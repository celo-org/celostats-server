import Node from "./Node"
import { NodeSummary } from "./interfaces/NodeSummary"
import { Address } from "./interfaces/Address"
import { NodeInformation } from "./interfaces/NodeInformation"
import { ValidatorData } from "./interfaces/ValidatorData"
import { Stats } from "./interfaces/Stats"
import { StatsResponse } from "./interfaces/StatsResponse"
import { Pending } from "./interfaces/Pending"
import { Latency } from "./interfaces/Latency"
import { NodeStats } from "./interfaces/NodeStats"
import { cfg, trusted } from "./utils/config"

export class Nodes extends Array<Node> {

  public updateStakingInformation(
    registered: Address[],
    elected: Address[]
  ): void {
    for (const node of this) {
      const id: Address = node.getId().toLowerCase()

      const elec = elected.indexOf(id) > -1
      const reg = registered.indexOf(id) > -1

      node.setStakingInformation(reg, elec)
    }
  }

  public updateLatency(
    id: Address,
    latency: number,
  ): Latency {
    const node: Node = this.getNodeById(id)

    if (node) {
      return node.setLatency(latency)
    }
  }

  public updatePending(
    id: Address,
    stats: Stats
  ): Pending {
    const node: Node = this.getNodeById(id)

    if (node) {
      return node.setPending(stats)
    }
  }

  public updateStats(
    id: Address,
    stats: Stats,
  ): StatsResponse {
    const node: Node = this.getNodeById(id)

    if (node) {
      return node.setStats(stats)
    }
  }

  public setValidator(
    id: Address,
    validator: ValidatorData
  ): void {
    let node: Node = this.getNodeById(id)

    if (!node) {
      node = this.createEmptyNode(id)
    }

    node.setValidatorData(validator)
  }

  public addNode(
    id: Address,
    nodeInformation: NodeInformation
  ): NodeSummary {
    let node: Node = this.getNodeById(id)

    if (!node) {
      node = this.createEmptyNode(id)
    }

    return node.setNodeInformation(
      nodeInformation
    )
  }

  private getIndex(
    search: { (n: Node): boolean }
  ): number {
    return this.indexOf(this.find(search))
  }

  private getNode(
    search: { (n: Node): boolean }
  ): Node {
    const index = this.getIndex(search)
    return index > -1 ? this[index] : null
  }

  public getNodeBySpark(spark: string): Node {
    return this.getNode((n: Node) => n.getSpark() === spark)
  }

  public getNodeById(id: Address): Node {
    return this.getNode((n: Node) => n.getId() === id)
  }

  public createEmptyNode(
    id: Address,
  ): Node {
    const node = new Node(id)
    this.push(node)
    return node;
  }

  public all(): NodeSummary[] {
    this.removeOldNodes()

    return this
      .filter((node: Node, index: number, self: Node[]) => self.findIndex(
        (t: Node) => {
          return (t.getId() === node.getId())
        }) === index
      )
      .map((n: Node) => n.getSummary())
  }

  public getOfflineButInteresting(): NodeStats[] {
    return this
      .filter((node: Node) => node.isOfflineButInteresting())
      .map((n: Node) => n.getNodeStats())
  }

  private removeOldNodes(): void {
    const deleteList = []

    for (let i = this.length - 1; i >= 0; i--) {
      if (this[i].isInactiveAndOld()) {
        deleteList.push(i)
      }
    }

    if (deleteList.length > 0) {
      console.success(`Deleting ${deleteList.length} stale nodes!`)

      for (let i = 0; i < deleteList.length; i++) {
        this.splice(deleteList[i], 1)
      }
    }
  }
}

export const nodes = new Nodes()

if (cfg.prePopulateFromWhitelist) {
  trusted.forEach((addr: string) => nodes.createEmptyNode(addr))
}
