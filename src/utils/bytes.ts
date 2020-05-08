export const flattenUint8Array = (u8s: Uint8Array[]): Uint8Array =>
  Uint8Array.from(u8s.map((u8) => Array.from(u8)).flat())

export const Bytes = new Array(8).fill(1).map((v, i) => v << i)

export const checkBit = (byte: number, index: number) =>
  (byte & Bytes[index]) === Bytes[index]

export const twoBytesBinary = (n: number): Uint8Array =>
  Uint8Array.from([n >> 8, n % 256])

export const fourBytesBinary = (n: number): Uint8Array => {
  let bin = new Uint8Array(4)
  for (let i = 3; i >= 0; i--) {
    bin[i] = (n >> (8 * i)) % 256
  }
  return bin.reverse()
}

export const BYTE_SIZE = 1 << 8

export const leftShift = (n: number, shift: number) => (n << shift) % BYTE_SIZE

export const uint8ArrayToString = (bin: Uint8Array) =>
  Array.from(bin)
    .map((u) => String.fromCharCode(u))
    .join('')

export class Base64Binary {
  static _keyStr =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='

  /* will return a  Uint8Array type */
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
    //get last chars to see if are valid
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
