import { Proof } from "../interfaces/Proof";
import { InfoWrapped } from "../interfaces/InfoWrapped";
import { reserved, trusted } from "./config";
import { ec as EC } from "elliptic"
// @ts-expect-error not a module
import { KeyPair } from "elliptic/lib/elliptic/ec"
import { isInputValid } from "./isInputValid";
import { hash } from "./hash";

const secp256k1 = new EC('secp256k1')

export function isAuthorized(
  proof: Proof,
  stats: InfoWrapped
): boolean {
  let isAuthorized = false

  if (
    isInputValid(stats) &&
    proof && proof.publicKey && proof.signature
  ) {
    if (
      reserved.indexOf(proof.address.toLowerCase()) < 0 &&
      trusted
        .indexOf(proof.address.toLowerCase()) > -1
    ) {

      // check that msg hash is equal to msg hash from proof
      const msgHash = hash(JSON.stringify(stats))

      if (!(msgHash === proof.msgHash.substr(2))) {
        console.error(
          'API', 'SIG',
          'Message hash did not match',
          msgHash, proof.msgHash.substr(2)
        )
        return false
      }

      // recover key from public key
      const pubkeyNoZeroX = proof.publicKey.substr(2)

      let pubkey: KeyPair

      try {
        pubkey = secp256k1.keyFromPublic(pubkeyNoZeroX, 'hex')
      } catch (err) {
        console.error('API', 'SIG', 'Public Key Error', (err as Error).message)
        return false
      }

      // compare address
      const addressHash = hash(pubkeyNoZeroX.substr(2), 'hex')
        .substr(24)

      if (!(addressHash.toLowerCase() === proof.address.substr(2).toLowerCase())) {
        console.error(
          'API', 'SIG',
          'Address hash did not match', addressHash,
          proof.address.substr(2)
        )
        return false
      }

      // create signature
      const signature: {
        r: string
        s: string
      } = {
        r: proof.signature.substr(2, 64),
        s: proof.signature.substr(66, 64)
      }

      // validate sig
      try {
        isAuthorized = pubkey.verify(msgHash, signature)
        if (!isAuthorized) {
          console.error('API', 'SIG', 'Signature did not verify')
          return false
        }
      } catch (e) {
        console.error('API', 'SIG', 'Signature Error', (e as Error).message)
        return false
      }
    }
  } else {
    console.error(
      'API', 'SIG', 'Input data malformed', stats, proof
    )
  }

  return isAuthorized
}