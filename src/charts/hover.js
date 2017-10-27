import * as d3 from "./helpers/d3-service"

import {keys} from "./helpers/constants"
import {override} from "./helpers/common"

export default function Hover (_container) {

  let config = {
    margin: {
      top: 60,
      right: 30,
      bottom: 40,
      left: 70
    },
    width: 800,
    height: 500,
    dotRadius: null,
    chartType: null
  }

  let scales = {
    yScale: null,
    yScale2: null,
    hasSecondAxis: null,
    colorScale: null
  }

  const cache = {
    container: _container,
    svg: null,
    chartWidth: null,
    chartHeight: null,
    dateRange: [null, null],
    brush: null,
    chartBrush: null,
    handle: null,
    data: null,
    isEnabled: true
  }

  let data = {
    stack: null,
    groupKeys: null
  }

  // events
  const dispatcher = d3.dispatch("hover")

  const getColor = (d) => scales.colorScale(d[keys.ID])

  function buildSVG () {
    cache.chartWidth = config.width - config.margin.left - config.margin.right
    cache.chartHeight = config.height - config.margin.top - config.margin.bottom

    if (!cache.svg) {
      cache.svg = cache.container.append("g")
          .classed("hover-group", true)
          .style("pointer-events", "none")
    }
  }

  function drawHover (_dataPoint, _dataPointXPosition) {
    buildSVG()

    if (!isNaN(_dataPointXPosition)) {
      moveVerticalMarker(_dataPointXPosition)
      drawVerticalMarker()
      if (config.chartType === "stackedLine"
        || config.chartType === "stackedArea"
        || config.chartType === "stackedBar") {
        highlightStackedDataPoints(_dataPoint)
      } else {
        highlightDataPoints(_dataPoint)
      }
      dispatcher.call("hover", this, _dataPoint)
    }
  }

  function show () {
    if (!cache.svg) { return null }
    cache.svg.style("display", "block")
    return this
  }

  function hide () {
    if (!cache.svg) { return null }
    cache.svg.style("display", "none")
    return this
  }

  function highlightDataPoints (_dataPoint) {
    const dotsData = _dataPoint[keys.SERIES]

    drawHighlightDataPoints(dotsData)
  }

  function drawHighlightDataPoints (_dotsData) {
    const dots = cache.svg.selectAll(".dot")
        .data(_dotsData)

    dots.enter()
      .append("circle")
      .attr("class", "dot")
      .merge(dots)
      .attr("cy", (d) => {
        if (config.chartType === "stackedArea" || data.groupKeys[0].indexOf(d[keys.ID]) > -1) {
          return scales.yScale(d[keys.VALUE])
        } else {
          return scales.yScale2(d[keys.VALUE])
        }
      })
      .attr("r", config.dotRadius)
      .style("stroke", "none")
      .style("fill", getColor)

    dots.exit().remove()
  }

  function highlightStackedDataPoints (_dataPoint) {
    const stackedDataPoint = {key: _dataPoint[keys.DATA]}
    _dataPoint.series.forEach((d) => {
      const id = d[keys.ID]
      stackedDataPoint[id] = d[keys.VALUE]
    })

    const dotsStack = data.stack([stackedDataPoint])
    const dotsData = dotsStack.map((d) => {
      const dot = {value: d[0][1]}
      dot[keys.ID] = d.key
      return dot
    })

    drawHighlightDataPoints(dotsData)
  }

  function drawVerticalMarker () {
    const verticalMarkerLine = cache.svg.selectAll("line")
        .data([0])

    verticalMarkerLine.enter()
      .append("line")
      .classed("vertical-marker", true)
      .merge(verticalMarkerLine)
      .attr("y1", 0)
      .attr("y2", cache.chartHeight)

    verticalMarkerLine.exit().remove()
  }

  function moveVerticalMarker (_verticalMarkerXPosition) {
    cache.svg.attr("transform", `translate(${[_verticalMarkerXPosition, 0]})`)
  }

  function bindEvents (_dispatcher) {
    _dispatcher.on("mouseOverPanel.hover", show)
      .on("mouseMovePanel.hover", drawHover)
      .on("mouseOutPanel.hover", hide)
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

  function setScales (_scales) {
    scales = override(scales, _scales)
    return this
  }

  function setData (_data) {
    data = Object.assign({}, data, _data)
    return this
  }

  return {
    setConfig,
    setScales,
    setData,
    bindEvents,
    highlightDataPoints,
    highlightStackedDataPoints,
    drawVerticalMarker,
    moveVerticalMarker,
    on
  }
}
