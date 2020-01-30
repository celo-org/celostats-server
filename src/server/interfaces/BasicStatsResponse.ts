import { StatsBase } from "./StatsBase";

export interface BasicStatsResponse {
  readonly id: string,
  readonly name: string,
  readonly stats: StatsBase
}
