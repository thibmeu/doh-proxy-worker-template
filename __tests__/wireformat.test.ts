import {
  HEADER_LENGTH,
  decodeHeader,
  encodeHeader,
  decode,
  encode,
} from '../src/dns/wireformat'
import { btou } from '../src/utils'
import { handleRequest } from '../src/handler'

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

  it('should return the same thing on decode/encode', () => {
    const bin = btou('q80BAAABAAAAAAAAA3d3dwdleGFtcGxlA2NvbQAAAQAB')

    expect(encode(decode(bin))).toBe(bin)
  })

  it('should return a valid result for ipfs.eth', async () => {
    // const bin = btou('AAABAAABAAAAAAABBGlwZnMDZXRoAAABAAEAACkQAAAAAAAACAAIAAQAAQAA')

    let request = new Request(
      '/?dns=AAABAAABAAAAAAABBGlwZnMDZXRoAAABAAEAACkQAAAAAAAACAAIAAQAAQAA',
      {
        headers: {
          'Content-Type': 'application/dns-message',
        },
      },
    )
    let response = await handleRequest(request)
    response
  })
})
