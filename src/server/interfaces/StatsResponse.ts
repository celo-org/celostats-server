import { Stats } from "./Stats"

export interface StatsResponse {
  id: string,
  stats: Stats,
  history?: number[]
}