import './utils/logger'
// @ts-ignore
import Primus from "primus"
// @ts-ignore
import * as primusEmit from "primus-emit"
// @ts-ignore
import * as primusSparkLatency from "primus-spark-latency"
// @ts-ignore
import _ from "lodash"
import { Keccak } from 'sha3'
// @ts-ignore
import { ec as EC } from "elliptic"
// @ts-ignore
import { KeyPair } from "elliptic/lib/elliptic/ec"
import { createServer } from "http"
import routes from "./routes"
import Collection from './collection'
import {
  banned,
  reserved,
  trusted
} from "./utils/config"
import Node from "./node"
import { BasicStatsResponse } from "./interfaces/BasicStatsResponse";
import { Proof } from "./interfaces/Proof";
import { NodeResponseLatency } from "./interfaces/NodeResponseLatency";
import { Pending } from "./interfaces/Pending";
import { NodeInfo } from "./interfaces/NodeInfo";
import { ChartData } from "./interfaces/ChartData";
import { BlockStats } from "./interfaces/BlockStats";
import { StatsWrapped } from "./interfaces/StatsWrapped";
import { NodePong } from "./interfaces/NodePong";
import { ClientPong } from "./interfaces/ClientPong";
import { NodeResponsePing } from "./interfaces/NodeResponsePing";
import { NodeStats } from "./interfaces/NodeStats";
import { NodeResponseStats } from "./interfaces/NodeResponseStats";
import { NodeInformation } from "./interfaces/NodeInformation";
import { NodeData } from "./interfaces/NodeData";
import { Latency } from "./interfaces/Latency";
import { NodePing } from "./interfaces/NodePing";
import { NodeResponseBlock } from "./interfaces/NodeResponseBlock";
import { BlockWrapped } from "./interfaces/BlockWrapped";
import { NodeResponseInfo } from "./interfaces/NodeResponseInfo";
import { InfoWrapped } from "./interfaces/InfoWrapped";
import { Sides } from "./statistics/Sides";
import { Directions } from "./statistics/Directions";
import { Statistics } from "./statistics/Statistics";
import { IDictionary } from "./interfaces/IDictionary";
import { Wrapper } from "./interfaces/Wrapper";

// general config
const clientPingTimeout = 5 * 1000
const nodeCleanupTimeout = 1000 * 60 * 60
const port = process.env.PORT || 3000
const statisticsInterval = 60 * 1000

// add trusted from env
if (process.env.TRUSTED_ADDRESSES) {
  trusted.push(...process.env.TRUSTED_ADDRESSES.split(','))
}
if (process.env.BANNED_ADDRESSES) {
  banned.push(...process.env.BANNED_ADDRESSES.split(','))
}
if (process.env.RESERVED_ADDRESSES) {
  reserved.push(...process.env.RESERVED_ADDRESSES.split(','))
}

export default class Server {

  private readonly nodes: Collection
  private readonly api: Primus
  private readonly client: Primus
  private danglingConnections: IDictionary = {}

  private statistics: Statistics;

  constructor() {
    const server = createServer(routes)

    server.headersTimeout = 0.9 * 1000
    server.maxHeadersCount = 0
    server.timeout = 0.6 * 1000

    this.api = new Primus(server, {
      transformer: 'websockets',
      pathname: '/api',
      parser: 'JSON',
      compression: true,
      pingInterval: false
    })

    this.client = new Primus(server, {
      transformer: 'websockets',
      pathname: '/primus',
      parser: 'JSON',
      compression: true,
      pingInterval: false
    })

    this.nodes = new Collection()

    this.statistics = new Statistics(this.nodes);

    server.listen(port)

    console.success(
      "SYS", "CON",
      `Server started and listening on port: ${port}!`
    )
  }

  static isInputValid(stats: Wrapper): boolean {
    return (
      !_.isUndefined(stats) && !_.isUndefined(stats.id)
    )
  }

