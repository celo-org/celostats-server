import assert from "assert"
import Collection from "../../src/server/collection";
import { NodeInformation } from "../../src/server/interfaces/NodeInformation";

describe('Collection', () => {

  let collection: Collection;

  beforeEach(() => {
    collection = new Collection();
  })

  describe('all', () => {

    it('should return the inserted node', (done) => {

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

      collection.add(node, (err) => {
        if (err) {
          throw err
        }

        const all = collection.all()
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

      collection.add(node1, (err) => {
        if (err) {
          throw err
        }

        const node2 = Object.assign({}, node1)

        collection.add(node2, (err) => {
          if (err) {
            throw err
          }

          assert.equal(collection.all().length, 1)
          done()
        })

      })

    })

  })

})