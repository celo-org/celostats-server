import { Wrapper } from "../../../src/server/interfaces/Wrapper";
import { Proof } from "../../../src/server/interfaces/Proof";
import { hash } from "../../../src/server/utils/hash";
import { trusted } from "../../../src/server/utils/config";
// @ts-ignore
import { ec as EC } from "elliptic"
// @ts-ignore
import { KeyPair } from "elliptic/lib/elliptic/ec"

const secp256k1 = new EC('secp256k1')

export function generateProof(
  stats: Wrapper
): Proof {

  // create key
  const key: KeyPair = secp256k1.genKeyPair();

  // get public key
  const publicKey = key.getPublic().encode('hex')

  // hash the msg
  const msgHash = hash(JSON.stringify(stats))

  // sign
  const sig = key.sign(msgHash)
  const signature = sig.r.toString(16) + sig.s.toString(16)

  const proof = {
    // address is just the hash of the public key
    address: '0x' + hash(publicKey.substr(2), 'hex').substr(24),
    msgHash: '0x' + msgHash,
    publicKey: '0x' + publicKey,
    signature: '0x' + signature
  }

  // trust!
  trusted.push(proof.address)

  return proof;
}
