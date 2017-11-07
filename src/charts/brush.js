import * as d3 from "./helpers/d3-service"

import {keys} from "./helpers/constants"
import {cloneData, invertScale, sortData, override} from "./helpers/common"

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
    keyType: null
  }

  let scales = {
    xScale: null
  }

  const cache = {
    container: _container,
    dateRange: [null, null],
    brush: null,
    chartBrush: null,
    handle: null,
    chartWidth: null,
    chartHeight: null,
    isEnabled: true
  }

  let data = {
    dataBySeries: null
  }

  let brushExtent = null

  // events
  const dispatcher = d3.dispatch("brushStart", "brushMove", "brushEnd")

  function buildSVG () {
    cache.chartWidth = Math.max(config.width - config.margin.left - config.margin.right, 0)
    cache.chartHeight = Math.max(config.height - config.margin.top - config.margin.bottom, 0)

    if (!cache.svg) {
      cache.svg = cache.container.append("g")
          .classed("brush-group", true)
    }
  }

  function buildBrush () {
    cache.brush = cache.brush || d3.brushX()
        .on("start", handleBrushStart)
        .on("brush", handleBrushMove)
        .on("end", handleBrushEnd)

    cache.brush.extent([[0, 0], [cache.chartWidth, cache.chartHeight]])

    cache.chartBrush = cache.svg.call(cache.brush)

    cache.chartBrush.selectAll(".brush-rect")
      .attr("height", cache.chartHeight)

    moveBrush()
  }

  function getDataExtent () {
    const selection = d3.event.selection
    const dataExtent = selection.map((d) => invertScale(scales.xScale, d, config.keyType))
    return dataExtent
  }

  function validateExtent (_brushExtent) {
    return (Array.isArray(_brushExtent)
      && _brushExtent[0] !== null
      && typeof _brushExtent[0] !== "undefined"
      && _brushExtent[1] !== null
      && typeof _brushExtent[1] !== "undefined")
  }

  function clampBrush (_dataExtent, _brushExtent) {
    return [Math.max(_dataExtent[0], _brushExtent[0]), Math.min(_dataExtent[1], _brushExtent[1])]
  }

  function moveBrush () {
    if (brushExtent === null) {
      return this
    }
    const dataExtent = scales.xScale.domain()
    const extent = clampBrush(dataExtent, brushExtent)
    if (extent) {
      cache.svg.call(cache.brush.move, extent.map((d) => scales.xScale(d)))
    }
    return this
  }

  function handleBrushStart () {
    if (!d3.event.sourceEvent || !d3.event.selection) {
      return
    }
    dispatcher.call("brushStart", this, getDataExtent(), config)
  }

  function handleBrushMove () {
    if (!d3.event.sourceEvent || !d3.event.selection) {
      return
    }
    dispatcher.call("brushMove", this, getDataExtent(), config)
  }

  function handleBrushEnd () {
    // Skip programatic setting and empty selection
    if (!d3.event.sourceEvent || !d3.event.selection) {
      return
    }

    const dataExtent = getDataExtent()
    dispatcher.call("brushEnd", this, dataExtent, config)
  }

  function drawBrush () {
    if (!cache.isEnabled) {
      destroy()
    }

    buildSVG()

    if (data.dataBySeries) {
      buildBrush()
    }
    return this
  }

  function on (...args) {
    dispatcher.on(...args)
    return this
  }

  function setVisibility (_isEnabled) {
    cache.isEnabled = _isEnabled
    return this
  }

  function setConfig (_config) {
    config = override(config, _config)
    return this
  }

  function setBrushExtent (_brushExtent) {
    if (validateExtent(_brushExtent)) {
      brushExtent = _brushExtent
    } else {
      brushExtent = null
    }
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

  function destroy () {
    cache.svg.remove()
    return this
  }

  return {
    on,
    setConfig,
    setData,
    setScales,
    setBrushExtent,
    drawBrush,
    setVisibility,
    destroy
  }
}
