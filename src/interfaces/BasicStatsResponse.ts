import { StatsBase } from "./StatsBase";

export interface BasicStatsResponse {
  id: string,
  stats: StatsBase,
  history?: number[]
}