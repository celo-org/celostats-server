import { StatsSummary } from "./StatsSummary"

export interface NodeStats {
  readonly id: string,
  readonly name: string,
  readonly stats: StatsSummary
  readonly history: number[]
}
