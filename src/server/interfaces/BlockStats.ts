import { BlockSummary } from "./BlockSummary"
import { Address } from "./Address"

export interface BlockStats {
  id: Address
  block: BlockSummary
  propagationAvg: number
  history: number[]
}
