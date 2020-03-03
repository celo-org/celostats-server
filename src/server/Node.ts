import deepEqual from "deep-equal";
import { cfg, trusted } from "./utils/config"
import { Block } from "./interfaces/Block";
import { Pending } from "./interfaces/Pending";
import { Latency } from "./interfaces/Latency";
import { StatsResponse } from "./interfaces/StatsResponse";
import { BlockStats } from "./interfaces/BlockStats";
import { Info } from "./interfaces/Info";
import { Uptime } from "./interfaces/Uptime";
import { NodeStats } from "./interfaces/NodeStats";
import { NodeDetails } from "./interfaces/NodeDetails";
import { NodeInformation } from "./interfaces/NodeInformation";
import { ValidatorData } from "./interfaces/ValidatorData"
import { BlockSummary } from "./interfaces/BlockSummary"
import { NodeSummary } from "./interfaces/NodeSummary"
import { Stats } from "./interfaces/Stats"
import { ValidatorDataWithStaking } from "./interfaces/ValidatorDataWithStaking"
import { Address } from "./interfaces/Address"
import { blockHistory } from "./BlockHistory"
import { BlockWrapper } from "./interfaces/BlockWrapper"
import { SignedState } from "./interfaces/SignedState"

export default class Node {

  private readonly _id: Address = null
  private _spark: string

  private _info: Info = {
    api: null,
    client: null,
    net: null,
    node: null,
    os: null,
    // eslint-disable-next-line @typescript-eslint/camelcase
    os_v: null,
    port: null,
    protocol: null,
    canUpdateHistory: null,
    name: null,
    contact: null
  }

  private _highestBlock = -1

  private _stats: Stats = {
    active: null,
    registered: null,
    mining: null,
    elected: null,
    proxy: null,
    hashrate: null,
    peers: null,
    pending: null,
    gasPrice: null,
    syncing: null,
    propagationAvg: null,
    latency: null,
    uptime: null
  }

  private readonly _uptime: Uptime = {
    started: null,
    up: null,
    down: null,
    lastStatus: null,
    lastUpdate: null
  }

  private _validatorData: ValidatorDataWithStaking = {
    address: null,
    blsPublicKey: null,
    ecdsaPublicKey: null,
    score: null,
    validatorGroupName: null,
    affiliation: null,
    registered: null,
    elected: null,
    signer: null
  }

  public constructor(
    id: Address
  ) {
    this._id = id
  }

  public setNodeInformation(
    nodeInformation: NodeInformation
  ): NodeDetails {
    // activate node
    if (this._uptime.started === null) {
      this.setState(true)
    }

    // unpack latency
    if (nodeInformation.nodeData.latency) {
      this._stats.latency = nodeInformation.nodeData.latency
    }

    // do we have info in the stats?
    if (
      nodeInformation.stats &&
      nodeInformation.stats.info
    ) {
      // yep, set it
      this._info = nodeInformation.stats.info

      // can this node update the history?
      if (nodeInformation.stats.info.canUpdateHistory) {
        this._info.canUpdateHistory = nodeInformation.stats.info.canUpdateHistory || false
      }
    }

    // store spark
    this._spark = nodeInformation.nodeData.spark

    return this.getInfo()
  }

  public setValidatorData(
    validatorData: ValidatorData,
  ): void {

    // set data
    this._validatorData = {
      ...this._validatorData,
      blsPublicKey: validatorData.blsPublicKey,
      ecdsaPublicKey: validatorData.ecdsaPublicKey,
      score: validatorData.score,
      affiliation: validatorData.affiliation,
      signer: validatorData.signer,
      address: validatorData.address,
      elected: null,
      registered: null
    }
  }

  public getSpark() {
    return this._spark;
  }

  public getId(): Address {
    return this._id
  }

  public getName(): string {
    return this._info.name
  }

  public getUptime(): Uptime {
    return this._uptime
  }

  public setStakingInformation(
    registered: boolean,
    elected: boolean
  ) {
    this._validatorData.registered = registered
    this._validatorData.elected = elected
  }

  public getTrusted(): boolean {
    return trusted.indexOf(this.getId()) > -1
  }

