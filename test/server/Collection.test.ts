import assert from "assert"
import Collection from "../../src/server/Collection";
import { NodeInformation } from "../../src/server/interfaces/NodeInformation";

describe('Collection', () => {

  let collection: Collection;

  const node: NodeInformation = {
    nodeData: {
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
    collection = new Collection();
  })

  describe('#all()', () => {

    it('should return the inserted node', (done) => {

      const id = '0xnode11244'

      const n = collection.addNode(id, node)
      assert(n)

      const all = collection.getAll()

      assert.equal(all.length, 1)
      assert.equal(all[0].getId(), id)
      done()

    })

    it('should return all deduplicated', (done) => {

      const node1: NodeInformation = {
        nodeData: {
          ip: '',
          spark: '',
          latency: 0
        },
        stats: {
          id: '11',
          address: '0x12345'
        }
      }

      const id = "node1";

      const n1 = collection.addNode(id, node1)
      assert(n1)

      const node2 = {...node1}
      const n2 = collection.addNode(id, node2)
      assert(n2)

      assert.equal(collection.getAll().length, 1)
      done()

    })

  })

})