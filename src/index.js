import { ENS } from './ENS'

addEventListener('fetch', event => {
    // event.respondWith(handleRequest(event.request))
    event.respondWith(handleRequest(new Request('http://t.com?name=matoken.eth')))
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
        let namehash = ens.hash(query.name)
        let resolver = await ens.getResolver(namehash)
        let contentHash = await ens.getContentHash(resolver, namehash)

        return new Response(JSON.stringify(contentHash))
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