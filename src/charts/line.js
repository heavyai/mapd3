import * as d3 from "./helpers/d3-service"

import {keys} from "./helpers/constants"
import {override} from "./helpers/common"

export default function Line () {

  let config = {
    colorScale: null,
    xScale: null,
    yScale: null,
    yScale2: null,
    svg: null,
    chartHeight: null
  }

  let data = {
    dataBySeries: null,
    groupKeys: null,
    stack: null,
    stackData: null
  }

  const getColor = (d) => config.colorScale(d[keys.ID])

  function drawLines () {
    const seriesLine = d3.line()
        .x((d) => config.xScale(d[keys.DATA]))
        .y((d) => config.yScale(d[keys.VALUE]))

    const seriesLine2 = d3.line()
        .x((d) => config.xScale(d[keys.DATA]))
        .y((d) => config.yScale2(d[keys.VALUE]))
        .curve(d3.curveCatmullRom)

    const lines = config.svg.select(".chart-group").selectAll(".mark")
        .data(data.dataBySeries)

    lines.enter()
      .append("path")
      .attr("class", () => ["mark", "d3.line"].join(" "))
      .merge(lines)
      .attr("d", (d) => {
        if (d[keys.GROUP] === data.groupKeys[0]) {
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
        .x((d) => config.xScale(d[keys.DATA]))
        .y0((d) => config.yScale(d[keys.VALUE]))
        .y1(() => config.chartHeight)

    const seriesArea2 = d3.area()
        .x((d) => config.xScale(d[keys.DATA]))
        .y0((d) => config.yScale2(d[keys.VALUE]))
        .y1(() => config.chartHeight)
        .curve(d3.curveCatmullRom)

    const areas = config.svg.select(".chart-group").selectAll(".mark")
        .data(data.dataBySeries)

    areas.enter()
      .append("path")
      .attr("class", () => ["mark", "d3.area"].join(" "))
      .merge(areas)
      .attr("d", (d) => {
        if (d[keys.GROUP] === data.groupKeys[0]) {
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
        .x((d) => config.xScale(d.data[keys.DATA]))
        .y0((d) => config.yScale(d[0]))
        .y1((d) => config.yScale(d[1]))

    const areas = config.svg.select(".chart-group").selectAll(".mark")
        .data(data.stack(data.stackData))

    areas.enter()
      .append("path")
      .attr("class", () => ["mark", "stacked-d3.area"].join(" "))
      .merge(areas)
      .attr("d", seriesLine)
      .style("stroke", "none")
      .style("fill", (d) => config.colorScale(d.key))

    areas.exit().remove()
  }

  function setConfig (_config) {
    config = override(config, _config)
    return this
  }

  function setData (_data) {
    data = Object.assign({}, data, _data)
    return this
  }

  return {
    setConfig,
    setData,
    drawLines,
    drawAreas,
    drawStackedAreas
  }
}
