import { abi as registryContract } from '@ensdomains/resolver/build/contracts/ENS.json'
import { abi as resolverContract } from '@ensdomains/resolver/build/contracts/Resolver.json'
import { Interface } from '@ethersproject/abi'
import contentHash from 'content-hash'
import namehash from 'eth-ens-namehash'
import * as DNS from './dns'
import * as IPFS from './IPFS'
import { OpCodes } from './dns'

const registry = new Interface(registryContract)
const resolver = new Interface(resolverContract)

const methodToFunction = (
  provider_url: string,
  options: { to: string; contract: Interface; method: string },
) => async (...params: any[]) =>
  fetch(provider_url, {
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
    .then((r) => options.contract.decodeFunctionResult(options.method, r)[0])

export const DNSLookupIPFSProxy = (query: DNS.QuestionJSON) =>
  DNS.lookup(IPFS.DefaultProvider, query.type).then(
    (r: { Answer: DNS.AnswerJSON[] }): DNS.Answer[] =>
      r.Answer.map((a) => ({
        name: query.name,
        type: a.type,
        ttl: a.TTL,
        class: DNS.Classes.IN,
        rdata: a.data,
      })),
  )

export class ENS {
  static REGISTRY_CONTRACT_ADDRESS = '0x314159265dd8dbb310642f98f50c066173c1259b'
  providerUrl: string

  constructor(providerUrl: string) {
    this.providerUrl = providerUrl
  }

  public hash = (name: string) => namehash.normalize(namehash.hash(name))

  public getContentHash = async (node: string) =>
    methodToFunction(this.providerUrl, {
      contract: resolver,
      method: 'contenthash',
      to: await this.getResolver()(node),
    })(node)

  public getResolver = () =>
    methodToFunction(this.providerUrl, {
      contract: registry,
      method: 'resolver',
      to: ENS.REGISTRY_CONTRACT_ADDRESS,
    })

  public getContentHashText = (name: string) =>
    this.getContentHash(this.hash(name))
      .then(chBinary => contentHash.decode(chBinary))

  public getDNS = async (query: DNS.QuestionJSON): Promise<DNS.Answer[]> => {
    let { name, type } = query
    switch (type) {
      case OpCodes.A, OpCodes.AAAA:
        return DNSLookupIPFSProxy(query)
      case OpCodes.TXT:
        let node = this.hash(name.slice(0, -1))
        let chBinary = await this.getContentHash(node)
        let chText = contentHash.decode(chBinary)
        return [`dnslink=/ipfs/${chText}`, `contenthash=${chBinary}`].map(
          (rec): DNS.Answer => ({
            name,
            type,
            class: DNS.Classes.IN,
            ttl: DNS.DefaultTtl,
            rdata: rec,
          }),
        )
      default:
        throw new Error('Record not implemented')
    }
  }
}