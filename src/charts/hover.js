import {dispatch} from "d3-dispatch"

import {keys} from "./helpers/constants"

export default function Hover (_chart) {

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
    xScale: null,
    yScale: null,
    yScale2: null,
    colorScale: null
  }

  let chartCache = {
    xScale: null,
    yScale: null,
    yScale2: null,
    colorScale: null,
    dataBySeries: null,
    svg: null
  }

  // events
  const dispatcher = dispatch("hover")

  function init () {
    cache.chart.on("mouseOver.hover", show)
      .on("mouseMove.hover", update)
      .on("mouseOut.hover", hide)

    render()
    hide()
  }
  init()

  function render () {
    buildSVG()
    buildScales()
    drawVerticalMarker()
  }

  function buildSVG () {
    chartCache = cache.chart.getCache()
    setConfig(cache.chart.getConfig())

    cache.chartWidth = config.width - config.margin.left - config.margin.right
    cache.chartHeight = config.height - config.margin.top - config.margin.bottom

    if (!cache.svg) {
      cache.svg = chartCache.svg.append("g")
          .classed("hover-group", true)
    }

    cache.svg.attr("transform", `translate(${config.margin.left}, ${config.margin.top})`)
  }

  function buildScales () {
    cache.xScale = chartCache.xScale
    cache.yScale = chartCache.yScale
    cache.yScale2 = chartCache.yScale2
    cache.colorScale = chartCache.colorScale
  }

  function update (_dataPoint, _dataPointXPosition) {
    if (_dataPointXPosition) {
      moveVerticalMarker(_dataPointXPosition)
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
    cache.svg.style("display", "block")
  }

  function hide () {
    cache.svg.style("display", "none")
  }

  const getColor = (d) => cache.colorScale(d[keys.ID])

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
      // .attr("cy", (d) => cache.yScale2(d[keys.VALUE]))
      .attr("cy", (d) => {
        if (d[keys.GROUP] === chartCache.groupKeys[0]) {
          return cache.yScale(d[keys.VALUE])
        } else {
          return cache.yScale2(d[keys.VALUE])
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

    const dotsStack = cache.stack([stackedDataPoint])
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
    cache.svg.attr("transform", `translate(${[_verticalMarkerXPosition + config.margin.left, config.margin.top]})`)
  }

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

  function destroy () {
    cache.svg.remove()
  }

  return {
    highlightDataPoints,
    highlightStackedDataPoints,
    drawVerticalMarker,
    moveVerticalMarker,
    getCache,
    on,
    setConfig,
    destroy
  }
}
