import { Info } from "../../src/server/interfaces/Info"
import { Stats } from "../../src/server/interfaces/Stats"
import { BlockSummary } from "../../src/server/interfaces/BlockSummary"

export const dummyInfo: Info = {
  name: '',
  contact: '',
  canUpdateHistory: true,
  node: '',
  port: 0,
  net: 0,
  protocol: '',
  api: '',
  os: '',
  // eslint-disable-next-line @typescript-eslint/camelcase
  os_v: '',
  client: ''
}

export const dummyBlock: BlockSummary = {
  blockRemain: 0,
  epochSize: 0,
  time: 0,
  received: 0,
  arrived: 0,
  validators: {
    elected: 0,
    registered: 0
  },
  trusted: false,
  fork: 0,
  propagation: 0,
  transactions: 0,
  // block number
  number: 0,
  // block hash
  hash: '',
  // paren block hash
  parentHash: '',
  // miner address
  miner: '',
  difficulty: '',
  totalDifficulty: '',
  gasLimit: 0,
  gasUsed: 0,
  timestamp: 0,
  arrival: 0,
}

export const dummyStats: Stats = {
  uptime: 0,
  mining: false,
  proxy: false,
  gasPrice: 0,
  active: false,
  hashrate: 0,
  syncing: false,
  peers: 0,
  latency: 0,
  propagationAvg: 0,
  pending: 0
}