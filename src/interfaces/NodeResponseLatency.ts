import { Proof } from "./Proof";
import { Latency } from "./Latency";

export interface NodeResponseLatency {
  proof: Proof
  stats: Latency
}
