import {merge} from "d3-array"
import {brushX} from "d3-brush"
import {dispatch} from "d3-dispatch"
import {event, select} from "d3-selection"

import {keys} from "./helpers/constants"
import {cloneData, invertScale, sortData} from "./helpers/common"

export default function module (_chart) {

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
    chart: _chart,
    svg: null,
    chartWidth: null,
    chartHeight: null,
    dateRange: [null, null],
    brush: null,
    chartBrush: null,
    handle: null,
    data: null,
    xScale: null
  }

  let chartCache = {
    xScale: null,
    dataBySeries: null,
    svg: null
  }

  // events
  const dispatcher = dispatch("brushStart", "brushMove", "brushEnd")

  function init () {
    buildSVG()

    cache.data = extractBrushDimension(cloneData(chartCache.dataBySeries))
    buildScales()
    buildBrush()
    drawBrush()
  }
  init()

  function buildSVG () {
    chartCache = cache.chart.getCache()
    setConfig(cache.chart.getConfig())

    cache.chartWidth = config.width - config.margin.left - config.margin.right
    cache.chartHeight = config.height - config.margin.top - config.margin.bottom

    if (!cache.svg) {
      cache.svg = chartCache.svg.append("g")
          .classed("brush-group", true)
    }

    cache.svg.attr("transform", `translate(${config.margin.left}, ${config.margin.top})`)
  }

  function buildBrush () {
    cache.brush = brushX()
        .extent([[0, 0], [cache.chartWidth, cache.chartHeight]])
        .on("start", handleBrushStart)
        .on("brush", handleBrushMove)
        .on("end", handleBrushEnd)
  }

  function buildScales () {
    cache.xScale = chartCache.xScale
  }

  function extractBrushDimension (_data) {
    const merged = merge(_data.map((d) => d[keys.VALUES_KEY]))
    return sortData(merged, config.keyType)
  }

  function drawBrush () {
    cache.chartBrush = cache.svg.call(cache.brush)

    cache.chartBrush.selectAll(".brush-rect")
      .attr("height", cache.chartHeight)
  }

  function getDataExtent () {
    const selection = event.selection
    const dataExtent = selection.map((d) => invertScale(chartCache.xScale, d, config.keyType))
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
    if (!event.sourceEvent || !event.selection) {
      return
    }

    const dataExtent = getDataExtent()

    select(this)
      .transition()
      .call(event.target.move, dataExtent.map(cache.xScale))

    dispatcher.call("brushEnd", this, dataExtent, config)
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
    config = Object.assign({}, config, _config)
    return this
  }

  function getCache () {
    return cache
  }

  return {
    getCache,
    on,
    setConfig
  }
}
