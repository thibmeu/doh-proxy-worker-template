export const encodeName = (name: string): Uint8Array =>
  Uint8Array.from(
    name
      .split('.')
      .map((label) => new Uint8Array(Buffer.from(label)))
      .map((u8) => [u8.length, ...Array.from(u8)])
      .flat(),
  )

export const decodeName = (bin: DataView): string => {
  let name = ''
  let decoder = new TextDecoder()
  for (let i = 0; bin.getUint8(i) !== 0; i += bin.getUint8(i) + 1) {
    name +=
      decoder.decode(
        bin.buffer.slice(
          bin.byteOffset + i + 1,
          bin.byteOffset + i + 1 + bin.getUint8(i),
        ),
      ) + '.'
  }
  return name
}
