import assert from "assert"
import Collection from "../src/Collection";
import { NodeInformation } from "../src/interfaces/NodeInformation";

describe('Collection', () => {

  let collection: Collection;

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
    collection = new Collection();
  })

  describe('#all()', () => {

    it('should return the inserted node', (done) => {

      collection.addNode(node, (err) => {
        if (err) {
          throw err
        }

        const all = collection.getAll()
        assert.equal(all.length, 1)
        assert.equal(all[0].getId(), node.nodeData.id)
        done()

      })

    })

    it('should return all deduplicated', (done) => {

      const node1: NodeInformation = {
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

      collection.addNode(node1, (err) => {
        if (err) {
          throw err
        }

        const node2 = Object.assign({}, node1)

        collection.addNode(node2, (err) => {
          if (err) {
            throw err
          }

          assert.equal(collection.getAll().length, 1)
          done()
        })

      })

    })

  })

})