  static isAuthorize(
    proof: Proof,
    stats: InfoWrapped
  ): boolean {
    let isAuthorized = false

    if (
      Server.isInputValid(stats) &&
      !_.isUndefined(proof) &&
      !_.isUndefined(proof.publicKey) &&
      !_.isUndefined(proof.signature) &&
      reserved.indexOf(stats.id) < 0 &&
      trusted
        .map(address => address && address.toLowerCase())
        .indexOf(proof.address) >= 0
    ) {
      const hasher = new Keccak(256)
      hasher.update(JSON.stringify(stats))

      const msgHash = hasher.digest('hex')
      const secp256k1 = new EC('secp256k1')
      const pubkeyNoZeroX = proof.publicKey.substr(2)

      let pubkey: KeyPair

      try {
        pubkey = secp256k1.keyFromPublic(pubkeyNoZeroX, 'hex')
      } catch (err) {
        console.error('API', 'SIG', 'Public Key Error', err.message)
        return false
      }

      const addressHasher = new Keccak(256)
      addressHasher.update(pubkeyNoZeroX.substr(2), 'hex')

      const addressHash = addressHasher.digest('hex').substr(24)

      if (!(addressHash.toLowerCase() === proof.address.substr(2).toLowerCase())) {
        console.error(
          'API', 'SIG',
          'Address hash did not match', addressHash,
          proof.address.substr(2)
        )
      }

      const signature: {
        r: string
        s: string
      } = {
        r: proof.signature.substr(2, 64),
        s: proof.signature.substr(66, 64)
      }

      if (!(msgHash === proof.msgHash.substr(2))) {
        console.error(
          'API', 'SIG',
          'Message hash did not match',
          msgHash, proof.msgHash.substr(2)
        )
        return false
      }

      try {
        isAuthorized = pubkey.verify(msgHash, signature)
        if (!isAuthorized) {
          console.error('API', 'SIG', 'Signature did not verify')
          return false
        }
      } catch (e) {
        console.error('API', 'SIG', 'Signature Error', e.message)
        return false
      }
    }

    return isAuthorized
  }

