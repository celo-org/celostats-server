import { StatsSummary } from "./StatsSummary"
import { Address } from "./Address"
import { SignedState } from "./SignedState"

export interface NodeStats {
  readonly id: Address
  readonly stats: StatsSummary
  readonly history: number[]
  readonly signHistory: SignedState[]
}
