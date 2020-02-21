import { BlockWrapper } from "./interfaces/BlockWrapper";

export default class Blocks extends Array<BlockWrapper> {
  public prevMaxBlock(): BlockWrapper {
    const heights = this.map(item => item.block.number)
    const index = heights.indexOf(Math.max(...heights))

    if (index < 0) {
      return null
    }

    return this[index]
  }

  public bestBlock(): BlockWrapper {
    return this[0]
  }

  public worstBlock(): BlockWrapper {
    return this[this.length - 1]
  }

  public bestBlockNumber(): number {
    const best: BlockWrapper = this.bestBlock()

    if (best && best.block.number) {
      return best.block.number
    }

    return 0
  }

  public worstBlockNumber(): number {
    const worst: BlockWrapper = this.worstBlock()

    if (worst && worst.block.number) {
      return worst.block.number
    }

    return 0
  }

  // todo: this is dead code
  private clean(
    max: number
  ): void {
    if (max > 0 && this.length > 0 && max < this.bestBlockNumber()) {
      console.log('MAX:', max)

      console.log('History items before:', this.length)

      const delta = this
        .filter((blockWrapper: BlockWrapper) => {
          return (
            blockWrapper.block.number <= max &&
            !blockWrapper.block.trusted
          )
        })

      console.log('History items after:', this.length)
    }
  }

  public search(
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
