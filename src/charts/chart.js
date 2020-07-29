import * as d3 from "./helpers/d3-service"

import {colors} from "./helpers/colors"
import {keys, stackOffset} from "./helpers/constants"
import {override, uniqueId, getChartClass, rebind} from "./helpers/common"
import throttle from "lodash.throttle"
import {augmentConfig} from "./helpers/auto-config"
import ComponentRegistry from "./helpers/component-registry"
import * as StyleFilters from "./helpers/filters"

import {augmentData, getNearestDataPoint} from "./data-manager"
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
import ClipPath from "./clip-path"

export default function Chart(_container) {
  const defaultConfig = {
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
    colorSchema: colors.mapdColors.map(d => ({value: d})),
    defaultColor: "skyblue",
    xDomain: "auto",
    yDomain: "auto",
    y2Domain: "auto",

    // axis
    tickPadding: 5,
    xAxisFormat: "auto",
    yAxisFormat: ".2f",
    y2AxisFormat: ".2f",
    yAxisPercentageFormat: null,
    tickSizes: 8,
    yTicks: "auto",
    y2Ticks: "auto",
    xTickSkip: 0,
    grid: null,
    axisTransitionDuration: 0,
    labelsAreRotated: "auto",
    maxXLabelCharCount: null,
    maxYLabelCharCount: null,

    // data
    sortBy: null,
    fillData: false,

    // hover
    lineDotRadius: 4,
    hoverDotRadius: 5,

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
    binningIsEnabled: false,

    // domain
    xLock: false,
    yLock: false,
    y2Lock: false,
    xDomainEditorIsEnabled: false,
    yDomainEditorIsEnabled: false,
    y2DomainEditorIsEnabled: false,

    // brush range
    brushRangeMin: null,
    brushRangeMax: null,
    brushRangeIsEnabled: false,

    // brush
    brushIsEnabled: true,

    // zooming is controllec by the brush
    zoomRangeMin: null,
    zoomRangeMax: null,
    zoomIsEnabled: () => true,
    // the original range is used as bounds by the zoom
    fullXDomain: null,

    // label
    xLabel: "",
    yLabel: "",
    y2Label: "",

    // bar
    barSpacingPercent: 10,
    selectedKeys: [],
    forceGroupedBars: false,

    // line
    dotsToShow: "none",
    lineFx: null,

    // stacked
    stackOffset: stackOffset.NONE
  }

  let scales = {
    xScale: null,
    yScale: null,
    y2Scale: null,
    hasSecondAxis: null,
    colorScale: null
  }

  const cache = {
    originalData: null,
    originalConfig: defaultConfig,
    container: _container,
    svg: null,
    panel: null,
    margin: null,
    maskingRectangle: null,
    width: null,
    height: null,
    chartWidth: null,
    chartHeight: null,
    xAxis: null,
    yAxis: null,
    yAxis2: null
  }

  let config = {}

  let data = {}

  const dispatcher = d3.dispatch(
    "mouseOverPanel",
    "mouseOutPanel",
    "mouseMovePanel",
    "mouseClickPanel"
  )
  const scale = Scale()
  const componentRegistry = ComponentRegistry()

  const createTemplate = chartType => {
    const className = getChartClass(chartType)
    return `<div class="mapd3 mapd3-container ${className}">
        <div class="header-group"></div>
        <div class="y-axis-container">
          <svg>
            <g class="axis-group"></g>
          </svg>
        </div>
        <div class="svg-wrapper">
          <svg class="chart ${className}">
            <defs>
            ${StyleFilters.underline}
            ${StyleFilters.shadow}
            </defs>
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

  function buildChart() {
    if (!cache.root) {
      const base = d3
        .select(cache.container)
        .html(createTemplate(config.chartType))

      cache.root = base
        .select(".mapd3-container")
        .style("position", "relative")

      cache.svgWrapper = base.select(".svg-wrapper")
      cache.svg = base.select("svg.chart")
      cache.headerGroup = base
        .select(".header-group")
        .style("position", "absolute")
      cache.panel = cache.svg.select(".panel-group")
      cache.chart = cache.svg.select(".chart-group")

      addEvents()

      componentRegistry.register({
        axis: Axis(cache.root),
        bar: Bar(cache.panel),
        line: Line(cache.panel),
        tooltip: Tooltip(cache.root),
        legend: Legend(cache.root),
        brush: Brush(cache.panel),
        hover: Hover(cache.panel),
        binning: Binning(cache.headerGroup),
        domainEditor: DomainEditor(cache.root),
        brushRangeEditor: BrushRangeEditor(cache.headerGroup),
        label: Label(cache.root),
        clipPath: ClipPath(cache.svg)
      })
    }

    cache.svgWrapper
      .style("flex", `0 0 ${config.chartWidth}px`)
      .style("height", `${config.height}px`)
      .style("overflow-x", config.useScrolling ? "auto" : "hidden")

    cache.svg
      .style("flex", `0 0 ${config.markPanelWidth}px`)
      .style("height", `${config.chartHeight + config.margin.bottom}`)
      .style("top", `${config.margin.top}px`)

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

  function build() {
    config = transformConfig(cache.originalConfig)
    buildChart()

    if (cache.originalData) {
      scales = computeScales(config, data)

      componentRegistry.render({
        config,
        scales,
        data,
        dispatcher
      })
    }

    return this
  }

  function addEvents() {
    const THROTTLE_DELAY = 20
    const throttledDispatch = throttle(
      (...args) => {
        dispatcher.call(...args)
      },
      THROTTLE_DELAY,
      {
        leading: true,
        trailing: false
      }
    )

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
        if (!cache.originalData) {
          return
        }
        const xPosition = mouseX
        const dataPoint = getNearestDataPoint(
          xPosition,
          data,
          scales,
          config.keyType
        )

        if (dataPoint) {
          const dataPointXPosition = scales.xScale(dataPoint[keys.KEY])
          throttledDispatch(
            "mouseMovePanel",
            null,
            dataPoint,
            dataPointXPosition,
            mouseY,
            panelMouseX
          )
        }
      })
      .on("click.dispatch", () => {
        const [mouseX] = d3.mouse(cache.panel.node())
        if (!cache.originalData) {
          return
        }
        const xPosition = mouseX
        const dataPoint = getNearestDataPoint(
          xPosition,
          data,
          scales,
          config.keyType
        )

        if (dataPoint) {
          throttledDispatch("mouseClickPanel", null, dataPoint)
        }
      })
  }

  function transformData(_data) {
    return augmentData(
      _data,
      config.keyType,
      config.sortBy,
      config.fillData,
      config.stackOffset,
      config.yAxisPercentageFormat
    )
  }

  function transformConfig(_config) {
    return augmentConfig(_config, cache, data)
  }

  function computeScales(_config, _data) {
    return scale
      .setConfig(_config)
      .setData(_data)
      .getScales()
  }

  function getEvents() {
    if (!cache.root) {
      render()
    }
    const events = componentRegistry.getEvents()
    events.onPanel = rebind(dispatcher) // adding chart dispatcher
    return events
  }

  function on(...args) {
    dispatcher.on(...args)
    return this
  }

  function setData(_data) {
    cache.originalData = _data
    data = transformData(cache.originalData)
    render()
    return this
  }

  function setConfig(_config) {
    cache.originalConfig = override(cache.originalConfig, _config)
    config = transformConfig(cache.originalConfig)
    return this
  }

  function render() {
    build()
    return this
  }

  function destroy() {
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
