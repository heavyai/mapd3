import * as d3 from "./helpers/d3-service"

import {keys, dashStylesTranslation} from "./helpers/constants"
import {override} from "./helpers/common"

export default function Line (_container) {

  let config = {
    chartId: null,
    chartType: null,
    colorSchema: ["skyblue"],
    xDomain: "auto",

    chartHeight: null
  }

  let scales = {
    colorScale: null,
    styleScale: null,
    chartTypeScale: null,
    xScale: null,
    yScale: null,
    y2Scale: null
  }

  const cache = {
    container: _container,
    svg: null
  }

  let data = {
    dataBySeries: null,
    groupKeys: null,
    stack: null,
    stackData: null
  }

  const getColor = (d) => scales.colorScale(d[keys.ID])

  function build () {
    if (!cache.root) {
      cache.root = cache.container.append("g")
          .classed("mark-group", true)
    }
  }

  function drawLines () {
    const seriesLine = d3.line()
        .x((d) => scales.xScale(d[keys.KEY]))
        .y((d) => scales.yScale(d[keys.VALUE]))

    const seriesLine2 = d3.line()
        .x((d) => scales.xScale(d[keys.KEY]))
        .y((d) => scales.y2Scale(d[keys.VALUE]))

    if (Array.isArray(config.xDomain)) {
      seriesLine.defined((d) => d[keys.KEY] >= config.xDomain[0] && d[keys.KEY] <= config.xDomain[1])
      seriesLine2.defined((d) => d[keys.KEY] >= config.xDomain[0] && d[keys.KEY] <= config.xDomain[1])
    }

    let lineData = data.dataBySeries
    if (Array.isArray(config.chartType)) {
      lineData = lineData.filter((d, i) => config.chartType[i] === "line")
    }
    const lines = cache.root.selectAll(".mark")
        .data(lineData)

    lines.enter()
      .append("path")
      .merge(lines)
      .attr("class", "mark line")
      .attr('clip-path', `url(#mark-clip-${config.chartId})`)
      .classed("y2-line", (d) => d[keys.GROUP] > 0)
      .attr("d", (d) => {
        if (d[keys.GROUP] === 0) {
          return seriesLine(d[keys.VALUES])
        } else {
          return seriesLine2(d[keys.VALUES])
        }
      })
      .style("stroke", getColor)
      .style("fill", "none")
      .attr("stroke-dasharray", d => {
        const style = scales.styleScale(d[keys.ID])
        return dashStylesTranslation[style]
      })

    lines.exit().remove()
  }

  function drawAreas () {
    const seriesArea = d3.area()
        .x((d) => scales.xScale(d[keys.KEY]))
        .y0((d) => scales.yScale(d[keys.VALUE]))
        .y1(() => config.chartHeight)

    const seriesArea2 = d3.area()
        .x((d) => scales.xScale(d[keys.KEY]))
        .y0((d) => scales.y2Scale(d[keys.VALUE]))
        .y1(() => config.chartHeight)
        .curve(d3.curveCatmullRom)

    const areas = cache.root.selectAll(".mark")
        .data(data.dataBySeries)

    areas.enter()
      .append("path")
      .merge(areas)
      .attr("class", "mark area")
      .attr('clip-path', `url(#mark-clip-${config.chartId})`)
      .classed("y2-area", (d) => d[keys.GROUP] > 0)
      .attr("d", (d) => {
        if (d[keys.GROUP] === 0) {
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
        .x((d) => scales.xScale(d.data[keys.KEY]))
        .y0((d) => scales.yScale(d[0]))
        .y1((d) => scales.yScale(d[1]))

    const areas = cache.root.selectAll(".mark")
        .data(data.stack(data.stackData))

    areas.enter()
      .append("path")
      .merge(areas)
      .attr("class", "mark stacked-area")
      .attr('clip-path', `url(#mark-clip-${config.chartId})`)
      .attr("d", seriesLine)
      .style("stroke", "none")
      .style("fill", (d) => scales.colorScale(d.key))

    areas.exit().remove()
  }

  function setConfig (_config) {
    config = override(config, _config)
    return this
  }

  function setScales (_scales) {
    scales = override(scales, _scales)
    return this
  }

  function setData (_data) {
    data = Object.assign({}, data, _data)
    return this
  }

  function render () {
    build()

    if (config.chartType === "area") {
      drawAreas()
    } else if (config.chartType === "line" || Array.isArray(config.chartType)) {
      drawLines()
    } else if (config.chartType === "stackedArea") {
      drawStackedAreas()
    }
  }

  function destroy () {
    if (cache.root) {
      cache.root.remove()
      cache.root = null
    }
    return this
  }

  return {
    setConfig,
    setScales,
    setData,
    render,
    destroy
  }
}
