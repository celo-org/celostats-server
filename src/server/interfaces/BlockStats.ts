import { BlockSummary } from "./BlockSummary"

export interface BlockStats {
  id: string
  block: BlockSummary
  propagationAvg: number,
  history: number[]
}
