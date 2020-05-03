import {
  checkBit,
  twoBytesBinary,
  fourBytesBinary,
  twoBytesNumber,
  fourBytesNumber,
  leftShift,
} from '../utils/bytes'
import { charToNumber } from '../utils'
import { encodeOpcodeData, decodeOpcodeData } from './opcodes'
import { encodeName, decodeName } from './helpers'

export const HEADER_LENGTH = 12

export const decodeHeader = (bin: string): DNSHeader => ({
  id:
    (console.log(charToNumber(bin[0]), charToNumber(bin[1])),
    twoBytesNumber(bin, 0)),
  qr: checkBit(bin[2], 7),
  opcode: leftShift(charToNumber(bin[2]), 1) >> 4,
  aa: checkBit(bin[2], 2),
  tc: checkBit(bin[2], 1),
  rd: checkBit(bin[2], 0),
  ra: checkBit(bin[3], 7),
  z: leftShift(charToNumber(bin[3]), 1) >> 5,
  rcode: charToNumber(bin[3]) % (1 << 4),
  qdcount: twoBytesNumber(bin, 4),
  ancount: twoBytesNumber(bin, 6),
  nscount: twoBytesNumber(bin, 8),
  arcount: twoBytesNumber(bin, 10),
})

export const encodeHeader = (header: DNSHeader) =>
  [
    twoBytesBinary(header.id),
    String.fromCharCode(
      leftShift(+header.qr, 7) +
        leftShift(header.opcode, 3) +
        leftShift(+header.aa, 2) +
        leftShift(+header.tc, 1) +
        +header.rd,
      leftShift(+header.ra, 7) + leftShift(header.z, 4) + header.rcode,
    ),
    twoBytesBinary(header.qdcount),
    twoBytesBinary(header.ancount),
    twoBytesBinary(header.nscount),
    twoBytesBinary(header.arcount),
  ].join('')

export const decodeQuestion = (
  bin: string,
): { question: DNSQuestion; end: number } => {
  let nameEnd = bin.indexOf(String.fromCharCode(0))
  return {
    question: {
      name: decodeName(bin.slice(0, nameEnd)),
      type: twoBytesNumber(bin, nameEnd + 1),
      class: twoBytesNumber(bin, nameEnd + 3),
    },
    end: nameEnd + 5,
  }
}

export const encodeQuestion = (question: DNSQuestion) =>
  [
    encodeName(question.name),
    twoBytesBinary(question.type),
    twoBytesBinary(question.class),
  ].join('')

export const decodeResponseData = (
  bin: string,
): { responseData: DNSAnswer; end: number } => {
  if (bin.length <= 0) {
    throw 'Cannot decode data. Binary is invalid.'
  }
  let name = decodeName(bin)
  let nameEnd = name.length + 1 // there is no dot at the beginning while there is a one byte number
  let rdlength = twoBytesNumber(bin, nameEnd + 8)
  let end = nameEnd + 10 + rdlength
  let responseData = {
    name: name,
    type: twoBytesNumber(bin, nameEnd).toString(),
    class: twoBytesNumber(bin, nameEnd + 2),
    ttl: fourBytesNumber(bin, nameEnd + 4),
    rdlength: rdlength,
    rdata: bin.slice(nameEnd + 10, end),
  }
  responseData.rdata = decodeOpcodeData(responseData.type, responseData.rdata)
  responseData.rdlength = responseData.rdata.length
  return {
    responseData,
    end,
  }
}

export const encodeResponseData = (data: DNSAnswer) => {
  const encodedData = encodeOpcodeData(data)
  return [
    encodeName(data.name),
    twoBytesBinary(Number.parseInt(data.type)),
    twoBytesBinary(data.class),
    fourBytesBinary(data.ttl),
    twoBytesBinary(encodedData.length),
    encodedData,
  ].join('')
}

export const decode = (binary: string): DNSQuery => {
  let header = decodeHeader(binary.slice(0, HEADER_LENGTH))
  let body = binary.slice(HEADER_LENGTH)

  let index = 0

  let questions: DNSQuestion[] = []
  for (let _ = 0; _ < header.qdcount; _++) {
    let { question, end } = decodeQuestion(body.slice(index))
    questions = [...questions, question]
    index += end
  }

  let answers: DNSAnswer[] = []
  for (let _ = 0; _ < header.ancount; _++) {
    let { responseData, end } = decodeResponseData(body.slice(index))
    answers = [...answers, responseData]
    index += end
  }
  let nameServers: DNSAnswer[] = []
  for (let _ = 0; _ < header.nscount; _++) {
    let { responseData, end } = decodeResponseData(body.slice(index))
    nameServers = [...nameServers, responseData]
    index += end
  }
  let additionals: DNSAnswer[] = []
  for (let _ = 0; _ < header.arcount; _++) {
    let { responseData, end } = decodeResponseData(body.slice(index))
    additionals = [...additionals, responseData]
    index += end
  }

  return {
    header,
    questions,
    answers,
    nameServers,
    additionals,
  }
}

export const encode = (query: DNSQuery): string =>
  [
    encodeHeader(query.header),
    ...query.questions.map(encodeQuestion),
    ...query.answers.map(encodeResponseData),
    ...query.nameServers.map(encodeResponseData),
    // ...(query.additionals !== undefined ? query.additionals.map(encodeResponseData) : []), // TODO: enable proper additionals
  ].join('')

export const JSONToWireformat = (j: DNSResponseJSON): string =>
  [
    encodeHeader({
      id: 0, // TODO to be replaced
      qr: true,
      opcode: Number.parseInt(j.Question[0].type),
      aa: j.AD,
      tc: j.TC,
      rd: j.RD,
      ra: j.RA,
      z: 0,
      rcode: j.Status,
      qdcount: j.Question.length,
      ancount: j.Answer.length,
      nscount: 0,
      arcount: 0,
    }),
    ...j.Question.map(q =>
      encodeQuestion({
        name: q.name,
        type: Number.parseInt(q.type),
        class: 0,
      }),
    ),
    ...j.Answer.map(r => encodeResponseData(r)),
  ].join('')
