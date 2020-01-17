import History from "./History";
import Node from "./Node"
import Nodes from "./Nodes";
import { Stats } from "./interfaces/Stats";
import { Validator } from "./interfaces/Validator";
import { Pending } from "./interfaces/Pending";
import { Latency } from "./interfaces/Latency";
import { NodeInfo } from "./interfaces/NodeInfo";
import { ChartData } from "./interfaces/ChartData";
import { BlockStats } from "./interfaces/BlockStats";
import { BasicStatsResponse } from "./interfaces/BasicStatsResponse";
import { NodeStats } from "./interfaces/NodeStats";
import { Block } from "./interfaces/Block";
import { NodeInformation } from "./interfaces/NodeInformation";

export default class Collection {

  private nodes: Nodes = new Nodes()
  private history: History = new History()

  // todo: move to history
  private highestBlock: number = 1

  public addNode(
    nodeInformation: NodeInformation,
    callback: { (err: Error | string, nodeInfo: NodeInfo): void }
  ): void {
    const node: Node = this.nodes.getNodeOrNew(
      (n: Node) => n.getValidatorData().signer === nodeInformation.nodeData.id,
      nodeInformation
    )
    node.setInfo(
      nodeInformation,
      callback
    )
  }

  public addBlock(
    id: string,
    block: Block,
    callbackUpdatedStats: { (err: Error | string, blockStats: BlockStats): void },
    callbackHighestBlock: { (err: Error | string, highestBlock: number): void }
  ): void {
    const node: Node = this.nodes.getNode((n: Node) => n.getValidatorData().signer === id)

    if (!node) {
      console.error(
        this.nodes.map(node => {
          console.log(node.getValidatorData().signer)
        })
      )
      callbackUpdatedStats(`Node ${id} not found`, null)
    } else {

      const newBlock = this.history.addBlock(
        block, id,
        node.getTrusted()
      )

      if (!newBlock) {
        callbackUpdatedStats('Block undefined', null)
      } else {
        const propagationHistory: number[] = this.history.getNodePropagation(id)

        block.arrived = newBlock.block.arrived
        block.received = newBlock.block.received
        block.propagation = newBlock.block.propagation
        block.validators = newBlock.block.validators

        if (newBlock.block.number > this.highestBlock) {
          this.highestBlock = newBlock.block.number

          callbackHighestBlock(null, this.highestBlock)
        }

        node.setBlock(block, propagationHistory, callbackUpdatedStats)
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

  public getAll(): Node[] {
    return this.nodes.all()
  }

  public getHighestBlock(): number {
    return this.highestBlock
  }

  public updatePending(
    id: string,
    stats: Stats,
    callback: { (err: Error | string, pending: Pending | null): void }
  ): void {
    const node: Node = this.nodes.getNode((n: Node) => n.getValidatorData().signer === id)

    if (!node) {
      return
    }

    node.setPending(stats, callback)
  }

  public updateStats(
    id: string,
    stats: Stats,
    callback: { (err: Error | string, basicStats: BasicStatsResponse | null): void }
  ): void {
    const node: Node = this.nodes.getNode((n: Node) => n.getValidatorData().signer === id)

    if (!node) {
      callback('Node not found during update stats', null)
    } else {
      node.setBasicStats(stats, callback)
    }
  }

  public updateLatency(
    id: string,
    latency: number,
    callback: { (err: Error | string, latency: Latency): void }
  ): void {
    const node: Node = this.nodes.getNode((n: Node) => n.getValidatorData().signer === id)

    if (!node) {
      return
    }

    node.setLatency(latency, callback)
  }

  public setInactive(
    spark: string,
    callback: { (err: Error | string, stats: NodeStats): void }
  ): void {
    const node = this.nodes.getNode((n: Node) => n.getSpark() === spark)

    if (!node) {
      callback('Node not found during setting inactive', null)
    } else {
      node.setState(false)
      callback(null, node.getStats())
    }
  }

  public getCharts(
    callback: { (err: Error | string, charts: ChartData): void }
  ): void {

    this.history.getCharts(callback);
  }

  public setValidator(
    validator: Validator,
    isElected: boolean
  ): void {
    const search = (n: Node) => n.getId() === validator.address
    const index: number = this.nodes.getIndex(search)
    const node: Node = this.nodes.getNodeOrNew(search, validator)

    if (index < 0) {
      // only if new node
      node.integrateValidatorData(validator)
    }

    node.setValidatorData(validator)

    if (isElected) {
      node.setValidatorElected(true)
    }

    node.setValidatorRegistered(true)
  }
}
