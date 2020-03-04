import { Miner } from "./Miner";
import { Histogram } from "./Histogram";

export interface ChartData {
  // the last x block numbers / heights
  readonly height: number[]
  // the last x block times
  readonly blocktime: number[]
  // average block time
  readonly avgBlocktime: number
  // the last x block difficulties
  readonly difficulty: string[]
  // todo: ?
  readonly uncles: number[]
  // the last x blocks transactions amount
  readonly transactions: number[]
  // the last x blocks gas spending amount
  readonly gasSpending: number[]
  // the last x blocks gas limit
  readonly gasLimit: number[]
  // the last x miners
  readonly miners: Miner[]
  // the last x signature count
  readonly signatures: number[]
  readonly propagation: Histogram
}
