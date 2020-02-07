export interface Stats {
  active: boolean
  mining: boolean
  proxy: boolean
  pending: number
  hashrate: number
  syncing: boolean
  peers: number
  propagationAvg: number
  gasPrice: number
  latency: number
  uptime: number
}
