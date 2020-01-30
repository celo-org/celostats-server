import { Stats } from "./Stats";
import { Info } from "./Info";

export interface NodeDetails {
  readonly id: string,
  readonly stats: Stats
  readonly info: Info
  readonly history: number[]
}
