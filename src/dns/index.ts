import { decode } from './wireformat'
export * from './wireformat'
import { OpCodes } from './opcodes'
export * from './opcodes'
export * from './errors'
export * from './classes'
export * from './types'

import { paramsToObject } from '../url'
import { Query } from './types'
import { Base64Binary } from '../utils'

export const DOHUrl = 'https://cloudflare-dns.com/dns-query'

export const DefaultTtl = 3600

export enum Format {
  JSON = 'application/dns-json',
  WIRE = 'application/dns-message',
}

export const lookup = async (
  name: string,
  type: OpCodes,
  json = true,
): Promise<any> => {
  let search = {
    name,
    type: OpCodes[type],
  }
  let query = Object.entries(search)
    .map((c) => c.map((p) => encodeURIComponent(p)).join('='))
    .join('&')
  let options = {
    method: json ? 'GET' : 'POST',
    headers: {
      accept: json ? Format.JSON : Format.WIRE,
    },
  }
  return fetch(`${DOHUrl}?${query}`, options)
    .then((r: Response) => r.text()) // becauseb dns-json is not json
    .then((r: string) =>
      decodeURIComponent(r).replace(/\\\//gi, '/').replace(/\\\:/gi, ':'),
    )
    .then((r: string) => JSON.parse(r))
}

export const dnsMessageToJSON = async (request: Request): Promise<Query> => {
  let url = new URL(request.url)
  let bin: ArrayBuffer
  if (request.method === 'GET') {
    let dns = paramsToObject(url.search).dns
    bin = Base64Binary.decodeArrayBuffer(dns)
  } else if (request.method === 'POST') {
    let clone = request.clone()
    bin = await clone.arrayBuffer()
  } else {
    throw new Error('Bad Request')
  }
  return decode(bin)
}

export const isWireQuery = (request: Request) =>
  request.headers.get('content-type') === Format.WIRE ||
  request.headers.get('accept') === Format.WIRE

export const isJSONQuery = (request: Request) =>
  request.headers.get('content-type') === Format.JSON ||
  request.headers.get('accept') === Format.JSON
