import {keys} from "./helpers/constants"
import {override} from "./helpers/common"

export default function Bar (_container) {

  let config = {
    margin: {
      top: 60,
      right: 30,
      bottom: 40,
      left: 70
    },
    width: 800,
    height: 500,
    chartType: null
  }

  let scales = {
    colorScale: null,
    xScale: null,
    yScale: null,
    yScale2: null
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

    if (!cache.svg) {
      cache.svg = cache.container.append("g")
          .classed("mark-group", true)
    }
  }

  function drawBars () {
    const bars = cache.svg.selectAll(".mark")
        .data(data.dataBySeries[0].values)

    bars.enter()
      .append("rect")
      .attr("class", "mark rect")
      .merge(bars)
      .attr("x", (d) => scales.xScale(d[keys.DATA]))
      .attr("y", (d) => scales.yScale(d[keys.VALUE]))
      .attr("width", () => scales.xScale.bandwidth())
      .attr("height", (d) => cache.chartHeight - scales.yScale(d[keys.VALUE]))
      .style("stroke", "white")
      .style("fill", getColor)

    bars.exit().remove()
  }

  function drawStackedBars () {

    const stackedBarGroups = cache.svg.selectAll(".bar-group")
        .data(data.stack(data.stackData))

    const stackedUpdate = stackedBarGroups.enter()
      .append("g")
      .attr("class", "bar-group")
      .merge(stackedBarGroups)
      .attr("fill", (d) => scales.colorScale(d.key))
      .attr("stroke", "white")

    stackedBarGroups.exit().remove()

    const stackedBars = stackedUpdate.selectAll(".mark")
        .data((d) => d)

    stackedBars.enter()
      .append("rect")
      .attr("class", "mark")
      .merge(stackedBars)
      .attr("x", (d) => scales.xScale(d.data[keys.DATA]))
      .attr("y", (d) => scales.yScale(d[1]))
      .attr("height", (d) => scales.yScale(d[0]) - scales.yScale(d[1]))
      .attr("width", scales.xScale.bandwidth())

    stackedBars.exit().remove()
  }

  function drawMarks () {
    buildSVG()

    if (config.chartType === "bar") {
      drawBars()
    } else if (config.chartType === "stackedBar") {
      drawStackedBars()
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

  return {
    setConfig,
    setScales,
    setData,
    drawMarks
  }
}
