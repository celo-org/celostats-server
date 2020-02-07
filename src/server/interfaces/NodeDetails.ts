import { Info } from "./Info";
import { StatsSummary } from "./StatsSummary"

export interface NodeDetails {
  readonly id: string,
  readonly stats: StatsSummary
  readonly info: Info
  readonly history: number[]
}
