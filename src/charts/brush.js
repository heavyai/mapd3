import * as d3 from "./helpers/d3-service"
import {invertScale, override, extendIsValid} from "./helpers/common"

export default function Brush (_container) {

  let config = {
    margin: {
      top: 60,
      right: 30,
      bottom: 40,
      left: 70
    },
    width: 800,
    height: 500,
    keyType: null,
    brushRangeMin: null,
    brushRangeMax: null,
    brushIsEnabled: true,

    markPanelWidth: null,
    chartHeight: null
  }

  let scales = {
    xScale: null
  }

  const cache = {
    container: _container,
    dateRange: [null, null],
    brush: null,
    chartBrush: null,
    handle: null
  }

  let data = {
    dataBySeries: null
  }

  // events
  const dispatcher = d3.dispatch("brushStart", "brushMove", "brushEnd", "brushClear")

  function buildSVG () {
    if (!cache.root) {
      cache.root = cache.container.append("g")
        .classed("brush-group", true)

      cache.brush = d3.brushX()
        .on("start", handleBrushStart)
        .on("brush", handleBrushMove)
        .on("end", handleBrushEnd)
    }
  }

  function buildBrush () {
    cache.brush.extent([[0, 0], [config.markPanelWidth, config.chartHeight]])

    cache.chartBrush = cache.root.call(cache.brush)

    cache.chartBrush.selectAll(".brush-rect")
      .attr("height", config.chartHeight)

    setBrush()
  }

  function getDataExtentUnderBrush () {
    const selection = d3.event.selection
    if (selection) {
      return selection.map((d) => invertScale(scales.xScale, d, config.keyType))
    } else {
      return null
    }
  }

  function setBrush () {
    let extent = [config.brushRangeMin, config.brushRangeMax]
    if (extendIsValid(extent)) {
      if (config.keyType === "time") {
        extent = extent.map(d => new Date(d))
      }
      cache.root.call(cache.brush.move, extent.map((d) => scales.xScale(d)))
    } else {
      cache.root.call(cache.brush.move, null)
    }
    return this
  }

  function handleBrushStart () {
    if (!d3.event.sourceEvent ||
      (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush")) {
      return
    }
    dispatcher.call("brushStart", this, getDataExtentUnderBrush(), config)
  }

  function handleBrushMove () {
    if (!d3.event.sourceEvent ||
      (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush")) {
      return
    }
    dispatcher.call("brushMove", this, getDataExtentUnderBrush(), config)
  }

  function handleBrushEnd () {
    // Skip programatic setting
    if (!d3.event.sourceEvent ||
      (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush")) {
      return
    }

    // dispatch empty selection
    if (!d3.event.selection) {
      dispatcher.call("brushClear", this, config)
      return
    }

    dispatcher.call("brushEnd", this, getDataExtentUnderBrush(), config)
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

  function setData (_data) {
    data = Object.assign({}, data, _data)
    return this
  }

  function render () {
    if (!config.brushIsEnabled) {
      destroy()
    }

    if (config.brushIsEnabled) {
      buildSVG()
    }

    if (config.brushIsEnabled && data.dataBySeries) {
      buildBrush()
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
    setData,
    setScales,
    render,
    destroy
  }
}
