import * as d3 from "./helpers/d3-service"

import {keys, dashStylesTranslation} from "./helpers/constants"
import {isNumeric, isNumberString, override} from "./helpers/common"
import {binTranslation, formatPercentage, formatOddDateBin, formatTooltipNumber} from "./helpers/formatters"

export const applyFormat = (_value, _format) => {
  if (typeof _format === "function") {
    return _format(_value)
  } else if (typeof _format === "string" && _format !== "auto") {
    return d3.format(_format)(_value)
  } else {
    return formatTooltipNumber(_value)
  }
}

const getMeasureFormatter = (tooltipFormatter, measureName) => {
  // Running a function, _just_ to test to see if one of it's inputs are valid is _insane_.
  // But alas, that's what's happening here just to see if we have a specific measure formatter. So we should
  // prolly think about not doing this at some point.
  if (
    typeof tooltipFormatter === "function" &&
    tooltipFormatter(null, measureName)
  ) {
    return v => tooltipFormatter(v, measureName)
  }
}

export const formatTooltipTitle = (
  title,
  format,
  dateFormat,
  binningResolution
) => {
  if (isNumberString(title)) {
    title = Number(parseFloat(title))
  }
  if (typeof format === "function" && typeof title !== "string") {
    title = format(title)
  } else if (title instanceof Date) {
    const specifier = binTranslation[binningResolution]
    if (format && format !== "auto") {
      title = d3.utcFormat(format)(title)
    } else if (specifier) {
      title = d3.utcFormat(specifier)(title)
    } else if (["1w", "1q", "10y", "1c"].indexOf(binningResolution) > -1) {
      // handle bin translation for bin types not available in d3-time (century, decade, quarter)
      title = formatOddDateBin(binningResolution, title)
    } else {
      title = d3.utcFormat(dateFormat)(title)
    }
  } else if (isNumeric(title)) {
    title = Number(parseFloat(title))
    if (format) {
      title = applyFormat(title, format)
    } else {
      title = formatTooltipNumber(title)
    }
  }
  return title
}

const formatTooltipValue = (_value, tooltipFormat, measureFormatter) => {
  const hasStringFormatterForMeasure = typeof tooltipFormat === "string" &&
    tooltipFormat !== "auto"

  if (typeof measureFormatter === "function") {
    return measureFormatter(_value)
  } else if (hasStringFormatterForMeasure) {
    return d3.format(tooltipFormat)(_value)
  } else {
    return formatTooltipNumber(_value)
  }
}

export const formatDataPoint = (
  d,
  tooltipFormat,
  yAxisPercentageFormat,
  measureFormatter
) => {
  // Check for percentage value (presence of absolute-value metadata)
  if (typeof d[keys.ABSOLUTEVAL] !== "undefined") {
    // Assume VALUE is not undefined, since ABSOLUTEVAL is derived from it
    const percentageValue = d[keys.VALUE]
    const absoluteValue = d[keys.ABSOLUTEVAL]

    const formattedAbsoluteValue = formatTooltipValue(absoluteValue, tooltipFormat, measureFormatter)
    const formattedPercentageValue =
      applyFormat(percentageValue, formatPercentage(yAxisPercentageFormat))

    return `${formattedAbsoluteValue} (${formattedPercentageValue})`
  } else if (typeof d[keys.VALUE] !== "undefined") {
    const value = d[keys.VALUE]
    return formatTooltipValue(value, tooltipFormat, measureFormatter)
  }
}

