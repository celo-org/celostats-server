import { generateProof } from "./generateProof";
import assert from "assert";
import { hash } from "../../../src/server/utils/hash"
import { ec as EC } from "elliptic"
// @ts-expect-error not a module
import { KeyPair } from "elliptic/lib/elliptic/ec"
import { dummyInfo } from "../constants"
import { InfoWrapped } from "../../../src/server/interfaces/InfoWrapped"

const secp256k1 = new EC('secp256k1')

describe('#generateProof()', () => {

  it('should generate 130 bytes long 0x prefixed signatures always', () => {

    const stats: InfoWrapped = {
      id: 'lorem ipsum',
      info: dummyInfo
    }

    for (let x = 0; x < 50; x++) {
      const proof = generateProof(stats)
      assert.equal(proof.signature.length, 130)
    }

  })

  it('must verify its own signature', () => {
    const stats: InfoWrapped = {
      id: 'lorem ipsum',
      info: dummyInfo
    }

    const msgHash = hash(JSON.stringify(stats))

    for (let x = 0; x < 50; x++) {
      const proof = generateProof(stats)

      // create signature
      const signature: {
        r: string
        s: string
      } = {
        r: proof.signature.substr(2, 64),
        s: proof.signature.substr(66, 64)
      }

      const pubkeyNoZeroX = proof.publicKey.substr(2)

      const pubkey: KeyPair = secp256k1.keyFromPublic(pubkeyNoZeroX, 'hex')

      // validate sig
      const isAuthorized = pubkey.verify(msgHash, signature)
      assert(isAuthorized, `${x} ${proof.signature.length}`)
    }

  })

})