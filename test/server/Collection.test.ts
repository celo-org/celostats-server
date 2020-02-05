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

      collection.addNode(
        id, node,
        (err: Error | string) => {
          if (err) {
            throw err
          }

          const all = collection.getAll()
          console.log(all)
          assert.equal(all.length, 1)
          assert.equal(all[0].getId(), id)
          done()
        })

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

      collection.addNode(
        id, node1,
        (err) => {
          if (err) {
            throw err
          }

          const node2 = {...node1}

          collection.addNode(
            id, node2,
            (err) => {
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