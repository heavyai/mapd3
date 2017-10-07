import {area, curveCatmullRom, line} from "d3-shape"

import {keys} from "./helpers/constants"

export default function Line (config, cache) {

  const getColor = (d) => cache.colorScale(d[keys.ID])

  function drawLines () {
    const seriesLine = line()
        .x((d) => cache.xScale(d[keys.DATA]))
        .y((d) => cache.yScale(d[keys.VALUE]))

    const seriesLine2 = line()
        .x((d) => cache.xScale(d[keys.DATA]))
        .y((d) => cache.yScale2(d[keys.VALUE]))
        .curve(curveCatmullRom)

    const lines = cache.svg.select(".chart-group").selectAll(".mark")
        .data(cache.dataBySeries)

    lines.enter()
      .append("path")
      .attr("class", () => ["mark", "line"].join(" "))
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
    const seriesArea = area()
        .x((d) => cache.xScale(d[keys.DATA]))
        .y0((d) => cache.yScale(d[keys.VALUE]))
        .y1(() => cache.chartHeight)

    const seriesArea2 = area()
        .x((d) => cache.xScale(d[keys.DATA]))
        .y0((d) => cache.yScale2(d[keys.VALUE]))
        .y1(() => cache.chartHeight)
        .curve(curveCatmullRom)

    const areas = cache.svg.select(".chart-group").selectAll(".mark")
        .data(cache.dataBySeries)

    areas.enter()
      .append("path")
      .attr("class", () => ["mark", "area"].join(" "))
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
    const seriesLine = area()
        .x((d) => cache.xScale(d.data[keys.DATA]))
        .y0((d) => cache.yScale(d[0]))
        .y1((d) => cache.yScale(d[1]))

    const areas = cache.svg.select(".chart-group").selectAll(".mark")
        .data(cache.stack(cache.stackData))

    areas.enter()
      .append("path")
      .attr("class", () => ["mark", "stacked-area"].join(" "))
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
