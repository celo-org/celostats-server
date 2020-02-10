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

export default class Collection {

  private nodes: Nodes = new Nodes()
  private history: History = new History()

  // todo: move to history
  private highestBlock = 1

  public addNode(
    id: string,
    nodeInformation: NodeInformation
  ): NodeDetails {
    let node: Node = this.nodes.getNodeById(id)

    if (!node) {
      node = this.nodes.createEmptyNode(id)
    }

    return node.setNodeInformation(
      nodeInformation
    )
  }

  public addBlock(
    id: string,
    block: Block
  ): {
    highestBlock: number | null,
    blockStats: BlockStats | null
  } {
    const node: Node = this.nodes.getNodeById(id)

    if (node) {

      const newBlock = this.history.addBlock(
        id, block,
        node.getTrusted()
      )

      if (newBlock) {
        const propagationHistory: number[] = this.history.getNodePropagation(id)

        block.arrived = newBlock.block.arrived
        block.received = newBlock.block.received
        block.propagation = newBlock.block.propagation
        block.validators = newBlock.block.validators

        let highestBlock = null
        if (newBlock.block.number > this.highestBlock) {
          this.highestBlock = newBlock.block.number
          highestBlock = this.highestBlock
        }

        return {
          highestBlock,
          blockStats: node.setBlock(block, propagationHistory)
        }
      }
    }
  }

  public getSize(): {
    nodes: number,
    blocks: number
  } {
    return {
      nodes: this.nodes.length,
      blocks: this.history.getLength()
    }
  }

  public getAll(): NodeSummary[] {
    return this.nodes.all()
  }

  public getHighestBlock(): number {
    return this.highestBlock
  }

  public updatePending(
    id: string,
    stats: Stats
  ): Pending {
    const node: Node = this.nodes.getNodeById(id)

    if (node) {
      return node.setPending(stats)
    }
  }

  public updateStats(
    id: string,
    stats: Stats,
  ): StatsResponse {
    const node: Node = this.nodes.getNodeById(id)

    if (node) {
      return node.setStats(stats)
    }
  }

  public updateLatency(
    id: string,
    latency: number,
  ): Latency {
    const node: Node = this.nodes.getNodeById(id)

    if (node) {
      return node.setLatency(latency)
    }
  }

  public setInactive(
    spark: string
  ): NodeStats {
    const node = this.nodes.getNodeBySpark(spark)

    if (node) {
      node.setState(false)
      return node.getNodeStats()
    }
  }

  public getCharts(): ChartData {

    return this.history.getCharts();
  }

  public setValidator(
    id: string,
    validator: ValidatorData
  ): void {
    let node: Node = this.nodes.getNodeById(id)

    if (!node) {
      node = this.nodes.createEmptyNode(id)
    }

    node.setValidatorData(validator)
  }
}
