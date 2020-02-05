import assert from "assert"
import { isAuthorized } from "../../../src/server/utils/isAuthorized"
import { Proof } from "../../../src/server/interfaces/Proof";
import { trusted } from "../../../src/server/utils/config";
import { generateProof } from "./generateProof";
import { dummyInfo } from "../constats"
import { InfoWrapped } from "../../../src/server/interfaces/InfoWrapped"

describe('isAuthorized', () => {

  it('should authorize with valid sig', () => {

    const stats: InfoWrapped = {
      address: "0x0",
      info: dummyInfo,
      id: 'lorem ipsum'
    }

    const proof: Proof = generateProof(stats)
    const result = isAuthorized(proof, stats)

    assert(result)
  })

  it('should not authorize with invalid sig', () => {

    const stats: InfoWrapped = {
      address: "0x0",
      info: dummyInfo,
      id: 'lorem ipsum'
    }

    const proof: Proof = {
      ...generateProof(stats),
      // put fake sig
      signature: '0x' + new Array(130)
        .fill('d', 0, 130)
        .join('')
    }

    const result = isAuthorized(proof, stats)

    assert(!result)
  })

  it('should not authorize with different valid sig', () => {

    const stats: InfoWrapped = {
      address: "0x0",
      info: dummyInfo,
      id: 'lorem ipsum'
    }

    const proof: Proof = generateProof(stats)

    const stats2 = {
      ...stats,
      // change the payload to force a different signature
      id: 'asdfg'
    }

    const result = isAuthorized(proof, stats2)

    assert(!result)
  })

  it('should not authorize with different address', () => {

    const stats: InfoWrapped = {
      address: "0x0",
      info: dummyInfo,
      id: 'lorem ipsum'
    }

    const proof: Proof = {
      ...generateProof(stats),
      address: 'lorem ipsum'
    }

    trusted.push(proof.address)

    const result = isAuthorized(proof, stats)

    assert(!result)
  })

  it('should not authorize from untrusted address', () => {

    const stats: InfoWrapped = {
      address: "0x0",
      info: dummyInfo,
      id: 'lorem ipsum'
    }

    const proof: Proof = {
      ...generateProof(stats),
      address: '0xuntrusted'
    }

    const result = isAuthorized(proof, stats)

    assert(!result)
  })

})