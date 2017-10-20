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
    chartHeight: null
  }

  let data = {
    dataBySeries: null
  }

  // events
  const dispatcher = d3.dispatch("brushStart", "brushMove", "brushEnd")

  function buildSVG () {
    cache.chartWidth = config.width - config.margin.left - config.margin.right
    cache.chartHeight = config.height - config.margin.top - config.margin.bottom

    if (!cache.svg) {
      cache.svg = cache.container.append("g")
          .classed("brush-group", true)
    }
  }

  function extractBrushDimension (_data) {
    const merged = d3.merge(_data.map((d) => d[keys.VALUES]))
    return sortData(merged, config.keyType)
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
  }

  function getDataExtent () {
    const selection = d3.event.selection
    const dataExtent = selection.map((d) => invertScale(scales.xScale, d, config.keyType))
    return dataExtent
  }

  function handleBrushStart () {
    dispatcher.call("brushStart", this, getDataExtent(), config)
  }

  function handleBrushMove () {
    dispatcher.call("brushMove", this, getDataExtent(), config)
  }

  function handleBrushEnd () {
    // Only transition after input, ignore empty selections.
    if (!d3.event.sourceEvent || !d3.event.selection) {
      return
    }

    const dataExtent = getDataExtent()

    d3.select(this)
      .transition()
      .call(d3.event.target.move, dataExtent.map(scales.xScale))

    dispatcher.call("brushEnd", this, dataExtent, config)
  }

  function drawBrush () {
    buildSVG()

    if (data.dataBySeries) {
      cache.data = extractBrushDimension(cloneData(data.dataBySeries))
      buildBrush()
    }

    return this
  }

  // function setBrushByPercentages (_a, _b) {
  //   const x0 = _a * cache.chartWidth
  //   const x1 = _b * cache.chartWidth

  //   brush.move(chartBrush, [x0, x1])
  // }

  // function setBrushByDates (_dateA, _dateB) {
  //   const x0 = cache.xScale(new Date(_dateA))
  //   const x1 = cache.xScale(new Date(_dateB))

  //   cache.brush.move(cache.chartBrush, [x0, x1])
  // }

  // function updateHandlers (_dateExtent) {
  //   if (_dateExtent === null) {
  //     cache.handle.attr("display", "none")
  //   } else {
  //     cache.handle
  //       .attr("display", null)
  //       .attr("transform", (d, i) => `translate(${_dateExtent[i]},${cache.chartHeight / 2})`)
  //   }
  // }

  // API

  /**
   * Gets or Sets the dateRange for the selected part of the brush
   * @param  {String[]} _x Desired dateRange for the graph
   * @return { dateRange | module} Current dateRange or Chart module to chain calls
   * @public
   */
  // function dateRange (_x) {
  //   if (!arguments.length) {
  //     return dateRange
  //   }
  //   dateRange = _x

  //   if (Array.isArray(dateRange)) {
  //     setBrushByDates(...dateRange)
  //   }

  //   return this
  // }

  function on (...args) {
    return dispatcher.on(...args)
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

  return {
    on,
    setConfig,
    setData,
    setScales,
    drawBrush
  }
}
