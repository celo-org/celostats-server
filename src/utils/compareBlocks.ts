import { Block } from "../interfaces/Block";

export function compareBlocks(
  block1: Block,
  block2: Block
): boolean {
  return !(block1.hash !== block2.hash ||
    block1.parentHash !== block2.parentHash ||
    block1.miner !== block2.miner ||
    block1.difficulty !== block2.difficulty ||
    block1.totalDifficulty !== block2.totalDifficulty)
}
