import './utils/logger'
import History from "./History";
import Node from "./Node"
import Nodes from "./Nodes";
import { Stats } from "./interfaces/Stats";
import { Pending } from "./interfaces/Pending";
import { Latency } from "./interfaces/Latency";
import { ChartData } from "./interfaces/ChartData";
import { BlockStats } from "./interfaces/BlockStats";
import { StatsResponse } from "./interfaces/StatsResponse";
import { NodeStats } from "./interfaces/NodeStats";
import { Block } from "./interfaces/Block";
import { NodeInformation } from "./interfaces/NodeInformation";
import { ValidatorData } from "./interfaces/ValidatorData"
import { NodeDetails } from "./interfaces/NodeDetails"
import { NodeSummary } from "./interfaces/NodeSummary"
import { Address } from "./interfaces/Address"
import { IDictionary } from "./interfaces/IDictionary"

export default class Collection {

  private _nodes: Nodes = new Nodes()
  private _history: History = new History()

  // todo: move to history
  private _highestBlock = 1

  public addNode(
    id: Address,
    nodeInformation: NodeInformation
  ): NodeDetails {
    let node: Node = this._nodes.getNodeById(id)

    if (!node) {
      node = this._nodes.createEmptyNode(id, this._history)
    }

    return node.setNodeInformation(
      nodeInformation
    )
  }

  public addBlock(
    id: Address,
    block: Block
  ): {
    highestBlock: number | null,
    blockStats: BlockStats | null
  } {
    const node: Node = this._nodes.getNodeById(id)

    if (node) {
      const changedBlock: Block = this._history.addBlock(
        id,
        block,
        node.getTrusted()
      )

      if (changedBlock) {
        let highestBlock = null

        if (changedBlock.number > this._highestBlock) {
          this._highestBlock = changedBlock.number
          highestBlock = this._highestBlock
        }

        return {
          highestBlock,
          blockStats: node.setBlock(
            changedBlock
          )
        }
      }
    }
  }

  public getSize(): {
    nodes: number,
    blocks: number
  } {
    return {
      nodes: this._nodes.length,
      blocks: this._history.getLength()
    }
  }

  public getAll(): NodeSummary[] {
    return this._nodes.all()
  }

  public getHighestBlock(): number {
    return this._highestBlock
  }

  public updatePending(
    id: Address,
    stats: Stats
  ): Pending {
    const node: Node = this._nodes.getNodeById(id)

    if (node) {
      return node.setPending(stats)
    }
  }

  public updateStats(
    id: Address,
    stats: Stats,
  ): StatsResponse {
    const node: Node = this._nodes.getNodeById(id)

    if (node) {
      return node.setStats(stats)
    }
  }

  public updateLatency(
    id: Address,
    latency: number,
  ): Latency {
    const node: Node = this._nodes.getNodeById(id)

    if (node) {
      return node.setLatency(latency)
    }
  }

  public setInactive(
    spark: string
  ): NodeStats {
    const node = this._nodes.getNodeBySpark(spark)

    if (node) {
      node.setState(false)
      return node.getNodeStats()
    }
  }

  public getCharts(): ChartData {
    return this._history.getCharts();
  }

  public setValidator(
    id: Address,
    validator: ValidatorData
  ): void {
    let node: Node = this._nodes.getNodeById(id)

    if (!node) {
      node = this._nodes.createEmptyNode(id, this._history)
    }

    node.setValidatorData(validator)
  }

  public updateStakingInformation(
    registered: Address[],
    elected: Address[]
  ): void {
    for (const node of this._nodes) {
      const id: Address = node.getId().toLowerCase()

      const elec = elected.indexOf(id) > -1
      const reg = registered.indexOf(id) > -1

      node.setStakingInformation(reg, elec)
    }
  }

  public getForks(): IDictionary {
    return this._history.getForks()
  }
}