export default function Tooltip (_container, _isLegend = false) {
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
    tooltipIsEnabled: true,
    tooltipTitle: null,
    binningResolution: null,
    binningIsAuto: null,
    chartType: null,
    colorSchema: ["skyblue"],
    keyType: "time",
    tooltipFormat: null,
    yAxisPercentageFormat: null,
    tooltipTitleFormat: null,

    markPanelWidth: null,
    chartWidth: null,
    chartHeight: null
  }

  let scales = {
    colorScale: null,
    styleScale: null,
    measureNameLookup: null
  }

  const cache = {
    container: _container,
    root: null,
    tooltipDivider: null,
    tooltipBody: null,
    tooltipTitle: null,
    tooltipBackground: null,
    xPosition: null,
    yPosition: null,
    content: null,
    title: null
  }

  function build () {
    if (!cache.root) {
      cache.root = cache.container.append("div")
        .attr("class", _isLegend ? "legend-group" : "tooltip-group")
        .style("position", "absolute")

      const panel = cache.root.append("div")
        .attr("class", "tooltip-panel")

      cache.tooltipTitleSection = panel.append("div")
        .attr("class", "tooltip-title-section")

      cache.tooltipTitle = cache.tooltipTitleSection.append("div")
        .attr("class", "tooltip-title")

      cache.tooltipBody = panel.append("div")
        .attr("class", "tooltip-body")

      if (_isLegend) {
        cache.tooltipTitleSection.append("div")
          .attr("class", "tooltip-collapse")
          .html("↗")

        cache.tooltipTitleSection.on("click", function click () {
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

    if (_isLegend) {
      cache.root.style("max-height", config.chartHeight)
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

    if (_mouseX > (config.chartWidth / 2)) {
      avoidanceOffset = -tooltipSize.width - OFFSET
    }

    return [tooltipX + avoidanceOffset, tooltipY]
  }

  function move () {
    const xPosition = cache.xPosition === "auto"
      ? config.chartWidth
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

    if (_isLegend) {
      // set max-height in case there are too many legend items
      cache.root.style("max-height", `${config.chartHeight}px`)
    }

    return this
  }

  function drawContent () {
    const tooltipItems = cache.tooltipBody.selectAll(".tooltip-item")
      .data(cache.content)
    const tooltipItemsUpdate = tooltipItems.enter().append("div")
      .attr("class", "tooltip-item")
      .merge(tooltipItems)
    tooltipItems.exit().remove()

    const tooltipItem = tooltipItemsUpdate.selectAll(".section")
      .data((d, i) => {
        const legendData = [
          {
            key: "tooltip-color",
            value: scales.colorScale(d[keys.ID]),
            style: scales.styleScale(d[keys.ID]),
            index: i
          }
        ]

        if (typeof d[keys.LABEL] !== "undefined") {
          legendData.push({key: "tooltip-label", value: d[keys.LABEL]})
        }

        if (
          typeof d[keys.ABSOLUTEVAL] !== "undefined" ||
          typeof d[keys.VALUE] !== "undefined"
        ) {
          const measureName = scales.measureNameLookup(d.id)
          const measureFormatter = getMeasureFormatter(config.tooltipFormat, measureName)
          const {
            tooltipFormat,
            yAxisPercentageFormat
          } = config
          legendData.push({
            key: "value",
            value: formatDataPoint(
              d,
              tooltipFormat,
              yAxisPercentageFormat,
              measureFormatter
            )
          })
        }

        return legendData
      })
    tooltipItem.enter().append("div")
      .merge(tooltipItem)
      .attr("class", (d) => ["section", d.key].join(" "))
      .each(function each (d) {
        const selection = d3.select(this)
        if (d.key === "tooltip-color") {
          const size = 12
          const offset = size / 2
          const svg = selection
            .html("<svg></svg>")
            .select("svg")
            .attr("width", size)
            .attr("height", size)

          if (config.chartType === "line" ||
            (Array.isArray(config.chartType) && config.chartType[d.index] === "line")) {

            svg
              .append("line")
              .attr("x1", 0)
              .attr("y1", offset)
              .attr("x2", size)
              .attr("y2", offset)
              .attr("stroke", d.value)
              .attr("stroke-width", 2.5)
              .attr("stroke-dasharray", dB => dashStylesTranslation[dB.style])
          } else {
            svg
              .append("rect")
              .attr("x", 0)
              .attr("y", 0)
              .attr("width", size)
              .attr("height", size)
              .style("fill", d.value)
          }
        } else {
          selection.html(d.value)
        }
      })
    tooltipItem.exit().remove()

    return this
  }

  function toggleCollapse (_isCollapsed) {
    if (_isCollapsed) {
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
    cache.tooltipTitle.html(formatTooltipTitle(
      config.tooltipTitle || cache.title,
      config.tooltipTitleFormat,
      config.dateFormat,
      config.binningResolution
    ))
    return this
  }

  function setupContent (_series) {
    cache.content = sortSeries(_series)
    return this
  }

  function sortSeries (_series) {
    return [..._series].sort((a, b) => b[keys.VALUE] - a[keys.VALUE])
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

  function setupTooltip (_dataPoint, _xPosition, _yPosition, _panelXPosition) {
    build()
    const [tooltipX, tooltipY] = calculateTooltipPosition(_panelXPosition, _yPosition)
    setXPosition(tooltipX)
    setYPosition(tooltipY)

    let title = _dataPoint[keys.KEY]
    if (isNumberString(title)) {
      title = Number(parseFloat(title))
    }
    setTitle(title)
    setupContent(_dataPoint[keys.SERIES])

    render()
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
    render()
    return this
  }

  function render () {
    build()
    drawTitle()
    drawContent()
    move()
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
    setConfig,
    setScales,
    destroy
  }
}
