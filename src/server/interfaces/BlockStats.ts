import { BlockSummary } from "./BlockSummary"

export interface BlockStats {
  readonly id: string
  readonly block: BlockSummary
  readonly propagationAvg: number,
  readonly history: number[]
}
