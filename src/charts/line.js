import * as d3 from "./helpers/d3-service"

import {keys} from "./helpers/constants"
import {override} from "./helpers/common"

export default function Line (_container) {

  let config = {
    margin: {
      top: 60,
      right: 30,
      bottom: 40,
      left: 70
    },
    width: 800,
    height: 500,
    chartType: null,
    colorSchema: ["skyblue"],
    xDomain: "auto"
  }

  let scales = {
    colorScale: null,
    xScale: null,
    yScale: null,
    y2Scale: null
  }

  const cache = {
    container: _container,
    svg: null,
    chartHeight: null
  }

  let data = {
    dataBySeries: null,
    groupKeys: null,
    stack: null,
    stackData: null
  }

  const getColor = (d) => scales.colorScale(d[keys.ID])

  function buildSVG () {
    cache.chartWidth = config.width - config.margin.left - config.margin.right
    cache.chartHeight = config.height - config.margin.top - config.margin.bottom

    if (!cache.root) {
      cache.root = cache.container.append("g")
          .classed("mark-group", true)
    }

    cache.container.select(function () {
      const svg = d3.select(this.parentNode)
      cache.clipPath = svg
        .append('defs')
        .append('clipPath')
        .attr('id', 'line-clip')
      cache.clipPath.append('rect')
        .attr('width', cache.chartWidth)
        .attr('height', cache.chartHeight)
        .attr('transform', `translate(${config.margin.left}, ${config.margin.top})`)
      svg.select('.masking-rectangle')
        .attr('clip-path', 'url(#line-clip)')
        .attr('width', cache.chartWidth)
        .attr('height', cache.chartHeight)
        .attr('transform', `translate(${config.margin.left}, ${config.margin.top})`)
    })
  }

  function drawLines () {
    const styleLookup = {}
    config.colorSchema.forEach(d => {
      styleLookup[d.key] = d.style
    })
    const stylesTranslation = {
      dashes: "5, 4",
      solid: null,
      dotted: "1 4"
    }
    const seriesLine = d3.line()
        .x((d) => scales.xScale(d[keys.DATA]))
        .y((d) => scales.yScale(d[keys.VALUE]))

    const seriesLine2 = d3.line()
        .x((d) => scales.xScale(d[keys.DATA]))
        .y((d) => scales.y2Scale(d[keys.VALUE]))
        .curve(d3.curveCatmullRom)

    if (Array.isArray(config.xDomain)) {
      seriesLine.defined((d) => d[keys.DATA] >= config.xDomain[0] && d[keys.DATA] <= config.xDomain[1])
      seriesLine2.defined((d) => d[keys.DATA] >= config.xDomain[0] && d[keys.DATA] <= config.xDomain[1])
    }

    const lines = cache.root.selectAll(".mark")
        .data(data.dataBySeries)

    lines.enter()
      .append("path")
      .merge(lines)
      .attr("class", "mark line")
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
        const style = styleLookup[d[keys.ID]]
        return stylesTranslation[style]
      })


    lines.exit().remove()
  }

  function drawAreas () {
    const seriesArea = d3.area()
        .x((d) => scales.xScale(d[keys.DATA]))
        .y0((d) => scales.yScale(d[keys.VALUE]))
        .y1(() => cache.chartHeight)

    const seriesArea2 = d3.area()
        .x((d) => scales.xScale(d[keys.DATA]))
        .y0((d) => scales.y2Scale(d[keys.VALUE]))
        .y1(() => cache.chartHeight)
        .curve(d3.curveCatmullRom)

    const areas = cache.root.selectAll(".mark")
        .data(data.dataBySeries)

    areas.enter()
      .append("path")
      .merge(areas)
      .attr("class", "mark area")
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
        .x((d) => scales.xScale(d.data[keys.DATA]))
        .y0((d) => scales.yScale(d[0]))
        .y1((d) => scales.yScale(d[1]))

    const areas = cache.root.selectAll(".mark")
        .data(data.stack(data.stackData))

    areas.enter()
      .append("path")
      .merge(areas)
      .attr("class", "mark stacked-area")
      .attr("d", seriesLine)
      .style("stroke", "none")
      .style("fill", (d) => scales.colorScale(d.key))

    areas.exit().remove()
  }

  function drawMarks () {
    buildSVG()

    if (config.chartType === "area") {
      drawAreas()
    } else if (config.chartType === "line") {
      drawLines()
    } else if (config.chartType === "stackedArea") {
      drawStackedAreas()
    }
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
    drawMarks,
    destroy
  }
}
