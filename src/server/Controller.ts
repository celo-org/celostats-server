import './utils/logger'
// @ts-ignore
import Primus from "primus"
import Collection from "./Collection";
import Node from "./Node";
import io from "socket.io"
import { Statistics } from "./statistics/Statistics";
import { Sides } from "./statistics/Sides";
import { Directions } from "./statistics/Directions";
import { Proof } from "./interfaces/Proof";
import { InfoWrapped } from "./interfaces/InfoWrapped";
import { NodeData } from "./interfaces/NodeData";
import { NodeInformation } from "./interfaces/NodeInformation";
import { Block } from "./interfaces/Block";
import { Stats } from "./interfaces/Stats";
import { Validators } from "./interfaces/Validators";
import {
  banned,
  cfg,
  trusted
} from "./utils/config";
import { NodeStats } from "./interfaces/NodeStats";
import { ClientPong } from "./interfaces/ClientPong";
import { NodePing } from "./interfaces/NodePing";
import { NodePong } from "./interfaces/NodePong";
import { isAuthorized } from "./utils/isAuthorized";
import { Validator } from "./interfaces/Validator"
import { ValidatorData } from "./interfaces/ValidatorData"
import { NodeDetails } from "./interfaces/NodeDetails"
import { Events } from "./server/Events"
import { Address } from "./interfaces/Address"
import { ChartData } from "./interfaces/ChartData"
import { Pending } from "./interfaces/Pending"
import { StatsResponse } from "./interfaces/StatsResponse"
import { ClientPing } from "./interfaces/ClientPing"
import { LastBlock } from "./interfaces/LastBlock"

export default class Controller {
  private readonly collection: Collection
  public readonly statistics: Statistics;

  constructor(
    private api: Primus,
    private client: io.Server
  ) {
    this.collection = new Collection()
    this.statistics = new Statistics(this.collection);
  }

  public init(): void {
    // ping clients
    setInterval(() => {
      this.clientBroadcast(
        Events.ClientPing,
        <ClientPing>{
          serverTime: Date.now()
        }
      )
    }, cfg.clientPingTimeout)

    // Cleanup old inactive nodes
    setInterval(() => {
      this.clientBroadcast(
        Events.Init,
        this.collection.getAll()
      )

      this.handleGetCharts()

    }, cfg.nodeCleanupTimeout)

    // print statistics
    setInterval(() => {
      const clients = Object.keys(this.client.sockets.connected).length

      let nodes = 0;
      this.api.forEach(() => nodes++);

      this.statistics.print(clients, nodes);
    }, cfg.statisticsInterval)
  }

  private clientBroadcast(
    action: Events,
    payload: object
  ) {
    for (const i in this.client.sockets.connected) {
      this.emit(
        this.client.sockets.connected[i],
        action, payload
      );
      this.statistics.add(Sides.Client, Directions.Out)
    }
  }

  private emit(
    s: io.Socket | Primus.spark,
    action: Events,
    payload?: object | any[]
  ) {
    if (payload) {
      s.emit(action, payload)
    } else {
      s.emit(action)
    }
  }

  /*************************************
   * Node handlers
   *************************************/
  private handleNodeInfo(
    id: Address,
    stats: InfoWrapped,
    spark: Primus.spark
  ): void {

    const nodeData: NodeData = {
      ip: spark.address.ip,
      spark: spark.id,
      latency: spark.latency || 0
    }

    const nodeDetails: NodeDetails = this.collection.addNode(
      id,
      <NodeInformation>{
        nodeData,
        stats
      }
    )

    if (nodeDetails) {
      this.emit(
        spark,
        Events.Ready
      )

      this.statistics.add(Sides.Node, Directions.Out)

      console.success(
        'API', 'CON', 'Node',
        `'${nodeDetails.info.name}'`, `(${spark.id})`, 'Connected')

      this.clientBroadcast(
        Events.Add,
        nodeDetails
      )
    }
  }

  public handleNodeBlock(
    id: Address,
    ip: string,
    block: Block
  ): void {
    const res = this.collection.addBlock(
      id,
      block
    )

    if (res) {
      if (res.blockStats) {
        this.clientBroadcast(
          Events.Block,
          res.blockStats
        )
        console.info(
          'API', 'BLK',
          'Block:', res.blockStats.block['number'],
          'td:', res.blockStats.block['totalDifficulty'],
          'from:', res.blockStats.id, 'ip:', ip
        )
      }

      if (res.highestBlock) {
        this.clientBroadcast(
          Events.LastBlock,
          <LastBlock>{
            highestBlock: res.highestBlock
          }
        )

        // propagate to all the clients
        this.handleGetCharts()
      }
    }
  }

  public handleNodePending(
    id: Address,
    stats: Stats
  ): void {
    const pending: Pending = this.collection.updatePending(
      id, stats
    )

    if (pending) {
      this.clientBroadcast(
        Events.Pending,
        pending
      )

      console.info(
        'API', 'TXS', 'Pending:',
        pending['pending'],
        'from:', pending.id
      )
    }
  }

