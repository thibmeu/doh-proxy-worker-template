import {decodeHeader, wireformatToJSON} from '../src/dns/wireformat'
import { btou } from '../src/utils'

describe('WireFormat', () => {
  it('should decode header', () => {
    const bin = btou('q80BAAABAAAAAAAAA3d3dwdleGFtcGxlA2NvbQAAAQAB')
    const header = decodeHeader(bin)

    expect(header.id).toBe(43981)
    expect(header.qr).toBe(false)
    expect(header.opcode).toBe(0)
    expect(header.aa).toBe(false)
    expect(header.tc).toBe(false)
    expect(header.ra).toBe(false)
    expect(header.z).toBe(0)
    expect(header.rcode).toBe(0)
    expect(header.qdcount).toBe(1)
    expect(header.ancount).toBe(0)
    expect(header.nscount).toBe(0)
    expect(header.arcount).toBe(0)
  })
})