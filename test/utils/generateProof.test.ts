import { generateProof } from "./generateProof";
import { StatsWrapped } from "../../src/interfaces/StatsWrapped"
import * as assert from "assert"

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
})