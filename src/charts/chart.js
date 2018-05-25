import * as d3 from "./helpers/d3-service"

import {colors} from "./helpers/colors"
import {keys} from "./helpers/constants"
import {
  cloneData,
  override,
  throttle,
  rebind,
  uniqueId
} from "./helpers/common"
import {autoConfigure} from "./helpers/auto-config"

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

  let inputConfig = {
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
    useScrolling: false,

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
    labelsAreRotated: "auto",

    // data
    sortBy: null,
    fillData: false,

    // hover
    dotRadius: 4,

    // tooltip
    tooltipFormat: ".2f",
    tooltipTitleFormat: null,
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
    barSpacingPercent: 10,
    selectedKeys: [],

    // line
    dotsToShow: "none"
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
    flatDataSorted: null,
    allKeyTotals: null
  }

  let components = {}
  let eventCollector = {}
  let config = null
  setConfig(inputConfig) // init with config = inputConfig

  // events
  const dispatcher = d3.dispatch("mouseOverPanel", "mouseOutPanel", "mouseMovePanel", "mouseClickPanel")
  const dataManager = DataManager()

  const createTemplate = (chartType) => {
    const chartClassName = _chartType => {
      switch (chartType) {
      case "bar":
      case "stackedBar":
        return "bar"

      case "line":
      case "stackedArea":
        return "line"

      // TO DO: handle bar line combo chartType...
      case Array.isArray(_chartType):
        return "combo"

      default:
        return ""
      }
    }

    const className = chartClassName(chartType)
    return `<div class="mapd3 mapd3-container ${className}">
        <div class="header-group"></div>
        <div class="y-axis-container">
          <svg>
            <g class="axis-group"></g>
          </svg>
        </div>
        <div class="svg-wrapper">
          <svg class="chart ${className}">
            <g class="chart-group"></g>
            <g class="panel-group">
              <rect class="panel-background"></rect>
            </g>
            <rect class="masking-rectangle"></rect>
          </svg>
        </div>
        <div class="y2-axis-container">
          <svg>
            <g class="axis-group"></g>
          </svg>
        </div>
      </div>`
  }

  function build () {
    if (!cache.root) {
      const base = d3.select(cache.container)
        .html(createTemplate(config.chartType))

      cache.root = base.select(".mapd3-container")
        .style("position", "relative")

      cache.svgWrapper = base.select(".svg-wrapper")
      cache.svg = base.select("svg.chart")
      cache.headerGroup = base.select(".header-group")
        .style("position", "absolute")
      cache.panel = cache.svg.select(".panel-group")
      cache.chart = cache.svg.select(".chart-group")

      addEvents()

      components = {
        scale: Scale(),
        axis: Axis(cache.root),
        line: Line(cache.panel),
        bar: Bar(cache.panel),
        tooltip: Tooltip(cache.root),
        legend: Legend(cache.root),
        brush: Brush(cache.panel),
        hover: Hover(cache.panel),
        binning: Binning(cache.headerGroup),
        domainEditor: DomainEditor(cache.root),
        brushRangeEditor: BrushRangeEditor(cache.headerGroup),
        label: Label(cache.root),
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

    cache.svgWrapper
      .style("flex", `0 0 ${config.chartWidth}px`)
      .style("height", `${config.height}px`)

    cache.svg
      .style("flex", `0 0 ${config.markPanelWidth}px`)
      .style("height", `${config.chartHeight + config.margin.bottom}`)
      .attr("transform", `translate(0,${config.margin.top})`)

    cache.headerGroup
      .style("width", `${config.chartWidth}px`)
      .style("left", `${config.margin.left}px`)

    cache.panel
      .select(".panel-background")
      .style("width", `${config.markPanelWidth}px`)
      .style("height", `${config.chartHeight}px`)
      .attr("fill", "transparent")

    return this
  }

  function buildChart () {
    scales = components.scale
      .setConfig(config)
      .setData(dataObject)
      .getScales()

    components.clipPath
      .setConfig(config)
      .render()

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

    triggerIntroAnimation()
    return this
  }

  function setData (_data) {
    dataObject.data = cloneData(_data[keys.SERIES])
    const cleanedData = dataManager.cleanData(_data, config.keyType, config.sortBy, config.fillData)
    Object.assign(dataObject, cleanedData)

    const autoConfig = autoConfigure(inputConfig, cache, dataObject)
    config = Object.assign({}, inputConfig, autoConfig)

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
        .attr("x", config.width - config.margin.right)
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
        const [panelMouseX] = d3.mouse(cache.svgWrapper.node())
        if (!dataObject.data) { return }
        const xPosition = mouseX
        const dataPoint = dataManager.getNearestDataPoint(xPosition, dataObject, scales, config.keyType)

        if (dataPoint) {
          const dataPointXPosition = scales.xScale(dataPoint[keys.KEY])
          throttledDispatch("mouseMovePanel", null, dataPoint, dataPointXPosition, mouseY, panelMouseX)
        }
      })
      .on("click.dispatch", () => {
        const [mouseX] = d3.mouse(cache.panel.node())
        if (!dataObject.data) { return }
        const xPosition = mouseX
        const dataPoint = dataManager.getNearestDataPoint(xPosition, dataObject, scales, config.keyType)

        if (dataPoint) {
          throttledDispatch("mouseClickPanel", null, dataPoint)
        }
      })
  }

  function getEvents () {
    if (!cache.root) {
      render()
    }
    return eventCollector
  }

  function on (...args) {
    dispatcher.on(...args)
    return this
  }

  function setConfig (_config) {
    inputConfig = override(inputConfig, _config)

    const autoConfig = autoConfigure(inputConfig, cache, dataObject)
    config = Object.assign({}, inputConfig, autoConfig)
    return this
  }

  function render () {
    build()

    if (dataObject.dataBySeries) {
      buildChart()
    }
    return this
  }

  function destroy () {
    if (cache.root) {
      cache.root.on(".", null).remove()
    }
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
