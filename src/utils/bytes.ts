import { charToNumber } from './char'

export const btou = (str: string) =>
  Buffer.from(str, 'base64').toString('binary')
export const utob = (str: string) =>
  Buffer.from(str, 'binary').toString('base64')

export const Bytes = new Array(8).fill(1).map((v, i) => v << i)

export const checkBit = (byte: number, index: number) =>
  (byte & Bytes[index]) === Bytes[index]

export const twoBytesNumber = (bin: Uint8Array, index: number) =>
  (bin[index] << 8) | bin[index + 1]

export const fourBytesNumber = (bin: Uint8Array, index: number) =>
  (bin[index] << 24) |
  (bin[index + 1] << 16) |
  (bin[index + 2] << 8) |
  bin[index + 3]

export const twoBytesBinary = (n: number) =>
  String.fromCharCode(n >> 8, n % 256)

export const fourBytesBinary = (n: number): string => {
  let bin = ''
  for (let i = 3; i >= 0; i--) {
    bin += String.fromCharCode((n >> (8 * i)) % 256)
  }
  return bin
}

export const BYTE_SIZE = 1 << 8

export const leftShift = (n: number, shift: number) => (n << shift) % BYTE_SIZE

export const uint8ArrayToString = (bin: Uint8Array) =>
  Array.from(bin)
    .map(u => String.fromCharCode(u))
    .join('')
