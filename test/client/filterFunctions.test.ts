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

    it("should return text-gray if active", () => {
      // @ts-ignore

      const pc = angular.peerClass(null, true)
      assert.equal(pc, "text-danger")
    })

  })

  describe("#peerClass()", () => {

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

})