  public setBlock(
    receivedBlock: Block,
  ): BlockStats | null {
    if (
      receivedBlock &&
      !isNaN(receivedBlock.number)
    ) {
      const currentBlock = this.getBlock()

      // did the block data changed?
      const blockDataChanged =
        !deepEqual(receivedBlock, currentBlock?.block)

      if (blockDataChanged) {
        // set block data
        const blockNumberChanged = receivedBlock.number !== currentBlock?.block.number
        const blockHashChanged = receivedBlock.hash !== currentBlock?.block.hash

        if (blockNumberChanged || blockHashChanged) {
          // do we have registered validators already?
          if (!receivedBlock.validators?.registered) {
            // if so, set them in the block
            receivedBlock.validators = currentBlock?.block.validators
          }

          this._highestBlock = receivedBlock.number

          return this.getBlockStats()
        }
      }
    }
  }

  public setPending(
    stats: Stats
  ): Pending {
    // bad request
    if (
      stats &&
      !isNaN(stats.pending)
    ) {
      // nothing pending
      if (stats.pending !== this._stats.pending) {
        // pending
        this._stats.pending = stats.pending

        return {
          id: this.getId(),
          pending: this._stats.pending
        }
      }
    }
  }

  public setStats(
    stats: Stats,
  ): StatsResponse {
    if (stats) {
      if (!deepEqual(stats, <Stats>{
        active: this._stats.active,
        mining: this._stats.mining,
        elected: this._stats.elected,
        proxy: this._stats.proxy,
        hashrate: this._stats.hashrate,
        syncing: this._stats.syncing,
        peers: this._stats.peers,
        gasPrice: this._stats.gasPrice,
        uptime: this._stats.uptime
      })
      ) {
        this._stats.active = stats.active
        this._stats.mining = stats.mining
        this._stats.elected = stats.elected
        this._stats.proxy = stats.proxy
        this._stats.hashrate = stats.hashrate
        this._stats.syncing = stats.syncing || false
        this._stats.peers = stats.peers
        this._stats.gasPrice = stats.gasPrice
        this._stats.uptime = stats.uptime

        return this.getStatsResponse()
      }
    }
  }

  public setLatency(
    latency: number
  ): Latency {
    if (!isNaN(latency)) {
      if (latency !== this._stats.latency) {
        this._stats.latency = latency

        return {
          id: this.getId(),
          latency: latency
        }
      }
    }
  }

  public setState(
    active: boolean
  ) {
    const now = Date.now()

    if (this._uptime.started !== null) {
      if (this._uptime.lastStatus === active) {
        this._uptime[(active ? 'up' : 'down')] += now - this._uptime.lastUpdate
      } else {
        this._uptime[(active ? 'down' : 'up')] += now - this._uptime.lastUpdate
      }
    } else {
      this._uptime.started = now
    }

    this._uptime.lastStatus = active
    this._uptime.lastUpdate = now

    this._stats.active = active
    this._stats.uptime = this.calculateUptime()
  }

  public isInactiveAndOld() {
    return (
      // if last status is set
      // if last update is set
      !this._uptime.lastStatus && !isNaN(this._uptime.lastUpdate) &&
      // if last update is past max inactive time
      (Date.now() - this._uptime.lastUpdate) > cfg.maxInactiveTime
    )
  }

  public getSummary(): NodeSummary {
    return {
      id: this.getId(),
      validatorData: this._validatorData,
      stats: {
        registered: this._stats.registered || this._validatorData.registered,
        active: this._stats.active,
        mining: this._stats.mining,
        elected: this._stats.elected || this._validatorData.elected,
        proxy: this._stats.proxy,
        block: this.getBlockSummary(),
        hashrate: this._stats.hashrate,
        peers: this._stats.peers,
        pending: this._stats.pending,
        gasPrice: this._stats.gasPrice,
        syncing: this._stats.syncing,
        propagationAvg: this._stats.propagationAvg,
        latency: this._stats.latency,
        uptime: this._stats.uptime
      },
      info: this._info,
      uptime: this._uptime
    }
  }

  public getNodeStats(): NodeStats {
    return {
      id: this.getId(),
      name: this._info.name,
      stats: {
        registered: this._stats.registered || this._validatorData.registered,
        active: this._stats.active,
        mining: this._stats.mining,
        elected: this._stats.elected || this._validatorData.elected,
        proxy: this._stats.proxy,
        syncing: this._stats.syncing,
        hashrate: this._stats.hashrate,
        peers: this._stats.peers,
        gasPrice: this._stats.gasPrice,
        block: this.getBlockSummary(),
        propagationAvg: this._stats.propagationAvg,
        uptime: this._stats.uptime,
        pending: this._stats.pending,
        latency: this._stats.latency
      },
      history: this.getPropagationHistory(),
      signHistory: this.getSignHistory()
    }
  }

