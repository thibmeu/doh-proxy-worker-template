import { ENS } from './ENS'
import * as DNS from './dns'
import { paramsToObject } from './url'
import { OpCodes } from './dns'

const resolvers: {
  [key: string]: (
    request: Request,
    query: DNS.QuestionJSON,
  ) => Promise<Response>
} = {
  default: async (request: Request, _: DNS.QuestionJSON): Promise<Response> => {
    let url = new URL(`${DNS.DOHUrl}${new URL(request.url).search}`)

    const r = new Request(url.href, request)
    return fetch(r)
  },
  '.eth': async (
    request: Request,
    query: DNS.QuestionJSON,
  ): Promise<Response> => {
    const ETH_PROVIDER_URL = 'https://cloudflare-eth.com'
    const ens = new ENS(ETH_PROVIDER_URL)

    let answers = await ens.getDNS(query)

    if (DNS.isWireQuery(request)) {
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
          rcode: DNS.Errors.NoError,
        },
        answers,
      }
      let encoded = DNS.encode(res)

      return new Response(encoded, {
        status: 200,
        headers: { 'content-type': DNS.Format.WIRE },
      })
    } else if (DNS.isJSONQuery(request)) {
      let res: DNS.ResponseJSON = {
        AD: true, // DNSSEC validation. We do it since we retrieve the record on chain
        CD: false, // TODO: We assume the client always asks for DNSSEC
        RA: true, // recursion available. true for DoH
        RD: true, // recursion desired. true for DoH
        TC: false, // response is not truncated
        Status: DNS.Errors.NoError,
        Question: [query],
        Answer: answers.map((a) => ({
          name: a.name.slice(0, -1),
          type: a.type,
          TTL: a.ttl,
          data: a.rdata,
        })),
      }
      return new Response(JSON.stringify(res), {
        status: 200,
        headers: { 'content-type': DNS.Format.JSON },
      })
    }
    return new Response('Invalid query', { status: 400 })
  },
}

export const questionFromRequest = async (
  request: Request,
): Promise<DNS.QuestionJSON> => {
  if (DNS.isWireQuery(request)) {
    let j: DNS.Query = await DNS.dnsMessageToJSON(request)
    return {
      name: j.questions[0].name,
      type: j.questions[0].type,
    }
  }
  if (DNS.isJSONQuery(request)) {
    let url = new URL(request.url)
    let j: DNS.QuestionJSON = paramsToObject(url.search)
    return {
      name: `${j.name}.`,
      type: (OpCodes[j.type] as unknown) as OpCodes,
    }
  }
  throw new Error('Invalid content type')
}

export const handleRequest = async (request: Request): Promise<Response> => {
  let query: DNS.QuestionJSON
  try {
    query = await questionFromRequest(request)
  } catch (err) {
    return new Response(err.message, { status: 400 })
  }

  if (query === undefined || !query.name || !query.type) {
    return new Response('A valid query name must be set.', { status: 400 })
  }

  let resolverKey =
    Object.keys(resolvers).find((key) => query.name.endsWith(`${key}.`)) ||
    'default'

  return resolvers[resolverKey](request, query)
}
