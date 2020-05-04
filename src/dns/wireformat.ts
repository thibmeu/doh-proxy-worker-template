import {
  checkBit,
  twoBytesBinary,
  fourBytesBinary,
  twoBytesNumber,
  fourBytesNumber,
  leftShift,
  flattenUint8Array,
} from '../utils/bytes'
import { encodeOpcodeData, decodeOpcodeData, OpCodes } from './opcodes'
import { encodeName, decodeName } from './helpers'
import { Header, Question, Answer, Query } from './types'

export const HEADER_LENGTH = 12

export const decodeHeader = (bin: Uint8Array): Header => ({
  id: twoBytesNumber(bin, 0),
  qr: checkBit(bin[2], 7),
  opcode: leftShift(bin[2], 1) >> 4,
  aa: checkBit(bin[2], 2),
  tc: checkBit(bin[2], 1),
  rd: checkBit(bin[2], 0),
  ra: checkBit(bin[3], 7),
  z: leftShift(bin[3], 1) >> 5,
  rcode: bin[3] % (1 << 4),
  qdcount: twoBytesNumber(bin, 4),
  ancount: twoBytesNumber(bin, 6),
  nscount: twoBytesNumber(bin, 8),
  arcount: twoBytesNumber(bin, 10),
})

export const encodeHeader = (header: Header): Uint8Array =>
  flattenUint8Array([
    twoBytesBinary(header.id),
    Uint8Array.from([
      leftShift(+header.qr, 7) +
        leftShift(header.opcode, 3) +
        leftShift(+header.aa, 2) +
        leftShift(+header.tc, 1) +
        +header.rd,
      leftShift(+header.ra, 7) + leftShift(header.z, 4) + header.rcode,
    ]),
    twoBytesBinary(header.qdcount),
    twoBytesBinary(header.ancount),
    twoBytesBinary(header.nscount),
    twoBytesBinary(header.arcount),
  ])

export const decodeQuestion = (
  bin: Uint8Array,
): { question: Question; end: number } => {
  let nameEnd = bin.indexOf(0)
  return {
    question: {
      name: decodeName(bin.slice(0, nameEnd)),
      type: twoBytesNumber(bin, nameEnd + 1),
      class: twoBytesNumber(bin, nameEnd + 3),
    },
    end: nameEnd + 5,
  }
}

export const encodeQuestion = (question: Question): Uint8Array =>
  flattenUint8Array([
    encodeName(question.name),
    twoBytesBinary(question.type),
    twoBytesBinary(question.class),
  ])

export const decodeResponseData = (
  bin: Uint8Array,
): { responseData: Answer; end: number } => {
  if (bin.length <= 0) {
    throw 'Cannot decode data. Binary is invalid.'
  }
  let name = decodeName(bin)
  let nameEnd = name.length + 1 // there is no dot at the beginning while there is a one byte number
  let rdlength = twoBytesNumber(bin, nameEnd + 8)
  let end = nameEnd + 10 + rdlength

  let type = twoBytesNumber(bin, nameEnd)
  let data = decodeOpcodeData(type, bin.slice(nameEnd + 10, end))
  return {
    responseData: {
      name: name,
      type,
      class: twoBytesNumber(bin, nameEnd + 2),
      ttl: fourBytesNumber(bin, nameEnd + 4),
      rdata: data,
    },
    end,
  }
}

export const encodeResponseData = (data: Answer) => {
  const encodedData = encodeOpcodeData(data)
  return flattenUint8Array([
    encodeName(data.name),
    twoBytesBinary(data.type),
    twoBytesBinary(data.class),
    fourBytesBinary(data.ttl),
    twoBytesBinary(encodedData.length),
    encodedData,
  ])
}

export const decode = (binary: string): Query => {
  let bin = new Uint8Array(Buffer.from(binary, 'binary'))
  let header = decodeHeader(bin.slice(0, HEADER_LENGTH))
  let body = bin.slice(HEADER_LENGTH)

  let index = 0

  let questions: Question[] = []
  for (let _ = 0; _ < header.qdcount; _++) {
    let { question, end } = decodeQuestion(body.slice(index))
    questions = [...questions, question]
    index += end
  }

  let answers: Answer[] = []
  for (let _ = 0; _ < header.ancount; _++) {
    let { responseData, end } = decodeResponseData(body.slice(index))
    answers = [...answers, responseData]
    index += end
  }
  let nameServers: Answer[] = []
  for (let _ = 0; _ < header.nscount; _++) {
    let { responseData, end } = decodeResponseData(body.slice(index))
    nameServers = [...nameServers, responseData]
    index += end
  }
  let additionals: Answer[] = []
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

export const encode = (query: Query): Uint8Array =>
  flattenUint8Array([
    encodeHeader(query.header),
    ...query.questions.map(encodeQuestion),
    ...query.answers.map(encodeResponseData),
    ...query.nameServers.map(encodeResponseData),
    // ...(query.additionals !== undefined ? query.additionals.map(encodeResponseData) : []), // TODO: enable proper additionals
  ])
