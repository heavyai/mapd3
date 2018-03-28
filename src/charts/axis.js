import * as d3 from "./helpers/d3-service"
import {override, getSizes} from "./helpers/common"
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
    dateFormat: "%b %d, %Y",
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
    hasSecondAxis: null
  }

  const cache = {
    container: _container,
    xAxisRoot: null,
    yAxisRoot: null,
    y2AxisRoot: null,
    background: null,
    xAxis: null,
    yAxis: null,
    y2Axis: null,
    horizontalGridLines: null,
    verticalGridLines: null
  }

  function build () {
    if (!cache.xAxisRoot) {
      cache.xAxisRoot = cache.container.select("svg.chart > g.chart-group")
        .append("g")
        .classed("axis-group", true)
        .style("pointer-events", "none")
      cache.xAxisRoot.append("g").attr("class", "grid-lines-group")
      cache.xAxisRoot.append("g").attr("class", "axis x")
      cache.yAxisRoot = cache.container.select(".y-axis-container > svg")
      cache.y2AxisRoot = cache.container.select(".y2-axis-container > svg")
      cache.yAxisRoot.select(".axis-group").append("g").attr("class", "axis y")
      cache.y2AxisRoot.select(".axis-group").append("g").attr("class", "axis y2")
    }

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
    if (config.keyType === "time") {
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

  function formatYAxis (axis) {
    if (!scales.yScale) {
      return
    }
    if (config.yAxisFormat === "auto") {
      const yExtent = config.yDomain === "auto" ? scales.yScale.domain() : config.yDomain
      let yFormat = autoFormat(yExtent, config.numberFormat)
      axis.tickFormat(d3.format(yFormat))
    } else if (typeof config.yAxisFormat === "string") {
      axis.tickFormat(d3.format(config.yAxisFormat))
    }
  }

  function formatY2Axis (axis) {
    if (!scales.y2Scale) {
      return
    }
    if (config.y2AxisFormat === "auto") {
      const y2Extent = config.y2Domain === "auto" ? scales.y2Scale.domain() : config.y2Domain
      const y2Format = autoFormat(y2Extent, config.numberFormat)
      axis.tickFormat(d3.format(y2Format))
    } else if (typeof config.y2AxisFormat === "string") {
      axis.tickFormat(d3.format(config.y2AxisFormat))
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

  function rotateXLabels () {
    cache.xAxisRoot.select(".axis.x").selectAll("text")
      .attr("y", 0)
      .attr("x", 9)
      .attr("dy", ".35em")
      .attr("transform", "rotate(90)")
      .style("text-anchor", "start")

    return this
  }

  function getNumberOfLabelsToSkip () {
    const APPROX_FONT_WIDTH = 5
    const labels = scales.xScale.domain()
    let longestLabelApproxWidth = null
    if (config.labelsAreRotated) {
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

    if (config.labelsAreRotated) {
      rotateXLabels()
    }

    if (scales.yScale) {
      cache.yAxisRoot.select(".axis.y")
        .transition()
        .duration(config.axisTransitionDuration)
        .ease(config.ease)
        .call(cache.yAxis)
    } else {
      cache.yAxisRoot.selectAll("*").remove()
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
