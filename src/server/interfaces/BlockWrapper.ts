import { PropagationTime } from "./PropagationTime";
import { Block } from "./Block";

export interface BlockWrapper {
  block: Block
  readonly height: number
  readonly forks: Block[]
  readonly propagTimes: PropagationTime[]
}
