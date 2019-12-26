const Bytes = new Array(8).fill(1).map((v, i) => v << i)

const charToNumber = (c: string) => c.charCodeAt(0)

const checkBit = (byte: string, index: number) =>
  (charToNumber(byte) & Bytes[index]) === Bytes[index]

const twoBytesNumber = (bin: string, index: number) =>
  (charToNumber(bin[index]) << 8) | charToNumber(bin[index + 1])

const btou = (str: string) => Buffer.from(str, 'base64').toString('binary')

const HEADER_LENGTH = 10

const decodeHeader = (bin: string) => ({
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

const binaryToQuestion = (
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

const binaryToResponseData = (
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

const wireformatToJSON = (binary: string) => {
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
