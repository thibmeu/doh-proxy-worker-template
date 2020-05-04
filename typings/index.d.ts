declare module 'content-hash' {
  export const helpers: {
    cidV0ToV1Base32: (ipfsHash: string) => string
  }
  export function decode(contentHash: string): string
  export function fromIpfs(ipfsHash: string): string
  export function fromSwarm(swarmHash: string): string
  export function encode(codec: string, value: string): string
  export function getCodec(hash: string): string
}

declare module 'eth-ens-namehash' {
  export function hash(inputName: string): string
  export function normalize(name: string): string
}
