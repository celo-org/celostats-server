import { Proof } from "./Proof";
import { StatsWrapped } from "./StatsWrapped";

export interface NodeResponseStats {
  proof: Proof
  stats: StatsWrapped
}
