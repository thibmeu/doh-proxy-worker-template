import { decode } from './wireformat'
export * from './wireformat'
import { OpCodes } from './opcodes'
export * from './opcodes'
export * from './classes'
export * from './types'

import { btou } from '../utils'
import { paramsToObject } from '../url'
import { Query } from './types'

export const DOHUrl = 'https://cloudflare-dns.com/dns-query'

export const DefaultTtl = 3600

// TODO: DNS Wireformat
export const lookup = async (
  name: string,
  type: string,
  json = true,
): Promise<any> => {
  let search = {
    name: name,
    type: Object.keys(OpCodes).find(k => OpCodes[k] === type) || type,
  }
  let query = Object.entries(search)
    .map(c => c.map(p => encodeURIComponent(p)).join('='))
    .join('&')
  let options = {
    method: json ? 'GET' : 'POST',
    headers: {
      accept: json ? 'application/dns-json' : 'application/dns-message',
    },
  }
  return fetch(`${DOHUrl}?${query}`, options)
    .then((r: Response) => r.text()) // becauseb dns-json is not json
    .then((r: string) =>
      decodeURIComponent(r)
        .replace(/\\\//gi, '/')
        .replace(/\\\:/gi, ':'),
    )
    .then((r: string) => JSON.parse(r))
}

export const dnsMessageToJSON = async (request: Request): Promise<Query> => {
  let url = new URL(request.url)
  let bin = ''
  if (request.method === 'GET') {
    let dns = paramsToObject(url.search).dns
    bin = btou(dns)
  } else if (request.method === 'POST') {
    let clone = request.clone()
    bin = await clone.text()
  }
  return decode(bin)
}
