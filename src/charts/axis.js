import {axisBottom, axisLeft, axisRight} from "d3-axis"
import {timeFormat} from "d3-time-format"
import {format} from "d3-format"

export default function Axis (config, cache) {

  function buildAxis () {
    cache.xAxis = axisBottom(cache.xScale)
        .tickSize(config.tickSizes, 0)
        .tickPadding(config.tickPadding)

    if (config.keyType === "time") {
      const formatter = timeFormat(config.xAxisFormat)
      cache.xAxis.tickFormat(formatter)
    } else {
      cache.xAxis.tickValues(cache.xScale.domain().filter((d, i) => !(i % config.tickSkip)))
    }

    cache.yAxis = axisLeft(cache.yScale)
        .ticks(config.yTicks)
        .tickSize([config.tickSizes])
        .tickPadding(config.tickPadding)
        .tickFormat(format(config.yAxisFormat))

    if (cache.hasSecondAxis) {
      cache.yAxis2 = axisRight(cache.yScale2)
          .ticks(config.yTicks)
          .tickSize([config.tickSizes])
          .tickPadding(config.tickPadding)
          .tickFormat(format(config.yAxisFormat))
    }
  }

  function drawAxis () {
    cache.svg.select(".x-axis-group .axis.x")
        .attr("transform", `translate(0, ${cache.chartHeight})`)
        .call(cache.xAxis)

    cache.svg.select(".y-axis-group.axis.y")
        .attr("transform", `translate(${-config.xAxisPadding.left}, 0)`)
        .transition()
        .duration(config.axisTransitionDuration)
        .ease(config.ease)
        .call(cache.yAxis)

    if (cache.hasSecondAxis) {
      cache.svg.select(".y-axis-group2.axis.y")
          .attr("transform", `translate(${cache.chartWidth - config.xAxisPadding.right}, 0)`)
          .transition()
          .duration(config.axisTransitionDuration)
          .ease(config.ease)
          .call(cache.yAxis2)
    }
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
  }

  function drawGridLines () {
    if (config.grid === "horizontal" || config.grid === "full") {
      cache.horizontalGridLines = cache.svg.select(".grid-lines-group")
          .selectAll("line.horizontal-grid-line")
          .data(cache.yScale.ticks(config.yTicks))

      cache.horizontalGridLines.enter()
        .append("line")
        .attr("class", "horizontal-grid-line")
        .merge(cache.horizontalGridLines)
        .transition()
        .duration(config.axisTransitionDuration)
        .attr("x1", (-config.xAxisPadding.left))
        .attr("x2", cache.chartWidth)
        .attr("y1", cache.yScale)
        .attr("y2", cache.yScale)

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
        .attr("x1", cache.xScale)
        .attr("x2", cache.xScale)

      cache.verticalGridLines.exit().remove()
    }
  }

  return {
    buildAxis,
    drawAxis,
    drawAxisTitles,
    drawGridLines
  }
}
