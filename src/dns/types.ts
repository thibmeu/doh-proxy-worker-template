import { OpCodes } from './opcodes'

export interface ResponseJSON {
  Status: number
  TC: boolean
  RD: boolean
  RA: boolean
  AD: boolean
  CD: boolean
  Question: QuestionJSON[]
  Answer: AnswerJSON[]
}

export interface QuestionJSON {
  name: string
  type: OpCodes
}

export interface AnswerJSON {
  name: string
  type: OpCodes
  TTL: number
  data: string
}

export interface Query {
  header: Header
  questions: Question[]
  answers: Answer[]
  nameServers: Answer[]
  additionals?: Answer[]
}

/**
 * Query is defined in 4.1.1 of RFC1035
 */
export interface Header {
  id: number // ID of the query
  qr: boolean // false if query, true if response
  opcode: number // 0 for standard QUERY, 1 for inversed IQUERY, 2 for server STATUS
  aa: boolean // Authoritative Answer
  tc: boolean // Is the message TruCated
  rd: boolean // Recursion Desired
  ra: boolean // Recursion Available
  z: number // 0
  rcode: number // Error code. Refer to the RFC for details
  qdcount: number // Number of Questions
  ancount: number // Number of Answers
  nscount: number // Number of Name Servers
  arcount: number // Number of Additional Records
}

export interface Question {
  name: string
  type: number
  class: number
}

export interface Answer {
  name: string
  type: OpCodes
  class: number
  ttl: number
  rdata: string
}
