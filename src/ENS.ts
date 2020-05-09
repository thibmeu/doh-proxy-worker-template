/**
 * Ethereum Name Service (ENS) is a way to bind address to resolvers.
 * A resolver can resolves to an Ethereum address, an IPFS hash or other content.
 * @remarks Official ENS website https://ens.domains
 * @packageDocumentation
 */

import { abi as registryContract } from '@ensdomains/resolver/build/contracts/ENS.json'
import { abi as resolverContract } from '@ensdomains/resolver/build/contracts/Resolver.json'
import { Interface } from '@ethersproject/abi'
import contentHash from 'content-hash'
import namehash from 'eth-ens-namehash'
import * as DNS from './dns'
import * as IPFS from './IPFS'
import { OpCodes } from './dns'

/**
 * Generate a function to query an Ethereum RPC provider over HTTP
 * @param httpEthereumProvider - HTTP URL of the Ethereum RPC provider to query
 * @param options - address, interface and method of the contract to be queried
 * @returns Javascript function that returns the desired 'string' value on call
 */
const methodToFunction = (
  httpEthereumProvider: string,
  options: { to: string; contract: Interface; method: string },
) => async (...params: string[]): Promise<string> =>
  fetch(httpEthereumProvider, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [
        {
          to: options.to,
          data: options.contract.encodeFunctionData(options.method, params),
        },
        'latest',
      ],
      id: 1,
    }),
  })
    .then((r) => r.json())
    .then((r) => r.result)
    .then(
      (r): string =>
        options.contract.decodeFunctionResult(options.method, r)[0],
    )

/**
 * Wrapper around the ENS contract to resolves content hash and DNS
 * @dev TODO: resolves address
 */
export class ENS {
  /** Address of the ENS contract. This might change when the registry is updated */
  static REGISTRY_CONTRACT_ADDRESS =
    '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
  /** ENS Registry interface. Taken from ENS Registry contract ABI */
  static Registry = new Interface(registryContract)
  /** ENS Resolver interface. Taken from the broader ENS Resolver contract ABI. A more specific ABI could be specified */
  static Resolver = new Interface(resolverContract)

  /** HTTP URL of the Ethereum RPC provider to be used */
  httpEthereumProvider: string
  /** Domain name of the IPFS gateway to be used */
  IPFSProvider: string

  /**
   * Creates a wrapper around ENS contracts
   * @param httpEthereumProvider - HTTP URL of the Ethereum RPC provider to be used
   * @param httpIPFSProvider - Domain name of the IPFS gateway to be used
   */
  constructor(
    httpEthereumProvider: string,
    IPFSProvider = IPFS.Providers.Cloudflare,
  ) {
    this.httpEthereumProvider = httpEthereumProvider
    this.IPFSProvider = IPFSProvider
  }

  /**
   * Perform a normalised namehash of the given name
   * @param name - name to be hashed
   * @returns Normalised namehash
   * @dev https://docs.ens.domains/contract-api-reference/name-processing
   */
  public hash = (name: string): string =>
    namehash.normalize(namehash.hash(name))

  /**
   * Retrieves the Content hash of the given node from ENS Resolver
   * @param node - Node associated to the resolver to query
   * @returns Content hash stored on ENS
   */
  public getContentHash = async (node: string): Promise<string> =>
    methodToFunction(this.httpEthereumProvider, {
      contract: ENS.Resolver,
      method: 'contenthash',
      to: await this.getResolver(node),
    })(node)

  /**
   * Get the address of the ENS resolver associated with a node
   * @param node - Node from which to retrieve the resolver
   * @returns Address of the resolver associated with the node
   */
  public getResolver = (node: string): Promise<string> =>
    methodToFunction(this.httpEthereumProvider, {
      contract: ENS.Registry,
      method: 'resolver',
      to: ENS.REGISTRY_CONTRACT_ADDRESS,
    })(node)

  /**
   * Retrieves and decode the contenthash associated with name
   * @param name - Name associated to a resolver on ENS. Usually `.eth` but can be `.xyz`, `.kred` or other providers using ENS
   * @returns Decoded content hash. For IPFS, this corresponds to the CID
   */
  public getContentHashText = (name: string): Promise<string> =>
    this.getContentHash(this.hash(name)).then((chBinary) =>
      contentHash.decode(chBinary),
    )

  /**
   * Answers DNS query using Ethereum blockchain. Appart from TXT record, all records should resolves to the default IPFS provider
   * @param query - DNS query for a domain handled by ENS Registry
   * @returns Answer to the DNS query
   * @remarks Partial implementation of https://eips.ethereum.org/EIPS/eip-1185
   * @dev If the formentioned EIP goes through, this needs to be updated to handle all DNS records
   */
  public getDNS = async (query: DNS.QuestionJSON): Promise<DNS.Answer[]> => {
    const { name, type } = query
    switch (type) {
      case OpCodes.A:
      case OpCodes.AAAA:
        return this.getDNSIPFSProxy(query)
      case OpCodes.TXT: {
        const node = this.hash(name.slice(0, -1))
        const chBinary = await this.getContentHash(node)
        const chText = contentHash.decode(chBinary)
        return [`dnslink=/ipfs/${chText}`, `contenthash=${chBinary}`].map(
          (rec): DNS.Answer => ({
            name,
            type,
            class: DNS.Classes.IN,
            ttl: DNS.DefaultTtl,
            rdata: rec,
          }),
        )
      }
      default:
        throw new Error('Record not implemented')
    }
  }

  /**
   * Reverse Proxy for DNS queries on ENS Registry names. It resolves queries to an IPFS gateway
   * @param query - Name to proxy and type to retrieve from the IPFS gateway
   * @returns DNS answer for the IPFS provider on the request DNS type
   */
  private getDNSIPFSProxy = (query: DNS.QuestionJSON): Promise<DNS.Answer[]> =>
    DNS.lookup({ name: this.IPFSProvider, type: query.type }).then(
      (r: { Answer: DNS.AnswerJSON[] }): DNS.Answer[] =>
        r.Answer.map((a) => ({
          name: query.name,
          type: a.type,
          ttl: a.TTL,
          class: DNS.Classes.IN,
          rdata: a.data,
        })),
    )
}
