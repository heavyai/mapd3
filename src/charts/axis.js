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
    keyType: null,
    yTicks: null,
    yAxisFormat: null,
    xAxisPadding: null,
    axisTransitionDuration: null,
    ease: null,
    yTitle: null,
    xTitle: null,
    grid: null,
    hoverZoneSize: 30
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

      // cache.background = cache.svg.append("g").attr("class", "background")
      //   .append("rect")
      //   .style("opacity", 0)
      cache.svg.append("g").attr("class", "grid-lines-group")

      const HOVER_ZONE_SIZE = 30
      cache.svg.append("g").attr("class", "axis x")
        // .append("rect")
        // .attr("class", "x-axis-background")
        // .attr("width", cache.chartWidth)
        // .attr("height", HOVER_ZONE_SIZE)
        // .style("pointer-events", "all")
        // .on("mouseover.dispatch", () => dispatcher.call("enterXAxis"))
        // .on("mouseout.dispatch", () => dispatcher.call("exitXAxis"))

      cache.svg.append("g").attr("class", "axis y")
        // .append("rect")
        // .attr("class", "y-axis-background")
        // .attr("width", HOVER_ZONE_SIZE)
        // .attr("height", cache.chartHeight)
        // .attr("x", -HOVER_ZONE_SIZE)
        // .style("pointer-events", "all")
        // .on("mouseover.dispatch", () => dispatcher.call("enterYAxis"))
        // .on("mouseout.dispatch", () => dispatcher.call("exitYAxis"))

      cache.svg.append("g").attr("class", "axis y2")
        // .append("rect")
        // .attr("class", "y2-axis-background")
        // .attr("width", HOVER_ZONE_SIZE)
        // .attr("height", cache.chartHeight)
        // .style("pointer-events", "all")
        // .on("mouseover.dispatch", () => dispatcher.call("enterY2Axis"))
        // .on("mouseout.dispatch", () => dispatcher.call("exitY2Axis"))
    }

    cache.svg.attr("transform", `translate(${config.margin.left}, ${config.margin.top})`)
    // cache.background.attr("width", config.hoverZoneSize)
  }

  function buildAxis () {
    cache.xAxis = d3.axisBottom(scales.xScale)
        .tickSize(config.tickSizes, 0)
        .tickPadding(config.tickPadding)

    if (config.keyType === "time") {
      const formatter = d3.timeFormat(config.xAxisFormat)
      cache.xAxis.tickFormat(formatter)
    } else {
      cache.xAxis.tickValues(scales.xScale.domain().filter((d, i) => !(i % config.tickSkip)))
    }

    cache.yAxis = d3.axisLeft(scales.yScale)
        .ticks(config.yTicks)
        .tickSize([config.tickSizes])
        .tickPadding(config.tickPadding)
        .tickFormat(d3.format(config.yAxisFormat))

    if (scales.hasSecondAxis) {
      cache.yAxis2 = d3.axisRight(scales.yScale2)
          .ticks(config.yTicks)
          .tickSize([config.tickSizes])
          .tickPadding(config.tickPadding)
          .tickFormat(d3.format(config.yAxisFormat))
    }
  }

  function drawAxis () {
    buildSVG()
    buildAxis()

    cache.svg.select(".axis.x")
        .attr("transform", `translate(0, ${cache.chartHeight})`)
        .call(cache.xAxis)

    cache.svg.select(".axis.y")
        .attr("transform", `translate(${-config.xAxisPadding.left}, 0)`)
        .transition()
        .duration(config.axisTransitionDuration)
        .ease(config.ease)
        .call(cache.yAxis)

    if (scales.hasSecondAxis) {
      cache.svg.select(".axis.y2")
          .attr("transform", `translate(${cache.chartWidth - config.xAxisPadding.right}, 0)`)
          .transition()
          .duration(config.axisTransitionDuration)
          .ease(config.ease)
          .call(cache.yAxis2)
    }

    return this
  }

  function drawAxisTitles () {
    cache.svg.select(".y-title")
      .text(config.yTitle)
      .attr("text-anchor", "middle")
      .attr("transform", function transform () {
        const textHeight = this.getBBox().height
        return `translate(${[textHeight, config.height / 2]}) rotate(-90)`
      })

    cache.svg.select(".x-title")
      .text(config.xTitle)
      .attr("text-anchor", "middle")
      .attr("transform", `translate(${[config.width / 2, config.height]})`)

    return this
  }

  function drawGridLines () {
    if (config.grid === "horizontal" || config.grid === "full") {
      cache.horizontalGridLines = cache.svg.select(".grid-lines-group")
          .selectAll("line.horizontal-grid-line")
          .data(scales.yScale.ticks(config.yTicks))

      cache.horizontalGridLines.enter()
        .append("line")
        .attr("class", "horizontal-grid-line")
        .merge(cache.horizontalGridLines)
        .transition()
        .duration(config.axisTransitionDuration)
        .attr("x1", (-config.xAxisPadding.left))
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
    drawAxisTitles,
    drawGridLines,
  }
}
