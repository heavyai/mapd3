import * as d3 from "./helpers/d3-service"

import {colors} from "./helpers/colors"
import {keys} from "./helpers/constants"
import {cloneData, getUnique, invertScale, sortData, override, throttle, rebind} from "./helpers/common"

import Scale from "./scale"
import Line from "./line"
import Bar from "./bar"
import Axis from "./axis"
import Tooltip from "./tooltip"
import Legend from "./legend"
import Brush from "./brush"
import Hover from "./hover"
import Binning from "./binning"
import DomainEditor from "./domain-editor"
import BrushRangeEditor from "./brush-range-editor"
import Label from "./label"

export default function Chart (_container) {

  let config = {
    // common
    margin: {
      top: 48,
      right: 32,
      bottom: 48,
      left: 32
    },
    width: 800,
    height: 500,
    keyType: "time",
    chartType: "line", // line, area, stackedLine, stackedArea
    ease: d3.easeLinear,

    // intro animation
    isAnimated: false,
    animationDuration: 1500,

    // scale
    colorSchema: colors.mapdColors.map((d) => ({value: d})),
    defaultColor: "skyblue",

    // axis
    xAxisPadding: {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0
    },
    tickPadding: 5,
    xAxisFormat: "%c",
    tickSkip: 1,
    tickSizes: 8,
    yTicks: 5,
    yTicks2: 5,
    yAxisFormat: ".2f",
    yAxisFormat2: ".2f",
    grid: null,
    axisTransitionDuration: 0,

    xTitle: "",
    yTitle: "",

    // hover
    dotRadius: 4,

    // tooltip
    valueFormat: ".2f",
    tooltipMaxTopicLength: 170,
    tooltipBorderRadius: 3,
    mouseChaseDuration: 0,
    tooltipEase: d3.easeQuadInOut,
    tooltipHeight: 48,
    tooltipWidth: 160,
    dateFormat: "%b %d, %Y",
    seriesOrder: []
  }

  let scales = {
    xScale: null,
    yScale: null,
    yScale2: null,
    hasSecondAxis: null,
    colorScale: null
  }

  const cache = {
    container: _container,
    svg: null,
    panel: null,
    margin: null,
    maskingRectangle: null,
    chartWidth: null, chartHeight: null,
    xAxis: null, yAxis: null, yAxis2: null,

    dataBySeries: null,
    dataByKey: null,
    data: null,
    groupKeys: [],
    hasSecondAxis: false,
    stackData: null,
    stack: null,
    flatDataSorted: null
  }

  // accessors
  const getKey = (d) => d[keys.DATA]
  const getGroup = (d) => d[keys.GROUP]

  // events
  const dispatcher = d3.dispatch("mouseOverPanel", "mouseOutPanel", "mouseMovePanel")
  const eventCollector = {}

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
      const template = `<div class="mapd3 mapd3-container">
        <div class="header-group"></div>
        <svg class="chart">
          <g class="chart-group"></g>
          <g class="panel-group">
            <rect class="panel-background"></rect>
          </g>
          <rect class="masking-rectangle"></rect>
        </svg>
      </div>`

      const base = d3.select(cache.container)
          .html(template)

      cache.container = base.select(".mapd3-container")
          .style("position", "relative")

      cache.svg = base.select("svg")
      cache.headerGroup = base.select(".header-group")
          .style("position", "absolute")
      cache.panel = cache.svg.select(".panel-group")
      cache.chart = cache.svg.select(".chart-group")

      addEvents()
    }

    cache.svg
      .attr("width", config.width)
      .attr("height", config.height)

    cache.headerGroup
      .style("width", cache.chartWidth)
      .style("left", config.margin.left)

    cache.panel
      .attr("transform", `translate(${config.margin.left},${config.margin.top})`)
      .select(".panel-background")
      .attr("width", cache.chartWidth)
      .attr("height", cache.chartHeight)
      .attr("fill", "transparent")


    return this
  }

  function buildChart () {
    const dataObject = {
      dataByKey: cache.dataByKey,
      dataBySeries: cache.dataBySeries,
      flatDataSorted: cache.flatDataSorted,
      groupKeys: cache.groupKeys
    }

    const scale = Scale()
      .setConfig(config)
      .setData(dataObject)
    scales = scale.getScales()

    Axis(cache.chart)
      .setConfig(config)
      .setScales(scales)
      .drawAxis()
      .drawGridLines()

    Line(cache.panel)
      .setConfig(config)
      .setScales(scales)
      .setData(dataObject)
      .drawMarks()

    Tooltip(cache.container)
      .setConfig(config)
      .setScales(scales)
      .bindEvents(dispatcher)

    const legendContent = dataObject.dataBySeries
        .map((d) => ({
          id: d.id,
          key: d.key,
          label: d.label
        }))

    Legend(cache.container)
      .setConfig(config)
      .setScales(scales)
      .setTitle("Title")
      .setContent(legendContent)
      .setXPosition(cache.chartWidth - 80)
      .setYPosition(20)
      .drawTooltip()
      .show()

    const brush = Brush(cache.panel)
      .setConfig(config)
      .setScales(scales)
      .setData(dataObject)
      .drawBrush()
    eventCollector.onBrush = rebind(brush)

    const hover = Hover(cache.panel)
      .setConfig(config)
      .setScales(scales)
      .bindEvents(dispatcher)
    eventCollector.onHover = rebind(hover)

    const binning = Binning(cache.headerGroup)
      .setConfig(config)
      .setBinning("1mo")
      .setAuto(true)
      .drawBinning()
    eventCollector.onBinning = rebind(binning)

    const domainEditor = DomainEditor(cache.container)
      .setConfig(config)
      .setXDomain(["a", "b"])
      .setYDomain([0, 200])
      .setY2Domain([0, 300])
      .drawDomainEditor()
    eventCollector.onDomainEditor = rebind(domainEditor)

    const brushRangeEditor = BrushRangeEditor(cache.headerGroup)
      .setConfig(config)
      .setRangeMin("Jan 01, 2001")
      .setRangeMax("Jan 01, 2002")
      .drawRangeEditor()
    eventCollector.onBrushRangeEditor = rebind(brushRangeEditor)

    const label = Label(cache.container)
      .setConfig(config)
      .setXLabels("X Axis Label")
      .setYLabels("Y Axis Label")
      .setY2Labels("Y2 Axis Label")
      .drawLabels()
    eventCollector.onLabel = rebind(label)

    // const bar = Bar(config, cache)
    // if (config.chartType === "bar") {
    //   bar.drawBars()
    // } else if (config.chartType === "stackedBar") {
    //   bar.drawStackedBars()
    // }

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

    const dataByKey = d3.nest()
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
      cache.maskingRectangle = cache.svg.d3.select(".masking-rectangle")
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
    const keyFromInvertedX = invertScale(scales.xScale, _mouseX, config.keyType)
    const bisectLeft = d3.bisector(getKey).left
    const dataEntryIndex = bisectLeft(cache.dataByKey, keyFromInvertedX)
    const dataEntryForXPosition = cache.dataByKey[dataEntryIndex]
    let nearestDataPoint = null

    if (keyFromInvertedX) {
      nearestDataPoint = dataEntryForXPosition
    }
    return nearestDataPoint
  }

  function addEvents () {
    const THROTTLE_DELAY = 20
    const throttledDispatch = throttle((...args) => {
      dispatcher.call(...args)
    }, THROTTLE_DELAY)

    cache.panel
      .on("mouseover.dispatch", () => {
        dispatcher.call("mouseOverPanel", null, d3.mouse(cache.panel.node()))
      })
      .on("mouseout.dispatch", () => {
        dispatcher.call("mouseOutPanel", null, d3.mouse(cache.panel.node()))
      })
      .on("mousemove.dispatch", () => {
        const [mouseX, mouseY] = d3.mouse(cache.panel.node())
        if (!cache.data) { return }
        const xPosition = mouseX
        const dataPoint = getNearestDataPoint(xPosition)

        if (dataPoint) {
          const dataPointXPosition = scales.xScale(dataPoint[keys.DATA])
          throttledDispatch("mouseMovePanel", null, dataPoint, dataPointXPosition, mouseY)
        }
      })
  }

  function on (...args) {
    dispatcher.on(...args)
    return this
  }

  function setConfig (_config) {
    config = override(config, _config)
    return this
  }

  function destroy () {
    cache.svg.on(".", null).remove()
  }

  return {
    render,
    setConfig,
    setData,
    on,
    destroy,
    events: eventCollector
  }
}
