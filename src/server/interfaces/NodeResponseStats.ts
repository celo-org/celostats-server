import { Proof } from "./Proof";
import { StatsWrapped } from "./StatsWrapped";

export interface NodeResponseStats {
  readonly proof: Proof
  readonly stats: StatsWrapped
}
