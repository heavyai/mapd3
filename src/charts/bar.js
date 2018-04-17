import {keys} from "./helpers/constants"
import {override} from "./helpers/common"

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
    barSpacingPercent: 10,

    markWidth: null,
    chartWidth: null,
    chartHeight: null,
    markPanelWidth: null,
    selectedKeys: []
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
    svg: null
  }

  let data = {
    dataBySeries: null,
    groupKeys: null,
    stack: null,
    stackData: null
  }

  const MIN_BAR_HEIGHT = 1
  const DIMMED_COLOR = "silver"

  const getColor = (d) => {
    const key = d.data && d.data.key

    if (key && Array.isArray(config.selectedKeys) && config.selectedKeys.length) {
      if (config.selectedKeys.indexOf(key) > -1) {
        return scales.colorScale(d.id)
      } else {
        return DIMMED_COLOR
      }
    } else {
      return scales.colorScale(d.id)
    }
  }

  function build () {
    if (!cache.root) {
      cache.root = cache.container.append("g")
        .classed("mark-group", true)
    }
  }

  function drawBars () {
    const markCount = data.dataByKey && data.dataByKey.length || 1

    let barData = []
    if (Array.isArray(config.chartType)) {
      barData = data.dataBySeries.filter((d, i) => config.chartType[i] === "bar")
    } else if (config.chartType === "bar" || config.chartType === "groupedBar") {
      barData = data.dataBySeries
    }

    const groupMemberCount = barData.length
    const groupW = markCount ? (config.markPanelWidth / markCount) : 0
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
      .attr("clip-path", `url(#mark-clip-${config.chartId})`)
      .merge(bars)
      .attr("x", (d) => {
        if (config.chartType === "groupedBar" || barData.length > 1) {
          const x = scales.xScale(d[keys.KEY]) - groupW / 2 + groupedBarW * d.index + gutterW / 2
          return Math.max(x, 0)
        } else {
          return Math.max(scales.xScale(d[keys.KEY]) - config.markWidth / 2, 0)
        }
      })
      .attr("y", (d) => {
        if (d[keys.GROUP] === 0) {
          return Math.min(scales.yScale(d[keys.VALUE]), config.chartHeight - MIN_BAR_HEIGHT)
        } else {
          return Math.min(scales.y2Scale(d[keys.VALUE]), config.chartHeight - MIN_BAR_HEIGHT)
        }
      })
      .attr("width", () => {
        if (config.chartType === "groupedBar" || barData.length > 1) {
          return groupedBarW
        } else {
          return config.markWidth
        }
      })
      .attr("height", (d) => {
        if (d[keys.GROUP] === 0) {
          return Math.max(config.chartHeight - scales.yScale(d[keys.VALUE]), MIN_BAR_HEIGHT)
        } else {
          return Math.max(config.chartHeight - scales.y2Scale(d[keys.VALUE]), MIN_BAR_HEIGHT)
        }
      })
      .style("stroke", "white")
      .style("fill", getColor)

    bars.exit().remove()
  }

  function drawStackedBars () {
    const stack = data.stack(data.stackData)
    const gutterW = config.markWidth / 100 * config.barSpacingPercent

    const stackedBarGroups = cache.root.selectAll(".bar-group")
      .data(stack)

    const stackedUpdate = stackedBarGroups.enter()
      .append("g")
      .attr("class", "bar-group")
      .merge(stackedBarGroups)
      .attr("stroke", "white")

    stackedBarGroups.exit().remove()

    const stackedBars = stackedUpdate.selectAll(".mark")
      .data((d, i, p) => {
        // add the id to individual datum to use for choosing color
        const datum = d.map(dB => ({...dB, id: p[i].__data__.key}))
        return datum
      })

    stackedBars.enter()
      .append("rect")
      .attr("class", "mark bar")
      .attr("clip-path", `url(#mark-clip-${config.chartId})`)
      .merge(stackedBars)
      .attr("x", (d) => scales.xScale(d.data[keys.KEY]) - config.markWidth / 2 + gutterW / 2)
      .attr("y", (d) => scales.yScale(d[1]))
      .attr("height", (d) => Math.max(scales.yScale(d[0]) - scales.yScale(d[1]), MIN_BAR_HEIGHT))
      .attr("width", config.markWidth - gutterW)
      .attr("fill", getColor)

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
