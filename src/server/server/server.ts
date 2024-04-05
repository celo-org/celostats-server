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
import { cfg, trusted } from "../utils/config"
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
import { Events } from "./Events"
import { blockHistory } from "../BlockHistory"
import { getContractKit } from '../ContractKit'
import { Address } from 'interfaces/Address'
import { Validator } from '@celo/contractkit/lib/wrappers/Validators'

export default class Server {

  private readonly api: Primus
  private readonly client: io.Server
  private readonly danglingConnections: IDictionary = {}
  private readonly controller: Controller;

  constructor() {

    expressConfig.get('/stats', async (
      req: express.Request,
      res: express.Response
    ) => {
      const clients = (await this.client.sockets.allSockets()).size

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
      res.end()
    })

    expressConfig.get('/forks', (
      req: express.Request,
      res: express.Response
    ) => {
      res.set('Content-Type', 'text/html');
      res.send(
        Buffer.from(`<pre>${JSON.stringify(blockHistory.getForks(), null, 2)}</pre>`)
      )
      res.end()
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

    this.client = new io.Server(server, {
      path: '/client',
      transports: ['websocket'],
      cors: {
        origin: "*"
      },
      cookie: false,
      pingInterval: null,
      pingTimeout: cfg.clientPingTimeout,
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
    this.api
      .on(Events.Connection, (spark: Primus.spark): void => {
        this.controller.statistics.add(Sides.Node, Directions.In)

        // make connection dangling by default
        this.danglingConnections[spark.id] = 1

        console.success(
          'API', 'CON', 'Node Open:',
          `${spark.address.ip}:${spark.address.port}`,
          `(${spark.id})`
        )

        spark
          .on(Events.Hello, async (data: NodeResponseInfo): Promise<void> => {
            this.controller.statistics.add(Sides.Node, Directions.In)

            const {
              stats,
              proof
            }: {
              stats: InfoWrapped,
              proof: Proof
            } = data

            const id = proof.address;

            const isAuthed = await this.controller.handleNodeHello(
              id, proof, stats, spark
            )

            if (isAuthed) {
              // remove dangling connection on success
              delete (this.danglingConnections[spark.id])
            }
          })
          .on(Events.Block, (data: NodeResponseBlock): void => {
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
          .on(Events.Pending, (data: NodeResponseStats): void => {
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
          .on(Events.Stats, (data: NodeResponseStats): void => {
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
              stats.stats
            ) {

              // why? why not spark.id like everywhere?
              const id = proof.address

              this.controller.handleNodeStats(id, stats.stats)
            }
          })
          .on(Events.NodePing, (data: NodeResponsePing): void => {
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
          .on(Events.Latency, (data: NodeResponseLatency): void => {
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
          .on(Events.End, (): void => {
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
      .on(Events.Disconnection, (spark: Primus.spark): void => {
        deleteSpark(spark)
      });
  }

  private initClient(): void {
    this.client
      .on(Events.Connection, (socket: io.Socket): void => {
        this.controller.statistics.add(Sides.Client, Directions.In)

        console.success(
          'API', 'CON', 'Client Open:',
          socket.conn.remoteAddress, `'${socket.id}'`
        )

        socket
          .once(Events.Ready, (): void => {
            this.controller.statistics.add(Sides.Client, Directions.In)
            const id = socket.id

            this.controller.handleClientReady(id, socket)
          })
          .on(Events.ClientPong, (data: ClientPong): void => {
            this.controller.statistics.add(Sides.Client, Directions.In)

            this.controller.handleClientPong(data, socket)
          })
          .on(Events.Error, (reason: Error): void => {
            const id = socket.id;
            console.error(reason)
            this.controller.handleClientEnd(id, socket, reason.toString())
          })
          .once(Events.Disconnecting, (reason: string): void => {
            const id = socket.id;
            this.controller.handleClientEnd(id, socket, reason)
          })
      })
  }

  private initNodeTrustedRetriever(): void {
    const signersRetriever = async () => {
      const kit = await getContractKit()
      const registeredValidators = (
        await kit.validators.getRegisteredValidators()
      ).map((validator: Validator) => validator.signer)
      .map((address: Address) => address.toLowerCase())
      const diffAddresses = registeredValidators.filter(item => trusted.indexOf(item) < 0)
      trusted.push(...diffAddresses)
      if (diffAddresses.length > 0 ) {
        console.success(
          'SERVER', 'TRUSTED', 'Retrieved from signers',
          'New addresses:', `${diffAddresses}`
        )
      } else {
        console.success(
          'SERVER', 'TRUSTED', 'Retrieved from signers',
          'No new signers to add'
        )
      }
    }
    signersRetriever()
    setInterval(signersRetriever, cfg.retrieveTrustedSignersInterval);
  }

  public init(): void {
    this.initApi()
    this.initClient()
    this.initNodeTrustedRetriever()
    this.controller.init()
  }
}
