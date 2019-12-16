import { abi as resolverContract } from '@ensdomains/resolver/build/contracts/Resolver.json'
import { Interface } from '@ethersproject/abi'

const contract = new Interface(resolverContract)

export const contentHash = async provider_url =>
    fetch(provider_url, {
        method: 'POST',
        data: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: {
                to: contract,
                data: contract.encodeFunctionData('getContentHash', 'thibmeu.eth')
            }
        }).then(r => r.json()).then(r => r.result)
    })