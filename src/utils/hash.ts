import { Keccak } from "sha3";

export function hash(payload: string, encoding?: BufferEncoding) {
  const hasher = new Keccak(256)

  if (encoding) {
    hasher.update(payload, encoding)
  } else {
    hasher.update(payload)
  }

  return hasher.digest('hex')
}