// @ts-ignore
import * as d3 from "d3"
import Blocks from "./Blocks";
import { Block } from "./interfaces/Block";
import { PropagationTime } from "./interfaces/PropagationTime";
import { ChartData } from "./interfaces/ChartData";
import { Histogram } from "./interfaces/Histogram";
import { HistogramEntry } from "./interfaces/HistogramEntry";
import { Miner } from "./interfaces/Miner";
import { BlockWrapper } from "./interfaces/BlockWrapper";
import { padArray } from "./utils/padArray";
import { cfg } from "./utils/config";
import { compareBlocks } from "./utils/compareBlocks";
import { getForkIndex } from "./utils/getForkIndex";
import { Address } from "./interfaces/Address"
import { getContracts } from "./ContractKit"
import { IDictionary } from "./interfaces/IDictionary"

export default class History {

  private _blocks: Blocks = new Blocks()

  public addBlock(
    id: Address,
    receivedBlock: Block,
    trusted: boolean
  ): Block {
    if (
      receivedBlock && receivedBlock.uncles &&
      !isNaN(receivedBlock.number) && receivedBlock.number >= 0 &&
      receivedBlock.transactions && receivedBlock.difficulty
    ) {
      const historyBlock: BlockWrapper = this._blocks.findBlockByNumber(
        receivedBlock.number
      )
      const now = Date.now()

      const block: Block = {
        ...receivedBlock,
        trusted: trusted,
        arrived: now,
        received: now,
        propagation: 0,
        fork: 0
      }

      if (historyBlock) {
        // We already have a block with this height in collection
        return this.updateBlock(
          id,
          block,
          historyBlock
        )

      } else if (
        block.number > this._blocks.worstBlockNumber() ||
        block.number < this._blocks.bestBlockNumber()
      ) {
        // Couldn't find block with this height
        return this.addNewBlock(
          id,
          block
        )
      }
    }

    return null
  }

  private addNewBlock(
    id: string,
    block: Block
  ): Block {
    this.setBlockTime(block)

    const b: Block = {
      ...block
    }

    const blockWrapper: BlockWrapper = {
      // set block
      block: b,
      // set fork
      forks: [b],
      signers: [],
      propagationTimes: Array<PropagationTime>({
        node: id,
        trusted: block.trusted,
        // set fork index
        fork: 0,
        received: block.received,
        propagation: block.propagation
      })
    }

    const contracts = getContracts()

    if (contracts) {
      (async () => {
        try {
          const signers = await contracts.election.getValidatorSigners(
            blockWrapper.block.number
          )

          if (signers) {
            blockWrapper.signers = signers;
          }
        } catch (err) {
          console.error('API', 'BLK', blockWrapper.block.number, err.message)
        }
      })()
    }

    this._blocks.saveBlock(blockWrapper)

    return blockWrapper.block
  }

  private updateBlock(
    id: string,
    receivedBlock: Block,
    historyBlock: BlockWrapper,
  ): Block {
    // Check if node already check a fork with this height
    let forkIndex = getForkIndex(
      historyBlock,
      receivedBlock
    )

    // Check if node already checked this block height
    const propagationIndex = historyBlock.propagationTimes.indexOf(
      historyBlock.propagationTimes.find((p) => p.node === id)
    )

    if (propagationIndex === -1) {
      // Node didn't submit this block before
      forkIndex = this.addNodePropagation(
        id,
        receivedBlock,
        historyBlock,
        forkIndex
      )
    } else {
      // Node submitted the block before
      forkIndex = this.updateNodePropagation(
        receivedBlock,
        historyBlock,
        forkIndex,
        propagationIndex
      )
    }

    // are the base block and the new forks different?
    if (
      receivedBlock.trusted &&
      !compareBlocks(
        historyBlock.block,
        historyBlock.forks[forkIndex]
      )
    ) {
      // yes

      // If source is trusted update the main block
      historyBlock.forks[forkIndex].trusted = receivedBlock.trusted
      historyBlock.forks[forkIndex].fork = forkIndex
      historyBlock.block = historyBlock.forks[forkIndex]
    }

    return historyBlock.block;
  }

