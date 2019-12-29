import { ENS } from './ENS'
import * as DNS from './dns'
import {btou} from './utils'

addEventListener('fetch', (event: any) => {
  event.respondWith(handleRequest(event.request))
})

class DNSQuery {
  public name: string
  public type: string

  constructor(name: string, type: string) {
    this.name = name
    this.type = type
  }

  public static fromSearch = (query: string) => {
    let o = DNSQuery.paramsToObject(query)
    return new DNSQuery(o.name, o.type)
  }

  public static paramsToObject = (query: string): any =>
    Object.fromEntries(
      query
        .slice(1)
        .split('&')
        .map(c => c.split('=').map(s => decodeURIComponent(s))),
    )
}

const resolvers: { [key: string]: (request: Request) => Promise<Response> } = {
  default: async (request: Request): Promise<Response> => {
    let url = new URL(`${DNS.DOHUrl}${new URL(request.url).search}`)

    const r = new Request(url.href, request)
    return fetch(r)
  },
  '.eth': async (request: Request): Promise<Response> => {
    const ETH_PROVIDER_URL = 'https://cloudflare-eth.com'
    const ens = ENS(ETH_PROVIDER_URL)

    let url = new URL(request.url)
    let query = DNSQuery.fromSearch(url.search)
    let answer = await ens.getDNS(query.name)[query.type]()
    let res = {
      Status: 0, // TODO: To be implemented properly, failure is -1
      TC: false, // not truncated
      RD: true,
      RA: true,
      AD: false, // DNSSEC disabled for now, while we could say ok it doesn't mean anything
      CD: false,
      Question: [
        {
          name: query.name,
          type: DNS.OpCodes[query.type],
        },
      ],
      Answer: answer,
    }

    return new Response(JSON.stringify(res), {
      headers: request.headers,
    })
  },
}
const handleRequest = async (request: Request): Promise<Response> => {
  let url = new URL(request.url)
  let query = DNSQuery.fromSearch(url.search)

  if (request.headers.get('content-type') === 'application/dns-message' || request.headers.get('accept') === 'application/dns-message') {
    let bin = ''
    if (request.method === 'GET') {
      let dns = DNSQuery.paramsToObject(url.search).dns
      bin = btou(dns)
    } else if (request.method === 'POST') {
      let clone = request.clone()
      bin = await clone.text()
    }
    let j = DNS.wireformatToJSON(bin)
    query = new DNSQuery(j.questions[0].qname, DNS.opcodeToType(j.questions[0].qtype))
  } else if (request.headers.get('accept') === 'application/dns-json') {
    query = DNSQuery.fromSearch(url.search)
  }

  if (!query.name || !query.type) {
    return new Response('A valid query name must be set.', { status: 400 })
  }

  let resolverKey = Object.keys(resolvers).find(key => query.name.endsWith(key))
  if (resolverKey) {
    return resolvers[resolverKey](request)
  }
  let result = resolvers.default(request)

  if (request.headers.get('accept') === 'application/dns-json' || resolverKey !== '.eth') {
    return result
  } else if (request.headers.get('content-type') === 'application/dns-message' || request.headers.get('accept') === 'application/dns-message') {
    let resultJ = await result.then(r => r.json())
    let encoded = DNS.JSONToWireformat(resultJ)
    return new Response(encoded, {status: 200})
  }
  return new Response('Invalid query', {status: 400})
}
