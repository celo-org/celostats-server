export interface StatsBase {
  active: boolean
  mining: boolean
  elected: boolean
  proxy: boolean
  hashrate: number
  syncing: boolean
  peers: number
  gasPrice: number
  registered: boolean
  latency: number
  uptime: number
}
