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
  const {cloneData} = require("./helpers/common")

  /**
   * @typedef D3Selection
   * @type {Array[]}
   * @property {Number} length            Size of the selection
   * @property {DOMElement} parentNode    Parent of the selection
   */

   /**
    * @typedef lineChartDataByTopic
    * @type {Object}
    * @property {String} topicName    Topic name (required)
    * @property {Number} topic        Topic identifier (required)
    * @property {Object[]} dates      All date entries with values for that topic (required)
    *
    * @example
    * {
    *     topicName: "San Francisco",
    *     topic: 123,
    *     dates: [
    *         {
    *             date: "2017-01-16T16:00:00-08:00",
    *             value: 1
    *         },
    *         {
    *             date: "2017-01-16T17:00:00-08:00",
    *             value: 2
    *         }
    *     ]
    * }
    */

   /**
    * @typedef LineChartData
    * @type {Object[]}
    * @property {lineChartDataByTopic[]} dataBySeries  Data values to chart (required)
    *
    * @example
    * {
    *     dataBySeries: [
    *         {
    *             topicName: "San Francisco",
    *             topic: 123,
    *             dates: [
    *                 {
    *                     date: "2017-01-16T16:00:00-08:00",
    *                     value: 1
    *                 },
    *                 {
    *                     date: "2017-01-16T17:00:00-08:00",
    *                     value: 2
    *                 }
    *             ]
    *         },
    *         {
    *             topicName: "Other",
    *             topic: 345,
    *             dates: [
    *                 {...},
    *                 {...}
    *             ]
    *         }
    *     ]
    * }
    */

  /**
   * Line Chart reusable API module that allows us
   * rendering a multi line and configurable chart.
   *
   * @module Line
   * @tutorial line
   * @requires d3-array, d3-axis, d3-brush, d3-ease, d3-format, d3-scale, d3-shape, d3-selection, d3-time, d3-time-format
   *
   * @example
   * let lineChart = line()
   *
   * lineChart
   *     .aspectRatio(0.5)
   *     .width(500)
   *
   * d3Selection.select(".css-selector")
   *     .datum(dataset)
   *     .call(lineChart)
   *
   */
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
      yAxisFormat2: ".2s"
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
      dataByDate: null,
      chartWidth: null, chartHeight: null,
      xScale: null, yScale: null, yScale2: null, colorScale: null,
      seriesColorScale: null,
      xAxis: null, yAxis: null, yAxis2: null,
      groupKeys: [],
      hasSecondAxis: false
    }

    // accessors
    const getDate = (d) => d[keys.DATE_KEY] // Expect date
    const getValue = (d) => d[keys.VALUE_KEY]
    const getSeries = (d) => d[keys.ID_KEY]
    const getLineColor = (d) => cache.colorScale(d[keys.ID_KEY])

      // events
    const dispatcher = d3Dispatch.dispatch("mouseOver", "mouseOut", "mouseMove")

    /**
     * This function creates the graph using the selection and data provided
     *
     * @param {D3Selection} _selection A d3 selection that represents
     *                                  the container(s) where the chart(s) will be rendered
     * @param {LineChartData} _data The data to attach and generate the chart
     */
    function init () {
      buildSVG(_container)

      return this
    }
    init()

    /**
     * Builds the SVG element that will contain the chart
     *
     * @param  {HTMLElement} container DOM element that will work as the container of the graph
     * @private
     */
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

    /**
     * Setter for data, triggers rendering
     *
     * @param  {Object} Data object
     */
    function setData (_data) {
      const cleanedData = cleanData(_data)
      cache.dataBySeries = cleanedData.dataBySeries
      cache.dataByDate = cleanedData.dataByDate // Expect date

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

    /**
     * Adds events to the container group if the environment is not mobile
     * Adding: mouseover, mouseout and mousemove
     */
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

    /**
     * Creates the d3 x and y axis, setting orientations
     * @private
     */
    function buildAxis () {
      // let dataTimeSpan = cache.yScale.domain()[1] - cache.yScale.domain()[0]
      const tick = config.xTicks
      const format = d3TimeFormat.timeFormat(config.xAxisFormat) // Expect date

      cache.xAxis = d3Axis.axisBottom(cache.xScale)
          .ticks(tick)
          .tickSize(config.tickSizes, 0)
          .tickPadding(config.tickPadding)
          .tickFormat(format)

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

      drawGridLines(tick, config.yTicks)
    }

    /**
    * Split data by GROUP_KEY to assign them to one of both axes
    * @return {obj} Groups in the shape {$groupId: {allValues: [], allDates: []}}
    * @private
    */
    function splitGroupByAxis () {
      const groups = {}
      cache.dataBySeries.forEach((d) => {
        const key = d[keys.GROUP_KEY]
        if (!groups[key]) {
          groups[key] = {
            allValues: [],
            allDates: [] // Expect date
          }
          cache.groupKeys.push(key)
        }
        groups[key].allValues = groups[key].allValues.concat(d[keys.VALUES_KEY].map((dB) => dB[keys.VALUE_KEY]))
        groups[key].allDates = groups[key].allDates.concat(d[keys.VALUES_KEY].map((dB) => dB[keys.DATE_KEY])) // Expect date
      })

      return groups
    }

    /**
     * Creates the x and y scales of the graph
     * @private
     */
    function buildScales () {
      const groups = splitGroupByAxis()

      cache.hasSecondAxis = cache.groupKeys.length > 1

      const groupAxis1 = groups[cache.groupKeys[0]]

      const datesExtent = d3Array.extent(groupAxis1.allDates) // Expect date
      const valuesExtent = d3Array.extent(groupAxis1.allValues)
      // const yScaleBottomValue = Math.abs(minY) < 0 ? Math.abs(minY) : 0
      const yScaleBottomValue = valuesExtent[0]

      // Expect date
      cache.xScale = d3Scale.scaleTime()
          .domain(datesExtent)
          .rangeRound([0, cache.chartWidth])

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

    /**
     * Parses dates and values into JS Date objects and numbers
     * @param  {obj} dataBySeries    Raw data grouped by topic
     * @return {obj}                Parsed data with dataBySeries and dataByDate
     */
    // Expect date
    function cleanData (_data) {
      const dataBySeries = cloneData(_data[keys.SERIES_KEY])
      const flatData = []

      // Normalize dataBySeries
      dataBySeries.forEach((kv) => {
        kv[keys.VALUES_KEY].forEach((d) => {
          d[keys.DATE_KEY] = new Date(d[keys.DATE_KEY]) // Expect date
          d[keys.VALUE_KEY] = Number(d[keys.VALUE_KEY])
        })
      })

      dataBySeries.forEach((serie) => {
        serie[keys.VALUES_KEY].forEach((date) => {
          const dataPoint = {}
          dataPoint[keys.LABEL_KEY] = serie[keys.LABEL_KEY]
          dataPoint[keys.GROUP_KEY] = serie[keys.GROUP_KEY]
          dataPoint[keys.ID_KEY] = serie[keys.ID_KEY]
          dataPoint[keys.DATE_KEY] = date[keys.DATE_KEY] // Expect date
          dataPoint[keys.VALUE_KEY] = date[keys.VALUE_KEY]
          flatData.push(dataPoint)
        })
      })

      // Nest data by date and format
      // Expect date
      const dataByDate = d3Collection.nest()
        .key(getDate)
        .entries(flatData)
        .map((d) => {
          const dataPoint = {}
          dataPoint[keys.DATE_KEY] = new Date(d.key)
          dataPoint[keys.SERIES_KEY] = d[keys.VALUES_KEY]
          return dataPoint
        })

      return {dataBySeries, dataByDate}
    }

    /**
     * Removes all the datapoints highlighter circles added to the marker container
     * @return void
     */
    function cleanDataPointHighlights () {
      cache.verticalMarkerContainer.selectAll(".circle-container").remove()
    }

    /**
     * Draws the x and y axis on the svg object within their
     * respective groups
     * @private
     */
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

    /**
     * Draws the line elements within the chart group
     * @private
     */
    function drawLines () {
      const seriesLine = d3Shape.line()
          .x((d) => cache.xScale(d[keys.DATE_KEY])) // Expect date
          .y((d) => cache.yScale(d[keys.VALUE_KEY]))

      const seriesLine2 = d3Shape.line()
          .x((d) => cache.xScale(d[keys.DATE_KEY])) // Expect date
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

    /**
     * Draws grid lines on the background of the chart
     * @return void
     */
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

    /**
     * Triggers the line intro animation
     * @return void
     */
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

    /**
     * Determines if we should add the tooltip related logic depending on the
     * size of the chart and the tooltipThreshold variable value
     * @return {Boolean} Should we build the tooltip?
     */
    function shouldShowTooltip () {
      return config.width > config.tooltipThreshold
    }

    /**
     * Creates the vertical marker
     * @return void
     */
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

    /**
     * Creates coloured circles marking where the exact data y value is for a given data point
     * @param  {Object} dataPoint Data point to extract info from
     * @private
     */
    function highlightDataPoints (_dataPoint) {
      cleanDataPointHighlights()

      // sorting the topics based on the order of the colors,
      // so that the order always stays constant
      // TO DO: make it immutable
      _dataPoint[keys.SERIES_KEY] = _dataPoint[keys.SERIES_KEY]
          .filter(t => Boolean(t))
          .sort((a, b) => cache.seriesColorScale[a.name] < cache.seriesColorScale[b.name])

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

    /**
     * Helper method to update the x position of the vertical marker
     * @param  {Object} dataPoint Data entry to extract info
     * @return void
     */
    function moveVerticalMarker (_verticalMarkerXPosition) {
      cache.verticalMarkerContainer.attr("transform", `translate(${_verticalMarkerXPosition},0)`)
    }

    /**
     * Finds out which datapoint is closer to the given x position
     * @param  {Number} x0 Date value for data point
     * @param  {Object} d0 Previous datapoint
     * @param  {Object} d1 Next datapoint
     * @return {Object}    d0 or d1, the datapoint with closest date to x0
     */
     // Expect date
    function findOutNearestDate (_x0, _d0, _d1) {
      return (new Date(_x0).getTime() - new Date(_d0[keys.DATE_KEY]).getTime())
        > (new Date(_d1[keys.DATE_KEY]).getTime() - new Date(_x0).getTime()) ? _d0 : _d1
    }

    /**
     * Finds out the data entry that is closer to the given position on pixels
     * @param  {Number} mouseX X position of the mouse
     * @return {Object}        Data entry that is closer to that x axis position
     */
     // Expect date
    function getNearestDataPoint (_mouseX) {
      const dateFromInvertedX = cache.xScale.invert(_mouseX)
      const bisectDate = d3Array.bisector(getDate).left
      const dataEntryIndex = bisectDate(cache.dataByDate, dateFromInvertedX, 1)
      const dataEntryForXPosition = cache.dataByDate[dataEntryIndex]
      const previousDataEntryForXPosition = cache.dataByDate[dataEntryIndex - 1]
      let nearestDataPoint = null

      if (previousDataEntryForXPosition && dataEntryForXPosition) {
        nearestDataPoint = findOutNearestDate(dateFromInvertedX, dataEntryForXPosition, previousDataEntryForXPosition)
      } else {
        nearestDataPoint = dataEntryForXPosition
      }

      return nearestDataPoint
    }

    /**
     * MouseMove handler, calculates the nearest dataPoint to the cursor
     * and updates metadata related to it
     * @private
     */
    function handleMouseMove (_e) {
      const mouseX = d3Selection.mouse(_e)[0]
      const xPosition = mouseX - config.margin.left
      const dataPoint = getNearestDataPoint(xPosition)

      if (dataPoint) {
        const dataPointXPosition = cache.xScale(new Date(dataPoint.date)) // Expect date
        moveVerticalMarker(dataPointXPosition)
        highlightDataPoints(dataPoint)
        dispatcher.call("mouseMove", _e, dataPoint, cache.seriesColorScale, dataPointXPosition)
      }
    }

    /**
     * MouseOut handler and removes active class on verticalMarkerLine
     * It also resets the container of the vertical marker
     * @private
     */
    function handleMouseOut (_e, _d) {
      cache.verticalMarkerLine.classed("bc-is-active", false)
      cache.verticalMarkerContainer.attr("transform", "translate(9999, 0)")

      dispatcher.call("mouseOut", _e, _d, d3Selection.mouse(_e))
    }

    /**
     * Mouseover handler and adds active class to verticalMarkerLine
     * @private
     */
    function handleMouseOver (_e, _d) {
      cache.verticalMarkerLine.classed("bc-is-active", true)

      dispatcher.call("mouseOver", _e, _d, d3Selection.mouse(_e))
    }

    /**
     * Chart exported to png and a download action is fired
     * @public
     */
    function save (_filename, _title) {
      exportChart.call(this, cache.svg, _filename, _title)
    }

    /**
     * Exposes an "on" method that acts as a bridge with the event dispatcher
     * We are going to expose this events:
     * customMouseHover, mouseMove and mouseOut
     *
     * @return {module} Bar Chart
     * @public
     */
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
