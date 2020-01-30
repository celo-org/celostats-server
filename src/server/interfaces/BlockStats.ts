import { Block } from "./Block";

export interface BlockStats {
  readonly id: string
  readonly block: Block
  readonly propagationAvg: number,
  readonly history: number[]
}
