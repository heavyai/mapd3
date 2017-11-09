import * as d3 from "./helpers/d3-service"

import {keys} from "./helpers/constants"
import {cloneData, override} from "./helpers/common"

export default function Tooltip (_container, isLegend = false) {

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

    // Animations
    mouseChaseDuration: 0,
    tooltipEase: d3.easeQuadInOut,

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
    root: null,
    chartWidth: null,
    chartHeight: null,
    tooltipDivider: null,
    tooltipBody: null,
    tooltipTitle: null,
    tooltipBackground: null,
    xPosition: null,
    yPosition: null,
    content: null,
    title: null,
    isEnabled: true
  }

  function buildSVG () {
    cache.chartWidth = config.width - config.margin.left - config.margin.right
    cache.chartHeight = config.height - config.margin.top - config.margin.bottom

    if (!cache.root) {
      cache.root = cache.container.append("div")
          .attr("class", isLegend ? "legend-group" : "tooltip-group")
          .style("position", "absolute")
          .style("pointer-events", "none")

      cache.tooltipTitle = cache.root.append("div")
          .attr("class", "tooltip-title")

      cache.tooltipBody = cache.root.append("div")
          .attr("class", "tooltip-body")
    }
  }

  function calculateTooltipPosition (_mouseX, _mouseY) {
    const OFFSET = 4
    const tooltipSize = cache.root.node().getBoundingClientRect()
    const tooltipX = _mouseX
    let avoidanceOffset = OFFSET
    const tooltipY = _mouseY + config.margin.top - tooltipSize.height / 2

    if (_mouseX > (cache.chartWidth / 2)) {
      avoidanceOffset = -tooltipSize.width - OFFSET
    }
    return [tooltipX + avoidanceOffset, tooltipY]
  }

  function move () {
    const xPosition = cache.xPosition === "auto"
        ? cache.chartWidth
        : cache.xPosition

    const yPosition = cache.yPosition === "auto"
        ? config.margin.top
        : cache.yPosition

    cache.root.transition()
      .duration(config.mouseChaseDuration)
      .ease(config.tooltipEase)
      .style("top", `${yPosition}px`)
      .style("left", function left () {
        const width = cache.yPosition === "auto" ? this.getBoundingClientRect().width : 0
        return `${xPosition + config.margin.left - width}px`
      })
    return this
  }

  function drawContent () {
    const content = cache.content
    const formatter = d3.format(config.valueFormat)

    const tooltipItems = cache.tooltipBody.selectAll(".tooltip-item")
        .data(content)
    const tooltipItemsUpdate = tooltipItems.enter().append("div")
      .attr("class", "tooltip-item")
      .merge(tooltipItems)
    tooltipItems.exit().remove()

    const tooltipItem = tooltipItemsUpdate.selectAll(".section")
      .data((d) => {
        const legendData = [
          {key: "tooltip-color", value: scales.colorScale(d[keys.ID])},
          {key: "tooltip-label", value: d[keys.LABEL]}
        ]
        if (typeof d[keys.VALUE] !== "undefined") {
          legendData.push({key: "value", value: d[keys.VALUE]})
        }
        return legendData
      })
    tooltipItem.enter().append("div")
      .merge(tooltipItem)
      .attr("class", (d) => ["section", d.key].join(" "))
      .each(function each (d) {
        const selection = d3.select(this)
        if (d.key === "tooltip-color") {
          selection.style("background", d.value)
        } else if (d.key === "value") {
          selection.html(formatter(d.value))
        } else {
          selection.html(d.value)
        }
      })
    tooltipItem.exit().remove()
    return this
  }

  function drawTitle () {
    let title = cache.title

    if (typeof title === "object") {
      title = d3.timeFormat(config.dateFormat)(title)
    }

    cache.tooltipTitle.html(title)
    return this
  }

  function drawTooltip () {
    buildSVG()
    drawTitle()
    drawContent()
    move()
    return this
  }

  function setupContent (_series) {
    let series = _series

    if (config.seriesOrder.length) {
      series = sortByTopicsOrder(_series)
    } else if (_series.length && _series[0][keys.LABEL]) {
      series = sortByAlpha(_series)
    }

    cache.content = series
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
    if (!cache.root) { return null }
    cache.root.style("display", "none")
    return this
  }

  function show () {
    if (!cache.root) { return null }
    cache.root.style("display", "block")
    return this
  }

  function setVisibility (_shouldBeVisible) {
    cache.isEnabled = _shouldBeVisible
    if (!cache.root) { return null }
    if (cache.isEnabled) {
      show()
    } else {
      hide()
    }
    return this
  }

  function setupTooltip (_dataPoint, _xPosition, _yPosition) {
    buildSVG()
    const [tooltipX, tooltipY] = calculateTooltipPosition(_xPosition, _yPosition)
    setXPosition(tooltipX)
    setYPosition(tooltipY)
    setTitle(_dataPoint[keys.DATA])
    setupContent(_dataPoint[keys.SERIES])

    drawTooltip()
    return this
  }

  function bindEvents (_dispatcher) {
    _dispatcher.on("mouseOverPanel.tooltip", show)
      .on("mouseMovePanel.tooltip", setupTooltip)
      .on("mouseOutPanel.tooltip", hide)
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

  function setTitle (_title) {
    cache.title = _title
    return this
  }

  function setXPosition (_xPosition) {
    cache.xPosition = _xPosition
    return this
  }

  function setYPosition (_yPosition) {
    cache.yPosition = _yPosition
    return this
  }

  function setContent (_content) {
    cache.content = _content
    return this
  }

  return {
    bindEvents,
    setXPosition,
    setYPosition,
    setContent,
    setTitle,
    hide,
    show,
    drawTooltip,
    setConfig,
    setScales,
    setVisibility
  }
}
