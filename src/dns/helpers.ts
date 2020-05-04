import { uint8ArrayToString } from '../utils'

export const encodeName = (name: string): Uint8Array =>
  Uint8Array.from(
    name
      .split('.')
      .map(label => new Uint8Array(Buffer.from(label)))
      .map(u8 => [u8.length, ...Array.from(u8)])
      .flat(),
  )

export const decodeName = (bin: Uint8Array): string => {
  let name = ''
  for (let i = 0; ![undefined, 0].includes(bin[i]); i += bin[i] + 1) {
    name += uint8ArrayToString(bin.slice(i + 1, i + 1 + bin[i])) + '.'
  }
  return name
}
