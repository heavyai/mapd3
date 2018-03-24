import {keys, MIN_MARK_WIDTH, MAX_MARK_WIDTH} from "./helpers/constants"
import {override, getSizes} from "./helpers/common"

export default function Bar (_container) {

  let config = {
    margin: {
      top: 60,
      right: 30,
      bottom: 40,
      left: 0
    },
    width: 800,
    height: 500,
    chartId: null,
    chartType: null,
    barSpacingPercent: 10
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

  const MIN_BAR_HEIGHT = 1

  const getColor = (d) => scales.colorScale(d[keys.ID])

  function build () {
    if (!cache.root) {
      cache.root = cache.container.append("g")
          .classed("mark-group", true)
    }

    const {chartWidth, chartHeight} = getSizes(config, cache)
    cache.chartWidth = chartWidth
    cache.chartHeight = chartHeight
  }

  function drawBars () {
    const stack = data.stack(data.stackData)

    let barData = []
    if (Array.isArray(config.chartType)) {
      barData = data.dataBySeries.filter((d, i) => config.chartType[i] === "bar")
    } else if(config.chartType === "bar" || config.chartType === "groupedBar") {
      barData = data.dataBySeries
    }

    const groupCount = (stack[0] && stack[0].length) || 1
    const groupMemberCount = barData.length
    const groupW = groupCount ? (cache.chartWidth / groupCount) : 0
    const barW = Math.min(groupW, MAX_MARK_WIDTH)
    const gutterW = groupW / 100 * config.barSpacingPercent
    const groupedBarW = groupMemberCount ? ((groupW - gutterW) / groupMemberCount) : 0

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
              dBClone.index = i
              return dBClone
            })
          return datum
        })

    bars.enter()
      .append("rect")
      .attr("class", "mark bar")
      .attr('clip-path', `url(#mark-clip-${config.chartId})`)
      .merge(bars)
      .attr("x", (d, i) => {
        if (config.chartType === "groupedBar" || barData.length > 1) {
          const x = scales.xScale(d[keys.KEY]) - groupW / 2 + groupedBarW * d.index + gutterW / 2
          return Math.max(x, 0)
        } else {
          return Math.max(scales.xScale(d[keys.KEY]) - barW / 2, 0)
        }
      })
      .attr("y", (d) => {
        if (d[keys.GROUP] === 0) {
          return Math.min(scales.yScale(d[keys.VALUE]), cache.chartHeight - MIN_BAR_HEIGHT)
        } else {
          return Math.min(scales.y2Scale(d[keys.VALUE]), cache.chartHeight - MIN_BAR_HEIGHT)
        }
      })
      .attr("width", () => {
        if (config.chartType === "groupedBar" || barData.length > 1) {
          return groupedBarW
        } else {
          return barW
        }
      })
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
    const stackCount = stack[0] && stack[0].length || 1
    let barW = Math.min(cache.chartWidth / stackCount, MAX_MARK_WIDTH)
    if (barW < MIN_MARK_WIDTH) {
      barW = MIN_MARK_WIDTH
    }
    const gutterW = barW / 100 * config.barSpacingPercent

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
      .attr("class", "mark bar")
      .attr('clip-path', `url(#mark-clip-${config.chartId})`)
      .merge(stackedBars)
      .attr("x", (d) => scales.xScale(d.data[keys.KEY])- barW / 2 + gutterW / 2)
      .attr("y", (d) => scales.yScale(d[1]) )
      .attr("height", (d) => Math.max(scales.yScale(d[0]) - scales.yScale(d[1]), MIN_BAR_HEIGHT))
      .attr("width", barW - gutterW)

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
