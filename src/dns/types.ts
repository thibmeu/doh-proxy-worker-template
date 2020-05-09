/**
 * DNS Types organised by format
 * No suffix is used for WireFormat
 * JSON suffix is used for DoH JSON format.
 * @packageDocumentation
 */

import { OpCodes } from './opcodes'

export interface QueryGET {
  dns: string // base64 encoded DNS query
}

export interface ResponseJSON {
  Status: number // Response code of the DNS query
  TC: boolean // Is the response truncated. Usually `true` for DoH
  RD: boolean // Recursive Desired. This is always `true` for DoH
  RA: boolean // Recursion Available. This is always `true` for DoH
  AD: boolean // Answer verified against DNSSEC
  CD: boolean // Client ask to Disabled DNSSEC
  Question: QuestionJSON[] // DNS Question
  Answer: AnswerJSON[] // DNS Answer
}

export interface QuestionJSON {
  name: string // Record name requested
  type: OpCodes // Record type requested
}

export interface AnswerJSON {
  name: string // Record name owner
  type: OpCodes // Record type of the answer
  TTL: number // Time To Live. How long should the answer be cached in seconds
  data: string // For known record, this is text. Otherwise it is going to be in hex
}

export interface Query {
  header: Header // Requested header
  questions: Question[] // Questions
  answers: Answer[] // Answers to the questions
  nameServers: Answer[] // Authoritative Name Servers
  additionals?: Answer[] // Additional fields
}

/**
 * Header is defined in 4.1.1 of RFC1035
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
  name: string // Record name requested
  type: number // Record type requested
  class: number // Record class requested
}

export interface Answer {
  name: string // Record name owner
  type: OpCodes // Record type of the answer
  class: number // DNS Class of the answer
  ttl: number // Time To Live. How long should the answer be cached in seconds
  rdata: string // For known record, this is text. Otherwise it is going to be in hex
}
