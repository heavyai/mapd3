import * as d3 from "./helpers/d3-service"
import {legendSymbol} from "d3-svg-legend"

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

    // Animations
    mouseChaseDuration: 0,
    tooltipEase: d3.easeQuadInOut,

    tooltipMaxHeight: 48,
    tooltipMaxWidth: 160,
    tooltipTitleHeight: 12,

    dateFormat: "%b %d, %Y",
    numberFormat: ".2f",
    seriesOrder: [],
    tooltipIsEnabled: true,
    tooltipTitle: null,

    // from chart
    keyType: "time"
  }

  let scales = {
    colorScale: null
  }

  const cache = {
    container: _container,
    root: null,
    legend: null,
    legendScale: null,
    symbol: null,
    legendBBox: null,
    chartWidth: null,
    chartHeight: null,
    tooltipDivider: null,
    tooltipBody: null,
    tooltipTitle: null,
    tooltipBackground: null,
    xPosition: null,
    yPosition: null,
    content: null,
    title: null
  }

  function buildSVG () {
    cache.chartWidth = config.width - config.margin.left - config.margin.right
    cache.chartHeight = config.height - config.margin.top - config.margin.bottom

    if (!cache.root) {
      cache.symbol = d3.symbol().type(d3.symbolTriangle)()

      cache.legendScale = d3.scaleOrdinal()

      cache.legend = legendSymbol()
        .scale(cache.legendScale)
        .labelWrap(64)
        .labelOffset(0)
        .title("Symbol Legend Title")
        .on("cellclick", (d) => console.log("clicked", d))

      cache.root = cache.container
        .append("div")
        .classed(isLegend ? "legend-group" : "tooltip-group", true)
        .style("position", "absolute")
        .style("pointer-events", "none")

      cache.svg = cache.root.append("svg")
      cache.legendRoot = cache.svg
        .append("g")
        .attr("transform", `translate(${[0, config.tooltipTitleHeight]})`)

      cache.legendRoot.call(cache.legend)

      // cache.legendRoot
        // .classed(isLegend ? "legend-group" : "tooltip-group", true)
        // .attr("transform", "translate(0, 20)")
        // .call(cache.legend)

      // cache.root = cache.container.append("div")
      //     .attr("class", isLegend ? "legend-group" : "tooltip-group")
      //     .style("position", "absolute")
      //     .style("pointer-events", "none")

      // cache.tooltipTitle = cache.root.append("div")
      //     .attr("class", "tooltip-title")

      // cache.tooltipBody = cache.root.append("div")
      //     .attr("class", "tooltip-body")

      // if (!config.tooltipIsEnabled) {
      //   hide()
      // }
    }
  }

  function calculateTooltipPosition (_mouseX, _mouseY) {
    if (!cache.root) {
      return null
    }
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
    if (!cache.root) {
      return null
    }
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

      // .attr("transform", () => {
      //   const width = cache.yPosition === "auto" ? cache.root.node().getBoundingClientRect().width : 0
      //   const xPositionOffset = xPosition + config.margin.left - width
      //   return `translate(${[xPositionOffset, yPosition]})`
      // })
    return this
  }

  function drawContent () {
    const formatter = d3.format(config.numberFormat)

    const content = cache.content.map(d => {
      const label = []
      if (d.label) {
        label.push(d.label)
      }
      if (d.value) {
        label.push(formatter(d.value))
      }
      return label.join(" ")
    })
    // cache.legendScale.domain(content.map(d => formatter(d.value)))
    cache.legendScale.domain(content)
      .range(content.map(() => cache.symbol))

    cache.root.call(cache.legend)

    // const tooltipItems = cache.tooltipBody.selectAll(".tooltip-item")
    //     .data(content)
    // const tooltipItemsUpdate = tooltipItems.enter().append("div")
    //   .attr("class", "tooltip-item")
    //   .merge(tooltipItems)
    // tooltipItems.exit().remove()

    // const tooltipItem = tooltipItemsUpdate.selectAll(".section")
    //   .data((d) => {
    //     const legendData = [
    //       {key: "tooltip-color", value: scales.colorScale(d[keys.ID])},
    //       {key: "tooltip-label", value: d[keys.LABEL]}
    //     ]
    //     if (typeof d[keys.VALUE] !== "undefined") {
    //       legendData.push({key: "value", value: d[keys.VALUE]})
    //     }
    //     return legendData
    //   })
    // tooltipItem.enter().append("div")
    //   .merge(tooltipItem)
    //   .attr("class", (d) => ["section", d.key].join(" "))
    //   .each(function each (d) {
    //     const selection = d3.select(this)
    //     if (d.key === "tooltip-color") {
    //       selection.style("background", d.value)
    //     } else if (d.key === "value") {
    //       selection.html(formatter(d.value))
    //     } else {
    //       selection.html(d.value)
    //     }
    //   })
    // tooltipItem.exit().remove()
    return this
  }

  function resizeToContent () {
    cache.legendBBox = cache.svg.node().getBBox()
    const w = cache.legendBBox.width
    const h = cache.legendBBox.height
    cache.svg
      .attr("width", w)
      .attr("height", h)
    cache.root
      .attr("width", w)
      .attr("height", h)
    return this
  }

  function drawTitle () {
    let title = config.tooltipTitle || cache.title

    if (typeof title === "object") {
      title = d3.timeFormat(config.dateFormat)(title)
    }

    cache.legend.title(title)
    return this
  }

  function drawTooltip () {
    buildSVG()
    drawTitle()
    drawContent()
    resizeToContent()
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
    if (!cache.root || !config.tooltipIsEnabled) { return null }
    cache.root.style("display", "block")
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

  function destroy () {
    if (cache.root) {
      cache.root.remove()
      cache.root = null
    }
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
    destroy
  }
}
