import Node from "../../src/server/Node";
import assert from "assert"
import { dummyNodeInformation } from "./constants"
import History from "../../src/server/History"

describe('Node', () => {

  describe('#isInactiveAndOld()', () => {

    it('return false on fresh node', () => {
      const id = '0xsparky'
      const node = new Node(id, new History())
      assert(node)

      node.setNodeInformation(dummyNodeInformation)
      node.setState(true)

      const isInactiveorOld = node.isInactiveAndOld()
      assert.equal(isInactiveorOld, false)
    })

    it('return true when last status is true and last update is current', () => {
      const id = '0xsparky'
      const node = new Node(id, new History())
      assert(node)

      node.setNodeInformation(dummyNodeInformation)

      // deactivate node
      node.setState(false)

      node.getUptime().lastUpdate = Date.now()
      node.getUptime().lastStatus = true

      const isInactiveAndOld = node.isInactiveAndOld()
      assert.equal(isInactiveAndOld, false)
    })

    it('return true when last update is very far away and last status is false', () => {
      const id = '0xsparky'
      const node = new Node(id, new History())
      assert(node)

      node.setNodeInformation(dummyNodeInformation)

      // deactivate node
      node.setState(false)

      node.getUptime().lastUpdate = 100
      node.getUptime().lastStatus = false

      const isInactiveAndOld = node.isInactiveAndOld()
      assert.equal(isInactiveAndOld, true)
    })

    it('return true when last update is 0 and last status is false', () => {
      const id = '0xsparky'
      const node = new Node(id, new History())
      assert(node)

      node.setNodeInformation(dummyNodeInformation)

      // deactivate node
      node.setState(false)

      node.getUptime().lastUpdate = 0
      node.getUptime().lastStatus = false

      const isInactiveAndOld = node.isInactiveAndOld()
      assert.equal(isInactiveAndOld, true)
    })

  })

})
