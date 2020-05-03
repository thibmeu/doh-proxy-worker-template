import { charToNumber, fourBytesNumber } from '../utils'
import { decodeName } from './helpers'

export const opcodeToType = (opcode: string | number) =>
  Object.keys(OpCodes).find(k => OpCodes[k] === '' + opcode) || ''

export const encodeOpcodeData = (data: DNSAnswer): string => {
  // TODO: deal with data.type != 0
  switch (opcodeToType(data.type)) {
    case 'A':
      return data.rdata
        .split('.')
        .map(s => Number.parseInt(s))
        .map(n => String.fromCharCode(n))
        .join('')
    case 'TXT':
      return data.rdata
    case 'CNAME':
      return data.rdata
    case 'OPT':
      return ''
    default:
      return '------ Method not implemented ------'
  }
}

export const decodeOpcodeData = (type: string, data: string): string => {
  // TODO: deal with data.type != 0
  switch (opcodeToType(type)) {
    case 'A':
      return data
        .split('')
        .map(c => charToNumber(c))
        .join('.')
    case 'TXT':
      return data
    case 'CNAME':
      return data
    case 'SOA':
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
    case 'OPT':
      return ''
    default:
      console.log(
        '------ Method not implemented ------',
        type,
        opcodeToType(type),
      )
      return ''
  }
}

// from https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml#dns-parameters-4
export const OpCodes: { [key: string]: string } = {
  A: '1',
  NS: '2',
  MD: '3',
  MF: '4',
  CNAME: '5',
  SOA: '6',
  MB: '7',
  MG: '8',
  MR: '9',
  NULL: '10',
  WKS: '11',
  PTR: '12',
  HINFO: '13',
  MINFO: '14',
  MX: '15',
  TXT: '16',
  RP: '17',
  AFSDB: '18',
  X25: '19',
  ISDN: '20',
  RT: '21',
  NSAP: '22',
  'NSAP-PTR': '23',
  SIG: '24',
  KEY: '25',
  PX: '26',
  GPOS: '27',
  AAAA: '28',
  LOC: '29',
  NXT: '30',
  EID: '31',
  NIMLOC: '32',
  SRV: '33',
  ATMA: '34',
  NAPTR: '35',
  KX: '36',
  CERT: '37',
  A6: '38',
  DNAME: '39',
  SINK: '40',
  OPT: '41',
  APL: '42',
  DS: '43',
  SSHFP: '44',
  IPSECKEY: '45',
  RRSIG: '46',
  NSEC: '47',
  DNSKEY: '48',
  DHCID: '49',
  NSEC3: '50',
  NSEC3PARAM: '51',
  TLSA: '52',
  SMIMEA: '53',
  HIP: '55',
  NINFO: '56',
  RKEY: '57',
  TALINK: '58',
  CDS: '59',
  CDNSKEY: '60',
  OPENPGPKEY: '61',
  CSYNC: '62',
  ZONEMD: '63',
  SPF: '99',
  UINFO: '100',
  UID: '101',
  GID: '102',
  UNSPEC: '103',
  NID: '104',
  L32: '105',
  L64: '106',
  LP: '107',
  EUI48: '108',
  EUI64: '109',
  TKEY: '249',
  TSIG: '250',
  IXFR: '251',
  AXFR: '252',
  MAILB: '253',
  MAILA: '254',
  '*': '255',
  URI: '256',
  CAA: '257',
  AVC: '258',
  DOA: '259',
  AMTRELAY: '260',
  TA: '32768',
  DLV: '32769',
  Reserved: '65535',
}
