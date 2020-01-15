// @ts-ignore
import * as d3 from "d3"
import { Block } from "./interfaces/Block";
import { PropagationTime } from "./interfaces/PropagationTime";
import { ChartData } from "./interfaces/ChartData";
import { Histogram } from "./interfaces/Histogram";
import { HistogramEntry } from "./interfaces/HistogramEntry";
import { Miner } from "./interfaces/Miner";
import { BlockWrapper } from "./interfaces/BlockWrapper";
import { padArray } from "./utils/padArray";
import { cfg } from "./utils/config";

export default class History {

  private blocks: BlockWrapper[] = []
  private callback: { (err: Error | string, chartData: ChartData): void } = null

  public add(
    block: Block,
    id: string,
    trusted: boolean,
    addingHistory = false
  ): {
    block: Block,
    changed: boolean
  } {
    let changed = false

    if (
      block &&
      block.number && block.uncles &&
      block.transactions && block.difficulty &&
      block.number >= 0
    ) {
      const historyBlock: BlockWrapper = this.search(block.number)
      let forkIndex = -1

      const now = Date.now()

      block.trusted = trusted
      block.arrived = now
      block.received = now
      block.propagation = 0
      block.fork = 0

      if (historyBlock) {
        // We already have a block with this height in collection

        // Check if node already checked this block height
        const propagationIndex = historyBlock.propagTimes.indexOf(
          historyBlock.propagTimes.find((p) => p.node === id)
        )

        // Check if node already check a fork with this height
        forkIndex = History.compareForks(historyBlock, block)

        if (propagationIndex === -1) {
          // Node didn't submit this block before
          if (forkIndex >= 0 && historyBlock.forks[forkIndex]) {
            // Found fork => update data
            block.arrived = historyBlock.forks[forkIndex].arrived
            block.propagation = now - historyBlock.forks[forkIndex].received
          } else {
            // No fork found => add a new one
            const prevBlock: BlockWrapper = this.prevMaxBlock()

            if (prevBlock) {
              block.time = Math.max(block.arrived - prevBlock.block.arrived, 0)

              if (block.number < this.bestBlock().height)
                block.time = Math.max((block.timestamp - prevBlock.block.timestamp) * 1000, 0)
            } else {
              block.time = 0
            }

            forkIndex = historyBlock.forks.push(block) - 1
            historyBlock.forks[forkIndex].fork = forkIndex
          }

          // Push propagation time
          historyBlock.propagTimes.push({
            node: id,
            trusted: trusted,
            fork: forkIndex,
            received: now,
            propagation: block.propagation
          })
        } else {
          // Node submitted the block before
          if (forkIndex >= 0 && historyBlock.forks[forkIndex]) {
            // Matching fork found => update data
            block.arrived = historyBlock.forks[forkIndex].arrived

            if (forkIndex === historyBlock.propagTimes[propagationIndex].fork) {
              // Fork index is the same
              block.received = historyBlock.propagTimes[propagationIndex].received
              block.propagation = historyBlock.propagTimes[propagationIndex].propagation
            } else {
              // Fork index is different
              historyBlock.propagTimes[propagationIndex].fork = forkIndex
              historyBlock.propagTimes[propagationIndex].propagation =
                block.propagation = now - historyBlock.forks[forkIndex].received
            }

          } else {
            // No matching fork found => replace old one
            block.received = historyBlock.propagTimes[propagationIndex].received
            block.propagation = historyBlock.propagTimes[propagationIndex].propagation

            const prevBlock = this.prevMaxBlock()

            if (prevBlock) {
              block.time = Math.max(block.arrived - prevBlock.block.arrived, 0)

              if (block.number < this.bestBlock().height) {
                block.time = Math.max((block.timestamp - prevBlock.block.timestamp) * 1000, 0)
              }
            } else {
              block.time = 0
            }

            forkIndex = historyBlock.forks.push(block) - 1
            historyBlock.forks[forkIndex].fork = forkIndex
          }
        }

        if (trusted && !History.compareBlocks(historyBlock.block, historyBlock.forks[forkIndex])) {
          // If source is trusted update the main block
          historyBlock.forks[forkIndex].trusted = trusted
          historyBlock.block = historyBlock.forks[forkIndex]
        }

        block.fork = forkIndex

        changed = true

      } else {
        // Couldn't find block with this height

        // Getting previous max block
        const prevBlock = this.prevMaxBlock()

        if (prevBlock) {
          block.time = Math.max(block.arrived - prevBlock.block.arrived, 0)

          if (block.number < this.bestBlock().height) {
            block.time = Math.max((block.timestamp - prevBlock.block.timestamp) * 1000, 0)
          }
        } else {
          block.time = 0
        }

        const blockWrapper: BlockWrapper = {
          height: block.number,
          block: block,
          forks: [block],
          propagTimes: Array<PropagationTime>()
        }

        if (
          this.blocks.length === 0 ||
          (this.blocks.length > 0 && block.number > this.worstBlockNumber()) ||
          (
            this.blocks.length < cfg.maxBlockHistory &&
            block.number < this.bestBlockNumber() &&
            addingHistory
          )
        ) {
          blockWrapper.propagTimes.push({
            node: id,
            trusted: trusted,
            fork: 0,
            received: now,
            propagation: block.propagation
          })

          this.save(blockWrapper)

          changed = true
        }
      }

      return {
        block: block,
        changed: changed
      }
    }
  }

