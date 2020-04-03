export interface BlockBase {
  readonly number: number
  readonly hash: string
  readonly parentHash: string
  readonly miner: string
  readonly blockRemain: number
  readonly epochSize: number
  readonly totalDifficulty: string
  readonly gasLimit: number
  readonly gasUsed: number
  // ???
  readonly timestamp: number
  // ???
  time: number
  // ???
  received: number
  // was the reporting node trusted?
  trusted: boolean
  // arrival date
  arrived: number
  // index in the forks collection
  fork: number
  // propagation time
  propagation: number
}
