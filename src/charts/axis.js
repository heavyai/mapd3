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
    tickSpacing: 40,
    dateFormat: "%b %d, %Y",
    numberFormat: ".2f"
  }

  let scales = {
    xScale: null,
    yScale: null,
    y2Scale: null,
    hasSecondAxis: null
  }

  const cache = {
    container: _container,
    background: null,
    chartHeight: null,
    chartWidth: null,
    xAxis: null,
    yAxis: null,
    y2Axis: null,
    horizontalGridLines: null,
    verticalGridLines: null
  }

  // slightly modified version of d3's default time-formatting to always use abbrev month names
  const formatMillisecond = d3.timeFormat(".%L");
  const formatSecond = d3.timeFormat(":%S");
  const formatMinute = d3.timeFormat("%I:%M");
  const formatHour = d3.timeFormat("%I %p");
  const formatDay = d3.timeFormat("%a %d");
  const formatWeek = d3.timeFormat("%b %d");
  const formatMonth = d3.timeFormat("%b");
  const formatYear = d3.timeFormat("%Y");

  function multiFormat(date) {
    return (d3.timeSecond(date) < date ? formatMillisecond
        : d3.timeMinute(date) < date ? formatSecond
        : d3.timeHour(date) < date ? formatMinute
        : d3.timeDay(date) < date ? formatHour
        : d3.timeMonth(date) < date ? (d3.timeWeek(date) < date ? formatDay : formatWeek)
        : d3.timeYear(date) < date ? formatMonth
        : formatYear)(date);
  }

  function buildSVG () {
    cache.chartWidth = config.width - config.margin.left - config.margin.right
    cache.chartHeight = config.height - config.margin.top - config.margin.bottom

    if (!cache.root) {
      cache.root = cache.container.append("g")
          .classed("axis-group", true)
          .style("pointer-events", "none")

      cache.root.append("g").attr("class", "grid-lines-group")

      cache.root.append("g").attr("class", "axis x")

      cache.root.append("g").attr("class", "axis y")

      cache.root.append("g").attr("class", "axis y2")
    }

    cache.root.attr("transform", `translate(${config.margin.left}, ${config.margin.top})`)
  }

  function formatXAxis () {
    if (config.keyType === "time") {
      if (config.xAxisFormat && config.xAxisFormat !== "auto") {
        cache.xAxis.tickFormat(multiFormat)
      }
    } else if (config.keyType === "string") {
      cache.xAxis.tickValues(scales.xScale.domain().filter((d, i) => !(i % config.xTickSkip)))
    } else if (config.keyType === "number") {
      if (config.xAxisFormat && config.xAxisFormat !== "auto") {
        const formatter = d3.format(config.xAxisFormat)
        cache.xAxis.tickFormat(formatter)
      }
    }
  }

  function autoFormat (_yExtent) {
    let yFormat = config.numberFormat
    if ((_yExtent[1] - _yExtent[0]) < 1) {
      yFormat = ".2f"
    } else if ((_yExtent[1] - _yExtent[0]) < 100) {
      yFormat = ".1f"
    } else if ((_yExtent[1] - _yExtent[0]) < 1000) {
      yFormat = ".0f"
    } else if ((_yExtent[1] - _yExtent[0]) < 100000) {
      yFormat = ".2s"
    } else {
      yFormat = ".2s"
    }
    return yFormat
  }

  function formatYAxis (axis, domain) {
    if (!scales.yScale) {
      return
    }
    if (config.yAxisFormat === "auto") {
      const yExtent = scales.yScale.domain()
      let yFormat = autoFormat(yExtent)
      axis.tickFormat(d3.format(yFormat))
    } else if (typeof config.yAxisFormat === "string") {
      axis.tickFormat(d3.format(config.yAxisFormat))
    }
  }

  function formatY2Axis (axis, domain) {
    if (!scales.y2Scale) {
      return
    }
    if (config.y2AxisFormat === "auto") {
      const y2Extent = scales.y2Scale.domain()
      let y2Format = autoFormat(y2Extent)
      axis.tickFormat(d3.format(y2Format))
    } else if (typeof config.y2AxisFormat === "string") {
      axis.tickFormat(d3.format(config.y2AxisFormat))
    }
  }

  function buildAxis () {
    cache.xAxis = d3.axisBottom(scales.xScale)
        .tickSize(config.tickSizes, 0)
        .tickPadding(config.tickPadding)

    formatXAxis()

    if (scales.yScale) {
      cache.yAxis = d3.axisLeft(scales.yScale)
          .tickSize([config.tickSizes])
          .tickPadding(config.tickPadding)

      formatYAxis(cache.yAxis)

      if (Number.isInteger(config.yTicks)) {
        cache.yAxis.ticks(config.yTicks)
      } else {
        cache.yAxis.ticks(Math.ceil(cache.chartHeight / config.tickSpacing))
      }
    }

    if (scales.hasSecondAxis) {
      cache.y2Axis = d3.axisRight(scales.y2Scale)
          .tickSize([config.tickSizes])
          .tickPadding(config.tickPadding)

      formatY2Axis(cache.y2Axis)

      if (!isNaN(config.y2Ticks)) {
        cache.y2Axis.ticks(config.y2Ticks)
      }
    }
  }

  function drawAxis () {
    buildSVG()
    buildAxis()

    cache.root.select(".axis.x")
        .attr("transform", `translate(0, ${cache.chartHeight})`)
        .call(cache.xAxis)

    if (scales.yScale) {
      cache.root.select(".axis.y")
          .transition()
          .duration(config.axisTransitionDuration)
          .ease(config.ease)
          .call(cache.yAxis)
    } else {
      cache.root.select(".axis.y").selectAll("*").remove()
    }

    if (scales.y2Scale) {
      cache.root.select(".axis.y2")
          .attr("transform", `translate(${cache.chartWidth}, 0)`)
          .transition()
          .duration(config.axisTransitionDuration)
          .ease(config.ease)
          .call(cache.y2Axis)
    } else {
      cache.root.select(".axis.y2").selectAll("*").remove()
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

      if (scales.yScale) {
        cache.horizontalGridLines = cache.root.select(".grid-lines-group")
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
      } else {
        cache.horizontalGridLines.selectAll("*").remove()
      }
    }

    if (config.grid === "vertical" || config.grid === "full") {
      cache.verticalGridLines = cache.root.select(".grid-lines-group")
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

  function destroy () {
    if (cache.root) {
      cache.root.remove()
      cache.root = null
    }
  }

  return {
    setConfig,
    setScales,
    drawAxis,
    drawGridLines,
    destroy
  }
}