  static compareBlocks(block1: Block, block2: Block): boolean {
    return !(block1.hash !== block2.hash ||
      block1.parentHash !== block2.parentHash ||
      block1.miner !== block2.miner ||
      block1.difficulty !== block2.difficulty ||
      block1.totalDifficulty !== block2.totalDifficulty)
  }

  static compareForks(historyBlock: BlockWrapper, block2: Block): number {
    if (!historyBlock) {
      return -1
    }

    if (!historyBlock.forks || historyBlock.forks.length === 0) {
      return -1
    }

    for (let x = 0; x < historyBlock.forks.length; x++) {
      if (History.compareBlocks(historyBlock.forks[x], block2)) {
        return x
      }
    }

    return -1
  }

  private save(
    block: BlockWrapper
  ): void {
    this.blocks
      .unshift(block)

    this.blocks = this.blocks.sort(
      (block1: BlockWrapper, block2: BlockWrapper) => block2.height - block1.height
    )

    if (this.blocks.length > cfg.maxBlockHistory) {
      this.blocks.pop()
    }
  }

  // todo: this is dead code
  private clean(max: number): void {
    if (max > 0 && this.blocks.length > 0 && max < this.bestBlockNumber()) {
      console.log('MAX:', max)

      console.log('History items before:', this.blocks.length)

      this.blocks = this.blocks
        .filter((blockWrapper: BlockWrapper) => {
          return (blockWrapper.height <= max && blockWrapper.block.trusted === false)
        })

      console.log('History items after:', this.blocks.length)
    }
  }

  private search(
    number: number
  ): BlockWrapper {
    const index = this.blocks.indexOf(
      this.blocks.find((b: BlockWrapper) => b.height === number)
    )

    if (index < 0) {
      return null
    }

    return this.blocks[index]
  }

  private prevMaxBlock(): BlockWrapper {
    const heights = this.blocks.map(item => item.height)
    const index = heights.indexOf(Math.max(...heights))

    if (index < 0) {
      return null
    }

    return this.blocks[index]
  }

  private bestBlock(): BlockWrapper {
    return this.blocks[0]
  }

  private worstBlock(): BlockWrapper {
    return this.blocks[this.blocks.length - 1]
  }

  private bestBlockNumber(): number {
    const best: BlockWrapper = this.bestBlock()

    if (best && best.height) {
      return best.height
    }

    return 0
  }

  private worstBlockNumber(): number {
    const worst = this.worstBlock()

    if (worst && worst.height) {
      return worst.height
    }

    return 0
  }

  public getNodePropagation(
    id: string
  ): number[] {
    return this.blocks
      .slice(0, cfg.maxPeerPropagation)
      .map((block: BlockWrapper) => {

        const matches = block.propagTimes.filter(
          (propagationTime: PropagationTime) => propagationTime.node === id
        )

        if (matches.length > 0) {
          return matches[0].propagation
        }

        return -1
      })
  }

  public getBlockPropagation(): Histogram {
    const propagation: number[] = []
    let avgPropagation: number = 0

    this.blocks.forEach((block: BlockWrapper) => {
      block.propagTimes.forEach((propagationTime: PropagationTime) => {
        const prop = Math.min(
          cfg.maxPropagationRange,
          propagationTime.propagation || -1
        )

        if (prop >= 0) {
          propagation.push(prop)
        }
      })
    })

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

    const histogram = data.map((val: any): HistogramEntry => {
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
    const blockTimes = this.blocks
      .map((item: BlockWrapper): number => {
        return item.block.time / 1000
      })

    const sum = blockTimes.reduce((sum, b) => sum + b, 0)

    return sum / (blockTimes.length === 0 ? 1 : blockTimes.length)
  }

  private getMinersCount(): Miner[] {
    return this.blocks
      .slice(0, cfg.maxBins)
      .map((item: BlockWrapper): Miner => {
        return {
          miner: item.block.miner,
          number: item.block.number
        }
      })
  }

  public setCallback(
    callback: { (err: Error | string, chartData: ChartData): void }
  ): void {
    this.callback = callback
  }

  public getCharts(): void {
    const chartHistory = this.blocks
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
          height: blockWrapper.height,
          blocktime: blockWrapper.block.time / 1000,
          difficulty: blockWrapper.block.difficulty,
          uncles: blockWrapper.block.uncles.length,
          transactions: blockWrapper.block.transactions ? blockWrapper.block.transactions.length : 0,
          gasSpending: blockWrapper.block.gasUsed,
          gasLimit: blockWrapper.block.gasLimit,
          miner: blockWrapper.block.miner
        }
      })

    this.callback(null, {
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
    })
  }
}
