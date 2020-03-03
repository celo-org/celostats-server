/* global BigInt */
import { Sides } from "./Sides";
import { Directions } from "./Directions";
import { cfg } from "../utils/config"
import { blockHistory } from "../BlockHistory"
import { nodes } from "../Nodes"

export class Statistics {

  private readonly startTime: number;
  private readonly messages: {
    [Sides.Node]: {
      [Directions.In]: bigint,
      [Directions.Out]: bigint
    },
    [Sides.Client]: {
      [Directions.In]: bigint,
      [Directions.Out]: bigint
    }
  } = {
    [Sides.Node]: {
      [Directions.In]: BigInt(0),
      [Directions.Out]: BigInt(0)
    },
    [Sides.Client]: {
      [Directions.In]: BigInt(0),
      [Directions.Out]: BigInt(0)
    }
  }

  constructor() {
    this.startTime = Date.now()
  }

  add(side: Sides, direction: Directions) {
    this.messages[side][direction]++;
  }

  sumBySide(side: Sides): bigint {
    return this.messages[side][Directions.In] + this.messages[side][Directions.Out]
  }

  sumByDirection(direction: Directions): bigint {
    return this.messages[Sides.Client][direction] + this.messages[Sides.Node][direction]
  }

  prepare(
    clientsCount: number,
    nodesCount: number
  ): string {
    const dbSize = JSON.stringify(blockHistory).length + JSON.stringify(nodes).length
    const durationInSeconds = (Date.now() - this.startTime) / 1000;

    const serverMessages: bigint = this.sumBySide(Sides.Node)
    const clientMessages: bigint = this.sumBySide(Sides.Client)
    const inMessages: bigint = this.sumByDirection(Directions.In)
    const outMessages: bigint = this.sumByDirection(Directions.Out)

    const totalMessages: bigint = serverMessages + clientMessages;
    const messagePrecession = 3
    const height = blockHistory.getHighestBlockNumber()

    const output = [
      '\n==================================================================',
      `\nStarted at date: ${new Date(this.startTime).toLocaleString()}`,
      `\nCurrent date: ${new Date().toLocaleString()}`,
      `\nDB size: ${(dbSize / 1024 / 1024).toFixed(2)}mb`,
      `\nNodes in DB: ${nodes.length}`,
      `\nBlocks in DB: ${blockHistory.getLength()}/${cfg.maxBlockHistory}`,
      `\nHighest block: ${height}`,
      `\nMessages to/from nodes: ${serverMessages.toLocaleString()} / ${(Number(serverMessages) / durationInSeconds).toFixed(messagePrecession)} per second`,
      `\nMessages to/from clients: ${clientMessages.toLocaleString()} / ${(Number(clientMessages) / durationInSeconds).toFixed(messagePrecession)} per second`,
      `\nMessages received: ${inMessages.toLocaleString()} / ${(Number(inMessages) / durationInSeconds).toFixed(messagePrecession)} per second`,
      `\nMessages sent: ${outMessages.toLocaleString()} / ${(Number(outMessages) / durationInSeconds).toFixed(messagePrecession)} per second`,
      `\nTotal messages received and sent: ${totalMessages.toLocaleString()} / ${(Number(totalMessages) / durationInSeconds).toFixed(messagePrecession)} per second`,
      `\nNodes connected: ${nodesCount}`,
      `\nClients connected: ${clientsCount}`,
      '\n=================================================================='
    ]

    return output.join('')
  }

  print(
    clients: number,
    nodes: number
  ): void {
    console.success(
      "SYS", "STA",
      this.prepare(clients, nodes)
    )
  }
}
