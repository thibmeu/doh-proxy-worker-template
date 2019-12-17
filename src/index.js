import { ENS } from './ENS'
import * as DNS from './DNS'

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

const DNSQuery = query =>
    Object.fromEntries(
        query
        .slice(1)
        .split('&')
        .map(c => c.split('=').map(s => decodeURIComponent(s)))
    )

const resolvers = {
    'default': async request => {
        const DOH_URL = 'https://cloudflare-dns.com/dns-query'
        let url = new URL(`${DOH_URL}${new URL(request.url).search}`)

        const r = new Request(url.href, {
            headers: request.headers,
            method: request.method,
            body: request.body,
        })
        return fetch(r)
    },
    '.eth': async request => {
        const ETH_PROVIDER_URL = 'https://cloudflare-eth.com'
        const ens = ENS(ETH_PROVIDER_URL)

        let url = new URL(request.url)
        let query = DNSQuery(url.search)
        let answer = await ens.getDNS(query.name)[query.type]()
        let res = {
            Status: 0, // TODO: To be implemented properly, failure is -1
            TC: false, // not truncated
            RD: true,
            RA: true,
            AD: false, // DNSSEC disabled for now, while we could say ok it doesn't mean anything
            CD: false,
            Question: [{
                name: query.name,
                type: DNS.OpCodes[query.type]
            }],
            Answer: answer,
        }

        return new Response(JSON.stringify(res))
    },
}
const handleRequest = request => {
    let url = new URL(request.url)
    let query = DNSQuery(url.search)

    let resolverKey = Object.keys(resolvers).find(key => query.name.endsWith(key))
    if (resolverKey) {
        return resolvers[resolverKey](request)
    }
    return resolvers.default(request)
}