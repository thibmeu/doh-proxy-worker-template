import {charToNumber} from './char'

export const btou = (str: string) => Buffer.from(str, 'base64').toString('binary')
export const utob = (str: string) => Buffer.from(str, 'binary').toString('base64')

export const Bytes = new Array(8).fill(1).map((v, i) => v << i)

export const checkBit = (byte: string, index: number) =>
  (charToNumber(byte) & Bytes[index]) === Bytes[index]

export const twoBytesNumber = (bin: string, index: number) =>
  (charToNumber(bin[index]) << 8) | charToNumber(bin[index + 1])

export const twoBytesBinary = (n: number) =>
  String.fromCharCode(n >> 8, n%256)