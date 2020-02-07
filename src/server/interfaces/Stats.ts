export interface Stats {
  active: boolean
  mining: boolean
  elected: boolean
  proxy: boolean
  pending: number
  hashrate: number
  registered: boolean
  syncing: boolean
  peers: number
  propagationAvg: number
  gasPrice: number
  latency: number
  uptime: number
}
