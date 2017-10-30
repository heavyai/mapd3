import * as d3 from "./helpers/d3-service"

import {override} from "./helpers/common"

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
    tickSpacing: 40
  }

  let scales = {
    xScale: null,
    yScale: null,
    yScale2: null,
    hasSecondAxis: null
  }

  const cache = {
    container: _container,
    background: null,
    chartHeight: null,
    chartWidth: null,
    xAxis: null,
    yAxis: null,
    yAxis2: null,
    horizontalGridLines: null,
    verticalGridLines: null
  }

  function buildSVG () {
    cache.chartWidth = config.width - config.margin.left - config.margin.right
    cache.chartHeight = config.height - config.margin.top - config.margin.bottom

    if (!cache.svg) {
      cache.svg = cache.container.append("g")
          .classed("axis-group", true)
          .style("pointer-events", "none")

      cache.svg.append("g").attr("class", "grid-lines-group")

      cache.svg.append("g").attr("class", "axis x")

      cache.svg.append("g").attr("class", "axis y")

      cache.svg.append("g").attr("class", "axis y2")
    }

    cache.svg.attr("transform", `translate(${config.margin.left}, ${config.margin.top})`)
  }

  function buildAxis () {
    cache.xAxis = d3.axisBottom(scales.xScale)
        .tickSize(config.tickSizes, 0)
        .tickPadding(config.tickPadding)

    if (config.keyType === "time") {
      if (config.xAxisFormat && config.xAxisFormat !== "auto") {
        const formatter = d3.timeFormat(config.xAxisFormat)
        cache.xAxis.tickFormat(formatter)
      }
    } else if (config.keyType === "string") {
      cache.xAxis.tickValues(scales.xScale.domain().filter((d, i) => !(i % config.xTickSkip)))
    } else if (config.keyType === "number") {
      if (config.xAxisFormat && config.xAxisFormat !== "auto") {
        const formatter = d3.format(config.xAxisFormat)
        cache.xAxis.tickFormat(formatter)
      }
    }

    cache.yAxis = d3.axisLeft(scales.yScale)
        .tickSize([config.tickSizes])
        .tickPadding(config.tickPadding)
        .tickFormat(d3.format(config.yAxisFormat))

    if (Number.isInteger(config.yTicks)) {
      cache.yAxis.ticks(config.yTicks)
    } else {
      cache.yAxis.ticks(Math.ceil(cache.chartHeight / config.tickSpacing))
    }

    if (scales.hasSecondAxis) {
      cache.yAxis2 = d3.axisRight(scales.yScale2)
          .tickSize([config.tickSizes])
          .tickPadding(config.tickPadding)
          .tickFormat(d3.format(config.y2AxisFormat))

      if (!isNaN(config.y2Ticks)) {
        cache.yAxis2.ticks(config.y2Ticks)
      }
    }
  }

  function drawAxis () {
    buildSVG()
    buildAxis()

    cache.svg.select(".axis.x")
        .attr("transform", `translate(0, ${cache.chartHeight})`)
        .call(cache.xAxis)

    cache.svg.select(".axis.y")
        .transition()
        .duration(config.axisTransitionDuration)
        .ease(config.ease)
        .call(cache.yAxis)

    if (scales.hasSecondAxis) {
      cache.svg.select(".axis.y2")
          .attr("transform", `translate(${cache.chartWidth}, 0)`)
          .transition()
          .duration(config.axisTransitionDuration)
          .ease(config.ease)
          .call(cache.yAxis2)
    }

    return this
  }

  function drawGridLines () {
    if (config.grid === "horizontal" || config.grid === "full") {
      let ticks = null
      if (Number.isInteger(config.yTicks)) {
        ticks = config.yTicks
      } else {
        ticks = Math.ceil(cache.chartHeight / config.tickSpacing)
      }

      cache.horizontalGridLines = cache.svg.select(".grid-lines-group")
          .selectAll("line.horizontal-grid-line")
          .data(scales.yScale.ticks(ticks))

      cache.horizontalGridLines.enter()
        .append("line")
        .attr("class", "horizontal-grid-line")
        .merge(cache.horizontalGridLines)
        .transition()
        .duration(config.axisTransitionDuration)
        .attr("x2", cache.chartWidth)
        .attr("y1", scales.yScale)
        .attr("y2", scales.yScale)

      cache.horizontalGridLines.exit().remove()
    }

    if (config.grid === "vertical" || config.grid === "full") {
      cache.verticalGridLines = cache.svg.select(".grid-lines-group")
          .selectAll("line.vertical-grid-line")
          .data(cache.xAxis.tickValues())

      cache.verticalGridLines.enter()
        .append("line")
        .attr("class", "vertical-grid-line")
        .merge(cache.verticalGridLines)
        .transition()
        .duration(config.axisTransitionDuration)
        .attr("y1", 0)
        .attr("y2", cache.chartHeight)
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

  return {
    setConfig,
    setScales,
    drawAxis,
    drawGridLines
  }
}
