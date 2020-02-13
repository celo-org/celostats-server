import { BlockSummary } from "./BlockSummary"
import { Address } from "./Address"

export interface BlockStats {
  readonly id: Address
  readonly block: BlockSummary
  readonly propagationAvg: number
  readonly history: number[]
}
