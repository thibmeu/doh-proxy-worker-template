import { charToNumber } from '../utils'

export const encodeName = (name: string): string =>
  name
    .split('.')
    .map(label => `${String.fromCharCode(label.length)}${label}`)
    .join('')

export const decodeName = (bin: string): string => {
  let name = ''
  for (
    let i = 0;
    ![undefined, String.fromCharCode(0)].includes(bin[i]);
    i += charToNumber(bin[i]) + 1
  ) {
    name += bin.slice(i + 1, i + 1 + charToNumber(bin[i])) + '.'
  }
  return name
}
