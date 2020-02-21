import { PropagationTime } from "./PropagationTime";
import { Block } from "./Block";

export interface BlockWrapper {
  block: Block
  signers: string[]
  readonly forks: Block[]
  readonly propagTimes: PropagationTime[]
}
