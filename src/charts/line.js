define((require) => {
  "use strict"

  const d3Array = require("d3-array")
  const d3Axis = require("d3-axis")
  const d3Collection = require("d3-collection")
  const d3Dispatch = require("d3-dispatch")
  const d3Ease = require("d3-ease")
  const d3Scale = require("d3-scale")
  const d3Shape = require("d3-shape")
  const d3Selection = require("d3-selection")
  const d3TimeFormat = require("d3-time-format")
  const d3Format = require("d3-format")

  const {exportChart} = require("./helpers/exportChart")
  const colorHelper = require("./helpers/colors")
  const {keys} = require("./helpers/constants")
  const {cloneData, invertScale, sortData} = require("./helpers/common")

  return function mapdLine (_container) {

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
      colorSchema: colorHelper.mapdColors,
      dotRadius: 4,
      xAxisFormat: "%c",
      xTicks: null,
      tickSizes: 8,

      isAnimated: false,
      ease: d3Ease.easeQuadInOut,
      animationDuration: 1500,

      yTicks: 5,
      yTicks2: 5,
      yAxisFormat: ".2s",
      yAxisFormat2: ".2s",

      isTimeseries: false
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
      chartWidth: null, chartHeight: null,
      xScale: null, yScale: null, yScale2: null, colorScale: null,
      seriesColorScale: null,
      xAxis: null, yAxis: null, yAxis2: null,
      groupKeys: [],
      hasSecondAxis: false
    }

    // accessors
    const getKey = (d) => d[keys.DATA_KEY]
    const getValue = (d) => d[keys.VALUE_KEY]
    const getSeries = (d) => d[keys.ID_KEY]
    const getLineColor = (d) => cache.colorScale(d[keys.ID_KEY])

    // events
    const dispatcher = d3Dispatch.dispatch("mouseOver", "mouseOut", "mouseMove")

    function init () {
      buildSVG(_container)

      return this
    }
    init()

    function buildSVG () {
      const w = config.width || this.clientWidth
      const h = config.height || this.clientHeight
      cache.chartWidth = w - config.margin.left - config.margin.right
      cache.chartHeight = h - config.margin.top - config.margin.bottom

      if (!cache.svg) {
        cache.svg = d3Selection.select(cache.container)
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
      const cleanedData = cleanData(_data)
      cache.dataBySeries = cleanedData.dataBySeries
      cache.dataByKey = cleanedData.dataByKey

      buildSVG(_container)
      buildScales()
      buildAxis()
      drawAxis()
      drawLines()

      if (shouldShowTooltip()) {
        drawVerticalMarker()
        addMouseEvents()
      }

      triggerIntroAnimation()

      return this
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

    function buildAxis () {
      cache.xAxis = d3Axis.axisBottom(cache.xScale)
          .ticks(config.xTicks)
          .tickSize(config.tickSizes, 0)
          .tickPadding(config.tickPadding)

      if (config.isTimeseries) {
        const format = d3TimeFormat.timeFormat(config.xAxisFormat)
        cache.xAxis.tickFormat(format)
      }

      cache.yAxis = d3Axis.axisLeft(cache.yScale)
          .ticks(config.yTicks)
          .tickSize([config.tickSizes])
          .tickPadding(config.tickPadding)
          .tickFormat(d3Format.format(config.yAxisFormat))

      cache.yAxis2 = d3Axis.axisRight(cache.yScale2)
          .ticks(config.yTicks)
          .tickSize([config.tickSizes])
          .tickPadding(config.tickPadding)
          .tickFormat(d3Format.format(config.yAxisFormat))

      drawGridLines(config.xTicks, config.yTicks)
    }

    function splitGroupByAxis () {
      const groups = {}
      cache.dataBySeries.forEach((d) => {
        const key = d[keys.GROUP_KEY]
        if (!groups[key]) {
          groups[key] = {
            allValues: [],
            allKeys: []
          }
          cache.groupKeys.push(key)
        }
        groups[key].allValues = groups[key].allValues.concat(d[keys.VALUES_KEY].map((dB) => dB[keys.VALUE_KEY]))
        groups[key].allKeys = groups[key].allKeys.concat(d[keys.VALUES_KEY].map((dB) => dB[keys.DATA_KEY]))
      })

      return groups
    }

    function buildScales () {
      const groups = splitGroupByAxis()

      cache.hasSecondAxis = cache.groupKeys.length > 1

      const groupAxis1 = groups[cache.groupKeys[0]]

      let datesExtent = null
      if (config.isTimeseries) {
        datesExtent = d3Array.extent(groupAxis1.allKeys)
        cache.xScale = d3Scale.scaleTime()
      } else {
        datesExtent = groupAxis1.allKeys
        cache.xScale = d3Scale.scalePoint().padding(0)
      }

      const valuesExtent = d3Array.extent(groupAxis1.allValues)
      const yScaleBottomValue = valuesExtent[0]

      cache.xScale.domain(datesExtent)
          .range([0, cache.chartWidth])

      cache.yScale = d3Scale.scaleLinear()
          .domain([yScaleBottomValue, Math.abs(valuesExtent[1])])
          .rangeRound([cache.chartHeight, 0])
          .nice()

      if (cache.hasSecondAxis) {
        const groupAxis2 = groups[cache.groupKeys[1]]
        const valuesExtent2 = d3Array.extent(groupAxis2.allValues)
        const yScaleBottomValue2 = valuesExtent2[0]

        cache.yScale2 = cache.yScale.copy()
          .domain([yScaleBottomValue2, Math.abs(valuesExtent2[1])])
      }

      cache.colorScale = d3Scale.scaleOrdinal()
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
      dataBySeries.forEach((kv) => {
        kv[keys.VALUES_KEY].forEach((d) => {
          d[keys.DATA_KEY] = config.isTimeseries ? new Date(d[keys.DATA_KEY]) : d[keys.DATA_KEY]
          d[keys.VALUE_KEY] = Number(d[keys.VALUE_KEY])
        })
      })

      dataBySeries.forEach((serie) => {
        serie[keys.VALUES_KEY].forEach((date) => {
          const dataPoint = {}
          dataPoint[keys.LABEL_KEY] = serie[keys.LABEL_KEY]
          dataPoint[keys.GROUP_KEY] = serie[keys.GROUP_KEY]
          dataPoint[keys.ID_KEY] = serie[keys.ID_KEY]
          dataPoint[keys.DATA_KEY] = date[keys.DATA_KEY]
          dataPoint[keys.VALUE_KEY] = date[keys.VALUE_KEY]
          flatData.push(dataPoint)
        })
      })

      const flatDataSorted = sortData(flatData, config.isTimeseries)

      // Nest data by date and format
      const dataByKey = d3Collection.nest()
        .key(getKey)
        .entries(flatDataSorted)
        .map((d) => {
          const dataPoint = {}
          dataPoint[keys.DATA_KEY] = config.isTimeseries ? new Date(d.key) : d.key // Expect date-done
          // dataPoint[keys.DATA_KEY] = d.key
          dataPoint[keys.SERIES_KEY] = d[keys.VALUES_KEY]
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
          .ease(config.ease)
          .call(cache.yAxis)

      if (cache.hasSecondAxis) {
        cache.svg.select(".y-axis-group2.axis.y")
            .attr("transform", `translate(${cache.chartWidth - config.xAxisPadding.right}, 0)`)
            .transition()
            .ease(config.ease)
            .call(cache.yAxis2)
      }
    }

    function drawLines () {
      const seriesLine = d3Shape.line()
          .x((d) => cache.xScale(d[keys.DATA_KEY]))
          .y((d) => cache.yScale(d[keys.VALUE_KEY]))

      const seriesLine2 = d3Shape.line()
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
          .sort((a, b) => cache.seriesColorScale[a[keys.LABEL_KEY]] < cache.seriesColorScale[b[keys.LABEL_KEY]])

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
      const keyFromInvertedX = invertScale(cache.xScale, _mouseX, config.isTimeseries)
      const bisectLeft = d3Array.bisector(getKey).left
      const dataEntryIndex = bisectLeft(cache.dataByKey, keyFromInvertedX)
      const dataEntryForXPosition = cache.dataByKey[dataEntryIndex]
      let nearestDataPoint = null

      if (keyFromInvertedX) {
        nearestDataPoint = dataEntryForXPosition
      }
      return nearestDataPoint
    }

    function handleMouseMove (_e) {
      const mouseX = d3Selection.mouse(_e)[0]
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

      dispatcher.call("mouseOut", _e, _d, d3Selection.mouse(_e))
    }

    function handleMouseOver (_e, _d) {
      cache.verticalMarkerLine.classed("bc-is-active", true)

      dispatcher.call("mouseOver", _e, _d, d3Selection.mouse(_e))
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

})
