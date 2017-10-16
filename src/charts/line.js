import * as d3 from "./helpers/d3-service"

import {keys} from "./helpers/constants"

export default function Line (config, cache) {

  const getColor = (d) => cache.colorScale(d[keys.ID])

  function drawLines () {
    const seriesLine = d3.line()
        .x((d) => cache.xScale(d[keys.DATA]))
        .y((d) => cache.yScale(d[keys.VALUE]))

    const seriesLine2 = d3.line()
        .x((d) => cache.xScale(d[keys.DATA]))
        .y((d) => cache.yScale2(d[keys.VALUE]))
        .curve(d3.curveCatmullRom)

    const lines = cache.svg.select(".chart-group").selectAll(".mark")
        .data(cache.dataBySeries)

    lines.enter()
      .append("path")
      .attr("class", () => ["mark", "d3.line"].join(" "))
      .merge(lines)
      .attr("d", (d) => {
        if (d[keys.GROUP] === cache.groupKeys[0]) {
          return seriesLine(d[keys.VALUES])
        } else {
          return seriesLine2(d[keys.VALUES])
        }
      })
      .style("stroke", getColor)
      .style("fill", "none")

    lines.exit().remove()
  }

  function drawAreas () {
    const seriesArea = d3.area()
        .x((d) => cache.xScale(d[keys.DATA]))
        .y0((d) => cache.yScale(d[keys.VALUE]))
        .y1(() => cache.chartHeight)

    const seriesArea2 = d3.area()
        .x((d) => cache.xScale(d[keys.DATA]))
        .y0((d) => cache.yScale2(d[keys.VALUE]))
        .y1(() => cache.chartHeight)
        .curve(d3.curveCatmullRom)

    const areas = cache.svg.select(".chart-group").selectAll(".mark")
        .data(cache.dataBySeries)

    areas.enter()
      .append("path")
      .attr("class", () => ["mark", "d3.area"].join(" "))
      .merge(areas)
      .attr("d", (d) => {
        if (d[keys.GROUP] === cache.groupKeys[0]) {
          return seriesArea(d[keys.VALUES])
        } else {
          return seriesArea2(d[keys.VALUES])
        }
      })
      .style("stroke", getColor)
      .style("fill", getColor)

    areas.exit().remove()
  }

  function drawStackedAreas () {
    const seriesLine = d3.area()
        .x((d) => cache.xScale(d.data[keys.DATA]))
        .y0((d) => cache.yScale(d[0]))
        .y1((d) => cache.yScale(d[1]))

    const areas = cache.svg.select(".chart-group").selectAll(".mark")
        .data(cache.stack(cache.stackData))

    areas.enter()
      .append("path")
      .attr("class", () => ["mark", "stacked-d3.area"].join(" "))
      .merge(areas)
      .attr("d", seriesLine)
      .style("stroke", "none")
      .style("fill", (d) => cache.colorScale(d.key))

    areas.exit().remove()
  }

  return {
    drawLines,
    drawAreas,
    drawStackedAreas
  }
}
