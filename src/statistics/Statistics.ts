import { Sides } from "./Sides";
import { Directions } from "./Directions";
import Collection from "../Collection";

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
      [Directions.In]: 0n,
      [Directions.Out]: 0n
    },
    [Sides.Client]: {
      [Directions.In]: 0n,
      [Directions.Out]: 0n
    }
  }

  private collection: Collection;

  constructor(collection: Collection) {
    this.collection = collection
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
    clients: number,
    nodes: number
  ): string {
    const dbSize = JSON.stringify(this.collection).length
    const durationInSeconds = (Date.now() - this.startTime) / 1000;

    const serverMessages: bigint = this.sumBySide(Sides.Node)
    const clientMessages: bigint = this.sumBySide(Sides.Client)
    const inMessages: bigint = this.sumByDirection(Directions.In)
    const outMessages: bigint = this.sumByDirection(Directions.Out)

    const totalMessages: bigint = serverMessages + clientMessages;
    const messagePrecession = 3
    const height = this.collection.getHighestBlock()
    const amount = this.collection.getSize()

    const output = [
      '\n==================================================================',
      `\nStarted at date: ${new Date(this.startTime).toLocaleString()}`,
      `\nCurrent date: ${new Date().toLocaleString()}`,
      `\nDB size: ${(dbSize / 1024 / 1024).toFixed(2)}mb`,
      `\nNodes in DB: ${amount.nodes}`,
      `\nBlocks in DB: ${amount.blocks}`,
      `\nHighest block: ${height}`,
      `\nMessages to/from nodes: ${serverMessages.toLocaleString()} / ${(Number(serverMessages) / durationInSeconds).toFixed(messagePrecession)} per second`,
      `\nMessages to/from clients: ${clientMessages.toLocaleString()} / ${(Number(clientMessages) / durationInSeconds).toFixed(messagePrecession)} per second`,
      `\nMessages received: ${inMessages.toLocaleString()} / ${(Number(inMessages) / durationInSeconds).toFixed(messagePrecession)} per second`,
      `\nMessages sent: ${outMessages.toLocaleString()} / ${(Number(outMessages) / durationInSeconds).toFixed(messagePrecession)} per second`,
      `\nTotal messages received and sent: ${totalMessages.toLocaleString()} / ${(Number(totalMessages) / durationInSeconds).toFixed(messagePrecession)} per second`,
      `\nNodes connected: ${nodes}`,
      `\nClients connected: ${clients}`,
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
