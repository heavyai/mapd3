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
    chartTypeScale: null,
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

  function build () {
    cache.chartWidth = config.width - config.margin.left - config.margin.right
    cache.chartHeight = config.height - config.margin.top - config.margin.bottom

    if (!cache.root) {
      cache.root = cache.container.append("g")
          .classed("mark-group", true)
    }
  }

  function drawBars () {
    const stack = data.stack(data.stackData)
    const barW = cache.chartWidth / stack[0].length
    const MIN_BAR_HEIGHT = 1

    let barData = []
    if (Array.isArray(config.chartType)) {
      barData = data.dataBySeries.filter((d, i) => config.chartType[i] === "bar")
    } else if(config.chartType === "bar") {
      barData = data.dataBySeries
    }

    const barLayer = cache.root.selectAll(".bar-layer")
        .data(barData)

    const barLayerUpdate = barLayer.enter()
      .append("g")
      .attr("class", "bar-layer")
      .merge(barLayer)

    barLayer.exit().remove()

    const bars = barLayerUpdate.selectAll(".mark")
        .data((d, i) => {
          const datum = d.values.map(dB => {
              const dBClone = Object.assign({}, dB)
              dBClone.id = d[keys.ID]
              dBClone.group = d[keys.GROUP]
              return dBClone
            })
          return datum
        })

    bars.enter()
      .append("rect")
      .attr("class", "mark rect")
      .attr('clip-path', 'url(#mark-clip)')
      .merge(bars)
      .attr("x", (d) => scales.xScale(d[keys.KEY]) - barW / 2)
      .attr("y", (d) => {
        if (d[keys.GROUP] === 0) {
          return scales.yScale(d[keys.VALUE])
        } else {
          return scales.y2Scale(d[keys.VALUE])
        }
      })
      .attr("width", () => barW)
      .attr("height", (d) => {
        if (d[keys.GROUP] === 0) {
          return Math.max(cache.chartHeight - scales.yScale(d[keys.VALUE]), MIN_BAR_HEIGHT)
        } else {
          return Math.max(cache.chartHeight - scales.y2Scale(d[keys.VALUE]), MIN_BAR_HEIGHT)
        }
      })
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
      .attr('clip-path', 'url(#mark-clip)')
      .merge(stackedBars)
      .attr("x", (d) => scales.xScale(d.data[keys.KEY])- barW / 2)
      .attr("y", (d) => scales.yScale(d[1]) )
      .attr("height", (d) => scales.yScale(d[0]) - scales.yScale(d[1]))
      .attr("width", barW)

    stackedBars.exit().remove()
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

    if (config.chartType === "stackedBar") {
      drawStackedBars()
    } else {
      drawBars()
    }
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
    render,
    destroy
  }
}
