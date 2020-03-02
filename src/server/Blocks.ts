import { BlockWrapper } from "./interfaces/BlockWrapper";
import { cfg } from "./utils/config"

export default class Blocks extends Array<BlockWrapper> {
  public saveBlock(
    blockWrapper: BlockWrapper
  ): void {
    // store blockWrapper
    this
      .unshift(blockWrapper)

    // sort blocks
    this.sort(
      (block1: BlockWrapper, block2: BlockWrapper) =>
        block2.block.number - block1.block.number
    )

    // remove blocks when exceeding max history
    if (this.length > cfg.maxBlockHistory) {
      this.pop()
    }
  }

  public bestBlock(): BlockWrapper {
    return this[0]
  }

  public bestBlockNumber(): number {
    const best: BlockWrapper = this.bestBlock()

    if (best && !isNaN(best.block.number)) {
      return best.block.number
    }

    return -1
  }

  public worstBlock(): BlockWrapper {
    return this[this.length - 1]
  }

  public worstBlockNumber(): number {
    const worst: BlockWrapper = this.worstBlock()

    if (worst && !isNaN(worst.block.number)) {
      return worst.block.number
    }

    return -1
  }

  public findBlockByNumber(
    number: number
  ): BlockWrapper {
    const index = this.indexOf(
      this.find((b: BlockWrapper) => b.block.number === number)
    )

    if (index < 0) {
      return null
    }

    return this[index]
  }
}
