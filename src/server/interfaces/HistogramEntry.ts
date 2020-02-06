export interface HistogramEntry {
  readonly x: number
  readonly dx: number
  readonly y: number
  readonly frequency: number
  readonly cumulative: number
  readonly cumpercent: number
}