/**
 * Base method to handle DoH queries
 * @packageDocumentation
 */

import { ENS } from './ENS'
import * as DNS from './dns'
import { paramsToObject } from './utils'
import { OpCodes } from './dns'

/**
 * Resolves a request on Ethereum blockchain using ENS. It resolves to an IPFS gateway and the content hash is pull from the blockchain.
 * @param request Raw DoH request
 * @param query Name and type to resolves.
 * @returns DoH response formated in the requested format
 */
export const EthResolver = async (
  request: Request,
  query: DNS.QuestionJSON,
): Promise<Response> => {
  const ETH_PROVIDER_URL = 'https://cloudflare-eth.com'
  const ens = new ENS(ETH_PROVIDER_URL)

  const answers = await ens.getDNS(query)

  if (DNS.isWireQuery(request)) {
    const j: DNS.Query = await DNS.dnsMessageToJSON(request)
    const res: DNS.Query = {
      ...j,
      header: {
        ...j.header,
        qr: true,
        aa: true,
        ra: true,
        ancount: answers.length,
        arcount: j.additionals?.length ?? 0,
        rcode: DNS.Errors.NoError,
      },
      answers,
    }
    const encoded = DNS.encode(res)

    return new Response(encoded, {
      status: 200,
      headers: { 'content-type': DNS.Format.WIRE },
    })
  } else if (DNS.isJSONQuery(request)) {
    const res: DNS.ResponseJSON = {
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
}

/**
 * Given a valid DoH request, resolves it against a matching resolver
 * @param request - Raw DoH request. If the current resolver is not able to handle it, it passes it directly to DNS.DOHUrl
 * @param query - Query can be infered from the request but is passed for efficiency purposes.
 * @returns DoH response formatted in the requested format, either JSON or Wire
 */
export const resolve = async (
  request: Request,
  query: DNS.QuestionJSON,
): Promise<Response> => {
  if (query.name.endsWith('.eth.')) {
    return EthResolver(request, query)
  }
  const url = new URL(`${DNS.DOHUrl}${new URL(request.url).search}`)

  return fetch(new Request(url.href, request))
}

/**
 * Extract the question from a DoH request
 * @param request DoH request
 * @returns DNS question formated in JSON
 * @throws Error if the query not a valid DNS query
 */
export const questionFromRequest = async (
  request: Request,
): Promise<DNS.QuestionJSON> => {
  if (DNS.isWireQuery(request)) {
    const j: DNS.Query = await DNS.dnsMessageToJSON(request)
    return {
      name: j.questions[0].name,
      type: j.questions[0].type,
    }
  }
  if (DNS.isJSONQuery(request)) {
    const url = new URL(request.url)
    const j = paramsToObject<DNS.QuestionJSON>(url.search)
    return {
      name: `${j.name}.`,
      type: (OpCodes[j.type] as unknown) as OpCodes,
    }
  }
  throw new Error('Invalid content type')
}

/**
 * Handle request is a DoH resolver.
 * @param request - Request received. It should follow DoH standard, i.e. having an `accept` or `content-type` header with a valid dns format
 * @returns DoH response
 * @dev Error codes are not standard and are not embedded in the response
 */
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

  return resolve(request, query)
}
