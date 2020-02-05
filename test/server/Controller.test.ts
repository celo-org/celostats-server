import assert from "assert"
import { createServer } from "http";
import Controller from "../../src/server/Controller"
import { expressConfig } from "../../src/server/server/expressConfig";
import { routes } from "../../src/server/server/routes";
// @ts-ignore
import Primus from "primus"
import { ClientPong } from "../../src/server/interfaces/ClientPong";
import { Sides } from "../../src/server/statistics/Sides";
import io from "socket.io";
import { cfg } from "../../src/server/utils/config";

describe('Controller', () => {

  let controller: Controller;

  before(() => {
    expressConfig.use(routes)

    const server = createServer(expressConfig)

    server.headersTimeout = cfg.headersTimeout
    server.maxHeadersCount = cfg.maxHeadersCount
    server.timeout = cfg.timeout

    const api = new Primus(server, {
      transformer: 'websockets',
      pathname: '/api',
      parser: 'JSON',
      compression: true,
      pingInterval: false
    })

    const client = io(server, {
      path: '/client',
      transports: ['websocket'],
      cookie: false,
      perMessageDeflate: cfg.compression,
      httpCompression: cfg.compression
    })

    controller = new Controller(api, client)
  })

  describe('#handleClientEnd()', () => {

    it('should write then end to the console', () => {
      const socket = <io.Socket>{
        conn: {
          remoteAddress: "0.0.0.1"
        }
      }
      const hasEnded = controller.handleClientEnd(
        "hello", socket, 'all fine'
      )
      assert(hasEnded)
    });

  });

  describe('#handleClientPong()', () => {

    it('should emit client-latency', async (done) => {
      // prepare
      const data: ClientPong = <ClientPong>{
        serverTime: Date.now()
      }

      // mock spark
      const socket = <io.Socket>{
        emit: (name: string, payload: any): void => {
          // evaluate
          assert(name === 'client-latency')
          assert(payload.latency === 0 || payload.latency === 1)
          done();
        }
      }

      // call
      controller.handleClientPong(data, socket)
    });

    it('should write to the statistics', () => {
      // prepare
      const data: ClientPong = <ClientPong>{}

      // mock spark
      const socket = <io.Socket>{
        emit: (name: string, payload: any): void => {
          // stub, do not remove
        }
      }

      // before
      const before = controller.statistics.sumBySide(Sides.Client)
      // call
      controller.handleClientPong(data, socket)
      // after
      const after = controller.statistics.sumBySide(Sides.Client)
      // evaluate
      assert.equal(after, before + 1n)
    });

    it('should read supplied server time properly', async (done) => {

      const offset = 2000
      // prepare
      const data: ClientPong = <ClientPong>{
        serverTime: Date.now() - offset
      }

      // mock spark
      const socket = <io.Socket>{
        emit: (name: string, payload: any) => {
          // evaluate
          assert(name === 'client-latency')
          assert(
            payload.latency === offset / 2 ||
            payload.latency === offset / 2 + 1
          )
          done();
        }
      }

      // call
      controller.handleClientPong(data, socket)
    });

    it('should read not supplied server time properly', async (done) => {

      // prepare
      const data: ClientPong = <ClientPong>{}

      // mock spark
      const socket = <io.Socket>{
        emit: (name: string, payload: any) => {
          const expected = Math.round(Date.now() / 2)
          // evaluate
          assert(name === 'client-latency')
          assert(
            payload.latency === expected ||
            payload.latency === expected + 1 ||
            payload.latency === expected - 1
          )
          done();
        }
      }

      // call
      controller.handleClientPong(data, socket)
    });

  });
})
