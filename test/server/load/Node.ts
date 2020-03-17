// @ts-ignore
import Primus from "primus"
// @ts-ignore
import * as primusEmit from "primus-emit"
// @ts-ignore
import * as primusSparkLatency from "primus-spark-latency"

import { generateKey, generateProof } from "../utils/generateProof"
import { hash } from "../../../src/server/utils/hash"
import { Events, Latency } from "../../../src/server"
import { InfoWrapped } from "../../../src/server/interfaces/InfoWrapped"
import { dummyInfo } from "../constants"
import { NodeResponseInfo } from "../../../src/server/interfaces/NodeResponseInfo"
import { NodePong } from "../../../src/server/interfaces/NodePong"
import { fuzzy } from "./utils"
import { NodeResponseLatency } from "../../../src/server/interfaces/NodeResponseLatency"
import { NodePing } from "../../../src/server/interfaces/NodePing"
import { NodeResponsePing } from "../../../src/server/interfaces/NodeResponsePing"
import { Block } from "../../../src/server/interfaces/Block"
import { BlockWrapped } from "../../../src/server/interfaces/BlockWrapped"
import { NodeResponseBlock } from "../../../src/server/interfaces/NodeResponseBlock"
import { cfg } from "../../../src/server/utils/config"

const Socket = Primus.createSocket({
  pathname: '/api',
  transformer: "websockets",
  parser: 'JSON',
  pingInterval: false,
  compression: cfg.compression,
  transport: cfg.transport,
  plugin: {
    emit: primusEmit,
    'spark-latency': primusSparkLatency
  }
})

export class Node {
  api: Primus.Socket = null
  key = generateKey()
  publicKey = this.key.getPublic().encode('hex')
  address = '0x' + hash(this.publicKey.substr(2), 'hex').substr(24)

  private pingInterval: NodeJS.Timeout = null
  private blockInterval: NodeJS.Timeout = null

  constructor(
    private id: string,
    private factor: number,
    private volatilityPercent: number,
    private verbose: boolean
  ) {
    this.api = new Socket('ws://localhost:3000');

    this.api.on(Events.Error, (err: Primus.Spark) => {
      console.log(`${this.id} error!`, err.message)
      this.end()
    });

    this.api.on(Events.End, () => {
      console.log("end")
    });
  }

  getAddress() {
    return this.address
  }

  start() {
    this.api.on("open", () => {

      const stats: InfoWrapped = {
        id: this.id,
        address: this.address,
        info: {
          ...dummyInfo,
          name: this.id,
          contact: "test@celo.org"
        }
      }

      const nodeResponseInfo: NodeResponseInfo = {
        proof: generateProof(stats, this.key),
        stats
      }

      this.api.emit(Events.Hello, nodeResponseInfo)

      console.log(`${this.id} hello sent`)
    });

    this.api.on(Events.NodePong, (data: NodePong) => {
      const latency = fuzzy(
        Date.now() - data.serverTime,
        this.volatilityPercent
      )

      if (this.verbose) {
        console.log(`${this.id} pong latency ${latency}`)
      }

      const nodePing: Latency = {
        id: this.id,
        latency
      }

      const nodeResponsePing: NodeResponseLatency = {
        stats: nodePing,
        proof: generateProof(nodePing, this.key)
      }

      this.api.emit(Events.Latency, nodeResponsePing)

      if (this.verbose) {
        console.log(`${this.id} sent latency`)
      }
    });

    const pInterval = fuzzy(10, this.volatilityPercent)

    // ping interval
    this.pingInterval = setInterval(() => {
      const nodePing: NodePing = {
        id: this.id,
        clientTime: Date.now() + fuzzy(1, this.volatilityPercent)
      }

      const nodeResponsePing: NodeResponsePing = {
        stats: nodePing,
        proof: generateProof(nodePing, this.key)
      }

      this.api.emit(Events.NodePing, nodeResponsePing)

      if (this.verbose) {
        console.log(`${this.id} sent ping`)
      }
    }, (pInterval / this.factor) * 1000)

  }

  onBlock(block: Block) {
    const blockWrapped: BlockWrapped = {
      id: this.id,
      block,
    }

    const nodeResponseBlock: NodeResponseBlock = {
      stats: blockWrapped,
      proof: generateProof(blockWrapped, this.key)
    }

    this.api.emit(Events.Block, nodeResponseBlock)
    if (this.verbose) {
      console.log(`${this.id} dispatched block ${block.number}`)
    }
  }

  stop() {
    clearInterval(this.pingInterval)
    clearInterval(this.blockInterval)
  }

  end() {
    this.stop()
    this.api.destroy()
  }
}