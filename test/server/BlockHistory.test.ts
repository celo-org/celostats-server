import assert from "assert"
import { BlockHistory } from "../../src/server/BlockHistory"
import { dummyBlock } from "./constants"
import { Block } from "../../src/server/interfaces/Block"
import { cfg } from "../../src/server/utils/config"

cfg.JSONRPC = ""

describe('BlockHistory', () => {

  let blockHistory: BlockHistory;

  beforeEach(() => {
    blockHistory = new BlockHistory();
  })

  describe('#getNodeSignatures()', () => {

    it('should return the inserted node', () => {

      const nodeId = "0x1234456"
      const block = {
        ...dummyBlock,
        signers: [nodeId]
      }

      blockHistory.addBlock(
        nodeId, block,
        true
      )
      const sigs = blockHistory.getNodeSignatures(nodeId)

      assert(typeof sigs === 'object')
    })

  })

  describe('#getNodePropagations()', () => {

    it('should return the inserted node', () => {

      const propagation1 = 560
      const propagation2 = 40

      const nodeId1 = "0x1234456"
      const nodeId2 = "0x1"

      const block: Block = {
        ...dummyBlock,
        number: 0,
        propagation: 400
      }

      blockHistory.addBlock(
        nodeId1, {
          ...block,
          propagation: propagation1
        },
        true
      )

      blockHistory.addBlock(
        nodeId2, {
          ...block,
          propagation: propagation2
        },
        true
      )

      const nodePropagationHistory: number[] =
        blockHistory.getNodePropagationHistory(nodeId2)

      assert(nodePropagationHistory.length === 1)
    })

  })

})