  private clientWrite(payload: any) {
    this.client.forEach((spark: Primus.spark) => {
      spark.write(payload)

      this.statistics.add(Sides.Client, Directions.Out)
    });
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

  private initApi(): void {
    // Init API Socket connection
    this.api.plugin('emit', primusEmit)
    this.api.plugin('spark-latency', primusSparkLatency)

    // Init API Socket events
    this.api.on('connection', (spark: Primus.spark): void => {
      this.statistics.add(Sides.Node, Directions.In)

      // make connection dangling
      this.danglingConnections[spark.id] = 1

      console.success(
        'API', 'CON', 'Node Open:',
        spark.address.ip, `'${spark.id}'`
      )

      spark.on('hello', (data: NodeResponseInfo): void => {
        this.statistics.add(Sides.Node, Directions.In)

        const {
          stats,
          proof
        }: {
          stats: InfoWrapped,
          proof: Proof
        } = data

        if (
          banned.indexOf(spark.address.ip) >= 0 ||
          !Server.isAuthorize(proof, stats)
        ) {
          console.error(
            'API', 'CON', 'Node Closed: wrong auth',
            `'${stats.id}'`, `(${spark.id})`,
            'address:', proof.address
          )

          spark.end(undefined, {reconnect: false})

          return
        }

        delete (this.danglingConnections[spark.id])

        console.info(
          'API', 'CON',
          'Hello', stats.id
        )

        const id = proof.address;

        if (!_.isUndefined(stats.info)) {
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
            (err: Error | string, info: NodeInfo) => {
              if (err) {
                console.error('API', 'CON', 'Connection error:', err)
                return false
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
      })

      spark.on('block', (data: NodeResponseBlock): void => {
        this.statistics.add(Sides.Node, Directions.In)

        const {
          stats,
          proof
        }: {
          stats: BlockWrapped,
          proof: Proof
        } = data

        if (
          Server.isInputValid(stats) &&
          !_.isUndefined(stats.block)
        ) {
          const id = proof.address

          if (
            stats.block.validators &&
            stats.block.validators.registered
          ) {
            stats.block.validators.registered.forEach(validator => {
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

              if (stats.block.validators.elected.indexOf(validator.address) > -1) {
                node.setValidatorElected(true)
              }

              node.setValidatorRegistered(true)
            })
          }

          this.nodes.addBlock(
            id, stats.block,
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
                  'from:', updatedStats.id, 'ip:', spark.address.ip)

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

        } else {
          console.error('API', 'BLK', 'Block error:', data)
        }
      })

      spark.on('pending', (data: NodeResponseStats): void => {
        this.statistics.add(Sides.Node, Directions.In)

        const {
          stats,
          proof
        }: {
          stats: StatsWrapped,
          proof: Proof
        } = data

        if (
          Server.isInputValid(stats) &&
          !_.isUndefined(stats.stats)
        ) {

          const id = proof.address

          this.nodes.updatePending(
            id, stats.stats,
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
            })
        } else {
          console.error('API', 'TXS', 'Pending error:', data)
        }
      })

      spark.on('stats', (data: NodeResponseStats): void => {
        this.statistics.add(Sides.Node, Directions.In)

        const {
          stats,
          proof
        }: {
          stats: StatsWrapped,
          proof: Proof
        } = data;

        if (
          Server.isInputValid(stats) &&
          !_.isUndefined(stats.stats)
        ) {

          // why? why not spark.id like everywhere?
          const id = proof.address

          this.nodes.updateStats(
            id, stats.stats,
            (err: Error | string, basicStats: BasicStatsResponse) => {
              if (err) {
                console.error('API', 'STA', 'Stats error:', err)
              } else {

                if (basicStats) {
                  this.clientWrite({
                    action: 'stats',
                    data: basicStats
                  })

                  console.info('API', 'STA', 'Stats from:', id)
                }
              }
            })
        }
      })

      spark.on('node-ping', (data: NodeResponsePing): void => {
        this.statistics.add(Sides.Node, Directions.In)

        const {
          stats,
          proof
        }: {
          stats: NodePing,
          proof: Proof
        } = data

        if (Server.isInputValid(stats)) {
          const id = proof.address
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
      })

      spark.on('latency', (data: NodeResponseLatency): void => {
        this.statistics.add(Sides.Node, Directions.In)
        const {
          stats,
          proof
        }: {
          stats: Latency,
          proof: Proof
        } = data

        if (Server.isInputValid(stats)) {

          const id = proof.address
          this.nodes.updateLatency(
            id, stats.latency,
            (err, latency) => {
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
      })

      spark.on('end', (): void => {
          this.statistics.add(Sides.Node, Directions.In)
          // use spark id here, we have nothing else
          const id = spark.id;

          // it this was caused by a failed auth do not try this
          if (this.danglingConnections[id]) {
            delete (this.danglingConnections[id])
          } else {
            this.nodes.inactive(
              id,
              (err: Error | string, nodeStats: NodeStats
              ) => {
                if (err) {
                  console.error(
                    'API', 'CON',
                    'Connection with:', spark.address.ip, id,
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

          console.success(
            'API', 'CON', 'Node Close:',
            spark.address.ip, `'${id}'`
          )
        }
      )
    })
  }

  private initClient(): void {
    // Init Client Socket connection
    this.client.plugin('emit', primusEmit)

    this.client.on('connection', (spark: Primus.spark): void => {
      this.statistics.add(Sides.Client, Directions.In)

      console.success(
        'API', 'CON', 'Client Open:',
        spark.address.ip, `'${spark.id}'`
      )

      spark.on('ready', (): void => {
        this.statistics.add(Sides.Client, Directions.In)

        spark.emit(
          'init',
          {nodes: this.nodes.all()}
        )

        this.statistics.add(Sides.Client, Directions.Out)

        this.nodes.getCharts()

        console.success(
          'API', 'CON',
          'Client', `'${spark.id}'`,
          'Connected'
        )
      })

      spark.on('client-pong', (data: ClientPong): void => {
        this.statistics.add(Sides.Client, Directions.In)

        const serverTime = _.get(data, 'serverTime', 0)
        const latency = Math.ceil((_.now() - serverTime) / 2)

        spark.emit(
          'client-latency',
          {latency: latency}
        )

        this.statistics.add(Sides.Client, Directions.Out)
      })

      spark.on('end', () => {
        console.success(
          'API', 'CON', 'Client Close:',
          spark.address.ip, `'${spark.id}'`
        )
      })

    })
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

  public init(): void {
    this.initApi()
    this.initClient()
    this.initNodes()
    this.wireup()
  }
}
