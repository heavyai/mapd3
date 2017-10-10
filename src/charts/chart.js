import {bisector} from "d3-array"
import {nest} from "d3-collection"
import {dispatch} from "d3-dispatch"
import {easeLinear} from "d3-ease"
import {select, mouse} from "d3-selection"

import {exportChart} from "./helpers/exportChart"
import {colors} from "./helpers/colors"
import {keys} from "./helpers/constants"
import {cloneData, getUnique, invertScale, sortData} from "./helpers/common"

import Scale from "./scale"
import Line from "./line"
import Bar from "./bar"
import Axis from "./axis"

export default function Chart (_container) {

  let config = {
    margin: {
      top: 48,
      right: 32,
      bottom: 48,
      left: 32
    },
    width: 800,
    height: 500,
    xAxisPadding: {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0
    },
    tickPadding: 5,
    colorSchema: colors.mapdColors.map((d) => ({value: d})),
    dotRadius: 4,
    xAxisFormat: "%c",
    tickSkip: 1,
    tickSizes: 8,
    defaultColor: "skyblue",

    isAnimated: false,
    ease: easeLinear,
    animationDuration: 1500,
    axisTransitionDuration: 0,

    yTicks: 5,
    yTicks2: 5,
    yAxisFormat: ".2f",
    yAxisFormat2: ".2f",

    keyType: "time",
    chartType: "line" // line, area, stackedLine, stackedArea
  }

  const cache = {
    container: _container,
    svg: null,
    maskingRectangle: null,
    verticalGridLines: null,
    horizontalGridLines: null,
    grid: null,
    verticalMarkerContainer: null,
    verticalMarkerLine: null,

    dataBySeries: null,
    dataByKey: null,
    data: null,
    chartWidth: null, chartHeight: null,
    xScale: null, yScale: null, yScale2: null, colorScale: null,
    xAxis: null, yAxis: null, yAxis2: null,
    groupKeys: [],
    hasSecondAxis: false,

    stackData: null,
    stack: null,
    flatDataSorted: null
  }

  const components = {
    scale: null,
    axis: null,
    line: null,
    bar: null,
    hover: null
  }

  // accessors
  const getKey = (d) => d[keys.DATA]
  const getGroup = (d) => d[keys.GROUP]

  // events
  const dispatcher = dispatch("mouseOver", "mouseOut", "mouseMove")

  function init () {
    render()
    addMouseEvents()
  }
  init()

  function render () {
    buildSVG()

    if (cache.dataBySeries) {
      buildChart()
    }

    return this
  }

  function buildSVG () {
    const w = config.width || cache.container.clientWidth
    const h = config.height || cache.container.clientHeight
    cache.chartWidth = w - config.margin.left - config.margin.right
    cache.chartHeight = h - config.margin.top - config.margin.bottom

    if (!cache.svg) {
      const template = `<svg class="mapd3 line-chart">
        <g class="container-group">
          <g class="grid-lines-group"></g>
          <g class="x-axis-group">
            <g class="axis x"></g>
          </g>
          <g class="y-axis-group axis y"></g>
          <g class="y-axis-group2 axis y"></g>
          <g class="chart-group"></g>
        </g>
        <rect class="masking-rectangle"></rect>
      </svg>`

      cache.svg = select(cache.container)
          .html(template)
          .select("svg")
    }

    cache.svg.attr("width", config.width)
      .attr("height", config.height)
      .select(".container-group")
      .attr("transform", `translate(${config.margin.left},${config.margin.top})`)

    return this
  }

  function buildChart () {
    components.scale = Scale(config, cache)
    components.line = Line(config, cache)
    components.bar = Bar(config, cache)
    components.axis = Axis(config, cache)

    if (config.chartType === "stackedLine"
      || config.chartType === "stackedArea"
      || config.chartType === "stackedBar") {
      components.scale.buildStackedScales()
    } else {
      components.scale.buildScales()
    }

    components.axis.buildAxis()
    components.axis.drawGridLines()
    components.axis.drawAxis()

    if (config.chartType === "area") {
      components.line.drawAreas()
    } else if (config.chartType === "line") {
      components.line.drawLines()
    } else if (config.chartType === "stackedArea") {
      components.line.drawStackedAreas()
    } else if (config.chartType === "bar") {
      components.bar.drawBars()
    } else if (config.chartType === "stackedBar") {
      components.bar.drawStackedBars()
    }

    triggerIntroAnimation()

    return this
  }

  function setData (_data) {
    cache.data = cloneData(_data[keys.SERIES])
    const cleanedData = cleanData(_data)
    cache.dataBySeries = cleanedData.dataBySeries
    cache.dataByKey = cleanedData.dataByKey

    render()

    return this
  }

  function cleanData (_data) {
    const dataBySeries = cloneData(_data[keys.SERIES])
    const flatData = []

    // Normalize dataBySeries
    dataBySeries.forEach((serie) => {
      serie[keys.VALUES] = sortData(serie[keys.VALUES], config.keyType)
      serie[keys.VALUES].forEach((d) => {
        d[keys.DATA] = config.keyType === "time" ? new Date(d[keys.DATA]) : d[keys.DATA]
        d[keys.VALUE] = Number(d[keys.VALUE])
      })
    })

    dataBySeries.forEach((serie) => {
      serie[keys.VALUES].forEach((d) => {
        const dataPoint = {}
        dataPoint[keys.LABEL] = serie[keys.LABEL]
        dataPoint[keys.GROUP] = serie[keys.GROUP]
        dataPoint[keys.ID] = serie[keys.ID]
        dataPoint[keys.DATA] = config.keyType === "time" ? new Date(d[keys.DATA]) : d[keys.DATA]
        dataPoint[keys.VALUE] = d[keys.VALUE]
        flatData.push(dataPoint)
      })
    })

    cache.flatDataSorted = sortData(flatData, config.keyType)

    const dataByKey = nest()
      .key(getKey)
      .entries(cache.flatDataSorted)
      .map((d) => {
        const dataPoint = {}
        dataPoint[keys.DATA] = config.keyType === "time" ? new Date(d.key) : d.key
        dataPoint[keys.SERIES] = d.values
        return dataPoint
      })

    const allGroupKeys = dataBySeries.map(getGroup)
    cache.groupKeys = getUnique(allGroupKeys)

    return {dataBySeries, dataByKey}
  }

  function triggerIntroAnimation () {
    if (config.isAnimated) {
      cache.maskingRectangle = cache.svg.select(".masking-rectangle")
        .attr("width", cache.chartWidth - 2)
        .attr("height", cache.chartHeight)
        .attr("x", config.margin.left + 1)
        .attr("y", config.margin.top)

      cache.maskingRectangle.transition()
        .duration(config.animationDuration)
        .ease(config.ease)
        .attr("width", 0)
        .attr("x", config.width - config.margin.right)
        .on("end", () => cache.maskingRectangle.remove())
    }
  }

  function getNearestDataPoint (_mouseX) {
    const keyFromInvertedX = invertScale(cache.xScale, _mouseX, config.keyType)
    const bisectLeft = bisector(getKey).left
    const dataEntryIndex = bisectLeft(cache.dataByKey, keyFromInvertedX)
    const dataEntryForXPosition = cache.dataByKey[dataEntryIndex]
    let nearestDataPoint = null

    if (keyFromInvertedX) {
      nearestDataPoint = dataEntryForXPosition
    }
    return nearestDataPoint
  }

  function addMouseEvents () {
    cache.svg
      .on("mouseover.dispatch", function mouseover (d) {
        if (!cache.data) { return }
        dispatcher.call("mouseOver", this, d, mouse(this))
      })
      .on("mouseout.dispatch", function mouseout (d) {
        if (!cache.data) { return }
        dispatcher.call("mouseOut", this, d, mouse(this))
      })
      .on("mousemove.dispatch", function mousemove () {
        if (!cache.data) { return }
        const mouseX = mouse(this)[0]
        const xPosition = mouseX - config.margin.left
        const dataPoint = getNearestDataPoint(xPosition)

        if (dataPoint) {
          const dataPointXPosition = cache.xScale(dataPoint[keys.DATA])
          dispatcher.call("mouseMove", this, dataPoint, dataPointXPosition)
        }
      })
  }

  function save (_filename, _title) {
    exportChart.call(this, cache.svg, _filename, _title)
  }

  function on (...args) {
    return dispatcher.on(...args)
  }

  function setConfig (_config) {
    config = Object.assign({}, config, _config)
    return this
  }

  function getConfig () {
    return config
  }

  function getCache () {
    return cache
  }

  function destroy () {
    cache.svg.on(".", null).remove()
  }

  return {
    render,
    setConfig,
    setData,
    getCache,
    getConfig,
    on,
    save,
    destroy
  }
}
