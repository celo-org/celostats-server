import { Proof } from "../interfaces/Proof";
import { InfoWrapped } from "../interfaces/InfoWrapped";
import { reserved, trusted } from "./config";
import { Keccak } from "sha3";
// @ts-ignore
import { ec as EC } from "elliptic"
// @ts-ignore
import { KeyPair } from "elliptic/lib/elliptic/ec"
import { isInputValid } from "./isInputValid";

export function isAuthorize(
  proof: Proof,
  stats: InfoWrapped
): boolean {
  let isAuthorized = false

  if (
    isInputValid(stats) &&
    proof && proof.publicKey && proof.signature &&
    reserved.indexOf(stats.id) < 0 && trusted
      .map(address => address && address.toLowerCase())
      .indexOf(proof.address) >= 0
  ) {
    const hasher = new Keccak(256)
    hasher.update(JSON.stringify(stats))

    const msgHash = hasher.digest('hex')
    const secp256k1 = new EC('secp256k1')
    const pubkeyNoZeroX = proof.publicKey.substr(2)

    let pubkey: KeyPair

    try {
      pubkey = secp256k1.keyFromPublic(pubkeyNoZeroX, 'hex')
    } catch (err) {
      console.error('API', 'SIG', 'Public Key Error', err.message)
      return false
    }

    const addressHasher = new Keccak(256)
    addressHasher.update(pubkeyNoZeroX.substr(2), 'hex')

    const addressHash = addressHasher.digest('hex').substr(24)

    if (!(addressHash.toLowerCase() === proof.address.substr(2).toLowerCase())) {
      console.error(
        'API', 'SIG',
        'Address hash did not match', addressHash,
        proof.address.substr(2)
      )
    }

    const signature: {
      r: string
      s: string
    } = {
      r: proof.signature.substr(2, 64),
      s: proof.signature.substr(66, 64)
    }

    if (!(msgHash === proof.msgHash.substr(2))) {
      console.error(
        'API', 'SIG',
        'Message hash did not match',
        msgHash, proof.msgHash.substr(2)
      )
      return false
    }

    try {
      isAuthorized = pubkey.verify(msgHash, signature)
      if (!isAuthorized) {
        console.error('API', 'SIG', 'Signature did not verify')
        return false
      }
    } catch (e) {
      console.error('API', 'SIG', 'Signature Error', e.message)
      return false
    }
  }

  return isAuthorized
}