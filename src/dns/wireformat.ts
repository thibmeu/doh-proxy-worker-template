import {checkBit, twoBytesBinary, twoBytesNumber} from '../utils/bytes'
import {charToNumber} from '../utils'

export const HEADER_LENGTH = 12

export const decodeHeader = (bin: string): DNSHeader => ({
  id: twoBytesNumber(bin, 0),
  qr: checkBit(bin[2], 7),
  opcode: (charToNumber(bin[2]) << 1) >> 4,
  aa: checkBit(bin[2], 2),
  tc: checkBit(bin[2], 1),
  rd: checkBit(bin[2], 0),
  ra: checkBit(bin[3], 7),
  z: (charToNumber(bin[3]) << 1) >> 5,
  rcode: (charToNumber(bin[3]) << 4) >> 4,
  qdcount: twoBytesNumber(bin, 4),
  ancount: twoBytesNumber(bin, 6),
  nscount: twoBytesNumber(bin, 8),
  arcount: twoBytesNumber(bin, 10),
})

export const encodeHeader = (header: DNSHeader) => [
  twoBytesBinary(header.id),
  String.fromCharCode(
    (+header.qr << 7) + (header.opcode << 3) + (+header.aa << 2) + (+header.tc << 1) + (+header.rd),
    (+header.ra << 7) + (header.z << 4) + (header.rcode),
  ),
  twoBytesBinary(header.qdcount),
  twoBytesBinary(header.ancount),
  twoBytesBinary(header.nscount),
  twoBytesBinary(header.arcount),
].join('')

export const binaryToQuestion = (
  bin: string,
): { question: DNSQuestion; end: number } => {
  let qnameEnd = bin.indexOf(String.fromCharCode(0))
  return {
    question: {
      qname: bin.slice(0, qnameEnd),
      qtype: twoBytesNumber(bin, qnameEnd + 1),
      qclass: twoBytesNumber(bin, qnameEnd + 3),
    },
    end: qnameEnd + 5,
  }
}

export const binaryToResponseData = (
  bin: string,
): { responseData: DNSResponse; end: number } => {
  let nameEnd = bin.indexOf(String.fromCharCode(0))
  let rdlength = twoBytesNumber(bin, nameEnd + 7)
  let end = nameEnd + 9 + rdlength
  return {
    responseData: {
      name: bin.slice(0, nameEnd),
      type: twoBytesNumber(bin, nameEnd + 1).toString(),
      class: twoBytesNumber(bin, nameEnd + 3),
      ttl: twoBytesNumber(bin, nameEnd + 5),
      rdlength: rdlength,
      rdata: bin.slice(nameEnd + 9, end),
    },
    end: end,
  }
}

export const wireformatToJSON = (binary: string) => {
  let header = decodeHeader(binary.slice(0, HEADER_LENGTH))
  let body = binary.slice(HEADER_LENGTH)

  let index = 0
  let questions: DNSQuestion[] = []
  for (let _ = 0; _ < header.qdcount; _++) {
    let { question, end } = binaryToQuestion(body.slice(index))
    questions = [...questions, question]
    index = end
  }
  let answers: DNSResponse[] = []
  for (let _ = 0; _ < header.ancount; _++) {
    let { responseData, end } = binaryToResponseData(body.slice(index))
    answers = [...answers, responseData]
    index = end
  }

  return {
    header,
    questions,
    answers,
  }
}
