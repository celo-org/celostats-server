export interface StatsBase {
  active: boolean
  latency: number
  uptime: number
  mining: boolean
  elected: boolean
  hashrate: number
  syncing: boolean
  peers: number
  gasPrice: number
  registered: boolean
  proxy: boolean
}
