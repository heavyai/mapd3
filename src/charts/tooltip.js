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
    root: null,
    chartWidth: null,
    chartHeight: null,
    tooltipDivider: null,
    tooltipBody: null,
    tooltipTitle: null,
    tooltipBackground: null
  }

  function buildSVG () {
    cache.chartWidth = config.width - config.margin.left - config.margin.right
    cache.chartHeight = config.height - config.margin.top - config.margin.bottom

    if (!cache.root) {
      cache.root = cache.container.append("div")
          .attr("class", "tooltip-group")
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

  function setPosition (_xPosition, _yPosition) {
    const [tooltipX, tooltipY] = calculateTooltipPosition(_xPosition, _yPosition)

    cache.root.transition()
      .duration(config.mouseChaseDuration)
      .ease(config.tooltipEase)
      .style("top", `${tooltipY}px`)
      .style("left", `${tooltipX + config.margin.left}px`)
    return this
  }

  function setSeriesContent (_series) {
    const formatter = d3.format(config.valueFormat)

    const tooltipItems = cache.tooltipBody.selectAll(".tooltip-item")
        .data(_series)
    const tooltipItemsUpdate = tooltipItems.enter().append("div")
      .attr("class", "tooltip-item")
      .merge(tooltipItems)
    tooltipItems.exit().remove()

    const tooltipItem = tooltipItemsUpdate.selectAll(".section")
      .data((d) => [
        {key: "color", value: scales.colorScale(d[keys.ID])},
        {key: "label", value: d[keys.LABEL]},
        {key: "value", value: d[keys.VALUE]}
      ])
    tooltipItem.enter().append("div")
      .merge(tooltipItem)
      .attr("class", (d) => ["section", d.key].join(" "))
      .each(function each (d) {
        const selection = d3.select(this)
        if (d.key === "color") {
          selection.style("background", d.value)
        } else if (d.key === "value") {
          selection.html(formatter(d.value))
        } else {
          selection.html(d.value)
        }
      })
    tooltipItem.exit().remove()
  }

  function setTitle (_title) {
    let title = _title
    if (config.keyType === "time") {
      title = d3.timeFormat(config.dateFormat)(_title)
    }

    cache.tooltipTitle.html(title)
    return this
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
    if (!cache.root) { return null }
    cache.root.style("display", "none")
    return this
  }

  function show () {
    if (!cache.root) { return null }
    cache.root.style("display", "block")
    return this
  }

  function drawTooltip (_dataPoint, _xPosition, _yPosition) {
    buildSVG()
    setTitle(_dataPoint[keys.DATA])
    setContent(_dataPoint[keys.SERIES])
    setPosition(_xPosition, _yPosition)
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
    setContent,
    setTitle,
    hide,
    show,
    drawTooltip,
    setConfig,
    setScales
  }
}
