import { isInputValid } from "../../../src/server/utils/isInputValid"
import assert from "assert"

describe('isInputValid', () => {

  it('should return false if stats is null', () => {
    const result = isInputValid(null)
    assert(!result)
  })

  it('should return false if stats.id is null', () => {
    const result = isInputValid({id: null})
    assert(!result)
  })

  it('should return true if stats.id has value', () => {
    const result = isInputValid({id: 'lorem ipsum'})
    assert(result)
  })

})