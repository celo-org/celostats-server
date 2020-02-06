import { Proof } from "./Proof";
import { BlockWrapped } from "./BlockWrapped";

export interface NodeResponseBlock {
  readonly proof: Proof
  readonly stats: BlockWrapped
}
