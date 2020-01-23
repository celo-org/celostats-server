import { BlockWrapper } from "../interfaces/BlockWrapper";
import { Block } from "../interfaces/Block";
import { compareBlocks } from "./compareBlocks";

export function compareForks(historyBlock: BlockWrapper, block2: Block): number {
  if (!historyBlock) {
    return -1
  }

  if (!historyBlock.forks || historyBlock.forks.length === 0) {
    return -1
  }

  for (let x = 0; x < historyBlock.forks.length; x++) {
    if (compareBlocks(historyBlock.forks[x], block2)) {
      return x
    }
  }

  return -1
}
