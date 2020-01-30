import { HistogramEntry } from "./HistogramEntry";

export interface Histogram {
  readonly histogram: HistogramEntry[]
  readonly avg: number
}
