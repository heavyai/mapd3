import * as d3 from "./helpers/d3-service"

import {colors} from "./helpers/colors"
import {keys} from "./helpers/constants"
import {
  cloneData,
  override,
  throttle,
  rebind,
  getSizes,
  uniqueId
} from "./helpers/common"

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
import DataManager from "./data-manager"
import ClipPath from "./clip-path"

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
    chartId: uniqueId(),
    chartType: "line", // line, area, stackedLine, stackedArea
    extractType: null, // isodow, month, quarter, hour, minute
    ease: d3.easeLinear,

    // intro animation
    isAnimated: false,
    animationDuration: 1500,

    // scale
    colorSchema: colors.mapdColors.map((d) => ({value: d})),
    defaultColor: "skyblue",
    xDomain: "auto",
    yDomain: "auto",
    y2Domain: "auto",

    // axis
    tickPadding: 5,
    xAxisFormat: "auto",
    yAxisFormat: ".2f",
    y2AxisFormat: ".2f",
    tickSizes: 8,
    yTicks: "auto",
    y2Ticks: "auto",
    xTickSkip: 0,
    grid: null,
    axisTransitionDuration: 0,

    xTitle: "",
    yTitle: "",

    // hover
    dotRadius: 4,

    // tooltip
    mouseChaseDuration: 0,
    tooltipEase: d3.easeQuadInOut,
    tooltipHeight: 48,
    tooltipWidth: 160,
    tooltipIsEnabled: true,
    tooltipTitle: null,

    // format
    dateFormat: "%b %d, %Y",
    inputDateFormat: "%m-%d-%Y",
    numberFormat: ".2f",

    // legend
    legendXPosition: "auto",
    legendYPosition: "auto",
    legendTitle: "",
    legendIsEnabled: true,

    // binning
    binningResolution: "1mo",
    binningIsAuto: true,
    binningToggles: ["10y", "1y", "1q", "1mo"],
    binningIsEnabled: true,

    // domain
    xLock: false,
    yLock: false,
    y2Lock: false,
    xDomainEditorIsEnabled: true,
    yDomainEditorIsEnabled: true,
    y2DomainEditorIsEnabled: true,

    // brush range
    brushRangeMin: null,
    brushRangeMax: null,
    brushRangeIsEnabled: true,

    // brush
    brushIsEnabled: true,

    // label
    xLabel: "",
    yLabel: "",
    y2Label: "",

    // bar
    barSpacingPercent: 10
  }

  let scales = {
    xScale: null,
    yScale: null,
    y2Scale: null,
    hasSecondAxis: null,
    colorScale: null
  }

  const cache = {
    container: _container,
    svg: null,
    panel: null,
    margin: null,
    maskingRectangle: null,
    width: null, height: null,
    chartWidth: null, chartHeight: null,
    xAxis: null, yAxis: null, yAxis2: null
  }

  const dataObject = {
    dataBySeries: null,
    dataByKey: null,
    data: null,
    groupKeys: {},
    hasSecondAxis: false,
    stackData: null,
    stack: null,
    flatDataSorted: null
  }

  let components = {}
  let eventCollector = {}

  // events
  const dispatcher = d3.dispatch("mouseOverPanel", "mouseOutPanel", "mouseMovePanel")
  const dataManager = DataManager()

  function build () {
    if (!cache.svg) {
      const chartClassName = chartType => {
          switch(chartType) {
            case "bar":
            case "stackedBar":
              return "bar"

            case "line":
            case "stackedArea":
              return "line"

            // TO DO: handle bar line combo chartType...
            case Array.isArray(chartType):
              return "combo"

            default:
              return ""
          }
      }

      const template = (chartType) => `<div class="mapd3 mapd3-container">
        <div class="header-group"></div>
        <svg class="chart ${chartClassName(chartType)}">
          <g class="chart-group"></g>
          <g class="panel-group">
            <rect class="panel-background"></rect>
          </g>
          <rect class="masking-rectangle"></rect>
        </svg>
      </div>`

      const base = d3.select(cache.container)
          .html(template(config.chartType))

      cache.container = base.select(".mapd3-container")
          .style("position", "relative")

      cache.svg = base.select("svg")
      cache.headerGroup = base.select(".header-group")
          .style("position", "absolute")
      cache.panel = cache.svg.select(".panel-group")
      cache.chart = cache.svg.select(".chart-group")

      addEvents()

      components = {
        scale: Scale(),
        axis: Axis(cache.chart),
        line: Line(cache.panel),
        bar: Bar(cache.panel),
        tooltip: Tooltip(cache.container),
        legend: Legend(cache.container),
        brush: Brush(cache.panel),
        hover: Hover(cache.panel),
        binning: Binning(cache.headerGroup),
        domainEditor: DomainEditor(cache.container),
        brushRangeEditor: BrushRangeEditor(cache.headerGroup),
        label: Label(cache.container),
        clipPath: ClipPath(cache.svg)
      }

      eventCollector = {
        onBrush: rebind(components.brush),
        onHover: rebind(components.hover),
        onBinning: rebind(components.binning),
        onDomainEditor: rebind(components.domainEditor),
        onBrushRangeEditor: rebind(components.brushRangeEditor),
        onLabel: rebind(components.label),
        onPanel: rebind(dispatcher)
      }
    }

    const {width, height, chartWidth, chartHeight} = getSizes(config, cache)
    cache.width = width
    cache.height = height
    cache.chartWidth = chartWidth
    cache.chartHeight = chartHeight

    cache.svg
      .attr("width", cache.width)
      .attr("height", cache.height)

    cache.headerGroup
      .style("width", `${cache.chartWidth}px`)
      .style("left", `${config.margin.left}px`)

    cache.panel
      .attr("transform", `translate(${config.margin.left},${config.margin.top})`)
      .select(".panel-background")
      .attr("width", cache.chartWidth)
      .attr("height", cache.chartHeight)
      .attr("fill", "transparent")


    return this
  }

  function buildChart () {
    scales = components.scale
      .setConfig(config)
      .setData(dataObject)
      .getScales()

    components.axis
      .setConfig(config)
      .setScales(scales)
      .render()

    components.bar
      .setConfig(config)
      .setScales(scales)
      .setData(dataObject)
      .render()

    components.line
      .setConfig(config)
      .setScales(scales)
      .setData(dataObject)
      .render()

    components.tooltip
      .setConfig(config)
      .setScales(scales)
      .bindEvents(dispatcher)

    components.legend
      .setConfig(config)
      .setScales(scales)
      .setData(dataObject)

    components.brush
      .setConfig(config)
      .setScales(scales)
      .setData(dataObject)
      .render()

    components.hover
      .setConfig(config)
      .setScales(scales)
      .setData(dataObject)
      .bindEvents(dispatcher)

    components.binning
      .setConfig(config)
      .render()

    components.domainEditor
      .setConfig(config)
      .setScales(scales)
      .render()

    components.brushRangeEditor
      .setConfig(config)
      .setScales(scales)
      .render()

    components.label
      .setConfig(config)
      .render()

    components.clipPath
      .setConfig(config)
      .render()

    triggerIntroAnimation()
    return this
  }

  function setData (_data) {
    dataObject.data = cloneData(_data[keys.SERIES])
    const cleanedData = dataManager.cleanData(_data, config.keyType)
    Object.assign(dataObject, cleanedData)

    render()
    return this
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
        .attr("x", cache.width - config.margin.right)
        .on("end", () => cache.maskingRectangle.remove())
    }
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
        const dataPoint = dataManager.getNearestDataPoint(xPosition, dataObject, scales, config.keyType)

        if (dataPoint) {
          const dataPointXPosition = scales.xScale(dataPoint[keys.KEY])
          throttledDispatch("mouseMovePanel", null, dataPoint, dataPointXPosition, mouseY)
        }
      })
  }

  function getEvents () {
    if (!cache.svg) {
      render()
    }
    return eventCollector
  }

  function on (...args) {
    dispatcher.on(...args)
    return this
  }

  function setConfig (_config) {
    config = override(config, _config)
    return this
  }

  function render () {
    console.log(config)
    build()

    if (dataObject.dataBySeries) {
      buildChart()
    }
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
    getEvents
  }
}
