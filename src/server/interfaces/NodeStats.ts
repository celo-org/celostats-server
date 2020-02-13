import { StatsSummary } from "./StatsSummary"
import { Address } from "./Address"

export interface NodeStats {
  readonly id: Address,
  readonly name: string
  readonly stats: StatsSummary
  readonly history: number[]
}
