import {
  HEADER_LENGTH,
  decodeHeader,
  encodeHeader,
  decode,
  encode,
} from '../src/dns/wireformat'
import { decodeName, encodeName } from '../src/dns/helpers'
import { Base64Binary } from '../src/utils'

describe('WireFormat', () => {
  it('should decode header', () => {
    const binary = 'q80BAAABAAAAAAAAA3d3dwdleGFtcGxlA2NvbQAAAQAB'
    const bin = new DataView(Base64Binary.decodeArrayBuffer(binary))
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
    const binary = 'q80BAAABAAAAAAAAA3d3dwdleGFtcGxlA2NvbQAAAQAB'
    const bin = new DataView(Base64Binary.decodeArrayBuffer(binary))

    expect(encodeHeader(decodeHeader(bin))).toStrictEqual(
      new Uint8Array(bin.buffer.slice(0, HEADER_LENGTH)),
    )
  })

  it('should return the proper name on decoding', () => {
    let name = '\u0007example\u0003com\0'
    const encoder = new TextEncoder()
    let dv = new DataView(encoder.encode(name).buffer)

    expect(decodeName(dv)).toBe('example.com.')
  })

  it('should return the proper name on encoding', () => {
    let name = 'example.com.'
    const encoder = new TextEncoder()

    expect(encodeName(name)).toStrictEqual(
      encoder.encode('\u0007example\u0003com\0'),
    )
  })

  it('should return the same thing on decode/encode', () => {
    const binary = 'q80BAAABAAAAAAAAA3d3dwdleGFtcGxlA2NvbQAAAQAB'
    const bin = Base64Binary.decodeArrayBuffer(binary)

    expect(encode(decode(bin))).toStrictEqual(
      Uint8Array.from(new Uint8Array(bin)),
    )
  })

  // it('should return a valid result for ipfs.eth', async () => {
  //   let request = new Request(
  //     '/?dns=AAABAAABAAAAAAABBGlwZnMDZXRoAAABAAEAACkQAAAAAAAACAAIAAQAAQAA',
  //     {
  //       headers: {
  //         'Content-Type': 'application/dns-message',
  //       },
  //     },
  //   )
  //   // need to fake calls to ethereum and cloudflare-dns
  //   let response = await handleRequest(request)
  // })
})
