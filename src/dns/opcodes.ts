import { fourBytesNumber, uint8ArrayToString } from '../utils'
import { decodeName } from './helpers'
import { Answer } from './types'

export const encodeOpcodeData = (data: Answer): Uint8Array => {
  // TODO: deal with data.type != 0
  switch (data.type) {
    case OpCodes.A:
      return Uint8Array.from(data.rdata.split('.').map(s => Number.parseInt(s)))
    case OpCodes.TXT:
      return new Uint8Array(Buffer.from(data.rdata))
    case OpCodes.CNAME:
      return new Uint8Array(Buffer.from(data.rdata))
    case OpCodes.OPT:
      return new Uint8Array()
    default:
      console.log('------ Method not implemented ------')
      return new Uint8Array()
  }
}

export const decodeOpcodeData = (type: OpCodes, data: Uint8Array): string => {
  // TODO: deal with data.type != 0
  switch (type) {
    case OpCodes.A:
      return data.join('.')
    case OpCodes.TXT:
      return uint8ArrayToString(data)
    case OpCodes.CNAME:
      return uint8ArrayToString(data)
    case OpCodes.SOA:
      let index = 0
      let mname = decodeName(data)
      index += mname.length + 1
      let rname = decodeName(data.slice(index))
      index += rname.length + 1
      return JSON.stringify({
        mname,
        rname,
        serial: fourBytesNumber(data, index),
        refresh: fourBytesNumber(data, index + 4),
        retry: fourBytesNumber(data, index + 8),
        expire: fourBytesNumber(data, index + 12),
        minimum: fourBytesNumber(data, index + 16),
      })
    case OpCodes.OPT:
      return ''
    default:
      console.log('------ Method not implemented ------', type, OpCodes[type])
      return ''
  }
}

// from https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml#dns-parameters-4
export enum OpCodes {
  A = 1,
  NS,
  MD,
  MF,
  CNAME,
  SOA,
  MB,
  MG,
  MR,
  NULL,
  WKS,
  PTR,
  HINFO,
  MINFO,
  MX,
  TXT,
  RP,
  AFSDB,
  X25,
  ISDN,
  RT,
  NSAP,
  'NSAP-PTR',
  SIG,
  KEY,
  PX,
  GPOS,
  AAAA,
  LOC,
  NXT,
  EID,
  NIMLOC,
  SRV,
  ATMA,
  NAPTR,
  KX,
  CERT,
  A6,
  DNAME,
  SINK,
  OPT,
  APL,
  DS,
  SSHFP,
  IPSECKEY,
  RRSIG,
  NSEC,
  DNSKEY,
  DHCID,
  NSEC3,
  NSEC3PARAM,
  TLSA,
  SMIMEA,
  HIP = 55,
  NINFO,
  RKEY,
  TALINK,
  CDS,
  CDNSKEY,
  OPENPGPKEY,
  CSYNC,
  ZONEMD,
  SPF = 99,
  UINFO,
  UID,
  GID,
  UNSPEC,
  NID,
  L32,
  L64,
  LP,
  EUI48,
  EUI64,
  TKEY = 249,
  TSIG,
  IXFR,
  AXFR,
  MAILB,
  MAILA,
  '*',
  URI,
  CAA,
  AVC,
  DOA,
  AMTRELAY,
  TA = 32768,
  DLV,
  Reserved = 65535,
}
