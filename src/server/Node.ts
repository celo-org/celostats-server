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
import https from "https"
import http from "http"

const agentOpts = {
  keepAlive: true
}


const httpsAgent = new https.Agent(agentOpts)
const httpAgent = new http.Agent(agentOpts)

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

  private _propagationHistory: number[] = []

  private _block: Block = {
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
    trusted: null,
    arrival: null,
    received: null,
    arrived: null,
    fork: null,
    propagation: null,
    transactions: [],
    uncles: []
  }

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

  public constructor(id: Address) {
    this._id = id
  }

  public setNodeInformation(
    nodeInformation: NodeInformation
  ): NodeDetails {
    // preset propagation history
    this._propagationHistory.fill(-1, 0, cfg.maxPropagationHistory)

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

    if (!this._validatorData.validatorGroupName) {
      this.loadValidatorGroupName(validatorData.affiliation)
    }

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
    block: Block,
    propagationHistory: number[],
  ): BlockStats | null {
    if (
      block &&
      !isNaN(block.number)
    ) {
      const propagationHistoryChanged =
        !deepEqual(propagationHistory, this._propagationHistory)

      const blockDataChanged =
        !deepEqual(block, this._block)

      if (propagationHistoryChanged || blockDataChanged) {

        this.setPropagationHistory(propagationHistory)

        const blockNumberChanged = block.number !== this._block.number
        const blockHashChanged = block.hash !== this._block.hash

        if (blockNumberChanged || blockHashChanged) {
          // do we have registered validators already?
          if (!block.validators.registered) {
            // if so, set them in the block
            block.validators = this._block.validators
          }

          // overwrite block
          this._block = block

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
      !this._uptime.lastStatus &&
      this._uptime.lastUpdate !== null &&
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
      history: this._propagationHistory
    }
  }

  private getBlockSummary(): BlockSummary {
    return {
      transactions: this._block.transactions.length,
      validators: {
        elected: this._block.validators.elected.length,
        registered: this._block.validators.registered.length,
      },
      epochSize: this._block.epochSize,
      blockRemain: this._block.blockRemain,
      number: this._block.number,
      hash: this._block.hash,
      parentHash: this._block.parentHash,
      miner: this._block.miner,
      difficulty: this._block.difficulty,
      totalDifficulty: this._block.totalDifficulty,
      gasLimit: this._block.gasLimit,
      gasUsed: this._block.gasUsed,
      timestamp: this._block.timestamp,
      time: this._block.time,
      arrival: this._block.arrival,
      received: this._block.received,
      trusted: this._block.trusted,
      arrived: this._block.arrived,
      fork: this._block.fork,
      propagation: this._block.propagation
    }
  }

  private getBlockStats(): BlockStats {
    return {
      id: this.getId(),
      block: this.getBlockSummary(),
      propagationAvg: this._stats.propagationAvg,
      history: this._propagationHistory
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
      history: this._propagationHistory,
    }
  }

  private calculateUptime(): number {
    if (this._uptime.lastUpdate === this._uptime.started) {
      return 100
    }

    return Math.round(this._uptime.up / (this._uptime.lastUpdate - this._uptime.started) * 100)
  }

  private setPropagationHistory(
    propagationHistory: number[]
  ): boolean {
    // anything new?
    if (deepEqual(propagationHistory, this._propagationHistory)) {
      // no, nothing to set
      return false
    }

    if (!propagationHistory) {
      this._propagationHistory = [].fill(-1, 0, cfg.maxPropagationHistory)
      this._stats.propagationAvg = 0

      return true
    }

    this._propagationHistory = propagationHistory

    const positives: number[] = this._propagationHistory
      .filter((p: number) => {
        return p >= 0
      })

    const sum = positives.reduce((sum, h) => sum + h, 0)

    this._stats.propagationAvg = (positives.length > 0 ? Math.round(sum / positives.length) : 0)

    return true
  }

  private loadValidatorGroupName(
    validatorGroupAddress: string
  ): void {

    try {
      (async () => {
        const query = `{
  celoValidatorGroup(hash: "${validatorGroupAddress}") { 
    account {
      name
    }
  }
}`;

        const url = new URL(cfg.blockscoutUrl)
        const request = (url.protocol.startsWith('https') ? https : http).request(
          {
            method: 'POST',
            host: url.host,
            protocol: url.protocol,
            path: '/graphiql',
            port: url.port,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            agent: url.protocol.startsWith('https') ? httpsAgent : httpAgent
          }, (response) => {

            let res = ''
            response.on('data', (chunk: string) => {
              res += chunk
            })

            response.on('end', () => {
              const {data} = JSON.parse(res)

              if (data && data.celoValidatorGroup) {
                this._validatorData.validatorGroupName =
                  data.celoValidatorGroup.account.name;
              }
            })
          }
        )

        request.write(JSON.stringify({query}))
        request.end();

      })()
    } catch (err) {
      console.error('Unable to connect to Blockscout!', err.message)
    }
  }
}
