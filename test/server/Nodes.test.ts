import assert from "assert"
import Node from "../../src/server/Node";
import { Nodes } from "../../src/server/Nodes";
import { dummyInfo, dummyNodeInformation } from "./constants"
import { NodeInformation } from "../../src/server/interfaces/NodeInformation"

describe('Nodes', () => {

  const node: NodeInformation = {
    nodeData: {
      ip: '',
      spark: '',
      latency: 0
    },
    stats: {
      id: '11',
      address: '0x12345',
      info: dummyInfo,
    }
  }

  let nodes: Nodes;

  beforeEach(() => {
    nodes = new Nodes();
  })

  describe('#getNodeById()', () => {

    it('should get node by id', () => {
      const id = '0xnode1'
      const node = new Node(id)
      nodes.push(node)

      const n = nodes.getNodeById(id)

      assert(n)
      assert.equal(n.getId(), id)
    })

    it('should return null when node was not found with given id', () => {
      const id = '0xnode2'
      const node = new Node(id)
      nodes.push(node)

      const n = nodes.getNodeById("xxxFindMeNotxxx")

      assert.equal(n, null)
    })

  })

  describe('#getNodeBySpark()', () => {

    it('should get node by spark', () => {
      const id = '0xsparky'
      const spark = 'HGJgjsad'
      const node = new Node(id)
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

      const node = new Node(id)
      nodes.push(node)

      const n = nodes.getNodeBySpark(spark)

      assert.equal(n, null)
    })

  })

  describe('#all()', () => {

    it('should return the inserted node', () => {

      const id = '0xnode11244'

      const n = nodes.addNode(id, node)
      assert(n)

      const all = nodes.all()

      assert.equal(all.length, 1)
      assert.equal(all[0].id, id)
    })

    it('should return all deduplicated', () => {

      const id = "node1";

      const n1 = nodes.addNode(id, node)
      assert(n1)

      const n2 = nodes.addNode(id, node)
      assert(n2)

      assert.equal(nodes.all().length, 1)
    })

  })

})
