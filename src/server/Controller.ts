// @ts-ignore
import Primus from "primus"
import Collection from "./collection";
import Node from "./node";
import { Statistics } from "./statistics/Statistics";
import { ChartData } from "./interfaces/ChartData";
import _ from "lodash";
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
import { banned, trusted } from "./utils/config";
import { BasicStatsResponse } from "./interfaces/BasicStatsResponse";
import { Latency } from "./interfaces/Latency";
import { NodeStats } from "./interfaces/NodeStats";
import { ClientPong } from "./interfaces/ClientPong";
import { NodePing } from "./interfaces/NodePing";
import { NodePong } from "./interfaces/NodePong";
import { isAuthorize } from "./utils/isAuthorized";

const clientPingTimeout = 5 * 1000
const nodeCleanupTimeout = 1000 * 60 * 60
const statisticsInterval = 60 * 1000

export default class Controller {
  private readonly nodes: Collection
  public readonly statistics: Statistics;

  constructor(
    private api: Primus,
    private client: Primus
  ) {
    this.nodes = new Collection()
    this.statistics = new Statistics(this.nodes);
  }

  private initNodes(): void {
    // Init collections
    this.nodes.setChartsCallback(
      (err: Error | string, charts: ChartData): void => {
        if (err) {
          console.error('COL', 'CHR', 'Charts error:', err)
        } else {
          this.clientWrite({
            action: 'charts',
            data: charts
          })
        }
      }
    )
  }

  private wireup(): void {
    // ping clients
    setInterval(() => {
      this.clientWrite({
        action: 'client-ping',
        data: {
          serverTime: _.now()
        }
      })
    }, clientPingTimeout)

    // Cleanup old inactive nodes
    setInterval(() => {
      this.clientWrite({
        action: 'init',
        data: this.nodes.all()
      })

      this.nodes.getCharts()

    }, nodeCleanupTimeout)

    // print statistics
    setInterval(() => {
      let clients = 0
      this.client.forEach(() => clients++);

      let nodes = 0;
      this.api.forEach(() => nodes++);

      this.statistics.print(clients, nodes);
    }, statisticsInterval)
  }

  private clientWrite(payload: object) {
    this.client.forEach((spark: Primus.spark) => {
      spark.write(payload)

      this.statistics.add(Sides.Client, Directions.Out)
    });
  }

  public init() {
    this.initNodes()
    this.wireup()
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

    this.nodes.add(
      <NodeInformation>{
        nodeData,
        stats
      },
      (err: Error | string, info: NodeInfo): void => {
        if (err) {
          console.error('API', 'CON', 'Connection error:', err)
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
    this.nodes.addBlock(
      id, block,
      (err: Error | string, updatedStats: BlockStats) => {
        if (err) {
          console.error('API', 'BLK', 'Block error:', err, updatedStats)
        } else if (updatedStats) {

          this.clientWrite({
            action: 'block',
            data: updatedStats
          })

          console.info('API', 'BLK',
            'Block:', updatedStats.block['number'],
            'td:', updatedStats.block['totalDifficulty'],
            'from:', updatedStats.id, 'ip:', ip)

          this.nodes.getCharts()
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
        }
      }
    )
  }

  public handleNodePending(
    id: string,
    stats: Stats
  ): void {
    this.nodes.updatePending(
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

        const search = {id: validator.address}
        const index: number = this.nodes.getIndex(search)
        const node: Node = this.nodes.getNodeOrNew(search, validator)

        if (index < 0) {
          // only if new node
          node.integrateValidatorData(validator)
        }

        node.setValidatorData(validator)

        if (validators.elected.indexOf(validator.address) > -1) {
          node.setValidatorElected(true)
        }

        node.setValidatorRegistered(true)
      })
    }
  }

  public handleNodeStats(
    id: string,
    stats: Stats
  ): void {
    this.nodes.updateStats(
      id, stats,
      (err: Error | string, basicStats: BasicStatsResponse) => {
        if (err) {
          console.error('API', 'STA', 'Stats error:', err)
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
    this.nodes.updateLatency(
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

    this.nodes.inactive(
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
    const start = (!_.isUndefined(stats.clientTime) ? stats.clientTime : null)

    spark.emit(
      'node-pong',
      <NodePong>{
        clientTime: start,
        serverTime: _.now()
      }
    )

    this.statistics.add(Sides.Node, Directions.Out)

    console.info('API', 'PIN', 'Ping from:', id)
  }

  private handleNodeAuth(
    id: string,
    proof: Proof,
    stats: InfoWrapped,
    spark: Primus.spark
  ): boolean {

    if (
      banned.indexOf(spark.address.ip) >= 0 ||
      !isAuthorize(proof, stats)
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

    if (isAuthed && !_.isUndefined(stats.info)) {
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
    const serverTime = _.get(data, 'serverTime', 0)
    const latency = Math.ceil((_.now() - serverTime) / 2)

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
      {nodes: this.nodes.all()}
    )

    this.statistics.add(Sides.Client, Directions.Out)

    this.nodes.getCharts()

    console.success(
      'API', 'CON',
      'Client', `'${id}'`,
      'Connected'
    )
  }

  public handleClientEnd(
    id: string,
    ip: string
  ): void {
    console.success(
      'API', 'CON', 'Client Close:',
      ip, `'${id}'`
    )
  }
}
