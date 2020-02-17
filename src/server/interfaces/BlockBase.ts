export interface BlockBase {
  readonly number: number
  readonly hash: string
  readonly parentHash: string
  readonly miner: string
  readonly blockRemain: number
  readonly difficulty: string
  readonly epochSize: number
  readonly totalDifficulty: string
  readonly gasLimit: number
  readonly gasUsed: number
  readonly timestamp: number
  time: number
  readonly arrival: number
  received: number
  trusted: boolean
  arrived: number
  fork: number
  propagation: number
}
