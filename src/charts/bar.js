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
    y2Scale: null
  }

  const cache = {
    container: _container,
    svg: null,
    chartHeight: null,
    chartWidth: null
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
  }

  function drawBars () {
    const values = data.dataBySeries[0].values
    const barW = cache.chartWidth / values.length

    const bars = cache.root.selectAll(".mark")
        .data(values)

    bars.enter()
      .append("rect")
      .attr("class", "mark rect")
      .merge(bars)
      .attr("x", (d) => scales.xScale(d[keys.KEY]) - barW / 2)
      .attr("y", (d) => scales.yScale(d[keys.VALUE]))
      .attr("width", () => barW)
      .attr("height", (d) => cache.chartHeight - scales.yScale(d[keys.VALUE]))
      .style("stroke", "white")
      .style("fill", getColor)

    bars.exit().remove()
  }

  function drawStackedBars () {
    const stack = data.stack(data.stackData)
    const barW = cache.chartWidth / stack[0].length

    const stackedBarGroups = cache.root.selectAll(".bar-group")
        .data(stack)

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
      .attr("x", (d) => scales.xScale(d.data[keys.KEY])- barW / 2)
      .attr("y", (d) => scales.yScale(d[1]) )
      .attr("height", (d) => scales.yScale(d[0]) - scales.yScale(d[1]))
      .attr("width", barW)

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

  function destroy () {
    if (cache.root) {
      cache.root.remove()
      cache.root = null
    }
  }

  return {
    setConfig,
    setScales,
    setData,
    drawMarks,
    destroy
  }
}
