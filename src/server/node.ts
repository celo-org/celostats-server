import { cfg, trusted } from "./utils/config"
import { Stats } from "./interfaces/Stats";
import { Block } from "./interfaces/Block";
import { Validator } from "./interfaces/Validator";
import { Pending } from "./interfaces/Pending";
import { NodeInfo } from "./interfaces/NodeInfo"
import { BasicStatsResponse } from "./interfaces/BasicStatsResponse";
import { Latency } from "./interfaces/Latency";
import { BlockStats } from "./interfaces/BlockStats";
import { Info } from "./interfaces/Info";
import { Uptime } from "./interfaces/Uptime";
import { NodeStats } from "./interfaces/NodeStats";
import { NodeDetails } from "./interfaces/NodeDetails";
import { NodeInformation } from "./interfaces/NodeInformation";
import deepEqual from "deep-equal";

export default class Node {

  private id: string = null
  private spark: string
  private address: string = null
  private trusted: boolean = false
  private propagationHistory: number[] = []
  private info: Info = {
    canUpdateHistory: false,
    name: null,
    contact: null
  } as Info
  private stats: Stats = {
    active: false,
    mining: false,
    elected: false,
    hashrate: 0,
    peers: 0,
    pending: 0,
    gasPrice: 0,
    block: {
      number: 0,
      hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      difficulty: '0',
      totalDifficulty: '0',
      gasLimit: 0,
      gasUsed: 0,
      timestamp: 0,
      time: 0,
      miner: '0x0000000000000000000000000000000000000000000000000000000000000000',
      validators: {
        registered: [],
        elected: []
      },
      trusted: false,
      arrival: 0,
      received: 0,
      arrived: 0,
      fork: 0,
      propagation: 0,
      transactions: [],
      uncles: []
    },
    syncing: false,
    propagationAvg: 0,
    latency: 0,
    uptime: 100
  }
  private uptime: Uptime = {
    started: 0,
    up: 0,
    down: 0,
    lastStatus: false,
    lastUpdate: 0
  }
  private validatorData: Validator = {
    name: null,
    url: null,
    address: null,
    affiliation: null,
    registered: false,
    elected: false,
    signer: null
  }

  constructor(
    data: NodeInformation | Validator
  ) {

    if ("registered" in data) {
      this.setValidatorData(data as Validator)
    } else {
      this.init(data as NodeInformation)
    }

    if ('nodeData' in data) {
      this.address = data.nodeData.address
    }
  }

  public init(
    nodeInformation: NodeInformation
  ) {
    this.propagationHistory.fill(-1, 0, cfg.maxPropagationHistory)

    if (
      this.id === null &&
      this.uptime.started === null
    ) {
      this.setState(true)
    }

    this.id = nodeInformation.nodeData.id || this.id

    if (nodeInformation.nodeData.latency) {
      this.stats.latency = nodeInformation.nodeData.latency
    }

    this.setInfo(
      nodeInformation,
      (err: Error | string) => {
        if (err) {
          console.log(err)
        }
      }
    )
  }

  public setInfo(
    nodeInformation: NodeInformation,
    callback: { (err: Error | string, nodeInfo: NodeInfo): void }
  ) {
    if (nodeInformation.stats && nodeInformation.stats.info) {
      this.info = nodeInformation.stats.info

      if (nodeInformation.stats.info.canUpdateHistory) {
        this.info.canUpdateHistory = nodeInformation.stats.info.canUpdateHistory || false
      }
    }

    if (nodeInformation.nodeData.ip) {
      if (trusted.indexOf(nodeInformation.nodeData.ip) >= 0) {
        this.trusted = true
      }
      this.trusted = true
    }

    this.setState(true)
    this.validatorData.signer = this.id
    this.spark = nodeInformation.nodeData.spark

    callback(null, this.getInfo())
  }

  public setValidatorData(data: Validator) {
    this.validatorData = data
  }

  public getValidatorData(): Validator {
    return this.validatorData;
  }

  public setValidatorElected(elected: boolean) {
    this.validatorData.elected = elected;
  }

  public getSpark() {
    return this.spark;
  }

  public getId(): string {
    return this.id
  }

  public setValidatorRegistered(registered: boolean) {
    this.validatorData.registered = registered;
  }

  public integrateValidatorData(data: Validator) {
    this.info.name = data.name || data.address
    this.info.contact = data.address
    this.trusted = true
    this.validatorData.signer = data.signer
    this.id = data.address
    this.address = data.address
  }

  public getTrusted(): boolean {
    return this.trusted
  }

  public setStats(
    stats: Stats,
    history: number[],
    callback: { (err: Error | string, stats: NodeStats): void }
  ) {
    if (stats) {

      const block = stats.block || this.stats.block

      this.setBlock(
        block,
        history,
        (err: Error | string, blockStats: BlockStats) => {
          if (err) {
            console.error(err)
          }
        })

      this.setBasicStats(
        stats,
        (err: Error | string) => {
          if (err) {
            console.error(err)
          }
        })

      const pending = stats.pending || this.stats.pending

      if (pending) {
        this.setPending(stats, (err: Error | string) => {
          if (err) {
            console.error(err)
          }
        })
      }

      callback(null, this.getStats())
    }

    callback('Stats undefined', null)
  }

  public setBlock(
    block: Block,
    propagationHistory: number[],
    callback: { (err: Error | string, blockStats: BlockStats): void }
  ) {
    if (block && !isNaN(block.number)) {

      const propagationHistoryChanged =
        !deepEqual(propagationHistory, this.propagationHistory)

      const blockDataChanged =
        !deepEqual(block, this.stats.block)

      if (propagationHistoryChanged || blockDataChanged) {

        this.setPropagationHistory(propagationHistory)

        const blockNumberChanged = block.number !== this.stats.block.number
        const blockHashChanged = block.hash !== this.stats.block.hash

        if (blockNumberChanged || blockHashChanged) {
          if (!block.validators.registered) {
            block.validators = this.stats.block.validators
          }
          this.stats.block = block

          callback(null, this.getBlockStats())
        }
      }
    } else {
      callback('Block undefined', null)
    }
  }

