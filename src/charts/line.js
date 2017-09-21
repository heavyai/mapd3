import {extent, sum, bisector} from "d3-array"
import {axisBottom, axisLeft, axisRight} from "d3-axis"
import {nest} from "d3-collection"
import {dispatch} from "d3-dispatch"
import {easeLinear} from "d3-ease"
import {scaleTime, scalePoint, scaleLinear, scaleOrdinal} from "d3-scale"
import {area, line, stack} from "d3-shape"
import {select, mouse} from "d3-selection"
import {timeFormat} from "d3-time-format"
import {format} from "d3-format"

import {exportChart} from "./helpers/exportChart"
import {colors} from "./helpers/colors"
import {keys} from "./helpers/constants"
import {cloneData, getUnique, invertScale, sortData} from "./helpers/common"

export default function mapdLine (_container) {

  let config = {
    margin: {
      top: 48,
      right: 32,
      bottom: 48,
      left: 32
    },
    width: 800,
    height: 500,
    hoverThreshold: 480,
    xAxisPadding: {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0
    },
    tickPadding: 5,
    colorSchema: colors.mapdColors,
    dotRadius: 4,
    xAxisFormat: "%c",
    tickSkip: 1,
    tickSizes: 8,

    isAnimated: false,
    ease: easeLinear,
    animationDuration: 1500,
    axisTransitionDuration: 0,

    yTicks: 5,
    yTicks2: 5,
    yAxisFormat: ".2s",
    yAxisFormat2: ".2s",

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
    seriesColorScale: null,
    xAxis: null, yAxis: null, yAxis2: null,
    groupKeys: [],
    hasSecondAxis: false,

    stackData: null,
    stack: null,
    flatDataSorted: null
  }

  // accessors
  const getKey = (d) => d[keys.DATA_KEY]
  const getGroup = (d) => d[keys.GROUP_KEY]
  const getID = (d) => d[keys.ID_KEY]
  const getValue = (d) => d[keys.VALUE_KEY]
  const getColor = (d) => cache.colorScale(d[keys.ID_KEY])

  // events
  const dispatcher = dispatch("mouseOver", "mouseOut", "mouseMove")

  function init () {
    buildSVG()

    return this
  }
  init()

  function buildSVG () {
    const w = config.width || this.clientWidth
    const h = config.height || this.clientHeight
    cache.chartWidth = w - config.margin.left - config.margin.right
    cache.chartHeight = h - config.margin.top - config.margin.bottom

    if (!cache.svg) {
      cache.svg = select(cache.container)
        .append("svg")
        .classed("mapd3 line-chart", true)

      const container = cache.svg.append("g")
        .classed("container-group", true)

      container.append("g").classed("grid-lines-group", true)
      container.append("g").classed("x-axis-group", true)
        .append("g").classed("axis x", true)
      container.append("g").classed("y-axis-group axis y", true)
      container.append("g").classed("y-axis-group2 axis y", true)
      container.append("g").classed("chart-group", true)

      const metadataGroup = container.append("g")
          .classed("metadata-group", true)
      metadataGroup.append("g")
          .attr("class", "hover-marker vertical-marker-container")

      cache.maskingRectangle = cache.svg.append("rect")
        .attr("class", "masking-rectangle")
    }

    cache.svg.attr("width", config.width)
      .attr("height", config.height)
      .select(".container-group")
      .attr("transform", `translate(${config.margin.left},${config.margin.top})`)
  }

  function setData (_data) {
    cache.data = cloneData(_data[keys.SERIES_KEY])
    const cleanedData = cleanData(_data)
    cache.dataBySeries = cleanedData.dataBySeries
    cache.dataByKey = cleanedData.dataByKey

    buildSVG()

    if (config.chartType === "stackedLine" || config.chartType === "stackedArea") {
      buildStackedScales()
    } else {
      buildScales()
    }

    buildAxis()
    drawGridLines()
    drawAxis()

    if (config.chartType === "area") {
      drawAreas()
    } else if (config.chartType === "line") {
      drawLines()
    } else if (config.chartType === "stackedArea") {
      drawStackedAreas()
    }

    if (shouldShowHoverMarkers()) {
      drawVerticalMarker()
      addMouseEvents()
    }

    triggerIntroAnimation()

    return this
  }

  function cleanData (_data) {
    const dataBySeries = cloneData(_data[keys.SERIES_KEY])
    const flatData = []

    // Normalize dataBySeries
    dataBySeries.forEach((serie) => {
      serie[keys.VALUES_KEY] = sortData(serie[keys.VALUES_KEY], config.keyType)
      serie[keys.VALUES_KEY].forEach((d) => {
        d[keys.DATA_KEY] = config.keyType === "time" ? new Date(d[keys.DATA_KEY]) : d[keys.DATA_KEY]
        d[keys.VALUE_KEY] = Number(d[keys.VALUE_KEY])
      })
    })

    dataBySeries.forEach((serie) => {
      serie[keys.VALUES_KEY].forEach((d) => {
        const dataPoint = {}
        dataPoint[keys.LABEL_KEY] = serie[keys.LABEL_KEY]
        dataPoint[keys.GROUP_KEY] = serie[keys.GROUP_KEY]
        dataPoint[keys.ID_KEY] = serie[keys.ID_KEY]
        dataPoint[keys.DATA_KEY] = config.keyType === "time" ? new Date(d[keys.DATA_KEY]) : d[keys.DATA_KEY]
        dataPoint[keys.VALUE_KEY] = d[keys.VALUE_KEY]
        flatData.push(dataPoint)
      })
    })

    cache.flatDataSorted = sortData(flatData, config.keyType)

    const dataByKey = nest()
      .key(getKey)
      .entries(cache.flatDataSorted)
      .map((d) => {
        const dataPoint = {}
        dataPoint[keys.DATA_KEY] = config.keyType === "time" ? new Date(d.key) : d.key
        dataPoint[keys.SERIES_KEY] = d.values
        return dataPoint
      })

    const allGroupKeys = dataBySeries.map(getGroup)
    cache.groupKeys = getUnique(allGroupKeys)

    return {dataBySeries, dataByKey}
  }

  function splitByGroups () {
    const groups = {}
    cache.dataBySeries.forEach((d) => {
      const key = d[keys.GROUP_KEY]
      if (!groups[key]) {
        groups[key] = {
          allValues: [],
          allKeys: []
        }
      }
      groups[key].allValues = groups[key].allValues.concat(d[keys.VALUES_KEY].map(getValue))
      groups[key].allKeys = groups[key].allKeys.concat(d[keys.VALUES_KEY].map(getKey))
    })

    return groups
  }

  function buildXScale (_allKeys) {
    let datesExtent = null
    if (config.keyType === "time") {
      datesExtent = extent(_allKeys)
      cache.xScale = scaleTime()
    } else {
      datesExtent = _allKeys
      cache.xScale = scalePoint().padding(0)
    }

    cache.xScale.domain(datesExtent)
      .range([0, cache.chartWidth])
  }

  function buildColorScale () {
    cache.colorScale = scaleOrdinal()
        .range(config.colorSchema)
        .domain(cache.dataBySeries.map(getID))

    const range = cache.colorScale.range()
    cache.seriesColorScale = cache.colorScale.domain()
      .reduce((memo, item, i) => {
        memo[item] = range[i]
        return memo
      }, {})
  }

  function buildYScale (_extent) {
    cache.yScale = scaleLinear()
        .domain(_extent)
        .rangeRound([cache.chartHeight, 0])
        .nice()
  }

  function buildScales () {
    const groups = splitByGroups()

    cache.hasSecondAxis = cache.groupKeys.length > 1

    const groupAxis1 = groups[cache.groupKeys[0]]
    const allUniqueKeys = groupAxis1.allKeys
    const valuesExtent = extent(groupAxis1.allValues)

    buildXScale(allUniqueKeys)
    buildColorScale()
    buildYScale(valuesExtent)

    if (cache.hasSecondAxis) {
      const groupAxis2 = groups[cache.groupKeys[1]]
      const valuesExtent2 = extent(groupAxis2.allValues)

      cache.yScale2 = cache.yScale.copy()
        .domain(valuesExtent2)
    }
  }

  function buildStackedScales () {
    const allStackHeights = cache.dataByKey.map((d) => sum(d.series.map((dB) => dB.value)))

    cache.stackData = cache.dataByKey.map((d) => {
      const points = {
        key: d[keys.DATA_KEY]
      }
      d.series.forEach((dB) => {
        points[dB[keys.ID_KEY]] = dB[keys.VALUE_KEY]
      })

      return points
    })

    cache.stack = stack()
      .keys(cache.dataBySeries.map(getID))
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone)

    const valuesExtent = extent(allStackHeights)

    const allKeys = cache.flatDataSorted.map(getKey)
    const allUniqueKeys = getUnique(allKeys)

    buildXScale(allUniqueKeys)
    buildColorScale()
    buildYScale([0, valuesExtent[1]])
  }

  function buildAxis () {
    cache.xAxis = axisBottom(cache.xScale)
        .tickSize(config.tickSizes, 0)
        .tickPadding(config.tickPadding)

    if (config.keyType === "time") {
      const formatter = timeFormat(config.xAxisFormat)
      cache.xAxis.tickFormat(formatter)
    } else {
      cache.xAxis.tickValues(cache.xScale.domain().filter((d, i) => !(i % config.tickSkip)))
    }

    cache.yAxis = axisLeft(cache.yScale)
        .ticks(config.yTicks)
        .tickSize([config.tickSizes])
        .tickPadding(config.tickPadding)
        .tickFormat(format(config.yAxisFormat))

    if (cache.hasSecondAxis) {
      cache.yAxis2 = axisRight(cache.yScale2)
          .ticks(config.yTicks)
          .tickSize([config.tickSizes])
          .tickPadding(config.tickPadding)
          .tickFormat(format(config.yAxisFormat))
    }
  }

  function drawAxis () {
    cache.svg.select(".x-axis-group .axis.x")
        .attr("transform", `translate(0, ${cache.chartHeight})`)
        .call(cache.xAxis)

    cache.svg.select(".y-axis-group.axis.y")
        .attr("transform", `translate(${-config.xAxisPadding.left}, 0)`)
        .transition()
        .duration(config.axisTransitionDuration)
        .ease(config.ease)
        .call(cache.yAxis)

    if (cache.hasSecondAxis) {
      cache.svg.select(".y-axis-group2.axis.y")
          .attr("transform", `translate(${cache.chartWidth - config.xAxisPadding.right}, 0)`)
          .transition()
          .duration(config.axisTransitionDuration)
          .ease(config.ease)
          .call(cache.yAxis2)
    }
  }

  function drawLines () {
    const seriesLine = line()
        .x((d) => cache.xScale(d[keys.DATA_KEY]))
        .y((d) => cache.yScale(d[keys.VALUE_KEY]))

    const seriesLine2 = line()
        .x((d) => cache.xScale(d[keys.DATA_KEY]))
        .y((d) => cache.yScale2(d[keys.VALUE_KEY]))
        .curve(d3.curveCatmullRom)

    const lines = cache.svg.select(".chart-group").selectAll(".line")
        .data(cache.dataBySeries)

    lines.enter()
      .append("path")
      .attr("class", "line")
      .merge(lines)
      .attr("d", (d) => {
        if (d[keys.GROUP_KEY] === cache.groupKeys[0]) {
          return seriesLine(d[keys.VALUES_KEY])
        } else {
          return seriesLine2(d[keys.VALUES_KEY])
        }
      })
      .style("stroke", getColor)

    lines.exit().remove()
  }

  function drawAreas () {
    const seriesArea = area()
        .x((d) => cache.xScale(d[keys.DATA_KEY]))
        .y0((d) => cache.yScale(d[keys.VALUE_KEY]))
        .y1(() => cache.chartHeight)

    const seriesArea2 = area()
        .x((d) => cache.xScale(d[keys.DATA_KEY]))
        .y0((d) => cache.yScale2(d[keys.VALUE_KEY]))
        .y1(() => cache.chartHeight)
        .curve(d3.curveCatmullRom)

    const areas = cache.svg.select(".chart-group").selectAll(".area")
        .data(cache.dataBySeries)

    areas.enter()
      .append("path")
      .attr("class", "area")
      .merge(areas)
      .attr("d", (d) => {
        if (d[keys.GROUP_KEY] === cache.groupKeys[0]) {
          return seriesArea(d[keys.VALUES_KEY])
        } else {
          return seriesArea2(d[keys.VALUES_KEY])
        }
      })
      .style("stroke", getColor)
      .style("fill", getColor)

    areas.exit().remove()
  }

  function drawStackedAreas () {
    const seriesLine = area()
        .x((d) => cache.xScale(d.data[keys.DATA_KEY]))
        .y0((d) => cache.yScale(d[0]))
        .y1((d) => cache.yScale(d[1]))

    const areas = cache.svg.select(".chart-group").selectAll(".stacked-area")
        .data(cache.stack(cache.stackData))

    areas.enter()
      .append("path")
      .attr("class", "stacked-area")
      .merge(areas)
      .attr("d", seriesLine)
      .style("stroke", "none")
      .style("fill", (d) => cache.colorScale(d.key))

    areas.exit().remove()
  }

  function highlightStackedDataPoints (_dataPoint) {
    const stackedDataPoint = {key: _dataPoint[keys.DATA_KEY]}
    _dataPoint.series.forEach((d) => {
      const id = d[keys.ID_KEY]
      stackedDataPoint[id] = d[keys.VALUE_KEY]
    })

    const dotsStack = cache.stack([stackedDataPoint])
    const dotsData = dotsStack.map((d) => {
      const dot = {value: d[0][1]}
      dot[keys.ID_KEY] = d.key
      return dot
    })

    drawHighlightDataPoints(dotsData)
  }

  function highlightDataPoints (_dataPoint) {
    const dotsData = _dataPoint[keys.SERIES_KEY]

    drawHighlightDataPoints(dotsData)
  }

  function drawHighlightDataPoints (_dotsData) {
    const dots = cache.verticalMarkerContainer.selectAll(".dot")
        .data(_dotsData)

    dots.enter()
      .append("circle")
      .attr("class", "dot")
      .merge(dots)
      .attr("cy", (d) => cache.yScale(d[keys.VALUE_KEY]))
      .attr("r", config.dotRadius)
      .style("stroke", "none")
      .style("fill", getColor)

    dots.exit().remove()
  }

  function drawGridLines () {
    if (config.grid === "horizontal" || config.grid === "full") {
      cache.horizontalGridLines = cache.svg.select(".grid-lines-group")
          .selectAll("line.horizontal-grid-line")
          .data(cache.yScale.ticks(config.yTicks))

      cache.horizontalGridLines.enter()
        .append("line")
        .attr("class", "horizontal-grid-line")
        .merge(cache.horizontalGridLines)
        .transition()
        .duration(config.axisTransitionDuration)
        .attr("x1", (-config.xAxisPadding.left))
        .attr("x2", cache.chartWidth)
        .attr("y1", cache.yScale)
        .attr("y2", cache.yScale)

      cache.horizontalGridLines.exit().remove()
    }

    if (config.grid === "vertical" || config.grid === "full") {
      cache.verticalGridLines = cache.svg.select(".grid-lines-group")
          .selectAll("line.vertical-grid-line")
          .data(cache.xAxis.tickValues())

      cache.verticalGridLines.enter()
        .append("line")
        .attr("class", "vertical-grid-line")
        .merge(cache.verticalGridLines)
        .transition()
        .duration(config.axisTransitionDuration)
        .attr("y1", 0)
        .attr("y2", cache.chartHeight)
        .attr("x1", cache.xScale)
        .attr("x2", cache.xScale)
    }
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

  function shouldShowHoverMarkers () {
    return config.width > config.hoverThreshold
  }

  function drawVerticalMarker () {
    cache.verticalMarkerContainer = cache.svg.select(".metadata-group .vertical-marker-container")
        .attr("transform", "translate(9999, 0)")

    cache.verticalMarkerLine = cache.verticalMarkerContainer.selectAll("path")
        .data([])

    cache.verticalMarkerLine.enter()
      .append("line")
      .classed("vertical-marker", true)
      .merge(cache.verticalMarkerLine)
      .attr("y1", cache.chartHeight)

    cache.verticalMarkerLine.exit().remove()
  }

  function moveVerticalMarker (_verticalMarkerXPosition) {
    cache.verticalMarkerContainer.attr("transform", `translate(${_verticalMarkerXPosition},0)`)
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
      .on("mouseover", function mouseover (d) {
        handleMouseOver(this, d)
      })
      .on("mouseout", function mouseout (d) {
        handleMouseOut(this, d)
      })
      .on("mousemove", function mousemove (d) {
        handleMouseMove(this, d)
      })
  }

  function handleMouseMove (_e) {
    const mouseX = mouse(_e)[0]
    const xPosition = mouseX - config.margin.left
    const dataPoint = getNearestDataPoint(xPosition)

    if (dataPoint) {
      const dataPointXPosition = cache.xScale(dataPoint[keys.DATA_KEY])
      moveVerticalMarker(dataPointXPosition)
      if (config.chartType === "stackedLine" || config.chartType === "stackedArea") {
        highlightStackedDataPoints(dataPoint)
      } else {
        highlightDataPoints(dataPoint)
      }
      dispatcher.call("mouseMove", _e, dataPoint, cache.seriesColorScale, dataPointXPosition)
    }
  }

  function handleMouseOut (_e, _d) {
    cache.verticalMarkerLine.classed("bc-is-active", false)
    cache.verticalMarkerContainer.attr("transform", "translate(9999, 0)")

    dispatcher.call("mouseOut", _e, _d, mouse(_e))
  }

  function handleMouseOver (_e, _d) {
    cache.verticalMarkerLine.classed("bc-is-active", true)

    dispatcher.call("mouseOver", _e, _d, mouse(_e))
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

  return {
    init,
    setConfig,
    setData,
    getCache,
    getConfig,
    on,
    save
  }
}
