import { ENS } from './ENS'
import * as DNS from './dns'

class DNSQueryComponent {
  public name: string
  public type: string

  constructor(name: string, type: string) {
    this.name = name
    this.type = type
  }

  public static fromSearch = (query: string) => {
    let o = DNSQueryComponent.paramsToObject(query)
    return new DNSQueryComponent(o.name, o.type)
  }

  public static paramsToObject = (query: string): any =>
    Object.fromEntries(
      query
        .slice(1)
        .split('&')
        .map(c => c.split('=').map(s => decodeURIComponent(s))),
    )
}

const resolvers: {
  [key: string]: (
    request: Request,
    query: DNSQueryComponent,
  ) => Promise<Response>
} = {
  default: async (
    request: Request,
    query: DNSQueryComponent,
  ): Promise<Response> => {
    let url = new URL(`${DNS.DOHUrl}${new URL(request.url).search}`)

    const r = new Request(url.href, request)
    return fetch(r)
  },
  '.eth': async (
    request: Request,
    query: DNSQueryComponent,
  ): Promise<Response> => {
    const ETH_PROVIDER_URL = 'https://cloudflare-eth.com'
    const ens = ENS(ETH_PROVIDER_URL)

    let answers = await ens.getDNS(query.name)[query.type]()
    let j: DNSQuery = await DNS.dnsMessageToJSON(request)
    let res: DNSQuery = {
      ...j,
      header: {
        ...j.header,
        qr: true,
        aa: true,
        ra: true,
        ancount: answers.length,
        arcount: 0,
        rcode: 0, // No Error
      },
      answers: answers,
    }

    return new Response(JSON.stringify(res), {
      headers: request.headers,
    })
  },
}

export const handleRequest = async (request: Request): Promise<Response> => {
  let url = new URL(request.url)
  let query = DNSQueryComponent.fromSearch(url.search)

  if (
    request.headers.get('content-type') === 'application/dns-message' ||
    request.headers.get('accept') === 'application/dns-message'
  ) {
    let j: DNSQuery = await DNS.dnsMessageToJSON(request)
    query = new DNSQueryComponent(
      j.questions[0].name.slice(0, -1),
      DNS.opcodeToType(j.questions[0].type),
    )
  } else if (request.headers.get('accept') === 'application/dns-json') {
    query = DNSQueryComponent.fromSearch(url.search)
  }

  if (!query.name || !query.type) {
    return new Response('A valid query name must be set.', { status: 400 })
  }

  let resolverKey =
    Object.keys(resolvers).find(key => query.name.endsWith(key)) || 'default'

  let result = resolvers[resolverKey](request, query)

  if (
    request.headers.get('accept') === 'application/dns-json' ||
    resolverKey !== '.eth'
  ) {
    return result
  } else if (
    request.headers.get('content-type') === 'application/dns-message' ||
    request.headers.get('accept') === 'application/dns-message'
  ) {
    let resultJ: DNSQuery = await result.then(r => r.json())
    let encoded = DNS.encode(resultJ)
    return new Response(encoded, {
      status: 200,
      headers: { 'content-type': 'application/dns-message' },
    })
  }
  return new Response('Invalid query', { status: 400 })
}