  /**
   * TODO: Properly document and test this method
   * @param historyBlock
   * @param forkIndex
   * @param propagationIndex
   */
  private updateNodePropagation(
    receivedBlock: Block,
    historyBlock: BlockWrapper,
    forkIndex: number,
    propagationIndex: number
  ): number {
    const block: Block = {
      ...receivedBlock
    }

    if (
      forkIndex >= 0 &&
      historyBlock.forks[forkIndex]
    ) {
      // Matching fork found => update data
      block.arrived = historyBlock.forks[forkIndex].arrived

      if (forkIndex === historyBlock.propagationTimes[propagationIndex].fork) {
        // Fork index is the same
        block.received =
          historyBlock.propagationTimes[propagationIndex].received
        block.propagation =
          historyBlock.propagationTimes[propagationIndex].propagation
      } else {
        // Fork index is different
        historyBlock.propagationTimes[propagationIndex].fork = forkIndex
        historyBlock.propagationTimes[propagationIndex].propagation =
          block.propagation =
            block.received - historyBlock.forks[forkIndex].received
      }

    } else {
      // No matching fork found => replace old one
      block.received =
        historyBlock.propagationTimes[propagationIndex].received
      block.propagation =
        historyBlock.propagationTimes[propagationIndex].propagation

      this.setBlockTime(block)

      forkIndex = historyBlock.forks.push(block) - 1
      historyBlock.forks[forkIndex].fork = forkIndex
    }

    return forkIndex
  }

  /**
   * TODO: Properly document and test this method
   * @param id
   * @param receivedBlock
   * @param historyBlock
   * @param forkIndex
   */
  private addNodePropagation(
    id: string,
    receivedBlock: Block,
    historyBlock: BlockWrapper,
    forkIndex: number,
  ): number {

    // copy
    const block = {
      ...receivedBlock
    }

    // do we have a fork?
    if (
      forkIndex >= 0 &&
      historyBlock.forks[forkIndex]
    ) {
      // Found fork => update data
      block.arrived = historyBlock.forks[forkIndex].arrived
      block.propagation = block.received - historyBlock.forks[forkIndex].received
    } else {
      // No fork found => add a new one
      this.setBlockTime(block)

      forkIndex = historyBlock.forks.push(block) - 1
      historyBlock.forks[forkIndex].fork = forkIndex
    }

    historyBlock.block = block

    // Push propagation time
    historyBlock.propagationTimes.push({
      node: id,
      trusted: block.trusted,
      fork: forkIndex,
      received: block.received,
      propagation: block.propagation
    })

    return forkIndex
  }

  /**
   * TODO: Properly document and test this method
   * @param block
   */
  private setBlockTime(
    block: Block
  ): void {
    // Getting previous max block
    const bestBlock: BlockWrapper = this._blocks.bestBlock()

    if (bestBlock) {
      block.time = Math.max(
        block.arrived - bestBlock.block.arrived,
        0
      )

      if (block.number < bestBlock.block.number) {
        block.time = Math.max(
          (block.timestamp - bestBlock.block.timestamp) * 1000,
          0
        )
      }
    } else {
      block.time = 0
    }
  }

  public getNodePropagationHistory(
    id: Address
  ): number[] {
    return this._blocks
      .slice(0, cfg.maxPeerPropagation)
      .map((blockWrapper: BlockWrapper): number => {
        const propagationTime: PropagationTime = blockWrapper.propagationTimes.find(
          (propagationTime: PropagationTime) => propagationTime.node === id
        )

        if (propagationTime) {
          return propagationTime.propagation
        }

        return -1
      })
  }

  public getNodeSignatures(
    id: Address
  ): boolean[] {
    return this._blocks
      .slice(0, cfg.maxBins)
      .map((block: BlockWrapper): boolean => {
        const signer = block.signers.find(
          (signer: string) =>
            signer.toLowerCase() === id.toLowerCase()
        )
        return !!signer
      })
      .fill(null, null, cfg.maxBins)
  }

