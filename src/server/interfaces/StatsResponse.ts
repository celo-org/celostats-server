import { Stats } from "./Stats"
import { Address } from "./Address"

export interface StatsResponse {
  readonly id: Address,
  readonly stats: Stats,
  readonly history?: number[]
}