import { PropagationTime } from "./PropagationTime";
import { Block } from "./Block";

export interface BlockWrapper {
  height: number
  block: Block
  forks: Block[]
  propagTimes: PropagationTime[]
}
