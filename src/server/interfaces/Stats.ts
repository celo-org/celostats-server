import { StatsBase } from "./StatsBase";
import { Block } from "./Block";

export interface Stats extends StatsBase {
  propagationAvg: number
  propagationHistory?: number[]
  name?: string
  readonly signer?: string
  pending: number
  block: Block
  readonly clientTime?: number
}