  public handleNodeBlockValidators(
    validators: Validators
  ): void {
    if (
      validators &&
      validators.registered &&
      validators.elected
    ) {
      for (const validator of validators.registered) {

        // trust registered validators and signers - not safe
        if (
          validator.address &&
          trusted
            .map((address: Address) => address.toLowerCase())
            .indexOf(validator.address.toLowerCase()) === -1
        ) {
          trusted.push(validator.address.toLowerCase())
        }

        if (
          validator.signer &&
          trusted
            .map((address: Address) => address.toLowerCase())
            .indexOf(validator.signer.toLowerCase()) === -1
        ) {
          trusted.push(validator.signer.toLowerCase())
        }

        const v: ValidatorData = {
          affiliation: validator.affiliation,
          ecdsaPublicKey: validator.ecdsaPublicKey,
          score: parseFloat(validator.score) / 10000000000000000000000,
          signer: validator.signer,
          blsPublicKey: validator.blsPublicKey,
          address: validator.address
        }

        // correlate via signer here
        const id = v.signer
        this.collection.setValidator(id, v)
      }

      this.collection.updateStakingInformation(
        validators.registered.map((validator: Validator): Address => validator.signer.toLowerCase()),
        validators.elected.map((elected: Address): Address => elected.toLowerCase())
      )
    }
  }

  public handleNodeStats(
    id: Address,
    stats: Stats
  ): void {
    const statsResponse: StatsResponse = this.collection.updateStats(id, stats)

    if (statsResponse) {
      this.clientBroadcast(
        Events.Stats,
        statsResponse
      )

      console.info(
        'API', 'STA',
        'Stats from:', id
      )
    }

  }

  public handleNodeLatency(
    id: Address,
    latency: number
  ): void {
    const lat = this.collection.updateLatency(id, latency)

    if (lat) {
      this.clientBroadcast(
        Events.Latency,
        lat
      )

      console.info(
        'API', 'PIN',
        'Latency:', lat.latency,
        'from:', id
      )
    }
  }

  public handleNodeEnd(
    id: string
  ): void {

    const nodeStats: NodeStats = this.collection.setInactive(id)

    if (nodeStats) {
      this.clientBroadcast(
        Events.Inactive,
        nodeStats
      )

      console.success(
        'API', 'CON', 'Node:',
        `'${nodeStats.name}'`, `(${id})`,
        'disconnected.'
      )
    }
  }

  public handleNodePing(
    id: Address,
    stats: NodePing,
    spark: Primus.spark
  ): void {
    const start = (stats.clientTime ? stats.clientTime : null)

    this.emit(
      spark,
      Events.NodePong,
      <NodePong>{
        clientTime: start,
        serverTime: Date.now()
      }
    )

    this.statistics.add(Sides.Node, Directions.Out)

    console.info(
      'API', 'PIN',
      'Ping from:', id
    )
  }

  private handleNodeAuth(
    id: string,
    proof: Proof,
    stats: InfoWrapped,
    spark: Primus.spark
  ): boolean {

    if (
      banned.indexOf(spark.address.ip) >= 0 ||
      !isAuthorized(proof, stats)
    ) {
      console.error(
        'API', 'CON', 'Node Closed: wrong auth',
        `'${stats.id}'`, `(${id})`,
        'address:', proof.address
      )

      spark.end(undefined, {reconnect: false})

      return false
    }

    console.info(
      'API', 'CON',
      'Hello', id
    )

    return true
  }

  public handleNodeHello(
    id: Address,
    proof: Proof,
    stats: InfoWrapped,
    spark: Primus.spark
  ): boolean {
    const isAuthed = this.handleNodeAuth(
      spark.id, proof, stats, spark
    )

    if (isAuthed && stats.info) {
      this.handleNodeInfo(id, stats, spark)
    }

    return isAuthed
  }

  /*************************************
   * Client handlers
   *************************************/
  private handleGetCharts(
    socket?: io.Socket
  ): void {
    const charts: ChartData = this.collection.getCharts()

    if (charts) {
      if (socket) {
        this.emit(
          socket,
          Events.Charts,
          charts
        )

        this.statistics.add(Sides.Client, Directions.Out)
      } else {

        // propagate to all clients
        this.clientBroadcast(
          Events.Charts,
          charts
        )
      }
    }
  }

  public handleClientPong(
    data: ClientPong,
    socket: io.Socket
  ): void {
    const serverTime: number = data.serverTime || 0
    const latency: number = Math.ceil((Date.now() - serverTime) / 2)

    this.emit(
      socket,
      Events.ClientLatency, {
        latency
      }
    )

    this.statistics.add(Sides.Client, Directions.Out)
  }

  public handleClientReady(
    id: string,
    socket: io.Socket
  ): void {
    this.emit(
      socket,
      Events.Init,
      this.collection.getAll()
    )

    this.statistics.add(Sides.Client, Directions.Out)

    // propagate the charts only to this client not to all
    this.handleGetCharts(socket);

    console.success(
      'API', 'CON',
      'Client', `'${id}'`,
      'Connected'
    )
  }

  public handleClientEnd(
    id: string,
    socket: io.Socket,
    reason: string
  ): boolean {
    console.success(
      'API', 'CON', 'Client Close:',
      socket.conn.remoteAddress, `'${id}'`,
      reason
    )

    return true
  }

  public getForks() {
    return this.collection.getForks()
  }
}
