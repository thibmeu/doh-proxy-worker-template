import { abi as registryContract } from '@ensdomains/resolver/build/contracts/ENS.json'
import { abi as resolverContract } from '@ensdomains/resolver/build/contracts/Resolver.json'
import { Interface } from '@ethersproject/abi'
import contentHash from 'content-hash'
import namehash from 'eth-ens-namehash'
import * as DNS from './DNS'

const registry = new Interface(registryContract)
const resolver = new Interface(resolverContract)

const methodToFunction = (provider_url, options) =>
    async(...params) =>
    fetch(provider_url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [{
                to: options.to,
                data: options.contract.encodeFunctionData(options.method, params)
            }, 'latest'],
            id: 1
        })
    })
    .then(r => r.json())
    .then(r => r.result)
    .then(r => options.contract.decodeFunctionResult(options.method, r)[0])

export const ENS_REGISTRY = '0x314159265dd8dbb310642f98f50c066173c1259b'

export const hash = name =>
    namehash.normalize(namehash.hash(name))

export const getContentHash = async(provider_url, node) =>
    methodToFunction(provider_url, { contract: resolver, method: 'contenthash', to: await getResolver(provider_url)(node) })(node)

export const getResolver = (provider_url) =>
    methodToFunction(provider_url, { contract: registry, method: 'resolver', to: ENS_REGISTRY })

export const getDNS = (provider_url, name) => ({
    TXT: async() => {
        let node = hash(name)
        let chBinary = await getContentHash(provider_url, node)
        let chText = contentHash.decode(chBinary)
        return [
            `dnslink=/ipfs/${chText}`,
            `contenthash=${chBinary}`
        ].map(rec => ({
            name: name,
            type: DNS.OpCodes['TXT'],
            TTL: DNS.DEFAULT_TTL,
            data: rec,
        }))
    }
})

export const ENS = provider_url => ({
    hash: hash,
    getContentHash: node => getContentHash(provider_url, node),
    getResolver: node => getResolver(provider_url, node),
    getDNS: name => getDNS(provider_url, name),
})