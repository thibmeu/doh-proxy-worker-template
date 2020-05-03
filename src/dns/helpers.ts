import { charToNumber, uint8ArrayToString } from '../utils'

export const encodeName = (name: string): string =>
  name
    .split('.')
    .map(label => `${String.fromCharCode(label.length)}${label}`)
    .join('')

export const decodeName = (bin: Uint8Array): string => {
  let name = ''
  for (let i = 0; ![undefined, 0].includes(bin[i]); i += bin[i] + 1) {
    name += uint8ArrayToString(bin.slice(i + 1, i + 1 + bin[i])) + '.'
  }
  return name
}
