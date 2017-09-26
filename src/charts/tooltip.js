import {easeQuadInOut} from "d3-ease"
import {format} from "d3-format"
import {timeFormat} from "d3-time-format"

import {keys} from "./helpers/constants"
import {cloneData} from "./helpers/common"

export default function module (_chart) {

  let config = {
    margin: {
      top: 2,
      right: 2,
      bottom: 2,
      left: 2
    },
    width: 250,
    height: 45,

    valueFormat: ".2s",

    tooltipMaxTopicLength: 170,
    tooltipBorderRadius: 3,

    // Animations
    mouseChaseDuration: 30,
    ease: easeQuadInOut,

    titleHeight: 32,
    elementHeight: 24,
    padding: 8,
    dotRadius: 4,

    dateFormat: "%x",
    seriesOrder: [],

    // from chart
    keyType: "time"
  }

  const cache = {
    chart: _chart,
    svg: null,
    chartWidth: null,
    chartHeight: null,
    tooltipDivider: null,
    tooltipBody: null,
    tooltipTitle: null,
    tooltipHeight: 48,
    tooltipWidth: 150,
    tooltipBackground: null
  }

  let chartCache = null

  function init () {
    cache.chart.on("mouseOver.tooltip", show)
      .on("mouseMove.tooltip", update)
      .on("mouseOut.tooltip", hide)

    render()
  }
  init()

  function render () {
    buildSVG()

    return this
  }

  function buildSVG () {
    chartCache = cache.chart.getCache()
    setConfig(cache.chart.getConfig())

    if (!cache.svg) {
      cache.svg = chartCache.svg.append("g")
          .classed("mapd3 mapd3-tooltip", true)

      cache.tooltipBackground = cache.svg.append("rect")
          .classed("tooltip-text-container", true)

      cache.tooltipTitle = cache.svg.append("text")
          .classed("tooltip-title", true)
          .attr("dominant-baseline", "hanging")

      cache.tooltipDivider = cache.svg.append("line")
          .classed("tooltip-divider", true)

      cache.tooltipBody = cache.svg.append("g")
          .classed("tooltip-body", true)
    }

    cache.chartWidth = config.width - config.margin.left - config.margin.right
    cache.chartHeight = config.height - config.margin.top - config.margin.bottom

    cache.svg.attr("width", config.width)
      .attr("height", config.height)

    cache.tooltipBackground.attr("width", cache.tooltipWidth)
        .attr("height", cache.tooltipHeight)
        .attr("rx", config.tooltipBorderRadius)
        .attr("ry", config.tooltipBorderRadius)

    cache.tooltipTitle.attr("dy", config.padding)
        .attr("dx", config.padding)

    cache.tooltipDivider.attr("x2", cache.tooltipWidth)
        .attr("y1", config.titleHeight)
        .attr("y2", config.titleHeight)

    hide()
  }

  function updateSeriesContent (_series) {
    const tooltipLeft = cache.tooltipBody.selectAll(".tooltip-left-text")
        .data(_series)
    tooltipLeft.enter().append("text")
      .classed("tooltip-left-text", true)
      .attr("dominant-baseline", "hanging")
      .attr("dy", config.padding)
      .attr("dx", config.padding * 2 + config.dotRadius)
      .merge(tooltipLeft)
      .attr("y", (d, i) => i * config.elementHeight + config.titleHeight)
      .text((d) => d[keys.LABEL])
    tooltipLeft.exit().remove()

    const tooltipRight = cache.tooltipBody.selectAll(".tooltip-right-text")
        .data(_series)
    tooltipRight.enter().append("text")
      .classed("tooltip-right-text", true)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "hanging")
      .attr("dy", config.padding)
      .attr("dx", -config.padding)
      .merge(tooltipRight)
      .attr("x", cache.tooltipWidth)
      .attr("y", (d, i) => i * config.elementHeight + config.titleHeight)
      .text(getValueText)
    tooltipRight.exit().remove()

    const tooltipCircles = cache.tooltipBody.selectAll(".tooltip-circle")
        .data(_series)
    tooltipCircles.enter().append("circle")
      .classed("tooltip-circle", true)
      .merge(tooltipCircles)
      .attr("cx", config.padding + config.dotRadius)
      .attr("cy", (d, i) => i * config.elementHeight + config.titleHeight + config.elementHeight / 2)
      .attr("r", config.dotRadius)
      .style("fill", (d) => chartCache.seriesColorScale[d[keys.ID]])
    tooltipCircles.exit().remove()

    cache.tooltipHeight = cache.tooltipBody.node().getBBox().height
    cache.tooltipBackground.attr("width", cache.tooltipWidth)
      .attr("height", cache.tooltipHeight + config.titleHeight + config.padding)
  }

  function getTooltipPosition (_mouseX) {
    const tooltipX = _mouseX + config.margin.left
    let offset = 0
    const tooltipY = config.margin.top

    if (_mouseX > (cache.chartWidth / 2)) {
      offset = -cache.tooltipWidth
    }

    return [tooltipX + offset, tooltipY]
  }

  function getValueText (_data) {
    const formatter = format(config.valueFormat)

    return formatter(_data[keys.VALUE])
  }

  function updatePositionAndSize (_xPosition) {
    const [tooltipX, tooltipY] = getTooltipPosition(_xPosition)

    cache.svg.attr("width", cache.tooltipWidth)
      .attr("height", cache.tooltipHeight)
      .transition()
      .duration(config.mouseChaseDuration)
      .ease(config.ease)
      .attr("transform", `translate(${tooltipX}, ${tooltipY})`)
  }

  function updateTitle (_dataPoint) {
    const key = _dataPoint[keys.DATA]
    let title = key
    if (config.keyType === "time") {
      title = timeFormat(config.dateFormat)(key)
    }

    cache.tooltipTitle.text(title)
  }

  function sortByTopicsOrder (_series, _order = seriesOrder) {
    return _order.map((orderName) => _series.filter(({name}) => name === orderName)[0])
  }

  function sortByAlpha (_series) {
    const series = cloneData(_series)
    return series.sort((a, b) => a[keys.LABEL].localeCompare(b[keys.LABEL], "en", {numeric: false}))
  }

  function updateContent (dataPoint) {
    let series = dataPoint[keys.SERIES]

    if (config.seriesOrder.length) {
      series = sortByTopicsOrder(series)
    } else if (series.length && series[0][keys.LABEL]) {
      series = sortByAlpha(series)
    }

    updateTitle(dataPoint)
    updateSeriesContent(series)
  }

  function updateTooltip (dataPoint, xPosition) {
    updateContent(dataPoint)
    updatePositionAndSize(xPosition)
  }

  // API

  function hide () {
    cache.svg.style("display", "none")

    return this
  }

  function show () {
    cache.svg.style("display", "block")

    return this
  }

  function update (_dataPoint, _colorMapping, _xPosition, _yPosition = null) {
    updateTooltip(_dataPoint, _xPosition, _yPosition)

    return this
  }

  function setConfig (_config) {
    config = Object.assign({}, config, _config)
    return this
  }

  function getCache () {
    return cache
  }

  return {
    hide,
    show,
    update,
    setConfig,
    getCache,
    render
  }
}
