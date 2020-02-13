import { Stats } from "./Stats"
import { BlockSummary } from "./BlockSummary"

export interface StatsSummary extends Stats {
  readonly block: BlockSummary
}