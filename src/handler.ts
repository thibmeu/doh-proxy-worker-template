import { ENS } from './ENS'
import * as DNS from './dns'
import { paramsToObject } from './url'

const resolvers: {
  [key: string]: (
    request: Request,
    query: DNS.QuestionJSON,
  ) => Promise<Response>
} = {
  default: async (
    request: Request,
    query: DNS.QuestionJSON,
  ): Promise<Response> => {
    let url = new URL(`${DNS.DOHUrl}${new URL(request.url).search}`)

    const r = new Request(url.href, request)
    return fetch(r)
  },
  '.eth': async (
    request: Request,
    query: DNS.QuestionJSON,
  ): Promise<Response> => {
    const ETH_PROVIDER_URL = 'https://cloudflare-eth.com'
    const ens = ENS(ETH_PROVIDER_URL)

    let answers = await ens.getDNS(query.name)[query.type]()
    let j: DNS.Query = await DNS.dnsMessageToJSON(request)
    let res: DNS.Query = {
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

export const questionFromRequest = async (
  request: Request,
): Promise<DNS.QuestionJSON> => {
  let url = new URL(request.url)

  let query = paramsToObject(url.search) as DNS.QuestionJSON

  if (
    request.headers.get('content-type') === 'application/dns-message' ||
    request.headers.get('accept') === 'application/dns-message'
  ) {
    let j: DNS.Query = await DNS.dnsMessageToJSON(request)
    return {
      name: j.questions[0].name.slice(0, -1),
      type: j.questions[0].type,
    }
  }
  if (request.headers.get('accept') === 'application/dns-json') {
    return query
  }
  throw new Error('Invalid content type')
}

export const handleRequest = async (request: Request): Promise<Response> => {
  let query: DNS.QuestionJSON
  try {
    query = await questionFromRequest(request)
  } catch (err) {
    return new Response(err, { status: 400 })
  }

  if (query === undefined || !query.name || !query.type) {
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
  }
  if (
    request.headers.get('content-type') === 'application/dns-message' ||
    request.headers.get('accept') === 'application/dns-message'
  ) {
    let resultJ: DNS.Query = await result.then(r => r.json())
    let encoded = DNS.encode(resultJ)
    return new Response(encoded, {
      status: 200,
      headers: { 'content-type': 'application/dns-message' },
    })
  }
  return new Response('Invalid query', { status: 400 })
}
