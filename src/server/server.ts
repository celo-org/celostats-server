import '../utils/logger'
import io from "socket.io"
// @ts-ignore
import Primus from "primus"
// @ts-ignore
import * as primusEmit from "primus-emit"
// @ts-ignore
import * as primusSparkLatency from "primus-spark-latency"
import express from "express";
import Controller from "../Controller";
import { createServer } from "http"
import { expressConfig } from "./expressConfig"
import { routes } from "./routes";
import { cfg } from "../utils/config"
import { Proof } from "../interfaces/Proof";
import { NodeResponseLatency } from "../interfaces/NodeResponseLatency";
import { StatsWrapped } from "../interfaces/StatsWrapped";
import { ClientPong } from "../interfaces/ClientPong";
import { NodeResponsePing } from "../interfaces/NodeResponsePing";
import { NodeResponseStats } from "../interfaces/NodeResponseStats";
import { Latency } from "../interfaces/Latency";
import { NodePing } from "../interfaces/NodePing";
import { NodeResponseBlock } from "../interfaces/NodeResponseBlock";
import { BlockWrapped } from "../interfaces/BlockWrapped";
import { NodeResponseInfo } from "../interfaces/NodeResponseInfo";
import { InfoWrapped } from "../interfaces/InfoWrapped";
import { Sides } from "../statistics/Sides";
import { Directions } from "../statistics/Directions";
import { IDictionary } from "../interfaces/IDictionary";
import { isInputValid } from "../utils/isInputValid";
import { deleteSpark } from "../utils/deleteSpark";

export default class Server {

  private readonly api: Primus
  private readonly client: io.Server
  private readonly danglingConnections: IDictionary = {}
  private readonly controller: Controller;

  constructor() {

    expressConfig.get('/stats', (
      req: express.Request,
      res: express.Response
    ) => {
      const clients = Object.keys(this.client.sockets.connected).length

      let nodes = 0;
      this.api.forEach(() => nodes++);

      const stats = this.controller.statistics.prepare(
        clients,
        nodes
      );

      res.set('Content-Type', 'text/html');
      res.send(
        Buffer.from(`<pre>${stats}</pre>`)
      )
    })

    expressConfig.use(routes)

    const server = createServer(expressConfig)

    server.headersTimeout = cfg.headersTimeout
    server.maxHeadersCount = cfg.maxHeadersCount
    server.timeout = cfg.timeout

    this.api = new Primus(server, {
      transformer: 'websockets',
      pathname: '/api',
      parser: 'JSON',
      pingInterval: false,
      compression: cfg.compression,
      transport: cfg.transport,
      plugin: {
        emit: primusEmit,
        'spark-latency': primusSparkLatency
      }
    })

    this.client = io(server, {
      path: '/client',
      transports: ['websocket'],
      cookie: false,
      perMessageDeflate: cfg.compression,
      httpCompression: cfg.compression
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

        if (isInputValid(stats) && stats.block) {
          const id = proof.address

          // handle validator information from block
          this.controller.handleNodeBlockValidators(stats.block.validators)

          this.controller.handleNodeBlock(id, spark.address.ip, stats.block)

        } else {
          console.error(
            'API', 'BLK',
            'Invalid Block message:',
            stats
          )
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

        if (isInputValid(stats) && stats.stats) {
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

        if (isInputValid(stats) && stats.stats) {

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

          this.controller.handleNodeLatency(
            id,
            // todo: make node send this as number instead of string
            parseInt(String(stats.latency))
          )
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

    this.api.on('disconnection', (spark: Primus.spark): void => {
      deleteSpark(spark)
    });
  }

  private initClient(): void {
    this.client
      .on('connection', (socket: io.Socket): void => {
        this.controller.statistics.add(Sides.Client, Directions.In)

        console.success(
          'API', 'CON', 'Client Open:',
          socket.conn.remoteAddress, `'${socket.id}'`
        )

        socket
          .once('ready', (): void => {
            this.controller.statistics.add(Sides.Client, Directions.In)
            const id = socket.id

            this.controller.handleClientReady(id, socket)
          })
          .on('client-pong', (data: ClientPong): void => {
            this.controller.statistics.add(Sides.Client, Directions.In)

            this.controller.handleClientPong(data, socket)
          })
          .once('error', (reason: string): void => {
            const id = socket.id;
            console.error(reason)
            this.controller.handleClientEnd(id, socket, reason)
          })
          .once('disconnecting', (reason: string): void => {
            const id = socket.id;
            this.controller.handleClientEnd(id, socket, reason)
          })
      })
  }

  public init(): void {
    this.initApi()
    this.initClient()
    this.controller.init()
  }
}
