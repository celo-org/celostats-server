import { Proof } from "./Proof";
import { Latency } from "./Latency";

export interface NodeResponseLatency {
  readonly proof: Proof
  readonly stats: Latency
}
