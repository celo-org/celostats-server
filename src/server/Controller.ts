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

export default class Controller {
  private readonly collection: Collection
  public readonly statistics: Statistics;

  constructor(
    private api: Primus,
    private client: Primus
  ) {
    this.collection = new Collection()
    this.statistics = new Statistics(this.collection);
  }

  public init(): void {
    // ping clients
    setInterval(() => {
      this.clientWrite({
        action: 'client-ping',
        data: {
          serverTime: Date.now()
        }
      })
    }, cfg.clientPingTimeout)

    // Cleanup old inactive nodes
    setInterval(() => {
      this.clientWrite({
        action: 'init',
        data: this.collection.getAll()
      })

      this.handleGetCharts()

    }, cfg.nodeCleanupTimeout)

    // print statistics
    setInterval(() => {
      let clients = 0
      this.client.forEach(() => clients++);

      let nodes = 0;
      this.api.forEach(() => nodes++);

      this.statistics.print(clients, nodes);
    }, cfg.statisticsInterval)
  }

  private clientWrite(payload: object) {
    this.client.forEach((spark: Primus.spark) => {
      spark.write(payload)

      this.statistics.add(Sides.Client, Directions.Out)
    });
  }

  private handleGetCharts(
    spark?: Primus.spark
  ): void {
    this.collection.getCharts(
      (err: Error | string, charts: ChartData): void => {
        if (err) {
          console.error(
            'COL', 'CHR',
            'Charts error:', err
          )
        } else {

          const chartsResponse = {
            action: 'charts',
            data: charts
          }
          if (spark) {
            spark.write(chartsResponse)

            this.statistics.add(Sides.Client, Directions.Out)
          } else {

            // propagate to all clients
            this.clientWrite(chartsResponse)
          }
        }
      }
    )
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
      id,
      address: proof.address,
      ip: spark.address.ip,
      spark: spark.id,
      latency: spark.latency || 0
    }

    this.collection.addNode(
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

          this.clientWrite({
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

          // TODO: Change this and built this into a real data model
          // TODO: THIS IS A HACK!

          // @ts-ignore
          updatedStats.block.validators.elected = updatedStats.block.validators.elected ? updatedStats.block.validators.elected.length : 0
          // @ts-ignore
          updatedStats.block.validators.registered = updatedStats.block.validators.registered ? updatedStats.block.validators.registered.length : 0

          delete (updatedStats.block.transactions)

          this.clientWrite({
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
          this.clientWrite({
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
          this.clientWrite({
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
    if (validators && validators.registered) {
      validators.registered.forEach(validator => {
        validator.registered = true

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

        const isElected = validators.elected.indexOf(validator.address) > -1
        this.collection.setValidator(
          validator, isElected
        )
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
            this.clientWrite({
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
          this.clientWrite({
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
  public handleClientPong(
    data: ClientPong,
    spark: Primus.spark
  ): void {
    const serverTime = data.serverTime || 0
    const latency = Math.ceil((Date.now() - serverTime) / 2)

    spark.emit(
      'client-latency',
      {latency: latency}
    )

    this.statistics.add(Sides.Client, Directions.Out)
  }

  public handleClientReady(
    id: string,
    spark: Primus.spark
  ): void {
    spark.emit(
      'init',
      {nodes: this.collection.getAll()}
    )

    this.statistics.add(Sides.Client, Directions.Out)

    // propagate the charts only to this client not to all
    this.handleGetCharts(spark);

    console.success(
      'API', 'CON',
      'Client', `'${id}'`,
      'Connected'
    )
  }

  public handleClientEnd(
    id: string,
    ip: string
  ): boolean {
    console.success(
      'API', 'CON', 'Client Close:',
      ip, `'${id}'`
    )

    return true
  }
}
