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
    tickPadding: 5,
    xAxisFormat: "auto",
    yAxisFormat: ".2f",
    y2AxisFormat: ".2f",
    tickSizes: 8,
    yTicks: 5,
    y2Ticks: 5,
    xTickSkip: 0,
    grid: null,
    axisTransitionDuration: 0,

    xTitle: "",
    yTitle: "",

    // hover
    dotRadius: 4,

    // tooltip
    valueFormat: ".2f",
    mouseChaseDuration: 0,
    tooltipEase: d3.easeQuadInOut,
    tooltipHeight: 48,
    tooltipWidth: 160,
    dateFormat: "%b %d, %Y",
    seriesOrder: [],

    // legend
    legendXPosition: "auto",
    legendYPosition: "auto",
    legendTitle: "",

    // binning
    binningReolution: "1mo",
    binningIsAuto: true,

    // domain
    xDomain: null,
    yDomain: null,
    y2Domain: null,

    // brush range
    brushRangeMin: null,
    brushRangeMax: null,

    // label
    xLabel: "",
    yLabel: "",
    y2Label: ""
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
    xAxis: null, yAxis: null, yAxis2: null
  }

  const dataObject = {
    dataBySeries: null,
    dataByKey: null,
    data: null,
    groupKeys: [],
    hasSecondAxis: false,
    stackData: null,
    stack: null,
    flatDataSorted: null
  }

  let components = {}
  let eventCollector = {}

  // accessors
  const getKey = (d) => d[keys.DATA]
  const getGroup = (d) => d[keys.GROUP]
  const getID = (d) => d[keys.ID]

  // events
  const dispatcher = d3.dispatch("mouseOverPanel", "mouseOutPanel", "mouseMovePanel")

  function render () {
    buildSVG()

    if (dataObject.dataBySeries) {
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

      Object.assign(components, {
        scale: Scale(),
        axis: Axis(cache.chart),
        line: Line(cache.panel),
        tooltip: Tooltip(cache.container),
        legend: Legend(cache.container),
        brush: Brush(cache.panel),
        hover: Hover(cache.panel),
        binning: Binning(cache.headerGroup),
        domainEditor: DomainEditor(cache.container),
        brushRangeEditor: BrushRangeEditor(cache.headerGroup),
        label: Label(cache.container)
      })

      Object.assign(eventCollector, {
        onBrush: rebind(components.brush),
        onHover: rebind(components.hover),
        onBinning: rebind(components.binning),
        onDomainEditor: rebind(components.domainEditor),
        onBrushRangeEditor: rebind(components.brushRangeEditor),
        onLabel: rebind(components.label),
        onPanel: rebind(dispatcher)
      })
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
    components.scale
      .setConfig(config)
      .setData(dataObject)
    scales = components.scale.getScales()

    components.axis
      .setConfig(config)
      .setScales(scales)
      .drawAxis()
      .drawGridLines()

    components.line
      .setConfig(config)
      .setScales(scales)
      .setData(dataObject)
      .drawMarks()

    components.tooltip
      .setConfig(config)
      .setScales(scales)
      .bindEvents(dispatcher)

    const legendContent = dataObject.dataBySeries
        .map((d) => ({
          id: d.id,
          key: d.key,
          label: d.label
        }))

    components.legend
      .setConfig(config)
      .setScales(scales)
      .setTitle(config.legendTitle)
      .setContent(legendContent)
      .setXPosition(config.legendXPosition)
      .setYPosition(config.legendYPosition)
      .drawTooltip()
      .show()

    components.brush
      .setConfig(config)
      .setScales(scales)
      .setData(dataObject)
      .drawBrush()

    components.hover
      .setConfig(config)
      .setScales(scales)
      .bindEvents(dispatcher)

    components.binning
      .setConfig(config)
      .setBinning(config.binningReolution)
      .setAuto(config.binningIsAuto)
      .drawBinning()

    components.domainEditor
      .setConfig(config)
      .setXDomain(config.xDomain)
      .setYDomain(config.yDomain)
      .setY2Domain(config.y2Domain)
      .drawDomainEditor()

    components.brushRangeEditor
      .setConfig(config)
      .setRangeMin(config.brushRangeMin)
      .setRangeMax(config.brushRangeMax)
      .drawRangeEditor()

    components.label
      .setConfig(config)
      .setXLabels(config.xLabel)
      .setYLabels(config.yLabel)
      .setY2Labels(config.y2Label)
      .drawLabels()

    triggerIntroAnimation()
    return this
  }

  function setData (_data) {
    dataObject.data = cloneData(_data[keys.SERIES])
    const cleanedData = cleanData(_data)
    Object.assign(dataObject, cleanedData)

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

    const flatDataSorted = sortData(flatData, config.keyType)

    const dataByKey = d3.nest()
      .key(getKey)
      .entries(flatDataSorted)
      .map((d) => {
        const dataPoint = {}
        dataPoint[keys.DATA] = config.keyType === "time" ? new Date(d.key) : d.key
        dataPoint[keys.SERIES] = d.values
        return dataPoint
      })

    const allGroupKeys = dataBySeries.map(getGroup)
    const groupKeys = getUnique(allGroupKeys)

    let stackData = null
    let stack = null

    if (config.chartType === "stackedBar" || config.chartType === "stackedArea") {
      stackData = dataByKey
          .map((d) => {
            const points = {
              key: d[keys.DATA]
            }
            d.series.forEach((dB) => {
              points[dB[keys.ID]] = dB[keys.VALUE]
            })

            return points
          })

      stack = d3.stack()
          .keys(dataBySeries.map(getID))
          .order(d3.stackOrderNone)
          .offset(d3.stackOffsetNone)
    }

    return {dataBySeries, dataByKey, stack, stackData, flatDataSorted, groupKeys}
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
    const keyFromInvertedX = invertScale(scales.xScale, _mouseX, config.keyType)
    const bisectLeft = d3.bisector(getKey).left
    const dataEntryIndex = bisectLeft(dataObject.dataByKey, keyFromInvertedX)
    const dataEntryForXPosition = dataObject.dataByKey[dataEntryIndex]
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
        if (!dataObject.data) { return }
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
