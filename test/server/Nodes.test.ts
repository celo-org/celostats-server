import assert from "assert"
import Node from "../../src/server/Node";
import Nodes from "../../src/server/Nodes";
import { dummyNodeInformation } from "./constants"
import History from "../../src/server/History"

describe('Nodes', () => {

  let nodes: Nodes;
  const history = new History()

  beforeEach(() => {
    nodes = new Nodes();
  })

  describe('#getNodeById()', () => {

    it('should get node by id', () => {
      const id = '0xnode1'
      const node = new Node(id, history)
      nodes.push(node)

      const n = nodes.getNodeById(id)

      assert(n)
      assert.equal(n.getId(), id)
    })

    it('should return null when node was not found with given id', () => {
      const id = '0xnode2'
      const node = new Node(id, history)
      nodes.push(node)

      const n = nodes.getNodeById("xxxFindMeNotxxx")

      assert.equal(n, null)
    })

  })

  describe('#getNodeBySpark()', () => {

    it('should get node by spark', () => {
      const id = '0xsparky'
      const spark = 'HGJgjsad'
      const node = new Node(id, history)
      node.setNodeInformation({
        stats: {
          ...dummyNodeInformation.stats,
          id
        },
        nodeData: {
          ...dummyNodeInformation.nodeData,
          spark
        }
      })
      nodes.push(node)

      const n = nodes.getNodeBySpark(spark)

      assert(n)
      assert.equal(n.getId(), id)
      assert.equal(n.getSpark(), spark)
    })

    it('should return null when node was not found with given id', () => {
      const id = '0xnode2'
      const spark = 'LjaksKHJj'

      const node = new Node(id, history)
      nodes.push(node)

      const n = nodes.getNodeBySpark(spark)

      assert.equal(n, null)
    })

  })

})
