/**
 * DNS Opcodes definition, encoding and decoding
 * @packageDocumentation
 */

import { encodeName, decodeName } from './helpers'
import { Answer } from './types'
import { flattenUint8Array, twoBytesBinary } from '../utils'

/**
 * DNS Parameters as defined in RFC1035
 * @remarks https://www.ietf.org/rfc/rfc1035.txt
 */
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

/**
 * Encode data according to the defined opcode to bytes
 * @param data - Data to be encoded
 * @dev No check is performed on the data to see if its valid
 * @returns Encoded data as bytes
 */
export const encodeOpcodeData = (data: Answer): Uint8Array => {
  // TODO: deal with data.type != DNS.Classes.IN
  // Encoding varies depending on the data type
  switch (data.type) {
    case OpCodes.A:
      // Returns 4 bytes, one per entry of the IPv4
      return Uint8Array.from(
        data.rdata.split('.').map((s) => Number.parseInt(s)),
      )
    case OpCodes.AAAA: {
      // Defined in https://www.ietf.org/rfc/rfc5156.txt
      const bytes = data.rdata.split('::').map((s) =>
        flattenUint8Array(
          s
            .split(':')
            .map((n) => Number.parseInt(n, 16))
            .map((n) => twoBytesBinary(n)),
        ),
      )
      // there should be 8 uint16. Add 0s between two groups to fill the gap
      const filler = Uint8Array.from(
        new Array(16 - (bytes[0].length + bytes[1].length)).fill(0),
      )
      // returns 16 uint8, which means 8 uint16
      return flattenUint8Array([bytes[0], filler, bytes[1]])
    }
    case OpCodes.TXT:
      // TXT is a <character-string>, i.e. length on 1 byte and then the raw data
      return new Uint8Array(
        Buffer.from(`${String.fromCharCode(data.rdata.length)}${data.rdata}`),
      )
    case OpCodes.CNAME:
      // CNAME encodes a <domain-name>
      return encodeName(data.rdata)
    case OpCodes.OPT:
      // OPT is not implemented and returns empty data
      return new Uint8Array()
    default:
      // TODO: throw a proper error for unimplemented opcodes
      console.log('------ Method not implemented ------')
      return new Uint8Array()
  }
}

/**
 * Decode data from bytes according to the defined opcode
 * @param type - DNS OpCode for the type of data to be decoded
 * @param data - Bytes to be decoded
 * @dev Decoding might not require all the data to be read
 * @dev No check is performed on the data to see if its valid
 * @returns Decoded data as string
 */
export const decodeOpcodeData = (type: OpCodes, data: DataView): string => {
  const decoder = new TextDecoder()
  // TODO: deal with data.type != DNS.Classes.IN
  // Decoding varies depending on the data type
  switch (type) {
    case OpCodes.A:
      // Returns 4 bytes written in decimal and separated by `.`
      return [
        data.getUint8(0),
        data.getUint8(1),
        data.getUint8(2),
        data.getUint8(3),
      ].join('.')
    case OpCodes.AAAA:
      // Defined in https://www.ietf.org/rfc/rfc5156.txt
      // Returns 8 groups of 16 bits, encoded in hex and separated by `:`
      // Leading 0s are not included and consecutive 0s are collapsed as `::`.
      return new Array(8)
        .fill(0)
        .map((_, i) => i)
        .map((i) => data.getUint16(i))
        .map((n) => n.toString(16))
        .map((n) => (n !== '0' ? n : undefined))
        .join(':')
        .replace(/::+/g, '::')
    case OpCodes.TXT:
      // TXT is a <character-string>, i.e. length on 1 byte and then the raw data
      return decoder.decode(data).slice(1) // TODO: check that decoded[0] === decoded.length - 1
    case OpCodes.CNAME:
      // CNAME encodes a <domain-name>
      return decodeName(data)
    case OpCodes.SOA: {
      // TODO: SOA is encoded as string to make it easier to read. It should be associated to a new data type
      let index = 0
      const mname = decodeName(data)
      index += mname.length + 1
      const rname = decodeName(
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
    }
    case OpCodes.OPT:
      // OPT is not implemented and returns empty data
      return ''
    default:
      // TODO: throw a proper error for unimplemented opcodes
      console.log('------ Method not implemented ------', type, OpCodes[type])
      return ''
  }
}
