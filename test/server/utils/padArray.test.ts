import { padArray } from "../../../src/server/utils/padArray"
import assert from "assert"

describe('padArray', () => {

  it('should fill an array', () => {
    const arr: number[] = []
    const fillValue = 66

    const result = padArray(arr, 10, fillValue)

    assert(result[9] === fillValue)
    assert(result.length === 10)
  })

})