  public setPending(
    stats: Stats,
    callback: { (err: Error | string, pending: Pending | null): void }
  ) {
    // bad request
    if (stats && !isNaN(stats.pending)) {
      // nothing pending
      if (stats.pending !== this.stats.pending) {
        // pending
        this.stats.pending = stats.pending

        callback(null, {
          id: this.id,
          pending: this.stats.pending
        })
      } else {
        callback(null, null)
      }
    } else {
      callback('Stats undefined in pending', null)
    }
  }

  public setBasicStats(
    stats: Stats,
    callback: { (err: Error | string, basicStats: BasicStatsResponse | null): void }
  ) {
    if (stats) {
      if (!deepEqual(stats,
        {
          active: this.stats.active,
          mining: this.stats.mining,
          elected: this.stats.elected,
          hashrate: this.stats.hashrate,
          peers: this.stats.peers,
          gasPrice: this.stats.gasPrice,
          uptime: this.stats.uptime
        })
      ) {
        this.stats.active = stats.active
        this.stats.mining = stats.mining
        this.stats.elected = stats.elected
        this.stats.syncing = stats.syncing || false
        this.stats.hashrate = stats.hashrate
        this.stats.peers = stats.peers
        this.stats.gasPrice = stats.gasPrice
        this.stats.uptime = stats.uptime

        callback(null, this.getBasicStats())
      } else {
        callback(null, null)
      }
    } else {
      callback('Stats undefined in basic stats', null)
    }
  }

  public setLatency(
    latency: number,
    callback: { (err: Error | string, latency: Latency): void }
  ) {
    if (!isNaN(latency)) {
      if (latency !== this.stats.latency) {
        this.stats.latency = latency

        callback(null, {
          id: this.id,
          latency: latency
        })
      } else {
        callback(null, null)
      }
    } else {
      callback('Latency undefined', null)
    }
  }

  public setState(
    active: boolean
  ) {
    const now = Date.now()

    if (this.uptime.started !== null) {
      if (this.uptime.lastStatus === active) {
        this.uptime[(active ? 'up' : 'down')] += now - this.uptime.lastUpdate
      } else {
        this.uptime[(active ? 'down' : 'up')] += now - this.uptime.lastUpdate
      }
    } else {
      this.uptime.started = now
    }

    this.stats.active = active
    this.uptime.lastStatus = active
    this.uptime.lastUpdate = now

    this.stats.uptime = this.calculateUptime()
  }

  public isInactiveAndOld() {
    return (
      !this.uptime.lastStatus &&
      this.uptime.lastUpdate !== null &&
      (Date.now() - this.uptime.lastUpdate) > cfg.maxInactiveTime
    )
  }

  public getStats(): NodeStats {
    return {
      id: this.id,
      name: this.info.name,
      stats: {
        active: this.stats.active,
        mining: this.stats.mining,
        syncing: this.stats.syncing,
        hashrate: this.stats.hashrate,
        peers: this.stats.peers,
        gasPrice: this.stats.gasPrice,
        block: this.stats.block,
        propagationAvg: this.stats.propagationAvg,
        uptime: this.stats.uptime,
        pending: this.stats.pending,
        latency: this.stats.latency
      },
      history: this.propagationHistory
    }
  }

  private getBlockStats(): BlockStats {
    return {
      id: this.id,
      block: this.stats.block,
      propagationAvg: this.stats.propagationAvg,
      history: this.propagationHistory
    }
  }

  private getBasicStats(): BasicStatsResponse {
    return {
      id: this.id,
      stats: {
        active: this.stats.active,
        mining: this.stats.mining,
        elected: this.stats.elected,
        syncing: this.stats.syncing,
        hashrate: this.stats.hashrate,
        peers: this.stats.peers,
        gasPrice: this.stats.gasPrice,
        uptime: this.stats.uptime,
        latency: this.stats.latency
      }
    }
  }

  private getInfo(): NodeDetails {
    return {
      id: this.id,
      info: this.info,
      stats: {
        active: this.stats.active,
        mining: this.stats.mining,
        syncing: this.stats.syncing,
        hashrate: this.stats.hashrate,
        peers: this.stats.peers,
        gasPrice: this.stats.gasPrice,
        block: this.stats.block,
        propagationAvg: this.stats.propagationAvg,
        uptime: this.stats.uptime,
        latency: this.stats.latency,
        pending: this.stats.pending,
      },
      history: this.propagationHistory,
    }
  }

  private calculateUptime() {
    if (this.uptime.lastUpdate === this.uptime.started) {
      return 100
    }

    return Math.round(this.uptime.up / (this.uptime.lastUpdate - this.uptime.started) * 100)
  }

  private setPropagationHistory(
    propagationHistory: number[]
  ) {
    // anything new?
    if (deepEqual(propagationHistory, this.propagationHistory)) {
      // no, nothing to set
      return false
    }

    if (!propagationHistory) {
      this.propagationHistory = [].fill(-1, 0, cfg.maxPropagationHistory)
      this.stats.propagationAvg = 0

      return true
    }

    this.propagationHistory = propagationHistory

    const positives: number[] = this.propagationHistory
      .filter((p: number) => {
        return p >= 0
      })

    const sum = positives.reduce((sum, h) => sum + h, 0)

    this.stats.propagationAvg = (positives.length > 0 ? Math.round(sum / positives.length) : 0)

    return true
  }
}
