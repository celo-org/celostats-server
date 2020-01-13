import './utils/logger'
// @ts-ignore
import Primus from "primus"
// @ts-ignore
import * as primusEmit from "primus-emit"
// @ts-ignore
import * as primusSparkLatency from "primus-spark-latency"
// @ts-ignore
import _ from "lodash"
import Controller from "./Controller";
import { createServer } from "http"
import routes from "./routes"
import {
  banned,
  reserved,
  trusted
} from "./utils/config"
import { Proof } from "./interfaces/Proof";
import { NodeResponseLatency } from "./interfaces/NodeResponseLatency";
import { StatsWrapped } from "./interfaces/StatsWrapped";
import { ClientPong } from "./interfaces/ClientPong";
import { NodeResponsePing } from "./interfaces/NodeResponsePing";
import { NodeResponseStats } from "./interfaces/NodeResponseStats";
import { Latency } from "./interfaces/Latency";
import { NodePing } from "./interfaces/NodePing";
import { NodeResponseBlock } from "./interfaces/NodeResponseBlock";
import { BlockWrapped } from "./interfaces/BlockWrapped";
import { NodeResponseInfo } from "./interfaces/NodeResponseInfo";
import { InfoWrapped } from "./interfaces/InfoWrapped";
import { Sides } from "./statistics/Sides";
import { Directions } from "./statistics/Directions";
import { IDictionary } from "./interfaces/IDictionary";
import { isInputValid } from "./utils/isInputValid";

// general config
const cfg = {
  port: process.env.PORT || 3000,
  compression: process.env.COMPRESSION || false,
  headersTimeout: 0.9 * 1000,
  maxHeadersCount: 0,
  timeout: 0.6 * 1000
}

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

  private readonly api: Primus
  private readonly client: Primus
  private readonly danglingConnections: IDictionary = {}
  private readonly controller: Controller;

  constructor() {
    const server = createServer(routes)

    server.headersTimeout = cfg.headersTimeout
    server.maxHeadersCount = cfg.maxHeadersCount
    server.timeout = cfg.timeout

    this.api = new Primus(server, {
      transformer: 'websockets',
      pathname: '/api',
      parser: 'JSON',
      compression: cfg.compression,
      pingInterval: false
    })

    this.client = new Primus(server, {
      transformer: 'websockets',
      pathname: '/primus',
      parser: 'JSON',
      compression: cfg.compression,
      pingInterval: false
    })

    this.controller = new Controller(
      this.api,
      this.client
    )

    server.listen(cfg.port)

    console.success(
      "SYS", "CON",
      'Server started and listening!',
      `Config ${JSON.stringify(cfg, null, 2)}`
    )
  }

  private initApi(): void {
    // Init API Socket connection
    this.api.plugin('emit', primusEmit)
    this.api.plugin('spark-latency', primusSparkLatency)

    // Init API Socket events
    this.api.on('connection', (spark: Primus.spark): void => {
      this.controller.statistics.add(Sides.Node, Directions.In)

      // make connection dangling by default
      this.danglingConnections[spark.id] = 1

      console.success(
        'API', 'CON', 'Node Open:',
        spark.address.ip, `'${spark.id}'`
      )

      spark.on('hello', (data: NodeResponseInfo): void => {
        this.controller.statistics.add(Sides.Node, Directions.In)

        const {
          stats,
          proof
        }: {
          stats: InfoWrapped,
          proof: Proof
        } = data

        const id = proof.address;

        const isAuthed = this.controller.handleNodeHello(
          id, proof, stats, spark
        )

        if (isAuthed) {
          // remove dangling connection on success
          delete (this.danglingConnections[spark.id])
        }
      })

      spark.on('block', (data: NodeResponseBlock): void => {
        this.controller.statistics.add(Sides.Node, Directions.In)

        const {
          stats,
          proof
        }: {
          stats: BlockWrapped,
          proof: Proof
        } = data

        if (
          isInputValid(stats) &&
          !_.isUndefined(stats.block)
        ) {
          const id = proof.address

          // handle validator information from block
          this.controller.handleNodeBlockValidators(stats.block.validators)

          this.controller.handleNodeBlock(id, spark.address.ip, stats.block)

        } else {
          console.error('API', 'BLK', 'Invalid Block message:', stats)
        }
      })

      spark.on('pending', (data: NodeResponseStats): void => {
        this.controller.statistics.add(Sides.Node, Directions.In)

        const {
          stats,
          proof
        }: {
          stats: StatsWrapped,
          proof: Proof
        } = data

        if (
          isInputValid(stats) &&
          !_.isUndefined(stats.stats)
        ) {
          const id = proof.address

          this.controller.handleNodePending(id, stats.stats)
        } else {
          console.error('API', 'TXS', 'Pending error:', data)
        }
      })

      spark.on('stats', (data: NodeResponseStats): void => {
        this.controller.statistics.add(Sides.Node, Directions.In)

        const {
          stats,
          proof
        }: {
          stats: StatsWrapped,
          proof: Proof
        } = data;

        if (
          isInputValid(stats) &&
          !_.isUndefined(stats.stats)
        ) {

          // why? why not spark.id like everywhere?
          const id = proof.address

          this.controller.handleNodeStats(id, stats.stats)
        }
      })

      spark.on('node-ping', (data: NodeResponsePing): void => {
        this.controller.statistics.add(Sides.Node, Directions.In)

        const {
          stats,
          proof
        }: {
          stats: NodePing,
          proof: Proof
        } = data

        if (isInputValid(stats)) {
          const id = proof.address

          this.controller.handleNodePing(id, stats, spark)
        }
      })

      spark.on('latency', (data: NodeResponseLatency): void => {
        this.controller.statistics.add(Sides.Node, Directions.In)

        const {
          stats,
          proof
        }: {
          stats: Latency,
          proof: Proof
        } = data

        if (isInputValid(stats)) {

          const id = proof.address

          this.controller.handleNodeLatency(id, stats.latency)
        }
      })

      spark.on('end', (): void => {
        this.controller.statistics.add(Sides.Node, Directions.In)

        // use spark id here, we have nothing else
        const id = spark.id;

        // it this was caused by a failed auth do not try this
        if (this.danglingConnections[id]) {
          delete (this.danglingConnections[spark.id])

        } else {
          this.controller.handleNodeEnd(id)
        }

        console.success(
          'API', 'CON', 'Node Close:',
          spark.address.ip, `'${id}'`
        )

      })
    })
  }

  private initClient(): void {
    // Init Client Socket connection
    this.client.plugin('emit', primusEmit)

    this.client.on('connection', (spark: Primus.spark): void => {
      this.controller.statistics.add(Sides.Client, Directions.In)

      console.success(
        'API', 'CON', 'Client Open:',
        spark.address.ip, `'${spark.id}'`
      )

      spark.on('ready', (): void => {
        this.controller.statistics.add(Sides.Client, Directions.In)

        const id = spark.id

        this.controller.handleClientReady(id, spark)
      })

      spark.on('client-pong', (data: ClientPong): void => {
        this.controller.statistics.add(Sides.Client, Directions.In)

        this.controller.handleClientPong(data, spark)
      })

      spark.on('end', (): void => {
        const id = spark.id;

        this.controller.handleClientEnd(id, spark.address.ip)
      })

    })
  }

  public init(): void {
    this.initApi()
    this.initClient()
    this.controller.init()
  }
}
