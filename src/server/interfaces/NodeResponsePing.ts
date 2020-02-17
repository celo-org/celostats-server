import { Proof } from "./Proof";
import { NodePing } from "./NodePing";

export interface NodeResponsePing {
  readonly proof: Proof
  readonly stats: NodePing
}
