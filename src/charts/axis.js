import * as d3 from "./helpers/d3-service"
import {override} from "./helpers/common"
import {autoFormat, multiFormat, getExtractFormatter} from "./helpers/formatters"

export default function Axis (_container) {

  let config = {
    margin: {
      top: 60,
      right: 30,
      bottom: 40,
      left: 70
    },
    width: 800,
    height: 500,
    tickSizes: null,
    tickPadding: null,
    xAxisFormat: null,
    yAxisFormat: null,
    y2AxisFormat: null,
    keyType: null,
    yTicks: null,
    y2Ticks: null,
    xTickSkip: null,
    axisTransitionDuration: null,
    ease: null,
    grid: null,
    hoverZoneSize: 30,
    tickSpacing: 40,
    numberFormat: ".2f",
    extractType: null,
    yDomain: "auto",
    y2Domain: "auto",
    labelsAreRotated: false,

    chartWidth: null,
    chartHeight: null,
    markPanelWidth: null
  }

  let scales = {
    xScale: null,
    yScale: null,
    y2Scale: null,
    hasSecondAxis: null,
    measureNameLookup: null
  }

  const cache = {
    container: _container,
    root: null,
    xAxisRoot: null,
    yAxisRoot: null,
    y2AxisRoot: null,
    background: null,
    xAxis: null,
    yAxis: null,
    y2Axis: null,
    horizontalGridLines: null,
    verticalGridLines: null,
    xLabelsShouldRotate: false
  }

  const APPROX_FONT_WIDTH = 5
  const LABEL_SPACING = 2

  const X_TICK_LABEL_SETTINGS = {
    DEFAULT_XPOS: 0,
    DEFAULT_YPOS: 11,
    DEFAULT_DY: ".71em",
    DEFAULT_TRANSFORM: null,
    DEFAULT_ANCHOR: "middle",
    ROTATED_XPOS: 9,
    ROTATED_YPOS: 0,
    ROTATED_DY: ".35em",
    ROTATED_TRANSFORM: "rotate(90)",
    ROTATED_ANCHOR: "start"
  }

  function build () {
    if (!cache.root) {
      cache.root = cache.container.select("svg.chart > g.chart-group")
      cache.xAxisRoot = cache.root.append("g")
        .classed("axis-group", true)
        .style("pointer-events", "none")
      cache.xAxisRoot.append("g").attr("class", "grid-lines-group")
      cache.xAxisRoot.append("g").attr("class", "axis x")
      cache.yAxisRoot = cache.container.select(".y-axis-container > svg")
      cache.y2AxisRoot = cache.container.select(".y2-axis-container > svg")
      cache.yAxisRoot.select(".axis-group").append("g").attr("class", "axis y")
      cache.y2AxisRoot.select(".axis-group").append("g").attr("class", "axis y2")
    }

    cache.xLabelsShouldRotate = shouldXLabelsRotate()

    const DOMAIN_LINE_WIDTH = 1
    cache.yAxisRoot
      .attr("width", config.margin.left)
      .attr("height", config.chartHeight + config.margin.top + config.margin.bottom)
      .select(".axis-group")
      .attr("transform", `translate(${config.margin.left - DOMAIN_LINE_WIDTH}, ${config.margin.top})`)

    cache.y2AxisRoot
      .attr("width", config.margin.left)
      .attr("height", config.chartHeight + config.margin.top + config.margin.bottom)
      .select(".axis-group")
      .attr("transform", `translate(0, ${config.margin.top})`)
  }

  function formatXAxis () {
    if (typeof config.xAxisFormat === "function") {
      const dimensionName = scales.measureNameLookup("x")
      const hasFormatterForDimension = config.xAxisFormat(null, dimensionName)
      if (hasFormatterForDimension) {
        cache.xAxis.tickFormat(d => config.xAxisFormat(d, dimensionName))
      }
    } else if (config.keyType === "time") {
      if (config.xAxisFormat && config.xAxisFormat !== "auto") {
        const formatter = d3.utcFormat(config.xAxisFormat)
        cache.xAxis.tickFormat(formatter)
      } else {
        cache.xAxis.tickFormat(multiFormat)
      }
    } else if (config.keyType === "string") {
      let xTickSkip = config.xTickSkip
      if (config.xTickSkip === "auto") {
        xTickSkip = getNumberOfLabelsToSkip()
      }
      cache.xAxis.tickValues(scales.xScale.domain().filter((d, i) => !(i % xTickSkip)))
    } else if (config.keyType === "number") {
      if (config.extractType) {
        const formatter = getExtractFormatter(config.extractType)
        cache.xAxis.tickFormat(formatter)
      } else if (config.xAxisFormat && config.xAxisFormat !== "auto") {
        const formatter = d3.format(config.xAxisFormat)
        cache.xAxis.tickFormat(formatter)
      }
    }
  }

  function getYAutoFormat () {
    const yExtent = config.yDomain === "auto" ? scales.yScale.domain() : config.yDomain
    const yFormat = autoFormat(yExtent, config.numberFormat)
    return d3.format(yFormat)
  }

  function formatYAxis (axis) {
    if (!scales.yScale) {
      return
    }
    if (typeof config.yAxisFormat === "function") {
      const measureName = scales.measureNameLookup("y")
      const hasFormatterForMeasure = config.yAxisFormat(null, measureName)
      if (hasFormatterForMeasure) {
        axis.tickFormat(d => config.yAxisFormat(d, measureName))
      } else {
        axis.tickFormat(getYAutoFormat())
      }
    } else if (config.yAxisFormat === "auto") {
      axis.tickFormat(getYAutoFormat())
    } else if (typeof config.yAxisFormat === "string") {
      axis.tickFormat(d3.format(config.yAxisFormat))
    } else if (Array.isArray(config.yAxisFormat)) {
      axis.tickFormat(d3.format(config.yAxisFormat[0]))
    }
  }

  function getY2AutoFormat () {
    const y2Extent = config.y2Domain === "auto" ? scales.y2Scale.domain() : config.y2Domain
    const y2Format = autoFormat(y2Extent, config.numberFormat)
    return d3.format(y2Format)
  }

  function formatY2Axis (axis) {
    if (!scales.y2Scale) {
      return
    }
    if (typeof config.y2AxisFormat === "function") {
      const measureName = scales.measureNameLookup("y2")
      if (measureName) {
        const hasFormatterForMeasure = config.y2AxisFormat(null, measureName)
        if (hasFormatterForMeasure) {
          axis.tickFormat(d => config.y2AxisFormat(d, measureName))
        } else {
          axis.tickFormat(getY2AutoFormat())
        }
      } else {
        axis.tickFormat(d => config.y2AxisFormat(d))
      }
    } else if (config.y2AxisFormat === "auto") {
      axis.tickFormat(getY2AutoFormat())
    } else if (typeof config.y2AxisFormat === "string") {
      axis.tickFormat(d3.format(config.y2AxisFormat))
    } else if (Array.isArray(config.y2AxisFormat)) {
      axis.tickFormat(d3.format(config.y2AxisFormat[0]))
    }
  }

  function buildAxis () {
    cache.xAxis = d3.axisBottom(scales.xScale)
      .tickSize(config.tickSizes, 0)
      .tickPadding(config.tickPadding)
      .tickSizeOuter(0)

    formatXAxis()

    if (scales.yScale) {
      cache.yAxis = d3.axisLeft(scales.yScale)
        .tickSize([config.tickSizes])
        .tickPadding(config.tickPadding)
        .tickSizeOuter(0)

      formatYAxis(cache.yAxis)

      if (Number.isInteger(config.yTicks)) {
        cache.yAxis.ticks(config.yTicks)
      } else {
        cache.yAxis.ticks(Math.ceil(config.chartHeight / config.tickSpacing))
      }
    }

    if (scales.hasSecondAxis) {
      cache.y2Axis = d3.axisRight(scales.y2Scale)
        .tickSize([config.tickSizes])
        .tickPadding(config.tickPadding)
        .tickSizeOuter(0)

      formatY2Axis(cache.y2Axis)

      if (!isNaN(config.y2Ticks)) {
        cache.y2Axis.ticks(config.y2Ticks)
      }
    }
  }

  function shouldXLabelsRotate () {
    const width = config.markPanelWidth
    const labels = scales.xScale.domain()
    const totalLabelsWidth = labels.reduce(
      (total, d) => total + d.length * APPROX_FONT_WIDTH + LABEL_SPACING * APPROX_FONT_WIDTH,
      0
    )

    if (totalLabelsWidth >= width) {
      return true
    }
    return false
  }

  function rotateXLabels () {
    cache.xAxisRoot.select(".axis.x").selectAll("text")
      .attr("y", X_TICK_LABEL_SETTINGS.ROTATED_YPOS)
      .attr("x", X_TICK_LABEL_SETTINGS.ROTATED_XPOS)
      .attr("dy", X_TICK_LABEL_SETTINGS.ROTATED_DY)
      .attr("transform", X_TICK_LABEL_SETTINGS.ROTATED_TRANSFORM)
      .style("text-anchor", X_TICK_LABEL_SETTINGS.ROTATED_ANCHOR)

    return this
  }

  function unRotateXLabels () {
    cache.xAxisRoot.select(".axis.x").selectAll("text")
      .attr("x", X_TICK_LABEL_SETTINGS.DEFAULT_XPOS)
      .attr("y", X_TICK_LABEL_SETTINGS.DEFAULT_YPOS)
      .attr("dy", X_TICK_LABEL_SETTINGS.DEFAULT_DY)
      .attr("transform", X_TICK_LABEL_SETTINGS.DEFAULT_TRANSFORM)
      .style("text-anchor", X_TICK_LABEL_SETTINGS.DEFAULT_ANCHOR)
  }

  function getNumberOfLabelsToSkip () {
    const labels = scales.xScale.domain()
    let longestLabelApproxWidth = null
    if (config.labelsAreRotated === true || (config.labelsAreRotated === "auto" && shouldXLabelsRotate())) {
      longestLabelApproxWidth = APPROX_FONT_WIDTH
    } else {
      const longestLabel = labels.reduce((longest, d) => (d.length > longest.length ? d : longest), {length: 0})
      longestLabelApproxWidth = longestLabel.length * APPROX_FONT_WIDTH
    }
    return Math.ceil(longestLabelApproxWidth / (config.markPanelWidth / labels.length))
  }

  function drawAxis () {
    cache.xAxisRoot.select(".axis.x")
      .attr("transform", `translate(0, ${config.chartHeight})`)
      .call(cache.xAxis)

    if (config.labelsAreRotated === true || (config.labelsAreRotated === "auto" && cache.xLabelsShouldRotate)) {
      rotateXLabels()
    } else if (config.labelsAreRotated === "auto" && !cache.xLabelsShouldRotate) {
      unRotateXLabels()
    }

    if (scales.yScale) {
      cache.yAxisRoot.select(".axis.y")
        .transition()
        .duration(config.axisTransitionDuration)
        .ease(config.ease)
        .call(cache.yAxis)
    } else {
      cache.yAxisRoot.select(".axis.y").selectAll("*").remove()
    }

    if (scales.y2Scale) {
      cache.y2AxisRoot.select(".axis.y2")
        .transition()
        .duration(config.axisTransitionDuration)
        .ease(config.ease)
        .call(cache.y2Axis)
    } else {
      cache.y2AxisRoot.select(".axis.y2").selectAll("*").remove()
    }

    return this
  }

  function drawGridLines () {
    if (config.grid === "horizontal" || config.grid === "full") {
      let ticks = null
      if (Number.isInteger(config.yTicks)) {
        ticks = config.yTicks
      } else {
        ticks = Math.ceil(config.chartHeight / config.tickSpacing)
      }

      if (scales.yScale) {
        cache.horizontalGridLines = cache.xAxisRoot.select(".grid-lines-group")
          .selectAll("line.horizontal-grid-line")
          .data(scales.yScale.ticks(ticks))

        cache.horizontalGridLines.enter()
          .append("line")
          .attr("class", "horizontal-grid-line")
          .merge(cache.horizontalGridLines)
          .transition()
          .duration(config.axisTransitionDuration)
          .attr("x2", config.markPanelWidth)
          .attr("y1", scales.yScale)
          .attr("y2", scales.yScale)

        cache.horizontalGridLines.exit().remove()
      } else if (cache.horizontalGridLines) {
        cache.horizontalGridLines.selectAll("*").remove()
      }
    }

    if (config.grid === "vertical" || config.grid === "full") {
      cache.verticalGridLines = cache.xAxisRoot.select(".grid-lines-group")
        .selectAll("line.vertical-grid-line")
        .data(cache.xAxis.tickValues())

      cache.verticalGridLines.enter()
        .append("line")
        .attr("class", "vertical-grid-line")
        .merge(cache.verticalGridLines)
        .transition()
        .duration(config.axisTransitionDuration)
        .attr("y1", 0)
        .attr("y2", config.chartHeight)
        .attr("x1", scales.xScale)
        .attr("x2", scales.xScale)

      cache.verticalGridLines.exit().remove()
    }

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

  function render () {
    build()
    buildAxis()
    drawAxis()
    drawGridLines()
  }

  function destroy () {
    if (cache.xAxisRoot) {
      cache.xAxisRoot.remove()
      cache.xAxisRoot = null
    }
    if (cache.yAxisRoot) {
      cache.yAxisRoot.remove()
      cache.yAxisRoot = null
    }
    if (cache.y2AxisRoot) {
      cache.y2AxisRoot.remove()
      cache.y2AxisRoot = null
    }
  }

  return {
    setConfig,
    setScales,
    render,
    destroy
  }
}
