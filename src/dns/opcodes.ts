import { decodeName } from './helpers'
import { Answer } from './types'
import { flattenUint8Array, twoBytesBinary } from '../utils'

export const encodeOpcodeData = (data: Answer): Uint8Array => {
  // TODO: deal with data.type != 0
  switch (data.type) {
    case OpCodes.A:
      return Uint8Array.from(
        data.rdata.split('.').map((s) => Number.parseInt(s)),
      )
    case OpCodes.AAAA:
      let bytes = data.rdata.split('::').map((s) =>
        flattenUint8Array(
          s
            .split(':')
            .map((n) => Number.parseInt(n, 16))
            .map((n) => twoBytesBinary(n)),
        ),
      )
      // there should be 8 uint16. Add 0s between two groups to fill the gap rfc5156
      let filler = Uint8Array.from(
        new Array(8 - (bytes[0].length + bytes[1].length)).fill(0),
      )
      return flattenUint8Array([bytes[0], filler, bytes[1]])
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

export const decodeOpcodeData = (type: OpCodes, data: DataView): string => {
  let decoder = new TextDecoder()
  // TODO: deal with data.type != 0
  switch (type) {
    case OpCodes.A:
      return [
        data.getUint8(0),
        data.getUint8(1),
        data.getUint8(2),
        data.getUint8(3),
      ].join('.')
    case OpCodes.AAAA:
      return new Array(8)
        .fill(0)
        .map((_, i) => i)
        .map((i) => data.getUint16(i))
        .map((n) => n.toString(16))
        .map((n) => (n !== '0' ? n : undefined))
        .join(':')
        .replace(/::+/g, '::')
    case OpCodes.TXT:
      return decoder.decode(data)
    case OpCodes.CNAME:
      return decoder.decode(data)
    case OpCodes.SOA:
      let index = 0
      let mname = decodeName(data)
      index += mname.length + 1
      let rname = decodeName(
        new DataView(data.buffer.slice(data.byteOffset + index)),
      )
      index += rname.length + 1
      return JSON.stringify({
        mname,
        rname,
        serial: data.getUint32(index),
        refresh: data.getUint32(index + 4),
        retry: data.getUint32(index + 8),
        expire: data.getUint32(index + 12),
        minimum: data.getUint32(index + 16),
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
