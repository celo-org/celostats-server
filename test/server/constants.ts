import { Info } from "../../src/server/interfaces/Info"
import { Stats } from "../../src/server/interfaces/Stats"
import { BlockSummary } from "../../src/server/interfaces/BlockSummary"
import { Block } from "../../src/server/interfaces/Block"
import { NodeInformation } from "../../src/server/interfaces/NodeInformation"

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

export const dummyNodeInformation: NodeInformation = {
  stats: {
    id: '0x1',
    address: "0x2",
    info: dummyInfo
  },
  nodeData: {
    ip: '127.0.0.1',
    latency: 12,
    spark: "abcsd"
  }
}

export const dummyBlock: Block = {
  blockRemain: 0,
  epochSize: 0,
  time: 0,
  received: 0,
  arrived: 0,
  uncles: [],
  validators: {
    elected: [],
    registered: []
  },
  trusted: false,
  fork: 0,
  propagation: 0,
  transactions: [],
  // block number
  number: 0,
  // block hash
  hash: '',
  // paren block hash
  parentHash: '',
  // miner address
  miner: '',
  difficulty: '0',
  totalDifficulty: '',
  gasLimit: 0,
  gasUsed: 0,
  timestamp: 0
}

export const dummyBlockSummary: BlockSummary = {
  blockRemain: 0,
  epochSize: 0,
  time: 0,
  received: 0,
  arrived: 0,
  signatures: 0,
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
  timestamp: 0
}

export const dummyStats: Stats = {
  uptime: 0,
  mining: false,
  proxy: false,
  registered: false,
  elected: false,
  gasPrice: 0,
  active: false,
  hashrate: 0,
  syncing: false,
  peers: 0,
  latency: 0,
  propagationAvg: 0,
  pending: 0
}