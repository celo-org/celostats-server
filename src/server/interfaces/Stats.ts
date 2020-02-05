import { StatsBase } from "./StatsBase";
import { Block } from "./Block";
import { Info } from "./Info";

export interface Stats extends StatsBase {
  propagationAvg?: number
  propagationHistory?: number[]
  name?: string
  registered?: boolean
  signer?: string
  pending: number
  block: Block
  clientTime?: number
  info?: Info
}
