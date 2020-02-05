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
import { ValidatorData } from "./interfaces/ValidatorData"

export default class Node {

  private readonly id: string = null
  private spark: string

  private info: Info = {
    api: null,
    client: null,
    net: null,
    node: null,
    os: null,
    // eslint-disable-next-line @typescript-eslint/camelcase
    os_v: null,
    port: null,
    protocol: null,
    canUpdateHistory: false,
    name: null,
    contact: null
  }

  private stats: Stats = {
    active: false,
    mining: false,
    elected: false,
    proxy: false,
    hashrate: null,
    peers: null,
    pending: null,
    gasPrice: null,
    block: {
      number: null,
      epochSize: null,
      blockRemain: null,
      hash: null,
      parentHash: null,
      difficulty: null,
      totalDifficulty: null,
      gasLimit: null,
      gasUsed: null,
      timestamp: null,
      time: null,
      miner: null,
      validators: {
        registered: [],
        elected: []
      },
      trusted: false,
      arrival: null,
      received: null,
      arrived: null,
      fork: null,
      propagation: null,
      transactions: [],
      uncles: []
    },
    syncing: false,
    propagationAvg: null,
    propagationHistory: [],
    latency: null,
    uptime: null
  }

  private uptime: Uptime = {
    started: null,
    up: null,
    down: null,
    lastStatus: false,
    lastUpdate: null
  }

  private validatorData: ValidatorData = {
    blsPublicKey: null,
    ecdsaPublicKey: null,
    score: null,
    affiliation: null,
    registered: false,
    elected: false,
    signer: null
  }

  public constructor(id: string) {
    this.id = id
  }

  public setNodeInformation(
    nodeInformation: NodeInformation,
    callback: { (err: Error | string, nodeInfo: NodeInfo): void }
  ) {
    // preset propagation history
    this.stats.propagationHistory.fill(-1, 0, cfg.maxPropagationHistory)

    // activage node
    if (this.uptime.started === null) {
      this.setState(true)
    }

    // unpack latency
    if (nodeInformation.nodeData.latency) {
      this.stats.latency = nodeInformation.nodeData.latency
    }

    // do we have info in the stats?
    if (
      nodeInformation.stats &&
      nodeInformation.stats.info
    ) {
      // yep, set it
      this.info = nodeInformation.stats.info

      // can this node update the history?
      if (nodeInformation.stats.info.canUpdateHistory) {
        this.info.canUpdateHistory = nodeInformation.stats.info.canUpdateHistory || false
      }
    }

    // store spark
    this.spark = nodeInformation.nodeData.spark

    callback(null, this.getInfo())
  }

  public setValidatorData(data: ValidatorData) {
    this.validatorData = data
  }

  public getSpark() {
    return this.spark;
  }

  public getId(): string {
    return this.id
  }

  public getTrusted(): boolean {
    return trusted.indexOf(this.getId()) > -1
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
        !deepEqual(propagationHistory, this.stats.propagationHistory)

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
          id: this.getId(),
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
          id: this.getId(),
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

    this.uptime.lastStatus = active
    this.uptime.lastUpdate = now

    this.stats.active = active
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
      id: this.getId(),
      name: this.info.name,
      stats: {
        active: this.stats.active,
        mining: this.stats.mining,
        elected: this.stats.elected,
        proxy: this.stats.proxy,
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
      history: this.stats.propagationHistory
    }
  }

  private getBlockStats(): BlockStats {
    return {
      id: this.getId(),
      block: {
        transactions: this.stats.block.transactions.length,
        validators: {
          elected: this.stats.block.validators.elected.length,
          registered: this.stats.block.validators.elected.length,
        },
        epochSize: this.stats.block.epochSize,
        blockRemain: this.stats.block.blockRemain,
        number: this.stats.block.number,
        hash: this.stats.block.hash,
        parentHash: this.stats.block.parentHash,
        miner: this.stats.block.miner,
        difficulty: this.stats.block.difficulty,
        totalDifficulty: this.stats.block.totalDifficulty,
        gasLimit: this.stats.block.gasLimit,
        gasUsed: this.stats.block.gasUsed,
        timestamp: this.stats.block.timestamp,
        time: this.stats.block.time,
        arrival: this.stats.block.arrival,
        received: this.stats.block.received,
        trusted: this.stats.block.trusted,
        arrived: this.stats.block.arrived,
        fork: this.stats.block.fork,
        propagation: this.stats.block.propagation
      },
      propagationAvg: this.stats.propagationAvg,
      history: this.stats.propagationHistory
    }
  }

  private getBasicStats(): BasicStatsResponse {
    return {
      id: this.getId(),
      stats: {
        active: this.stats.active,
        mining: this.stats.mining,
        elected: this.stats.elected,
        proxy: this.stats.proxy,
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
      id: this.getId(),
      info: this.info,
      stats: {
        active: this.stats.active,
        mining: this.stats.mining,
        elected: this.stats.elected,
        proxy: this.stats.proxy,
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
      history: this.stats.propagationHistory,
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
    if (deepEqual(propagationHistory, this.stats.propagationHistory)) {
      // no, nothing to set
      return false
    }

    if (!propagationHistory) {
      this.stats.propagationHistory = [].fill(-1, 0, cfg.maxPropagationHistory)
      this.stats.propagationAvg = 0

      return true
    }

    this.stats.propagationHistory = propagationHistory

    const positives: number[] = this.stats.propagationHistory
      .filter((p: number) => {
        return p >= 0
      })

    const sum = positives.reduce((sum, h) => sum + h, 0)

    this.stats.propagationAvg = (positives.length > 0 ? Math.round(sum / positives.length) : 0)

    return true
  }
}