  public getLength(): number {
    return this._blocks.length;
  }

  public getBlockPropagation(): Histogram {
    const propagation: number[] = []
    let avgPropagation = 0

    for (const blockWrapper of this._blocks) {
      for (const propagationTime of blockWrapper.propagationTimes) {
        const prop = Math.min(
          cfg.maxPropagationRange,
          propagationTime.propagation || -1
        )

        if (prop >= 0) {
          propagation.push(prop)
        }
      }
    }

    if (propagation.length > 0) {
      const sum = propagation.reduce((sum, p) => sum + p, 0)
      avgPropagation = Math.round(sum / propagation.length)
    }

    const data = d3.histogram()
      .domain([
        cfg.minPropagationRange,
        cfg.maxPropagationRange
      ])
      .thresholds(cfg.maxBins)
      (propagation)

    let freqCum = 0

    const histogram = data.map((val): HistogramEntry => {
      freqCum += val.length

      const cumPercent = (freqCum / Math.max(1, propagation.length))
      const y = val.length / propagation.length

      return {
        x: val.x0,
        dx: val.x1 - val.x0,
        y: isNaN(y) ? 0 : y,
        frequency: val.length,
        cumulative: freqCum,
        cumpercent: cumPercent
      }
    })

    return {
      histogram: histogram,
      avg: avgPropagation
    }
  }

  private getAvgBlocktime(): number {
    const blockTimes = this._blocks
      .map((item: BlockWrapper): number => {
        return item.block.time / 1000
      })

    const sum = blockTimes.reduce((sum, b) => sum + b, 0)

    return sum / (blockTimes.length === 0 ? 1 : blockTimes.length)
  }

  private getMinersCount(): Miner[] {
    return this._blocks
      .slice(0, cfg.maxBins)
      .map((item: BlockWrapper): Miner => {
        return {
          miner: item.block.miner,
          number: item.block.number
        }
      })
  }

  public getCharts(): ChartData {
    const chartHistory = this._blocks
      .slice(0, cfg.maxBins)
      .map((blockWrapper: BlockWrapper): {
        height: number
        blocktime: number
        difficulty: string
        uncles: number
        transactions: number
        gasSpending: number
        gasLimit: number
        miner: string
      } => {
        return {
          height: blockWrapper.block.number,
          blocktime: blockWrapper.block.time / 1000,
          difficulty: blockWrapper.block.difficulty,
          uncles: blockWrapper.block.uncles.length,
          transactions: blockWrapper.block.transactions ? blockWrapper.block.transactions.length : 0,
          gasSpending: blockWrapper.block.gasUsed,
          gasLimit: blockWrapper.block.gasLimit,
          miner: blockWrapper.block.miner
        }
      })

    return {
      height: chartHistory.map((h) => h.height),
      blocktime: padArray(chartHistory.map((h) => h.blocktime), cfg.maxBins, 0),
      avgBlocktime: this.getAvgBlocktime(),
      difficulty: chartHistory.map((h) => h.difficulty),
      uncles: chartHistory.map((h) => h.uncles),
      transactions: chartHistory.map((h) => h.transactions),
      gasSpending: padArray(chartHistory.map((h) => h.gasSpending), cfg.maxBins, 0),
      gasLimit: padArray(chartHistory.map((h) => h.gasLimit), cfg.maxBins, 0),
      miners: this.getMinersCount(),
      propagation: this.getBlockPropagation(),
    }
  }

  public getForks(): IDictionary {

    const forks: IDictionary = {}

    for (const block of this._blocks) {
      const b: IDictionary = {
        forks: block.forks.length
      }

      for (const forkedBlock of block.forks) {
        b[forkedBlock.hash] = {
          number: forkedBlock.number,
          miner: forkedBlock.miner
        }
      }

      forks[block.block.number] = b
    }

    return forks
  }

  public getBlockByNumber(
    blockNumber: number
  ): BlockWrapper {

    return this._blocks.findBlockByNumber(blockNumber)
  }

}
