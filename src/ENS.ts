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

export const ENS_REGISTRY = '0x314159265dd8dbb310642f98f50c066173c1259b'

export const hash = (name: string) => namehash.normalize(namehash.hash(name))

export const getContentHash = async (provider_url: string, node: string) =>
  methodToFunction(provider_url, {
    contract: resolver,
    method: 'contenthash',
    to: await getResolver(provider_url)(node),
  })(node)

export const getResolver = (provider_url: string) =>
  methodToFunction(provider_url, {
    contract: registry,
    method: 'resolver',
    to: ENS_REGISTRY,
  })

export const SupportedRecord = [OpCodes.A, OpCodes.AAAA, OpCodes.CNAME]

export const getDNS = (
  provider_url: string,
  name: string,
): { [key: string]: () => Promise<DNS.Answer[]> } => ({
  ...Object.fromEntries(
    SupportedRecord.map((record) => [
      record,
      () =>
        DNS.lookup(IPFS.DefaultProvider, record).then(
          (r: { Answer: DNS.AnswerJSON[] }) =>
            r.Answer.map((a) => ({
              name: `${name}.`,
              type: a.type,
              ttl: a.TTL,
              class: DNS.Classes.IN,
              rdata: a.data,
            })),
        ),
    ]),
  ),
  16: async () => {
    let node = hash(name)
    let chBinary = await getContentHash(provider_url, node)
    let chText = contentHash.decode(chBinary)
    return [`dnslink=/ipfs/${chText}`, `contenthash=${chBinary}`].map(
      (rec): DNS.Answer => ({
        name: name,
        type: DNS.OpCodes.TXT,
        class: DNS.Classes.IN,
        ttl: DNS.DefaultTtl,
        rdata: rec,
      }),
    )
  },
})

export const ENS = (provider_url: string) => ({
  hash: hash,
  getContentHash: (node: string) => getContentHash(provider_url, node),
  getResolver: (node: string) => getResolver(provider_url)(node),
  getDNS: (name: string) => getDNS(provider_url, name),
})
