import { abi as registryContract } from '@ensdomains/resolver/build/contracts/ENS.json'
import { abi as resolverContract } from '@ensdomains/resolver/build/contracts/Resolver.json'
import { Interface } from '@ethersproject/abi'
import { formatBytes32String } from '@ethersproject/strings'
import namehash from 'eth-ens-namehash'

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

export const ENS = provider_url => ({
    hash: name =>
        namehash.normalize(namehash.hash(name)),
    getContentHash: (resolverAddress, name) =>
        methodToFunction(provider_url, { contract: resolver, method: 'contenthash', to: resolverAddress })(name),
    getResolver: methodToFunction(provider_url, { contract: registry, method: 'resolver', to: '0x314159265dd8dbb310642f98f50c066173c1259b' })
})