import { generateProof } from "./generateProof";
import * as assert from "assert"
import { dummyInfo } from "../constats"
import { InfoWrapped } from "../../../src/server/interfaces/InfoWrapped"

describe('#generateProof()', () => {
  it('should generate 130 bytes long 0x prefixed signatures always', () => {

    const stats: InfoWrapped = {
      address: '0x0',
      id: 'lorem ipsum',
      info: dummyInfo
    }

    for (let x = 0; x < 50; x++) {
      const proof = generateProof(stats)
      assert.equal(proof.signature.length, 130)
    }

  })
})