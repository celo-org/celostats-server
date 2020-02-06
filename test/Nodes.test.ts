import assert from "assert"
import Node from "../../src/server/Node";
import Nodes from "../../src/server/Nodes";

describe('Nodes', () => {

  let nodes: Nodes;

  beforeEach(() => {
    nodes = new Nodes();
  })

  describe('#getNodeById()', () => {

    it('should get node by id', (done) => {
      const id = '0xnode1'
      const node = new Node(id)
      nodes.push(node)

      const n = nodes.getNodeById(id)

      assert(n)
      assert.equal(n.getId(), id)
      done()
    })

    it('should return null when node was not found with given id', (done) => {
      const id = '0xnode2'
      const node = new Node(id)
      nodes.push(node)

      const n = nodes.getNodeById("xxxFindMeNotxxx")

      assert.equal(n, null)
      done()
    })

  })

})
