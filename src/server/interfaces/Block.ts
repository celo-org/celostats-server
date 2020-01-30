import { Validators } from "./Validators";
import { Transaction } from "./Transaction";

export interface Block {
  time: number
  received: number
  arrived: number
  validators: Validators
  trusted: boolean
  fork: number
  propagation: number
  transactions: Transaction[]
  // block number
  readonly number: number
  // block hash
  readonly hash: string
  // paren block hash
  readonly parentHash: string
  // miner address
  readonly miner: string
  readonly difficulty: string
  readonly totalDifficulty: string
  readonly gasLimit: number
  readonly gasUsed: number
  readonly timestamp: number
  readonly arrival: number
  readonly uncles: any[]
}
