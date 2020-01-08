import { Proof } from "./Proof";
import { BlockWrapped } from "./BlockWrapped";

export interface NodeResponseBlock {
  proof: Proof
  stats: BlockWrapped
}
