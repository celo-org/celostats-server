import { Address } from "../interfaces/Address"

export const trusted: Address[] = []

export const banned: Address[] = []

export const reserved: Address[] = []

// add trusted from env
if (process.env.TRUSTED_ADDRESSES) {
  trusted.push(...(process.env.TRUSTED_ADDRESSES.split(',').map((address: Address) => address.toLowerCase())))
}
if (process.env.BANNED_ADDRESSES) {
  banned.push(...(process.env.BANNED_ADDRESSES.split(',').map((address: Address) => address.toLowerCase())))
}
if (process.env.RESERVED_ADDRESSES) {
  reserved.push(...(process.env.RESERVED_ADDRESSES.split(',').map((address: Address) => address.toLowerCase())))
}

const compression = process.env.COMPRESSION ? process.env.COMPRESSION === 'true' : true
const prePopulateFromWhitelist = process.env.PRE_POPULATE_FROM_WHITELIST ? process.env.PRE_POPULATE_FROM_WHITELIST === 'true' : false
const production = process.env.NODE_ENV ? process.env.NODE_ENV === 'production' : false

const JSONRPC = process.env.JSONRPC || "http://localhost:8545"

// general config
export const cfg = {
  production,
  prePopulateFromWhitelist,
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
  retrieveTrustedSignersInterval: 60 * 1000,
  compression,
  transport: {
    perMessageDeflate: compression
  },
  JSONRPC
}
