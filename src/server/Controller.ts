import './utils/logger'
// @ts-ignore
import Primus from "primus"
import Collection from "./Collection";
import Node from "./Node";
import { Statistics } from "./statistics/Statistics";
import { ChartData } from "./interfaces/ChartData";
import { Sides } from "./statistics/Sides";
import { Directions } from "./statistics/Directions";
import { Proof } from "./interfaces/Proof";
import { InfoWrapped } from "./interfaces/InfoWrapped";
import { NodeData } from "./interfaces/NodeData";
import { NodeInformation } from "./interfaces/NodeInformation";
import { NodeInfo } from "./interfaces/NodeInfo";
import { Block } from "./interfaces/Block";
import { BlockStats } from "./interfaces/BlockStats";
import { Stats } from "./interfaces/Stats";
import { Pending } from "./interfaces/Pending";
import { Validators } from "./interfaces/Validators";
import {
  banned,
  cfg,
  trusted
} from "./utils/config";
import { BasicStatsResponse } from "./interfaces/BasicStatsResponse";
import { Latency } from "./interfaces/Latency";
import { NodeStats } from "./interfaces/NodeStats";
import { ClientPong } from "./interfaces/ClientPong";
import { NodePing } from "./interfaces/NodePing";
import { NodePong } from "./interfaces/NodePong";
import { isAuthorized } from "./utils/isAuthorized";
import io from "socket.io"
import { Validator } from "./interfaces/Validator"
import { ValidatorData } from "./interfaces/ValidatorData"

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
      this.clientBroadcast({
        action: 'client-ping',
        data: {
          serverTime: Date.now()
        }
      })
    }, cfg.clientPingTimeout)

    // Cleanup old inactive nodes
    setInterval(() => {
      this.clientBroadcast({
        action: 'init',
        data: this.collection.getAll()
      })

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

  private clientBroadcast(payload: object) {
    for (const i in this.client.sockets.connected) {
      this.client.sockets.connected[i].emit('b', payload);
      this.statistics.add(Sides.Client, Directions.Out)
    }
  }

  /*************************************
   * Node handlers
   *************************************/
  private handleNodeInfo(
    id: string,
    proof: Proof,
    stats: InfoWrapped,
    spark: Primus.spark
  ): void {

    const nodeData: NodeData = {
      address: proof.address,
      ip: spark.address.ip,
      spark: spark.id,
      latency: spark.latency || 0
    }

    this.collection.addNode(
      id,
      <NodeInformation>{
        nodeData,
        stats
      },
      (err: Error | string, info: NodeInfo): void => {
        if (err) {
          console.error(
            'API', 'CON',
            'Connection error:', err
          )
          return
        }

        if (info) {
          spark.emit('ready')

          this.statistics.add(Sides.Node, Directions.Out)

          console.success(
            'API', 'CON', 'Node',
            `'${stats.id}'`, `(${spark.id})`, 'Connected')

          this.clientBroadcast({
            action: 'add',
            data: info
          })
        }
      })
  }

  public handleNodeBlock(
    id: string,
    ip: string,
    block: Block
  ): void {
    this.collection.addBlock(
      id, block,
      (err: Error | string, updatedStats: BlockStats) => {
        if (err) {
          console.error(
            'API', 'BLK',
            'Block error:', err, updatedStats
          )
        } else if (updatedStats) {

          this.clientBroadcast({
            action: 'block',
            data: updatedStats
          })

          console.info(
            'API', 'BLK',
            'Block:', updatedStats.block['number'],
            'td:', updatedStats.block['totalDifficulty'],
            'from:', updatedStats.id, 'ip:', ip
          )
        }
      },
      (err: Error | string, highestBlock: number) => {
        if (err) {
          console.error(err)
        } else {
          this.clientBroadcast({
            action: 'lastBlock',
            number: highestBlock
          })

          // propagate to all the clients
          this.handleGetCharts()
        }
      }
    )
  }

  public handleNodePending(
    id: string,
    stats: Stats
  ): void {
    this.collection.updatePending(
      id, stats,
      (err: Error | string, pending: Pending) => {
        if (err) {
          console.error('API', 'TXS', 'Pending error:', err)
        }

        if (pending) {
          this.clientBroadcast({
            action: 'pending',
            data: pending
          })

          console.success(
            'API', 'TXS', 'Pending:',
            pending['pending'],
            'from:', pending.id
          )
        }
      }
    )
  }

  public handleNodeBlockValidators(
    validators: Validators
  ): void {
    if (
      validators &&
      validators.registered &&
      validators.elected
    ) {
      validators.registered.forEach((validator: Validator) => {

        // trust registered validators and signers - not safe
        if (
          validator.address &&
          trusted.indexOf(validator.address) === -1
        ) {
          trusted.push(validator.address)
        }

        if (
          validator.signer &&
          trusted.indexOf(validator.signer) === -1
        ) {
          trusted.push(validator.signer)
        }

        const elected = validators.elected.indexOf(validator.address) > -1

        const v: ValidatorData = {
          address: validator.address,
          affiliation: validator.affiliation,
          ecdsaPublicKey: validator.ecdsaPublicKey,
          score: validator.score,
          signer: validator.signer,
          blsPublicKey: validator.blsPublicKey,
          registered: true,
          elected
        }

        this.collection.setValidator(v)
      })
    }
  }

  public handleNodeStats(
    id: string,
    stats: Stats
  ): void {
    this.collection.updateStats(
      id, stats,
      (err: Error | string, basicStats: BasicStatsResponse) => {
        if (err) {
          console.error(
            'API', 'STA',
            'Stats error:', err
          )
        } else {

          if (basicStats) {
            this.clientBroadcast({
              action: 'stats',
              data: basicStats
            })

            console.info(
              'API', 'STA',
              'Stats from:', id
            )
          }
        }
      })
  }

  public handleNodeLatency(
    id: string,
    latency: number
  ): void {
    this.collection.updateLatency(
      id, latency,
      (err: Error | string, latency: Latency): void => {
        if (err) {
          console.error('API', 'PIN', 'Latency error:', err)
        }

        if (latency) {
          this.clientBroadcast({
              action: 'latency',
              data: latency
            }
          )

          console.info(
            'API', 'PIN',
            'Latency:', latency.latency,
            'from:', id
          )
        }
      }
    )
  }

  public handleNodeEnd(
    id: string
  ): void {

    this.collection.setInactive(
      id,
      (err: Error | string, nodeStats: NodeStats
      ) => {
        if (err) {
          console.error(
            'API', 'CON',
            'Connection with:', id,
            'ended.', 'Error:', err
          )
        } else {
          this.clientBroadcast({
            action: 'inactive',
            data: nodeStats
          })

          console.success(
            'API', 'CON', 'Node:',
            `'${nodeStats.name}'`, `(${id})`,
            'disconnected.'
          )
        }
      })
  }

  public handleNodePing(
    id: string,
    stats: NodePing,
    spark: Primus.spark
  ): void {
    const start = (stats.clientTime ? stats.clientTime : null)

    spark.emit(
      'node-pong',
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
    id: string,
    proof: Proof,
    stats: InfoWrapped,
    spark: Primus.spark
  ): boolean {
    const isAuthed = this.handleNodeAuth(
      spark.id, proof, stats, spark
    )

    if (isAuthed && stats.info) {
      this.handleNodeInfo(id, proof, stats, spark)
    }

    return isAuthed
  }

  /*************************************
   * Client handlers
   *************************************/
  private handleGetCharts(
    socket?: io.Socket
  ): void {
    this.collection.getCharts(
      (err: Error | string, charts: ChartData): void => {
        if (err) {
          console.error(
            'COL', 'CHR',
            'Charts error:', err
          )
        } else {

          if (socket) {
            socket.emit('charts', charts)

            this.statistics.add(Sides.Client, Directions.Out)
          } else {

            const chartsResponse = {
              action: 'charts',
              data: charts
            }
            // propagate to all clients
            this.clientBroadcast(chartsResponse)
          }
        }
      }
    )
  }

  public handleClientPong(
    data: ClientPong,
    socket: io.Socket
  ): void {
    const serverTime = data.serverTime || 0
    const latency = Math.ceil((Date.now() - serverTime) / 2)

    socket.emit(
      'client-latency',
      {latency: latency}
    )

    this.statistics.add(Sides.Client, Directions.Out)
  }

  public handleClientReady(
    id: string,
    socket: io.Socket
  ): void {
    socket.emit(
      'init',
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
}
