import * as d3 from "./helpers/d3-service"

import {exportChart} from "./helpers/exportChart"
import {colors} from "./helpers/colors"
import {keys} from "./helpers/constants"
import {cloneData, getUnique, invertScale, sortData, override, throttle} from "./helpers/common"

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
    mouseChaseDuration: 30,
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
  const dispatcher = d3.dispatch("mouseOver", "mouseOut", "mouseMove", "hoverYAxis")

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
      const template = `<div class="mapd3-container">
        <svg class="mapd3 chart">
          <rect class="masking-rectangle"></rect>
        </svg>
      </div>`

      const base = d3.select(cache.container)
          .html(template)

      base.select(".mapd3-container").style("position", "relative")

      cache.svg = base.select("svg")

      addEvents()
    }

    cache.svg.attr("width", config.width)
      .attr("height", config.height)
      .select(".container-group")
      .attr("transform", `translate(${config.margin.left},${config.margin.top})`)

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

    Axis(cache.svg)
      .setConfig(config)
      .setScales(scales)
      .drawAxis()
      .drawAxisTitles()
      .drawGridLines()

    Line(cache.svg)
      .setConfig(config)
      .setScales(scales)
      .setData(dataObject)
      .drawMarks()

    // const bar = Bar(config, cache)
    // if (config.chartType === "bar") {
    //   bar.drawBars()
    // } else if (config.chartType === "stackedBar") {
    //   bar.drawStackedBars()
    // }

    Tooltip(cache.svg)
      .setConfig(config)
      .setScales(scales)
      .bindEvents(dispatcher)

    // const legend = Legend(cache.svg)
    //   .setContent(data.series)
    //   .setTitle("Title")
    //   .setSize(80, "auto")
    //   .setPosition(780)
    //   .show()

    Brush(cache.svg)
      .setConfig(Object.assign({}, config, scales))
      .setData(dataObject)
      .drawBrush()
      .on("brushMove", (...arg) => console.log("brush", ...arg))

    Hover(cache.svg)
      .setConfig(config)
      .setScales(scales)
      .bindEvents(dispatcher)

    // const binning = Binning(cache.svg)
    //   .on("change", (...arg) => console.log("binning", ...arg))

    // const domainEditor = DomainEditor(cache.svg)

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

    cache.svg
      .on("mouseover.dispatch", function mouseover (d) {
        if (!cache.data) { return }
        dispatcher.call("mouseOver", this, d, d3.mouse(this))
      })
      .on("mouseout.dispatch", function mouseout (d) {
        if (!cache.data) { return }
        dispatcher.call("mouseOut", this, d, d3.mouse(this))
      })
      .on("mousemove.dispatch", function mousemove () {
        if (!cache.data) { return }
        const mouseX = d3.mouse(this)[0]
        const xPosition = mouseX - config.margin.left
        const dataPoint = getNearestDataPoint(xPosition)

        if (dataPoint) {
          const dataPointXPosition = scales.xScale(dataPoint[keys.DATA])
          dispatcher.call("mouseMove", this, dataPoint, dataPointXPosition)
          throttledDispatch("mouseMove", this, dataPoint, dataPointXPosition)
        }
      })
  }

  // function save (_filename, _title) {
  //   exportChart.call(this, cache.svg, _filename, _title)
  // }

  function on (...args) {
    return dispatcher.on(...args)
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
    // save,
    destroy
  }
}
