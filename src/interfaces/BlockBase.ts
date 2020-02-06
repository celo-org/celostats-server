export interface BlockBase {
  number: number
  hash: string
  parentHash: string
  miner: string
  blockRemain: number
  difficulty: string
  epochSize: number
  totalDifficulty: string
  gasLimit: number
  gasUsed: number
  timestamp: number
  time: number
  arrival: number
  received: number
  trusted: boolean
  arrived: number
  fork: number
  propagation: number
}
