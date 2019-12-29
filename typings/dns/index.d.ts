interface DNSHeader {
  id: number
  qr: boolean
  opcode: number
  aa: boolean
  tc: boolean
  rd: boolean
  ra: boolean
  z: number
  rcode: number
  qdcount: number
  ancount: number
  nscount: number
  arcount: number
}

interface DNSResponse {
  name: string
  type: string
  class?: number
  ttl: number
  rdlength?: number
  rdata: string
}

interface DNSQuestion {
  qname: string
  qtype: number
  qclass: number
}

declare module 'content-hash' {
  export const helpers: {
    cidV0ToV1Base32: (ipfsHash: string) => string
  }
  export function decode(contentHash: string): string
  export function fromIpfs(ipfsHash: string): string
  export function fromSwarm(swarmHash: string): string
  export function encode(codec: string, value: string): string
  export function getCodec(hash: string): string
}

declare module 'eth-ens-namehash' {
  export function hash(inputName: string): string
  export function normalize(name: string): string
}
