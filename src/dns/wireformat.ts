/**
 * DNS Wireformat utilities
 * @packageDocumentation
 */

import {
  checkBit,
  twoBytesBinary,
  fourBytesBinary,
  leftShift,
  flattenUint8Array,
} from '../utils/bytes'
import { encodeOpcodeData, decodeOpcodeData } from './opcodes'
import { encodeName, decodeName } from './helpers'
import { Header, Question, Answer, Query } from './types'

/** Number of bytes in the DNS header */
export const HEADER_LENGTH = 12

/**
 * Decode DNS header from bytes
 * @param bin - Bytes to be decoded
 * @dev Decoding might not require all the data to be read
 * @dev No check is performed on the data to see if its valid
 * @returns Decoded header
 */
export const decodeHeader = (bin: DataView): Header => ({
  id: bin.getUint16(0),
  qr: checkBit(bin.getUint8(2), 7),
  opcode: leftShift(bin.getUint8(2), 1) >> 4,
  aa: checkBit(bin.getUint8(2), 2),
  tc: checkBit(bin.getUint8(2), 1),
  rd: checkBit(bin.getUint8(2), 0),
  ra: checkBit(bin.getUint8(3), 7),
  z: leftShift(bin.getUint8(3), 1) >> 5,
  rcode: bin.getUint8(3) % (1 << 4),
  qdcount: bin.getUint16(4),
  ancount: bin.getUint16(6),
  nscount: bin.getUint16(8),
  arcount: bin.getUint16(10),
})

/**
 * Encode DNS header to bytes
 * @param header - Header to be encoded
 * @dev No check is performed on the data to see if its valid
 * @returns Encoded header as bytes
 */
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

/**
 * Decode 1 question from bytes
 * @param bin - Bytes to be decoded
 * @dev Decoding might not require all the data to be read
 * @dev No check is performed on the data to see if its valid
 * @returns Decoded question
 */
export const decodeQuestion = (
  bin: DataView,
): { question: Question; end: number } => {
  let name = decodeName(bin)

  return {
    question: {
      name,
      type: bin.getUint16(name.length + 1),
      class: bin.getUint16(name.length + 3),
    },
    end: name.length + 5,
  }
}

/**
 * Encode 1 question to bytes
 * @param question - Question to be encoded
 * @dev No check is performed on the data to see if its valid
 * @dev TODO: name is not compressed.
 * @returns Encoded question as bytes
 */
export const encodeQuestion = (question: Question): Uint8Array =>
  flattenUint8Array([
    encodeName(question.name),
    twoBytesBinary(question.type),
    twoBytesBinary(question.class),
  ])

/**
 * Decode 1 response data from bytes
 * @param bin - Bytes to be decoded
 * @dev Decoding might not require all the data to be read
 * @dev No check is performed on the data to see if its valid
 * @returns Decoded data
 */
export const decodeResponseData = (
  bin: DataView,
): { responseData: Answer; end: number } => {
  if (bin.byteLength <= 0) {
    throw 'Cannot decode data. Binary is invalid.'
  }
  let name = decodeName(bin)
  let nameEnd = name.length + 1 // there is no dot at the beginning while there is a one byte number
  let rdlength = bin.getUint16(nameEnd + 8)
  let end = nameEnd + 10 + rdlength

  let type = bin.getUint16(nameEnd)
  let data = decodeOpcodeData(
    type,
    new DataView(bin.buffer.slice(bin.byteOffset + nameEnd + 10, end)),
  )
  return {
    responseData: {
      name: name,
      type,
      class: bin.getUint16(nameEnd + 2),
      ttl: bin.getUint32(nameEnd + 4),
      rdata: data,
    },
    end,
  }
}

/**
 * Encode 1 response data to bytes
 * @param data - Data to be encoded
 * @dev No check is performed on the data to see if its valid
 * @returns Encoded response data as bytes
 */
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

/**
 * Decode DNS message in wireformat from bytes
 * @param binary - Bytes to be decoded
 * @dev Decoding might not require all the data to be read
 * @dev No check is performed on the data to see if its valid
 * @returns Decoded message
 */
export const decode = (binary: ArrayBuffer): Query => {
  // Decode header
  let header = decodeHeader(new DataView(binary, 0, HEADER_LENGTH))

  let index = HEADER_LENGTH

  // Decode questions
  let questions: Question[] = []
  for (let _ = 0; _ < header.qdcount; _++) {
    let { question, end } = decodeQuestion(new DataView(binary, index))
    questions = [...questions, question]
    index += end
  }

  // Decode all responses data: answers, nameservers and additionals
  let answers: Answer[] = []
  for (let _ = 0; _ < header.ancount; _++) {
    let { responseData, end } = decodeResponseData(new DataView(binary, index))
    answers = [...answers, responseData]
    index += end
  }
  let nameServers: Answer[] = []
  for (let _ = 0; _ < header.nscount; _++) {
    let { responseData, end } = decodeResponseData(new DataView(binary, index))
    nameServers = [...nameServers, responseData]
    index += end
  }
  let additionals: Answer[] = []
  for (let _ = 0; _ < header.arcount; _++) {
    let { responseData, end } = decodeResponseData(new DataView(binary, index))
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

/**
 * Encode DNS message to wireformat in bytes
 * @param query - Message to be encoded
 * @dev No check is performed on the data to see if its valid
 * @returns Encoded message as bytes
 */
export const encode = (query: Query): Uint8Array =>
  flattenUint8Array([
    encodeHeader(query.header),
    ...query.questions.map(encodeQuestion),
    ...query.answers.map(encodeResponseData),
    ...query.nameServers.map(encodeResponseData),
    ...(query.additionals !== undefined
      ? query.additionals.map(encodeResponseData)
      : []),
  ])
