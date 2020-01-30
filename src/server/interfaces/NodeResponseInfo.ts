import { Proof } from "./Proof";
import { InfoWrapped } from "./InfoWrapped";

export interface NodeResponseInfo {
  readonly proof: Proof
  readonly stats: InfoWrapped
}
