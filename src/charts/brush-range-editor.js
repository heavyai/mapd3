import * as d3 from "./helpers/d3-service"

import {override} from "./helpers/common"
import {blurOnEnter} from "./interactors"

export default function BrushRangeEditor (_container) {

  let config = {
    margin: {
      top: 60,
      right: 30,
      bottom: 40,
      left: 70
    },
    width: 800,
    height: 500,
    rangeFormat: "%b %d, %Y"
  }

  const cache = {
    container: _container,
    root: null,
    inputMin: null,
    inputMax: null,
    rangeMin: null,
    rangeMax: null,
    chartWidth: null,
    chartHeight: null,
    isEnabled: true
  }

  // events
  const dispatcher = d3.dispatch("rangeChange")

  function buildSVG () {
    cache.chartWidth = config.width - config.margin.left - config.margin.right
    cache.chartHeight = config.height - config.margin.top - config.margin.bottom

    if (!cache.root) {
      cache.root = cache.container
          .append("div")
          .attr("class", "brush-range-input-group")
          .style("top", 0)

      cache.inputMax = cache.root.append("div")
        .attr("class", "brush-range-input max")
        .attr("contentEditable", true)
        .on("blur", function change () {
          cache.rangeMax = cache.inputMax.text()
          dispatcher.call("rangeChange", this, {value: cache.rangeMax, type: "max"})
        })
        .call(blurOnEnter)
        .style("float", "right")

      cache.root.append("div")
        .attr("class", "separator")
        .text("-")
        .style("float", "right")

      cache.inputMin = cache.root.append("div")
        .attr("class", "brush-range-input min")
        .attr("contentEditable", true)
        .on("blur", function change () {
          cache.rangeMin = cache.inputMin.text()
          dispatcher.call("rangeChange", this, {value: cache.rangeMin, type: "min"})
        })
        .call(blurOnEnter)
        .style("float", "right")
    }

    const format = d3.utcFormat(config.rangeFormat)
    cache.inputMin.text(format(new Date(cache.rangeMin)) || "")
    cache.inputMax.text(format(new Date(cache.rangeMax)) || "")
  }

  function drawRangeEditor () {
    if (cache.isEnabled) {
      buildSVG()
    } else {
      destroy()
    }
    return this
  }

  function setRangeMin (_rangeMin) {
    cache.rangeMin = _rangeMin
    return this
  }

  function setVisibility (_shouldBeVisible) {
    cache.isEnabled = _shouldBeVisible
    drawRangeEditor()
    return this
  }

  function setRangeMax (_rangeMax) {
    cache.rangeMax = _rangeMax
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

  function destroy () {
    if (cache.root) {
      cache.root.remove()
    }
  }

  return {
    on,
    setConfig,
    drawRangeEditor,
    setRangeMin,
    setRangeMax,
    setVisibility
  }
}
