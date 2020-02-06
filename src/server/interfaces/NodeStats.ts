import { Stats } from "./Stats";

export interface NodeStats {
  readonly id: string,
  readonly name: string
  readonly stats: Stats
  readonly history: number[]
}
