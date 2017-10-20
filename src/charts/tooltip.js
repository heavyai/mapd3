import * as d3 from "./helpers/d3-service"

import {keys} from "./helpers/constants"
import {cloneData, override} from "./helpers/common"

export default function Tooltip (_container) {

  let config = {
    margin: {
      top: 2,
      right: 2,
      bottom: 2,
      left: 2
    },
    width: 250,
    height: 45,

    valueFormat: ".2f",

    tooltipMaxTopicLength: 170,
    tooltipBorderRadius: 3,

    // Animations
    mouseChaseDuration: 30,
    tooltipEase: d3.easeQuadInOut,

    titleHeight: 32,
    elementHeight: 24,
    padding: 8,
    dotRadius: 4,

    tooltipHeight: 48,
    tooltipWidth: 160,

    dateFormat: "%b %d, %Y",
    seriesOrder: [],

    // from chart
    keyType: "time"
  }

  let scales = {
    colorScale: null
  }

  const cache = {
    container: _container,
    svg: null,
    chartWidth: null,
    chartHeight: null,
    tooltipDivider: null,
    tooltipBody: null,
    tooltipTitle: null,
    tooltipBackground: null
  }

  // function init () {
    // if (!isStatic) {
    //   cache.chart.on("mouseOver.tooltip", show)
    //     .on("mouseMove.tooltip", update)
    //     .on("mouseOut.tooltip", hide)
    // }

  //   render()
  // }
  // init()

  function buildSVG () {

    if (!cache.svg) {
      cache.svg = cache.container.append("g")
          .classed("tooltip-group", true)
          .attr("pointer-events", "none")

      cache.tooltipBackground = cache.svg.append("rect")
          .classed("tooltip-text-container", true)

      cache.tooltipTitle = cache.svg.append("text")
          .classed("tooltip-title", true)
          .attr("dominant-baseline", "hanging")

      cache.tooltipDivider = cache.svg.append("line")
          .classed("tooltip-divider", true)

      cache.tooltipBody = cache.svg.append("g")
          .classed("tooltip-body", true)

      setSize("auto", "auto")
    }

    cache.chartWidth = config.width - config.margin.left - config.margin.right
    cache.chartHeight = config.height - config.margin.top - config.margin.bottom

    cache.tooltipBackground.attr("rx", config.tooltipBorderRadius)
        .attr("ry", config.tooltipBorderRadius)

    cache.tooltipTitle.attr("dy", config.padding)
        .attr("dx", config.padding)
  }

  function calculateTooltipPosition (_mouseX) {
    const tooltipX = _mouseX
    let offset = 0
    const tooltipY = config.margin.top

    if (_mouseX > (cache.chartWidth / 2)) {
      offset = -config.tooltipWidth
    }

    return [tooltipX + offset, tooltipY]
  }

  function setPosition (_xPosition) {
    const [tooltipX, tooltipY] = calculateTooltipPosition(_xPosition)

    cache.svg.transition()
      .duration(config.mouseChaseDuration)
      .ease(config.tooltipEase)
      .attr("transform", `translate(${tooltipX}, ${tooltipY})`)

    return this
  }

  function setSize (_width, _height) {
    let height = _height
    if (_height === "auto") {
      height = cache.tooltipBody.node().getBoundingClientRect().height + config.titleHeight + config.padding
    }
    let width = _width
    if (_width === "auto") {
      width = cache.tooltipBody.node().getBoundingClientRect().width + config.padding * 2
    }

    cache.tooltipBackground.attr("width", width)
      .attr("height", height)

    cache.tooltipDivider.attr("x2", width)
      .attr("y1", config.titleHeight)
      .attr("y2", config.titleHeight)

    return this
  }

  function setSeriesContent (_series) {
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

    const values = _series.map(getValueText)
    const tooltipRight = cache.tooltipBody.selectAll(".tooltip-right-text")
        .data(values)
    tooltipRight.enter().append("text")
      .classed("tooltip-right-text", true)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "hanging")
      .attr("dy", config.padding)
      .attr("dx", -config.padding)
      .merge(tooltipRight)
      .attr("x", config.tooltipWidth)
      .attr("y", (d, i) => i * config.elementHeight + config.titleHeight)
      .text((d) => d)
    tooltipRight.exit().remove()

    const tooltipCircles = cache.tooltipBody.selectAll(".tooltip-circle")
        .data(_series)
    tooltipCircles.enter().append("circle")
      .classed("tooltip-circle", true)
      .merge(tooltipCircles)
      .attr("cx", config.padding + config.dotRadius)
      .attr("cy", (d, i) => i * config.elementHeight + config.titleHeight + config.elementHeight / 2)
      .attr("r", config.dotRadius)
      .style("fill", (d) => scales.colorScale(d[keys.ID]))
    tooltipCircles.exit().remove()
  }

  function setTitle (_title) {
    let title = _title
    if (config.keyType === "time") {
      title = d3.timeFormat(config.dateFormat)(_title)
    }

    cache.tooltipTitle.text(title)

    return this
  }

  function getValueText (_data) {
    const value = _data[keys.VALUE]
    if (value) {
      const formatter = d3.format(config.valueFormat)
      return formatter(_data[keys.VALUE])
    } else {
      return null
    }
  }

  function setContent (_series) {
    let series = _series

    if (config.seriesOrder.length) {
      series = sortByTopicsOrder(_series)
    } else if (_series.length && _series[0][keys.LABEL]) {
      series = sortByAlpha(_series)
    }

    setSeriesContent(series)

    return this
  }

  function sortByTopicsOrder (_series, _order = seriesOrder) {
    return _order.map((orderName) => _series.filter(({name}) => name === orderName)[0])
  }

  function sortByAlpha (_series) {
    const series = cloneData(_series)
    return series.sort((a, b) => a[keys.LABEL].localeCompare(b[keys.LABEL], "en", {numeric: false}))
  }

  function hide () {
    if (!cache.svg) { return null }
    cache.svg.style("display", "none")

    return this
  }

  function show () {
    if (!cache.svg) { return null }
    cache.svg.style("display", "block")

    return this
  }

  function drawTooltip (_dataPoint, _xPosition) {
    buildSVG()
    setTitle(_dataPoint[keys.DATA])
    setContent(_dataPoint[keys.SERIES])
    setSize(config.tooltipWidth, "auto")
    setPosition(_xPosition)

    return this
  }

  function bindEvents (_dispatcher) {
    _dispatcher.on("mouseOverPanel.tooltip", show)
      .on("mouseMovePanel.tooltip", drawTooltip)
      .on("mouseOutPanel.tooltip", hide)
  }

  function setConfig (_config) {
    config = override(config, _config)
    return this
  }

  function setScales (_scales) {
    scales = override(scales, _scales)
    return this
  }

  return {
    bindEvents,
    setPosition,
    setSize,
    setContent,
    setTitle,
    hide,
    show,
    drawTooltip,
    setConfig,
    setScales
  }
}
