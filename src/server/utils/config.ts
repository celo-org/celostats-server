import { Address } from "../interfaces/Address"

export const trusted: Address[] = []

export const banned: Address[] = []

export const reserved: Address[] = []

// add trusted from env
if (process.env.TRUSTED_ADDRESSES) {
  trusted.push(...process.env.TRUSTED_ADDRESSES.split(','))
}
if (process.env.BANNED_ADDRESSES) {
  banned.push(...process.env.BANNED_ADDRESSES.split(','))
}
if (process.env.RESERVED_ADDRESSES) {
  reserved.push(...process.env.RESERVED_ADDRESSES.split(','))
}

const compression = process.env.COMPRESSION ? process.env.COMPRESSION === 'true' : true
const production = process.env.NODE_ENV ? process.env.NODE_ENV === 'production' : false

const blockscoutUrl = process.env.BLOCKSCOUTURL || "https://baklavastaging-blockscout.celo-testnet.org"

// general config
export const cfg = {
  production,
  port: process.env.PORT || 3000,
  headersTimeout: 0.9 * 1000,
  maxHeadersCount: 0,
  timeout: 0.6 * 1000,
  maxBlockHistory: 250,
  maxPropagationHistory: 40,
  maxInactiveTime: 1000 * 60 * 60 * 4,
  maxBins: 40,
  maxPeerPropagation: 40,
  minPropagationRange: 0,
  maxPropagationRange: 10000,
  clientPingTimeout: 5 * 1000,
  nodeCleanupTimeout: 1000 * 60 * 60,
  statisticsInterval: 60 * 1000,
  compression,
  transport: {
    perMessageDeflate: compression
  },
  blockscoutUrl
}
