export const trusted: string[] = []

export const banned: string[] = []

export const reserved: string[] = []

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

// general config
export const cfg = {
  port: process.env.PORT || 3000,
  compression: process.env.COMPRESSION || true,
  headersTimeout: 0.9 * 1000,
  maxHeadersCount: 0,
  timeout: 0.6 * 1000,
  maxBlockHistory: 100,
  maxPropagationHistory: 40,
  maxInactiveTime: 1000 * 60 * 60 * 4,
  maxBins: 40,
  maxPeerPropagation: 40,
  minPropagationRange: 0,
  maxPropagationRange: 10000,
  clientPingTimeout: 5 * 1000,
  nodeCleanupTimeout: 1000 * 60 * 60,
  statisticsInterval: 60 * 1000,
  chartDebounceInterval: 500
}
