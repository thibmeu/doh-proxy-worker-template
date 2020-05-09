/**
 * Collection of method to interact with Bytes.
 * There is no Uint8 types in Javascript
 * @packageDocumentation
 */

/**
 * Flatten an array of Uint8Array
 * The flattening happens in the order of Uint8Array
 * @param u8s - Array to be flattened
 * @returns Flattened array
 */
export const flattenUint8Array = (u8s: Uint8Array[]): Uint8Array =>
  Uint8Array.from(u8s.map((u8) => Array.from(u8)).flat())

/** Bytes with a single bit set */
export const BYTES = [1, 2, 4, 8, 16, 32, 64, 128, 256]
/** Number of bytes for UINT8 */
export const MAX_BYTES = 256
/** Length in bit of a byte */
export const BYTE_LENGTH = 8

/**
 * Check if bit at index of byte is set
 * @param byte - Byte to be checked
 * @param index - Index of the bit to be checked
 * @returns True if bit of byte at index is set
 */
export const checkBit = (byte: number, index: number) =>
  (byte & BYTES[index]) === BYTES[index]

/**
 * Decompose a given number `n` in base 256, represented by a Uint8Array. Includes leading 0 if any.
 * @param n - Number to decompose
 * @returns A Uint8Array of two values representing number `n` in base 256
 */
export const twoBytesBinary = (n: number): Uint8Array =>
  Uint8Array.from([n >> 8, n % MAX_BYTES])

/**
 * Decompose a given number `n` in base 256, represented by a Uint8Array. Includes leading 0 if any.
 * @param n - Number to decompose
 * @returns A Uint8Array of four values representing number `n` in base 256
 */
export const fourBytesBinary = (n: number): Uint8Array => {
  let bin = new Uint8Array(4)
  for (let i = 3; i >= 0; i--) {
    bin[i] = (n >> (8 * i)) % MAX_BYTES
  }
  return bin.reverse()
}

/**
 * Perform a left shift in base 256
 * @param n - Number to be shifted
 * @param shift - Shift to be applied
 * @returns Shifted number
 */
export const leftShift = (n: number, shift: number) => (n << shift) % MAX_BYTES

export class Base64Binary {
  static _keyStr =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='

  static decodeArrayBuffer = (input: string) => {
    let bytes = (input.length / 4) * 3
    let ab = new ArrayBuffer(bytes)
    Base64Binary.decode(input, ab)

    return ab
  }

  static removePaddingChars = (input: string) => {
    var lkey = Base64Binary._keyStr.indexOf(input.charAt(input.length - 1))
    return lkey === 64 ? input.slice(0, -1) : input
  }

  static decode = (input: string, arrayBuffer: ArrayBuffer) => {
    input = Base64Binary.removePaddingChars(input)
    input = Base64Binary.removePaddingChars(input)

    let bytes = parseInt('' + (input.length / 4) * 3, 10)

    let uarray: Uint8Array

    if (arrayBuffer) uarray = new Uint8Array(arrayBuffer)
    else uarray = new Uint8Array(bytes)

    let j = 0
    for (let i = 0; i < bytes; i += 3) {
      //get the 3 octects in 4 ascii chars
      let enc1 = Base64Binary._keyStr.indexOf(input.charAt(j++))
      let enc2 = Base64Binary._keyStr.indexOf(input.charAt(j++))
      let enc3 = Base64Binary._keyStr.indexOf(input.charAt(j++))
      let enc4 = Base64Binary._keyStr.indexOf(input.charAt(j++))

      let chr1 = (enc1 << 2) | (enc2 >> 4)
      let chr2 = ((enc2 & 15) << 4) | (enc3 >> 2)
      let chr3 = ((enc3 & 3) << 6) | enc4

      uarray[i] = chr1
      if (enc3 != 64) uarray[i + 1] = chr2
      if (enc4 != 64) uarray[i + 2] = chr3
    }

    return uarray
  }
}
