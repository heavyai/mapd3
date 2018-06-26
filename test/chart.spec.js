import {expect} from "chai"
import Chart from "../src/charts/chart"
import {baseConfig} from "./test-utils"
import * as d3 from "d3"

const jsdom = require("jsdom")
const fs = require("fs")
const path = require("path")

describe("Chart", () => {
  let domActual = null
  let domExpected = null
  let chart = null

  before(() => {
    domActual = (new jsdom.JSDOM("<!doctype html><div></div>")).window.document.body
    domExpected = (new jsdom.JSDOM(file("test/template.html"))).window.document.body
    const node = d3.select(domActual).select("div").node()
    chart = Chart(node).setConfig(baseConfig).render()
  })

  after(() => {
    chart = null
  })

  describe("General functionalities", () => {
    it("instantiates and exposes API get/setters", () => {
      expect(chart).to.include.all.keys(
        "setConfig",
        "setData",
        "render",
        "on",
        "destroy",
        "getEvents"
      )
    })
  })

  describe("Chart template", () => {
    it("renders the template markup for the chart", () => {
      expect(domActual.outerHTML.replace(/\n\s*/mg, "")).to.equal(domExpected.outerHTML.replace(/\n\s*/mg, ""))
    })
  })

})

function file(filePath) {
  // eslint-disable-next-line no-sync
  return fs.readFileSync(path.join(process.cwd(), filePath), "utf8").replace(/\n\s*/mg, "")
}
