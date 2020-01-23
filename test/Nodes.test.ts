import assert from "assert"
import Node from "../src/Node";
import { NodeInformation } from "../src/interfaces/NodeInformation";
import Nodes from "../src/Nodes";

describe('Collection', () => {

  let nodes: Nodes;

  const node: NodeInformation = {
    nodeData: {
      id: 'node1',
      address: '0x12345',
      ip: '',
      spark: '',
      latency: 0
    },
    stats: {
      id: '11',
      address: '0x12345'
    }
  }

  beforeEach(() => {
    nodes = new Nodes();
  })

  describe('#getIndex()', () => {

    it('should get node by search criteria', (done) => {
      nodes.push(new Node(node))

      const index = nodes.getIndex(
        (n: Node) => n.getId() === node.nodeData.id
      )

      assert.equal(index, 0)
      done()
    })

    it('should return -1 when node was not found', (done) => {
      nodes.push(new Node(node))

      const index = nodes.getIndex(
        (n: Node) => n.getId() === "xxxFindMeNotxxx"
      )

      assert.equal(index, -1)
      done()
    })

  })

})