import { Block } from "./Block";
import { Wrapper } from "./Wrapper";

export interface BlockWrapped extends Wrapper {
  block: Block
}
