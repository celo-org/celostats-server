import { generateProof } from "./generateProof";
import { hash } from "../../src/utils/hash"
// @ts-ignore
import { ec as EC } from "elliptic"
// @ts-ignore
import { KeyPair } from "elliptic/lib/elliptic/ec"
import { StatsWrapped } from "../../src/interfaces/StatsWrapped"
import assert from "assert";

const secp256k1 = new EC('secp256k1')

describe('#generateProof()', () => {

  it('should generate 130 bytes long 0x prefixed signatures always', () => {
    const stats: StatsWrapped = {
      id: 'lorem ipsum'
    }

    for (let x = 0; x < 50; x++) {
      const proof = generateProof(stats)
      assert.equal(proof.signature.length, 130)
    }

  })

  it('must verify its own signature', () => {
    const stats: StatsWrapped = {
      id: 'lorem ipsum'
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