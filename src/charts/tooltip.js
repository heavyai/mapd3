import * as d3 from "./helpers/d3-service"

import {keys, dashStylesTranslation} from "./helpers/constants"
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

    dateFormat: "%b %d, %Y",
    numberFormat: ".2f",
    seriesOrder: [],
    tooltipIsEnabled: true,
    tooltipTitle: null,

    // from chart
    chartType: null,
    colorSchema: ["skyblue"],
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
    title: null
  }

  function buildSVG () {
    cache.chartWidth = config.width - config.margin.left - config.margin.right
    cache.chartHeight = config.height - config.margin.top - config.margin.bottom

    if (!cache.root) {
      cache.root = cache.container.append("div")
          .attr("class", isLegend ? "legend-group" : "tooltip-group")
          .style("position", "absolute")

      const panel = cache.root.append("div")
        .attr("class", "tooltip-panel")

      cache.tooltipTitleSection = panel.append("div")
          .attr("class", "tooltip-title-section")

      cache.tooltipTitle = cache.tooltipTitleSection.append("div")
          .attr("class", "tooltip-title")

      cache.tooltipBody = panel.append("div")
          .attr("class", "tooltip-body")

      if (isLegend) {
        cache.tooltipTitleSection.append("div")
          .attr("class", "tooltip-collapse")
          .html("↗")

        cache.tooltipTitleSection.on("click", function () {
          const isCollapsed = this.classList.toggle("collapsed")
          toggleCollapse(isCollapsed)
        })
      } else {
        cache.root.style("pointer-events", "none")
      }

      if (!config.tooltipIsEnabled) {
        hide()
      }
    }

    if (isLegend) {
      cache.root.style("max-height", cache.chartHeight)
      if (config.tooltipIsEnabled) {
        show()
      } else {
        hide()
      }
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

    cache.root
      .style("top", `${yPosition}px`)
      .style("left", function left () {
        const width = cache.xPosition === "auto" ? this.getBoundingClientRect().width : 0
        return `${xPosition + config.margin.left - width}px`
      })
    return this
  }

  function drawContent () {
    // styleLookUp borrowed from line.drawLines, the two probably could be abstracted...
    const styleLookup = {}
    config.colorSchema.forEach(d => {
      styleLookup[d.key] = d.style
    })

    const formatter = d3.format(config.numberFormat)

    const tooltipItems = cache.tooltipBody.selectAll(".tooltip-item")
        .data(cache.content)
    const tooltipItemsUpdate = tooltipItems.enter().append("div")
      .attr("class", "tooltip-item")
      .merge(tooltipItems)
    tooltipItems.exit().remove()

    const tooltipItem = tooltipItemsUpdate.selectAll(".section")
      .data((d) => {
        const legendData = [
          {key: "tooltip-color", value: scales.colorScale(d[keys.LABEL])},
        ]

        if (isLegend) {
          legendData.push({key: "tooltip-label", value: d[keys.LABEL]})
        }

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
          const size = isLegend ? 8 : 12
          const offset = isLegend ? 4 : 6
          const svg = selection
            .html("<svg></svg>")
            .select("svg")
            .attr("width", size)
            .attr("height", size)

          if (config.chartType === "line") {
            svg
              .append("line")
              .attr("x1", 0)
              .attr("y1", offset)
              .attr("x2", size)
              .attr("y2", offset)
              .attr("stroke", d.value)
              .attr("stroke-width", 1.5)
              .attr("stroke-dasharray", d => {
                // borrowed from line.drawLines, the two probably could be abstracted...
                const style = styleLookup[d[keys.ID]]
                return dashStylesTranslation[style]
            })
          } else {
            svg
              .append("rect")
              .attr("x", 0)
              .attr("y", 0)
              .attr("width", size)
              .attr("height", size)
              .style("fill", d.value)
          }
        } else if (d.key === "value") {
          selection.html(formatter(d.value))
        } else {
          selection.html(d.value)
        }
      })
    tooltipItem.exit().remove()

    return this
  }

  function toggleCollapse (isCollapsed) {
    if (isCollapsed) {
      cache.tooltipTitle.html("Legend")
      cache.tooltipBody.style("display", "none")
      move()
    } else {
      drawTitle()
      cache.tooltipBody.style("display", "block")
      move()
    }
    return this
  }

  function drawTitle () {
    let title = config.tooltipTitle || cache.title

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
