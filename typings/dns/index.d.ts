interface DNSResponseJSON {
  Status: number
  TC: boolean
  RD: boolean
  RA: boolean
  AD: boolean
  CD: boolean
  Question: {
    name: string
    type: string
  }[]
  Answer: DNSAnswer[]
}

interface DNSQuery {
  header: DNSHeader
  questions: DNSQuestion[]
  answers: DNSAnswer[]
  nameServers: DNSAnswer[]
  additionals?: DNSAnswer[]
}

/**
 * DNSQuery is defined in 4.1.1 of RFC1035
 */
interface DNSHeader {
  id: number // ID of the query
  qr: boolean // false if query, true if response
  opcode: number // 0 for standard QUERY, 1 for inversed IQUERY, 2 for server STATUS
  aa: boolean // Authoritative Answer
  tc: boolean // Is the message TruCated
  rd: boolean // Recursion Desired
  ra: boolean // Recursion Available
  z: number // 0
  rcode: number // Error code. Refer to the RFC for details
  qdcount: number // Number of Questions
  ancount: number // Number of Answers
  nscount: number // Number of Name Servers
  arcount: number // Number of Additional Records
}

interface DNSAnswer {
  name: string
  type: string
  class: number
  ttl: number
  rdlength: number
  rdata: string
}

interface DNSQuestion {
  name: string
  type: number
  class: number
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
