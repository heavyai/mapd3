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
import {cloneData, invertScale, sortData} from "./helpers/common"

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
    tooltipThreshold: 480,
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
    xTicks: null,
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
    stack: null
  }

  // accessors
  const getKey = (d) => d[keys.DATA_KEY]
  const getID = (d) => d[keys.ID_KEY]
  const getValue = (d) => d[keys.VALUE_KEY]
  const getSeries = (d) => d[keys.ID_KEY]
  const getLineColor = (d) => cache.colorScale(d[keys.ID_KEY])

  // events
  const dispatcher = dispatch("mouseOver", "mouseOut", "mouseMove")

  function buildAxis () {
    cache.xAxis = axisBottom(cache.xScale)
        .ticks(config.xTicks)
        .tickSize(config.tickSizes, 0)
        .tickPadding(config.tickPadding)

    if (config.keyType === "time") {
      const formatter = timeFormat(config.xAxisFormat)
      cache.xAxis.tickFormat(formatter)
    }

    cache.yAxis = axisLeft(cache.yScale)
        .ticks(config.yTicks)
        .tickSize([config.tickSizes])
        .tickPadding(config.tickPadding)
        .tickFormat(format(config.yAxisFormat))

    cache.yAxis2 = axisRight(cache.yScale2)
        .ticks(config.yTicks)
        .tickSize([config.tickSizes])
        .tickPadding(config.tickPadding)
        .tickFormat(format(config.yAxisFormat))

    drawGridLines(config.xTicks, config.yTicks)
  }

  function buildStackedScales () {
    const groups = splitGroupByAxis()

    cache.hasSecondAxis = cache.groupKeys.length > 1

    const groupAxis1 = groups[cache.groupKeys[0]]

    let datesExtent = null
    if (config.keyType === "time") {
      datesExtent = extent(groupAxis1.allKeys)
      cache.xScale = scaleTime()
    } else {
      datesExtent = groupAxis1.allKeys
      cache.xScale = scalePoint().padding(0)
    }

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
    const yScaleBottomValue = 0

    cache.xScale.domain(datesExtent)
        .range([yScaleBottomValue, cache.chartWidth])

    cache.yScale = scaleLinear()
        .domain([0, valuesExtent[1]])
        .rangeRound([cache.chartHeight, 0])
        .nice()

    if (cache.hasSecondAxis) {
      const groupAxis2 = groups[cache.groupKeys[1]]
      const valuesExtent2 = extent(groupAxis2.allValues)
      const yScaleBottomValue2 = valuesExtent2[0]

      cache.yScale2 = cache.yScale.copy()
        .domain([yScaleBottomValue2, Math.abs(valuesExtent2[1])])
    }

    cache.colorScale = scaleOrdinal()
        .range(config.colorSchema)
        .domain(cache.dataBySeries.map(getSeries))

    const range = cache.colorScale.range()
    cache.seriesColorScale = cache.colorScale.domain()
      .reduce((memo, item, i) => {
        memo[item] = range[i]
        return memo
      }, {})
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
        dataPoint[keys.DATA_KEY] = d[keys.DATA_KEY]
        dataPoint[keys.VALUE_KEY] = d[keys.VALUE_KEY]
        flatData.push(dataPoint)
      })
    })

    const flatDataSorted = sortData(flatData, config.keyType)

    const dataByKey = nest()
      .key(getKey)
      .entries(flatDataSorted)
      .map((d) => {
        const dataPoint = {}
        dataPoint[keys.DATA_KEY] = config.keyType === "time" ? new Date(d.key) : d.key
        dataPoint[keys.SERIES_KEY] = d.values
        return dataPoint
      })

    return {dataBySeries, dataByKey}
  }

  function cleanDataPointHighlights () {
    cache.verticalMarkerContainer.selectAll(".circle-container").remove()
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
      .append("g")
      .attr("class", "series")
      .append("path")
      .merge(lines)
      .attr("class", (d, i) => ["line", `group-${d[keys.GROUP_KEY]}`, `series-${i}`].join(" "))
      .attr("d", (d) => {
        if (d[keys.GROUP_KEY] === cache.groupKeys[0]) {
          return seriesLine(d[keys.VALUES_KEY])
        } else {
          return seriesLine2(d[keys.VALUES_KEY])
        }
      })
      .style("stroke", getLineColor)

    lines.exit().remove()
  }

  function drawAreas () {
    const seriesLine = area()
        .x((d) => cache.xScale(d[keys.DATA_KEY]))
        .y0((d) => cache.yScale(d[keys.VALUE_KEY]))
        .y1(() => cache.chartHeight)

    const seriesLine2 = area()
        .x((d) => cache.xScale(d[keys.DATA_KEY]))
        .y0((d) => cache.yScale2(d[keys.VALUE_KEY]))
        .y1(() => cache.chartHeight)
        .curve(d3.curveCatmullRom)

    const areas = cache.svg.select(".chart-group").selectAll(".area")
        .data(cache.dataBySeries)

    areas.enter()
      .append("g")
      .attr("class", "series")
      .append("path")
      .merge(areas)
      .attr("class", (d, i) => ["area", `group-${d[keys.GROUP_KEY]}`, `series-${i}`].join(" "))
      .attr("d", (d) => {
        if (d[keys.GROUP_KEY] === cache.groupKeys[0]) {
          return seriesLine(d[keys.VALUES_KEY])
        } else {
          return seriesLine2(d[keys.VALUES_KEY])
        }
      })
      .style("stroke", getLineColor)
      .style("fill", getLineColor)

    areas.exit().remove()
  }

  function drawStackedAreas () {
    const seriesLine = area()
        .x((d) => cache.xScale(d.data[keys.DATA_KEY]))
        .y0((d) => cache.yScale(d[0]))
        .y1((d) => cache.yScale(d[1]))

    // const seriesLine2 = area()
    //     .x((d) => cache.xScale(d[keys.DATA_KEY]))
    //     .y0((d) => cache.yScale2(d[keys.VALUE_KEY]))
    //     .y1(() => cache.chartHeight)
    //     .curve(d3.curveCatmullRom)

    const areas = cache.svg.select(".chart-group").selectAll(".area")
        .data(cache.stack(cache.stackData))

    // to do: d.index for groups
    areas.enter()
      .append("g")
      .attr("class", "series")
      .append("path")
      .merge(areas)
      .attr("class", (d, i) => ["area", `group-${d.index}`, `series-${i}`].join(" "))
      .attr("d", (d, i) => {
        // if (d[keys.GROUP_KEY] === cache.groupKeys[0]) {
          return seriesLine(d)
        // } else {
        //   return seriesLine2(d[keys.VALUES_KEY])
        // }
      })
      .style("stroke", "none")
      .style("fill", (d, i) => cache.colorScale(i))

    areas.exit().remove()
  }

  function drawGridLines (_xTicks, _yTicks) {
    if (config.grid === "horizontal" || config.grid === "full") {
      cache.horizontalGridLines = cache.svg.select(".grid-lines-group")
          .selectAll("line.horizontal-grid-line")
          .data(cache.yScale.ticks(_yTicks))

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
          .data(cache.xScale.ticks(_xTicks))

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

  function shouldShowTooltip () {
    return config.width > config.tooltipThreshold
  }

  function drawVerticalMarker () {
    cache.verticalMarkerContainer = cache.svg.select(".metadata-group .vertical-marker-container")
        .attr("transform", "translate(9999, 0)")

    cache.verticalMarkerLine = cache.verticalMarkerContainer.selectAll("path")
        .data([{
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0
        }])

    cache.verticalMarkerLine.enter()
      .append("line")
      .classed("vertical-marker", true)
      .merge(cache.verticalMarkerLine)
      .attr("x1", 0)
      .attr("y1", cache.chartHeight)
      .attr("x2", 0)
      .attr("y2", 0)

    cache.verticalMarkerLine.exit().remove()
  }

  function highlightDataPoints (_dataPoint) {
    cleanDataPointHighlights()

    // sorting the series based on the order of the colors,
    // so that the order always stays constant
    _dataPoint[keys.SERIES_KEY] = _dataPoint[keys.SERIES_KEY]
        .filter(t => Boolean(t))
        .sort((a, b) => a[keys.LABEL_KEY].localeCompare(b[keys.LABEL_KEY], "en", {numeric: false}))

    _dataPoint[keys.SERIES_KEY].forEach(({id}, index) => {
      const marker = cache.verticalMarkerContainer
          .append("g")
          .classed("circle-container", true)

      marker.append("circle")
        .classed("data-point-highlighter", true)
        .attr("cx", config.dotRadius / 2)
        .attr("cy", 0)
        .attr("r", config.dotRadius)
        .style("stroke", cache.seriesColorScale[id])

      marker.attr("transform", () => {
        const datum = _dataPoint[keys.SERIES_KEY][index]
        const scale = datum.group === cache.groupKeys[0] ? cache.yScale(datum[keys.VALUE_KEY]) : cache.yScale2(datum[keys.VALUE_KEY])
        return `translate( ${(-config.dotRadius / 2)}, ${scale} )`
      })
    })
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

  function handleMouseMove (_e) {
    const mouseX = mouse(_e)[0]
    const xPosition = mouseX - config.margin.left
    const dataPoint = getNearestDataPoint(xPosition)

    if (dataPoint) {
      const dataPointXPosition = cache.xScale(dataPoint[keys.DATA_KEY])
      moveVerticalMarker(dataPointXPosition)
      highlightDataPoints(dataPoint)
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
