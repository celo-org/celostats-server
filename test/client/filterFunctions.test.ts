/* globals angular */
// @ts-ignore
global.angular = {}
// @ts-ignore
global._ = require("lodash")

const assert = require("assert")
require("../../src/client/js/filterFunctions")

describe("filterFunctions", () => {

  describe("#peerClass()", () => {

    it("should return text-gray if not active", () => {

      // @ts-ignore
      const pc = angular.peerClass(null, false)
      assert.equal(pc, "text-gray")
    })

    it("should return text-gray if active and null peers", () => {
      // @ts-ignore

      const pc = angular.peerClass(null, true)
      assert.equal(pc, "text-gray")
    })

    it("should return text-danger if active and 0 peers", () => {
      // @ts-ignore

      const pc = angular.peerClass(0, true)
      assert.equal(pc, "text-danger")
    })
  })

  describe("#xssFilter()", () => {

    it("should filter out javascript", () => {
      const base = "javascript"

      // @ts-ignore
      const result = angular.xssFilter(base)

      assert.equal(result, "")
    })

    it("should filter out javAscript", () => {
      const base = "javAscript"

      // @ts-ignore
      const result = angular.xssFilter(base)

      assert.equal(result, "")
    })

    it("should filter out <script>", () => {
      const base = "<script>"

      // @ts-ignore
      const result = angular.xssFilter(base)

      assert.equal(result, "")
    })

    it("should filter out < script >", () => {
      const base = "< script >"

      // @ts-ignore
      const result = angular.xssFilter(base)

      assert.equal(result, "")
    })

  })

  describe("#latencyFilter()", () => {

    it("should '.readable' if not existing", () => {
      const node: any = {}

      // @ts-ignore
      angular.latencyFilter(node)

      assert(node.readable)
    })

    it("should return offline when stats not set", () => {
      const node: any = {
        readable: {}
      }

      // @ts-ignore
      angular.latencyFilter(node)

      assert.equal(node.readable.latency, 'offline')
    })

    it("should return offline when latency not set", () => {
      const node: any = {
        stats: {}
      }

      // @ts-ignore
      angular.latencyFilter(node)

      assert.equal(node.readable.latency, 'offline')
    })

    it("should return offline when latency is null", () => {
      const node: any = {
        stats: {
          latency: null
        }
      }

      // @ts-ignore
      angular.latencyFilter(node)

      assert.equal(node.readable.latency, 'offline')
    })

    it("should return offline when latency is undefined", () => {
      const node: any = {
        stats: {
          active: true,
          latency: undefined
        }
      }

      // @ts-ignore
      angular.latencyFilter(node)

      assert.equal(node.readable.latency, 'offline')
    })

    it("should return offline when not active", () => {
      const node: any = {
        stats: {
          active: false
        }
      }

      // @ts-ignore
      angular.latencyFilter(node)

      assert.equal(node.readable.latency, 'offline')
    })

    it("should return offline when not active and latency is 10", () => {
      const node: any = {
        stats: {
          active: false,
          latency: 10
        }
      }

      // @ts-ignore
      angular.latencyFilter(node)

      assert.equal(node.readable.latency, 'offline')
    })

    it("should return offline when active and latency is undefined", () => {
      const node: any = {
        stats: {
          active: true,
          latency: undefined
        }
      }

      // @ts-ignore
      angular.latencyFilter(node)

      assert.equal(node.readable.latency, 'offline')
    })

    it("should return offline when active and latency is null", () => {
      const node: any = {
        stats: {
          active: true,
          latency: null
        }
      }

      // @ts-ignore
      angular.latencyFilter(node)

      assert.equal(node.readable.latency, 'offline')
    })

    it("should return offline when not active and latency is 10", () => {
      const node: any = {
        stats: {
          active: false,
          latency: 10
        }
      }

      // @ts-ignore
      angular.latencyFilter(node)

      assert.equal(node.readable.latency, 'offline')
    })

    it("should return string when active and latency is 10", () => {
      const node: any = {
        stats: {
          active: true,
          latency: 10
        }
      }

      // @ts-ignore
      angular.latencyFilter(node)

      assert.equal(node.readable.latency, '10 ms')
    })

    it("should return string when active and latency is 0", () => {
      const node: any = {
        stats: {
          active: true,
          latency: 0
        }
      }

      // @ts-ignore
      angular.latencyFilter(node)

      assert.equal(node.readable.latency, '0 ms')
    })
  })

})
