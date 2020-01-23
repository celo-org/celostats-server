export interface StatsBase {
  active: boolean
  mining: boolean
  elected?: boolean
  hashrate: number
  syncing: boolean
  peers: number
  gasPrice: number
  latency: number
  uptime: number
}
