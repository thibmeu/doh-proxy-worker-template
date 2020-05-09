/**
 * Base method to handle DoH queries
 * @packageDocumentation
 */

import * as DNS from './dns'
import { paramsToObject } from './utils'
import { OpCodes } from './dns'
import { BlockList } from './blockList'

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
  if (
    BlockList.some((n: string): boolean => n.endsWith(query.name.slice(0, -1)))
  ) {
    console.log(blocked)
    return new Response('Content blocked.', { status: 401 })
  }
  console.log(query.name)
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
