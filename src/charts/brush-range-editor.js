import * as d3 from "./helpers/d3-service"

import {override, stringToType, getSizes} from "./helpers/common"
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
    keyType: "time",
    dateFormat: "%b %d, %Y",
    numberFormat: ".2f",
    brushRangeIsEnabled: true,
    brushRangeMin: null,
    brushRangeMax: null
  }

  const cache = {
    container: _container,
    root: null,
    inputMin: null,
    inputMax: null,
    chartWidth: null,
    chartHeight: null
  }

  let scales = {
    xScale: null
  }

  // events
  const dispatcher = d3.dispatch("rangeChange")

  function buildSVG () {
    if (!cache.root) {
      cache.root = cache.container
          .append("div")
          .attr("class", "brush-range-input-group")
          .style("top", 0)
          .style("padding-top", "12px")

      cache.inputMax = cache.root.append("div")
        .attr("class", "brush-range-input max")
        .attr("contentEditable", true)
        .on("blur", function change () {
          const domain = scales.xScale.domain()
          cache.rangeMax = stringToType(cache.inputMax.text(), config.keyType)
          dispatcher.call("rangeChange", this, {extent: [domain[0], cache.rangeMax]})
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
          const domain = scales.xScale.domain()
          const rangeMin = stringToType(cache.inputMin.text(), config.keyType)
          dispatcher.call("rangeChange", this, {extent: [rangeMin, domain[1]]})
        })
        .call(blurOnEnter)
        .style("float", "right")
    }

    const {chartWidth, chartHeight} = getSizes(config, cache)
    cache.chartWidth = chartWidth
    cache.chartHeight = chartHeight

    const domain = scales.xScale.domain()
    let rangeMin = config.brushRangeMin === null ? domain[0] : config.brushRangeMin
    let rangeMax = config.brushRangeMax === null ? domain[1] : config.brushRangeMax
    if (config.keyType === "time") {
      const format = d3.utcFormat(config.dateFormat)
      rangeMin = format(new Date(rangeMin))
      rangeMax = format(new Date(rangeMax))
    } else {
      const format = d3.format(config.numberFormat)
      rangeMin = format(rangeMin)
      rangeMax = format(rangeMax)
    }

    cache.inputMin.text(rangeMin)
    cache.inputMax.text(rangeMax)
  }

  function on (...args) {
    dispatcher.on(...args)
    return this
  }

  function setConfig (_config) {
    config = override(config, _config)
    return this
  }

  function setScales (_scales) {
    scales = override(scales, _scales)
    return this
  }

  function render () {
    if (config.brushRangeIsEnabled) {
      buildSVG()
    } else {
      destroy()
    }
    return this
  }

  function destroy () {
    if (cache.root) {
      cache.root.remove()
      cache.root = null
    }
    return this
  }

  return {
    on,
    setConfig,
    render,
    setScales
  }
}
