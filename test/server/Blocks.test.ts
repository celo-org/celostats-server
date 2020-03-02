import assert from "assert"
import Blocks from "../../src/server/Blocks"
import { cfg } from "../../src/server/utils/config"
import { dummyBlock } from "./constants"
import { BlockWrapper } from "../../src/server/interfaces/BlockWrapper"

cfg.JSONRPC = ""

describe('Blocks', () => {

  let blocks: Blocks;
  const testBlocks = [
    {
      ...dummyBlock,
      number: 1
    },
    {
      ...dummyBlock,
      number: 15
    },
    {
      ...dummyBlock,
      number: 7
    }
  ]

  beforeEach(() => {
    blocks = new Blocks();
  })

  describe('#worstBlock()', () => {

    it('should null on empty collection', () => {
      const block: BlockWrapper = blocks.worstBlock()

      assert.equal(block, null)
    })

    it('should return worst block', () => {

      // populate collection
      for (const block of testBlocks) {
        blocks.saveBlock({
          block,
          forks: [block],
          signers: [],
          propagationTimes: []
        })
      }

      const block: BlockWrapper = blocks.worstBlock()

      assert.notEqual(block, null)
      assert.equal(block.block.number, 1)
    })

  })

  describe('#worstBlock()', () => {

    it('should null on empty collection', () => {
      const blockNumber: number = blocks.worstBlockNumber()

      assert.equal(blockNumber, -1)
    })

    it('should return worst block', () => {

      // populate collection
      for (const block of testBlocks) {
        blocks.saveBlock({
          block,
          forks: [block],
          signers: [],
          propagationTimes: []
        })
      }

      const blockNumber: number = blocks.worstBlockNumber()

      assert.notEqual(blockNumber, -1)
      assert.equal(blockNumber, 1)
    })

  })

  describe('#bestBlock()', () => {

    it('should null on empty collection', () => {
      const block: BlockWrapper = blocks.bestBlock()

      assert.equal(block, null)
    })

    it('should return best block', () => {

      // populate collection
      for (const block of testBlocks) {
        blocks.saveBlock({
          block,
          forks: [block],
          signers: [],
          propagationTimes: []
        })
      }

      const block: BlockWrapper = blocks.bestBlock()

      assert.notEqual(block, null)
      assert.equal(block.block.number, 15)
    })

  })

  describe('#bestBlockNumber()', () => {

    it('should null on empty collection', () => {
      const blockNumber: number = blocks.bestBlockNumber()

      assert.equal(blockNumber, -1)
    })

    it('should return best block number', () => {

      // populate collection
      for (const block of testBlocks) {
        blocks.saveBlock({
          block,
          forks: [block],
          signers: [],
          propagationTimes: []
        })
      }

      const blockNumber: number = blocks.bestBlockNumber()

      assert.notEqual(blockNumber, -1)
      assert.equal(blockNumber, 15)
    })

  })

  describe('#saveBlock()', () => {

    it('should sort properly', () => {

      // populate collection
      for (const block of testBlocks) {
        blocks.saveBlock({
          block,
          forks: [block],
          signers: [],
          propagationTimes: []
        })
      }

      assert(blocks.length === 3)

      assert(blocks[0].block.number > blocks[1].block.number)
      assert(blocks[1].block.number > blocks[2].block.number)
      assert.equal(blocks[2].block.number, 1)
    })

    it('should discard more than 250 blocks', () => {

      // populate collection
      for (let i = 0; i < cfg.maxBlockHistory + 5; i++) {
        const block = {
          ...dummyBlock,
          number: i
        }

        blocks.saveBlock({
          block,
          forks: [block],
          signers: [],
          propagationTimes: []
        })
      }

      assert(blocks.length === cfg.maxBlockHistory)
    })

  })

  describe('#findBlockByNumber()', () => {

    it('should return block', () => {
      // find me not
      const block: BlockWrapper = blocks.findBlockByNumber(1337)
      assert.equal(block, null)
    })

    it('should return block', () => {

      // populate collection
      for (const block of testBlocks) {
        blocks.saveBlock({
          block,
          forks: [block],
          signers: [],
          propagationTimes: []
        })
      }

      const block: BlockWrapper = blocks.findBlockByNumber(15)
      assert.notEqual(block, null)
    })

  })

})
