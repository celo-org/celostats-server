import { PropagationTime } from "./PropagationTime";
import { Block } from "./Block";

export interface BlockWrapper {
  block: Block
  readonly forks: Block[],
  readonly propagationTimes: PropagationTime[],
  signers: string[]
}
