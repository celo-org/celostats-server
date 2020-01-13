// @ts-ignore
import _ from 'lodash'
import History from "./history";
import Node from "./node"
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
import { Histogram } from "./interfaces/Histogram";

export default class Collection {

  private nodes: Node[] = []
  private history: History = new History()
  private debounced: any = null
  private highestBlock: number = 1

  public add(
    nodeInformation: NodeInformation,
    callback: { (err: Error | string, nodeInfo: NodeInfo): void }
  ): void {
    const node: Node = this.getNodeOrNew(
      {validatorData: {signer: nodeInformation.nodeData.id}},
      nodeInformation
    )
    node.setInfo(
      nodeInformation,
      callback
    )
  }

  // todo: this is dead code!
  private update(
    id: string,
    stats: Stats,
    callback: { (err: Error | string, stats: NodeStats): void }
  ): void {
    const node: Node = this.getNode({validatorData: {signer: id}})

    if (!node) {
      callback('Node not found', null)
    } else {
      const block = this.history.add(stats.block, id, node.getTrusted())

      if (!block) {
        callback('Block data wrong', null)
      } else {
        const propagationHistory: number[] = this.history.getNodePropagation(id)

        stats.block.arrived = block.block.arrived
        stats.block.received = block.block.received
        stats.block.propagation = block.block.propagation

        node.setStats(
          stats,
          propagationHistory,
          callback
        )
      }
    }
  }

  public addBlock(
    id: string,
    block: Block,
    callbackUpdatedStats: { (err: Error | string, blockStats: BlockStats): void },
    callbackHighestBlock: { (err: Error | string, highestBlock: number): void }
  ): void {
    const node: Node = this.getNode({validatorData: {signer: id}})

    if (!node) {
      console.error(
        this.nodes.map(node => {
          console.log(node.getValidatorData().signer)
        })
      )
      callbackUpdatedStats(`Node ${id} not found`, null)
    } else {

      const newBlock = this.history.add(block, id, node.getTrusted())

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

  public getLength(): number {
    return this.nodes.length
  }

  public getHighestBlock(): number {
    return this.highestBlock
  }

  public updatePending(
    id: string,
    stats: Stats,
    callback: { (err: Error | string, pending: Pending | null): void }
  ): void {
    const node: Node = this.getNode({validatorData: {signer: id}})

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
    const node: Node = this.getNode({validatorData: {signer: id}})

    if (!node) {
      callback('Node not found', null)
    } else {
      node.setBasicStats(stats, callback)
    }
  }

  public updateLatency(
    id: string,
    latency: number,
    callback: { (err: Error | string, latency: Latency): void }
  ): void {
    const node: Node = this.getNode({validatorData: {signer: id}})

    if (!node) {
      return
    }

    node.setLatency(latency, callback)
  }

  public inactive(
    spark: string,
    callback: { (err: Error | string, stats: NodeStats): void }
  ): void {
    const node = this.getNode({spark})

    if (!node) {
      callback('Node not found', null)
    } else {
      node.setState(false)
      callback(null, node.getStats())
    }
  }

  public getIndex(
    search: object
  ): number {
    return _.findIndex(this.nodes, search)
  }

  private getNode(
    search: object
  ): Node {
    const index = this.getIndex(search)

    if (index >= 0) {
      return this.nodes[index]
    }

    return null
  }

  private getNodeByIndex(
    index: number
  ): Node {
    if (this.nodes[index])
      return this.nodes[index]

    return
  }

  private getIndexOrNew(
    search: object,
    data: NodeInformation | Validator
  ): number {
    const index = this.getIndex(search)

    return (index >= 0 ? index : this.nodes.push(new Node(data)) - 1)
  }

  public getNodeOrNew(
    search: object,
    data: NodeInformation | Validator
  ): Node {
    return this.getNodeByIndex(
      this.getIndexOrNew(search, data)
    )
  }

  public all(): Node[] {
    this.removeOldNodes()

    return this.nodes
  }

  private removeOldNodes(): void {
    const deleteList = []

    for (let i = this.nodes.length - 1; i >= 0; i--) {
      if (this.nodes[i].isInactiveAndOld()) {
        deleteList.push(i)
      }
    }

    if (deleteList.length > 0) {
      for (let i = 0; i < deleteList.length; i++) {
        this.nodes.splice(deleteList[i], 1)
      }
    }
  }

  // todo: this is dead code
  private blockPropagationChart(): Histogram {
    return this.history.getBlockPropagation()
  }

  public setChartsCallback(
    callback: { (err: Error | string, chartData: ChartData): void }
  ): void {
    this.history.setCallback(callback)
  }

  public getCharts(): void {
    this.getChartsDebounced()
  }

  private getChartsDebounced(): void {

    if (this.debounced === null) {
      this.debounced = _.debounce(() => {
        this.history.getCharts()
      }, 500, {
        leading: false,
        maxWait: 2000,
        trailing: true
      })
    }

    this.debounced()
  }
}
