import {expect} from "chai"
import {autoFormatter} from "../src/charts/helpers/auto-format"
/* eslint-disable no-unused-expressions, no-undefined */

describe("Automatic Formatter", () => {

  const BASE_NUMBER = 12345.678
  const BASE_DATE = new Date("3/21/2018")

  describe("Number formatters", () => {

    it("should round to a number of decimals", () => {
      const formatted = autoFormatter(".2f")(BASE_NUMBER)
      expect(formatted.split(".")[1]).to.equal("68")
    })

    it("should add thousand separators", () => {
      const formatted = autoFormatter(",")(BASE_NUMBER)
      expect(formatted).to.equal("12,345.678")
    })

    it("should round to integer", () => {
      const formatted = autoFormatter(".0f")(BASE_NUMBER)
      expect(formatted).to.equal("12346")
    })

    it("should round to SI format with given precision", () => {
      const formatted = autoFormatter(".2s")(BASE_NUMBER)
      expect(formatted).to.equal("12k")
    })

    it("should convert to percentage, multiplying by 100", () => {
      const formatted = autoFormatter(".0%")(0.25)
      expect(formatted).to.equal("25%")
    })

    it("should convert to percentage with given precision", () => {
      const formatted = autoFormatter(".2p")(BASE_NUMBER)
      expect(formatted).to.equal("1200000%")
    })

    it("should convert to currency (locale specific)", () => {
      const formatted = autoFormatter("-$.2f")(BASE_NUMBER)
      expect(formatted).to.equal("$12345.68")
    })

    it("should use minus sign for negative currency", () => {
      const formatted = autoFormatter("-$.2f")(-BASE_NUMBER)
      expect(formatted).to.equal("-$12345.68")
    })

    it("should use parenthesis for negative currency", () => {
      const formatted = autoFormatter("($.2f")(-BASE_NUMBER)
      expect(formatted).to.equal("($12345.68)")
    })

    it("should force an SI suffix with given precision", () => {
      const formatted = autoFormatter(",.3s|M")(BASE_NUMBER)
      expect(formatted).to.equal("0.012M")
    })

    it("should add prefix/suffix", () => {
      const formatted = autoFormatter("AVG {.2f}km/h")(BASE_NUMBER)
      expect(formatted).to.equal("AVG 12345.68km/h")
    })

    it("should return the value on invalid formatter", () => {
      const formatted = autoFormatter("aaaaa")(BASE_NUMBER)
      expect(formatted).to.equal(BASE_NUMBER)
    })

    it("should return null if there's no formatter", () => {
      const formatted = autoFormatter(null)(BASE_NUMBER)
      expect(formatted).to.be.null
    })

  })

  describe("Date formatters", () => {

    it("should handle typical date formats", () => {
      const formatted = autoFormatter("%Y-%m-%d")(BASE_DATE)
      expect(formatted).to.equal("2018-03-21")

      const formatted2 = autoFormatter("%m/%d/%Y")(BASE_DATE)
      expect(formatted2).to.equal("03/21/2018")

      const formatted3 = autoFormatter("%c")(BASE_DATE)
      expect(formatted3).to.equal("3/21/2018, 12:00:00 AM")
    })

    it("should handle invalid date formats", () => {
      const formatted = autoFormatter("foo")(BASE_DATE)
      expect(formatted).to.equal("Wed Mar 21 2018 00:00:00 GMT-0400 (EDT)")
    })

  })

  describe("Value input", () => {

    it("should handle array input", () => {
      const formatted = autoFormatter(".2s")([1234.567, 89])
      expect(formatted).to.equal("1.2k - 89")

      const formatted2 = autoFormatter("%Y")([BASE_DATE])
      expect(formatted2).to.equal("2018")
    })

    it("should pass through string input", () => {
      const formatted = autoFormatter(".2s")("foo")
      expect(formatted).to.equal("foo")
    })

    it("should convert unsupported value types to string", () => {
      const formatted = autoFormatter(".2s")(undefined)
      expect(formatted).to.equal("undefined")

      const formatted2 = autoFormatter(".2s")({})
      expect(formatted2).to.equal("[object Object]")

      const formatted3 = autoFormatter(".2s")(null)
      expect(formatted3).to.equal("null")
    })

  })

  describe("Format by key", () => {

    const formats = [
      {key: "foo", format: ".2s"},
      {key: "bar", format: ".2f"}
    ]

    it("should pick the format by key", () => {
      const formatted = autoFormatter(formats)(BASE_NUMBER, "foo")
      expect(formatted).to.equal("12k")

      const formatted2 = autoFormatter(formats)(BASE_NUMBER, "bar")
      expect(formatted2).to.equal("12345.68")
    })

    it("should return null if no match", () => {
      const formatted2 = autoFormatter(formats)(BASE_NUMBER, "baz")
      expect(formatted2).to.be.null
    })

  })

})