  private getBlockSummary(): BlockSummary {
    const blockWrapper = this.getBlock()

    if (blockWrapper) {
      return {
        transactions: blockWrapper.block.transactions.length,
        signatures: blockWrapper.signers?.length,
        validators: {
          elected: blockWrapper.block.validators?.elected.length,
          registered: blockWrapper.block.validators?.registered.length,
        },
        epochSize: blockWrapper.block.epochSize,
        blockRemain: blockWrapper.block.blockRemain,
        number: blockWrapper.block.number,
        hash: blockWrapper.block.hash,
        parentHash: blockWrapper.block.parentHash,
        miner: blockWrapper.block.miner,
        difficulty: blockWrapper.block.difficulty,
        totalDifficulty: blockWrapper.block.totalDifficulty,
        gasLimit: blockWrapper.block.gasLimit,
        gasUsed: blockWrapper.block.gasUsed,
        timestamp: blockWrapper.block.timestamp,
        time: blockWrapper.block.time,
        received: blockWrapper.block.received,
        trusted: blockWrapper.block.trusted,
        arrived: blockWrapper.block.arrived,
        fork: blockWrapper.block.fork,
        propagation: blockWrapper.block.propagation
      }
    }
  }

  private getBlockStats(): BlockStats {
    return {
      id: this.getId(),
      block: this.getBlockSummary(),
      propagationAvg: this._stats.propagationAvg,
      history: this.getPropagationHistory(),
      signHistory: this.getSignHistory(),
    }
  }

  private getStatsResponse(): StatsResponse {
    return {
      id: this.getId(),
      stats: {
        registered: this._stats.registered || this._validatorData.registered,
        active: this._stats.active,
        pending: this._stats.pending,
        mining: this._stats.mining,
        elected: this._stats.elected || this._validatorData.elected,
        proxy: this._stats.proxy,
        syncing: this._stats.syncing,
        hashrate: this._stats.hashrate,
        propagationAvg: this._stats.propagationAvg,
        peers: this._stats.peers,
        gasPrice: this._stats.gasPrice,
        uptime: this._stats.uptime,
        latency: this._stats.latency
      }
    }
  }

  private getInfo(): NodeDetails {
    return {
      id: this.getId(),
      info: this._info,
      stats: {
        registered: this._stats.registered || this._validatorData.registered,
        active: this._stats.active,
        mining: this._stats.mining,
        elected: this._stats.elected || this._validatorData.elected,
        proxy: this._stats.proxy,
        syncing: this._stats.syncing,
        hashrate: this._stats.hashrate,
        peers: this._stats.peers,
        gasPrice: this._stats.gasPrice,
        block: this.getBlockSummary(),
        propagationAvg: this._stats.propagationAvg,
        uptime: this._stats.uptime,
        latency: this._stats.latency,
        pending: this._stats.pending,
      },
      history: this.getPropagationHistory(),
    }
  }

  private calculateUptime(): number {
    if (this._uptime.lastUpdate === this._uptime.started) {
      return 100
    }

    return Math.round(
      this._uptime.up /
      (this._uptime.lastUpdate - this._uptime.started) * 100
    )
  }

  private getPropagationHistory(): number[] {

    const propagationHistory =
      blockHistory.getNodePropagationHistory(this._id) || new Array(cfg.maxPropagationHistory).fill(-1)

    const positives: number[] = propagationHistory
      .filter((propagation: number) => {
        return propagation >= 0
      })

    const sum = positives.reduce((sum, h) => sum + h, 0)

    // todo move this somewhere else
    this._stats.propagationAvg = (positives.length > 0 ? Math.round(sum / positives.length) : 0)

    return propagationHistory
  }

  private getSignHistory(): SignedState[] {
    let signHistory: SignedState[] = Array(cfg.maxBins).fill(null)

    if (this._validatorData.signer) {
      signHistory = blockHistory.getSignHistory(this._validatorData.signer)
    }

    return signHistory
  }

  private getBlock(): BlockWrapper {
    return blockHistory.getBlockByNumber(
      this._highestBlock
    )
  }
}
