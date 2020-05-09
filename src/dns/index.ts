/**
 * DNS utilities
 * @packageDocumentation
 */

import { decode } from './wireformat'
export * from './wireformat'
import { OpCodes } from './opcodes'
export * from './opcodes'
export * from './errors'
export * from './classes'
export * from './types'

import { Query, QueryGET, QuestionJSON, ResponseJSON } from './types'
import { objectToParams, paramsToObject, Base64Binary } from '../utils'

/** DoH Provider to use when performing DNS queries */
export const DOHUrl = 'https://cloudflare-dns.com/dns-query'

/** Number of seconds to keep records if not specified by the upstream DNS */
export const DefaultTtl = 3600

export enum Format {
  JSON = 'application/dns-json', // JSON format
  WIRE = 'application/dns-message', // Wire format
}

/**
 * Perform a DNS lookup with JSON using DOHUrl
 * @param query - DNS query to perform. Contains the name and the query type to lookup for
 * @returns DoH JSON answer for the given query
 */
export const lookup = async (query: QuestionJSON): Promise<ResponseJSON> => {
  const search = objectToParams({
    name: query.name,
    type: OpCodes[query.type],
  })
  const options = {
    method: 'GET',
    headers: {
      accept: Format.JSON,
    },
  }
  return fetch(`${DOHUrl}${search}`, options)
    .then((r: Response) => r.text()) // because dns-json is not json
    .then((r: string) =>
      decodeURIComponent(r).replace(/\\\//gi, '/').replace(/\\:/gi, ':'),
    )
    .then((r: string): ResponseJSON => JSON.parse(r))
}

/**
 * Format a DNS Wire format request as a Query object. It can handle `GET` and `POST`
 * @param request - HTTP request
 * @returns Formated request
 * @dev Does not check if the request is valid
 */
export const dnsMessageToJSON = async (request: Request): Promise<Query> => {
  const url = new URL(request.url)
  let bin: ArrayBuffer
  // DoH only supports `GET` and `POST`
  switch (request.method) {
    case 'GET': {
      const dns = paramsToObject<QueryGET>(url.search).dns
      bin = Base64Binary.decodeArrayBuffer(dns)
      break
    }
    case 'POST': {
      const clone = request.clone()
      bin = await clone.arrayBuffer()
      break
    }
    default:
      throw new Error('Bad Request')
  }
  return decode(bin)
}

/**
 * Identify if the request is a DNS Wireformat request
 * @param request - HTTP request
 * @returns true if the request asks for wireformat
 */
export const isWireQuery = (request: Request): boolean =>
  request.headers.get('content-type') === Format.WIRE ||
  request.headers.get('accept') === Format.WIRE

/**
 * Identify if the request is a DNS JSON format request
 * @param request - HTTP request
 * @returns true if the request asks for JSON format
 */
export const isJSONQuery = (request: Request): boolean =>
  request.headers.get('content-type') === Format.JSON ||
  request.headers.get('accept') === Format.JSON
