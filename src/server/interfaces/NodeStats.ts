import { Stats } from "./Stats";

export interface NodeStats {
  id: string,
  name: string,
  stats: Stats
  history: number[]
}
