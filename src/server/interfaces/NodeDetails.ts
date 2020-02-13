import { Info } from "./Info";
import { StatsSummary } from "./StatsSummary"
import { Address } from "./Address"

export interface NodeDetails {
  readonly id: Address
  readonly stats: StatsSummary
  readonly info: Info
  readonly history: number[]
}
