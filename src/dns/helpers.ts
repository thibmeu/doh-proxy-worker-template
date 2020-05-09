/**
 * DNS format encoding and decoding used both in queries and data format
 * @packageDocumentation
 */

/**
 * Encode a name to bytes
 * @param name - Name should follow the format `www.example.com.`
 * @dev There MUST be a `.` at the end
 * @returns Bytes of the encoded name
 */
export const encodeName = (name: string): Uint8Array =>
  Uint8Array.from(
    name
      .split('.')
      .map((label) => new Uint8Array(Buffer.from(label)))
      .map((u8) => [u8.length, ...Array.from(u8)])
      .flat(),
  )

/**
 * Decode a name from bytes
 * @param bin - Binary starting with the name. A name format is `LABEL+` where `LABEL` is `[length, ...name]` It must end with an empty label
 * @dev It does not work for Unicode strings
 * @returns Domain name, with a `.` at the end
 */
export const decodeName = (bin: DataView): string => {
  let name = ''
  let decoder = new TextDecoder()
  // Decode while the label to decode is not empty
  for (let i = 0; bin.getUint8(i) !== 0; i += bin.getUint8(i) + 1) {
    name +=
      decoder.decode(
        bin.buffer.slice(
          // bin being a DataView, the underlying buffer might not start from 0
          bin.byteOffset + i + 1,
          bin.byteOffset + i + 1 + bin.getUint8(i),
        ),
      ) + '.'
  }
  return name
}
