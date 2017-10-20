import * as d3 from "./helpers/d3-service"

import {override} from "./helpers/common"

export default function BrushRangeEditor (_container) {

  let config = {
    margin: {
      top: 60,
      right: 30,
      bottom: 40,
      left: 70
    },
    width: 800,
    height: 500
  }

  const cache = {
    container: _container,
    root: null,
    inputGroup: null,
    inputMax: null,
    inputMin: null,
    chartWidth: null,
    chartHeight: null
  }

  // events
  const dispatcher = d3.dispatch("rangeChanged")

  function buildSVG () {
    cache.chartWidth = config.width - config.margin.left - config.margin.right
    cache.chartHeight = config.height - config.margin.top - config.margin.bottom

    if (!cache.root) {
      cache.root = cache.container
          .append("div")
          .attr("class", "brush-range-input-group")
          .style("position", "absolute")
          .style("top", 0)

      const INPUT_HEIGHT = 16
      const INPUT_WIDTH = 74
      const SEPARATOR_WIDTH = 8

      cache.inputMin = cache.root.append("input")
        .attr("class", "brush-range-input min")
        .style("position", "absolute")
        .on("change", function change () {
          dispatcher.call("rangeChanged", this, {value: this.value, type: "min"})
        })
        .style("width", `${INPUT_WIDTH}px`)
        .style("height", `${INPUT_HEIGHT}px`)
        .style("left", `${config.margin.left + cache.chartWidth - INPUT_WIDTH * 2 - SEPARATOR_WIDTH}px`)

      cache.root.append("div")
        .attr("class", "separator")
        .style("position", "absolute")
        .style("width", `${SEPARATOR_WIDTH}px`)
        .style("height", `${INPUT_HEIGHT}px`)
        .style("left", `${config.margin.left + cache.chartWidth - INPUT_WIDTH - SEPARATOR_WIDTH + 2}px`)
        .text("-")

      cache.inputMax = cache.root.append("input")
        .attr("class", "brush-range-input max")
        .style("position", "absolute")
        .on("change", function change () {
          dispatcher.call("rangeChanged", this, {value: this.value, type: "max"})
        })
        .style("width", `${INPUT_WIDTH}px`)
        .style("height", `${INPUT_HEIGHT}px`)
        .style("left", `${config.margin.left + cache.chartWidth - INPUT_WIDTH}px`)
    }
  }

  function drawRangeEditor () {
    buildSVG()
    return this
  }

  function on (...args) {
    dispatcher.on(...args)
    return this
  }

  function setConfig (_config) {
    config = override(config, _config)
    return this
  }

  function setRangeMin (_range) {
    cache.inputMin.property("value", _range)
    return this
  }

  function setRangeMax (_range) {
    cache.inputMax.property("value", _range)
    return this
  }

  return {
    on,
    setConfig,
    drawRangeEditor,
    setRangeMin,
    setRangeMax
  }
}
