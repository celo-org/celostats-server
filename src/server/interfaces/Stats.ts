import { StatsBase } from "./StatsBase";
import { Block } from "./Block";

export interface Stats extends StatsBase {
  propagationAvg: number
  pending: number
  block: Block
  readonly signer: string
  readonly clientTime: number
}
