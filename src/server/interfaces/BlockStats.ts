import { BlockSummary } from "./BlockSummary"
import { Address } from "./Address"
import { SignedState } from "./SignedState"

export interface BlockStats {
  readonly id: Address
  readonly block: BlockSummary
  readonly propagationAvg: number
  readonly history: number[]
  readonly signHistory: SignedState[]
}
