import {
  HEADER_LENGTH,
  decodeHeader,
  encodeHeader,
  wireformatToJSON,
  JSONToWireformat,
} from '../src/dns/wireformat'
import { btou, utob } from '../src/utils'

describe('WireFormat', () => {
  it('should decode header', () => {
    const bin = btou('q80BAAABAAAAAAAAA3d3dwdleGFtcGxlA2NvbQAAAQAB')
    const header = decodeHeader(bin)

    expect(header.id).toBe(43981)
    expect(header.qr).toBe(false)
    expect(header.opcode).toBe(0)
    expect(header.aa).toBe(false)
    expect(header.tc).toBe(false)
    expect(header.rd).toBe(true)
    expect(header.ra).toBe(false)
    expect(header.z).toBe(0)
    expect(header.rcode).toBe(0)
    expect(header.qdcount).toBe(1)
    expect(header.ancount).toBe(0)
    expect(header.nscount).toBe(0)
    expect(header.arcount).toBe(0)
  })

  it('should return the same header on decode/encode', () => {
    const bin = btou('q80BAAABAAAAAAAAA3d3dwdleGFtcGxlA2NvbQAAAQAB')

    expect(encodeHeader(decodeHeader(bin))).toBe(bin.slice(0, HEADER_LENGTH))
  })

  it('test', () => {
    let x = JSONToWireformat({
      Status: 0,
      TC: false,
      RD: true,
      RA: true,
      AD: false,
      CD: false,
      Question: [
        {
          name: 'ipfs.eth',
          type: '1',
        },
      ],
      Answer: [
        {
          name: 'ipfs.eth.',
          type: '1',
          ttl: 300,
          class: 0,
          rdlength: 14,
          rdata: '104.18.64.168',
        },
        {
          name: 'ipfs.eth.',
          type: '1',
          ttl: 300,
          class: 0,
          rdlength: 14,
          rdata: '104.18.252.167',
        },
        {
          name: 'ipfs.eth.',
          type: '1',
          ttl: 300,
          class: 0,
          rdlength: 14,
          rdata: '104.18.253.167',
        },
        {
          name: 'ipfs.eth.',
          type: '1',
          ttl: 300,
          class: 0,
          rdlength: 14,
          rdata: '104.18.254.167',
        },
        {
          name: 'ipfs.eth.',
          type: '1',
          ttl: 300,
          class: 0,
          rdlength: 14,
          rdata: '104.18.255.167',
        },
      ],
    })
    console.log(wireformatToJSON(x))
  })
})
