define((require) => {
  "use strict"

  const d3Array = require("d3-array")
  const d3Brush = require("d3-brush")
  // const d3Ease = require("d3-ease")
  const d3Scale = require("d3-scale")
  const d3Dispatch = require("d3-dispatch")
  const d3Selection = require("d3-selection")
  const d3Time = require("d3-time")

  const {keys} = require("./helpers/constants")
  const {cloneData} = require("./helpers/common")

  /**
   * @typedef BrushChartData
   * @type {Object[]}
   * @property {Number} value        Value to chart (required)
   * @property {Date} date           Date of the value (required)
   *
   * @example
   * [
   *     {
   *         value: 1,
   *         date: '2011-01-06T00:00:00Z'
   *     },
   *     {
   *         value: 2,
   *         date: '2011-01-07T00:00:00Z'
   *     }
   * ]
   */

  /**
   * Brush Chart reusable API class that renders a
   * simple and configurable brush chart.
   *
   * @module Brush
   * @tutorial brush
   * @requires d3-array, d3-axis, d3-brush, d3-ease, d3-scale, d3-shape, d3-selection, d3-time, d3-time-format
   *
   * @example
   * let brushChart = brush();
   *
   * brushChart
   *     .height(500)
   *     .width(800);
   *
   * d3Selection.select('.css-selector')
   *     .datum(dataset)
   *     .call(brushChart);
   *
   */

  return function module (_chart) {

    let config = {
      margin: {
        top: 60,
        right: 30,
        bottom: 40,
        left: 70
      },
      width: 800,
      height: 500
    }

    const cache = {
      chart: _chart,
      svg: null,
      chartWidth: null,
      chartHeight: null,
      dateRange: [null, null],
      brush: null,
      chartBrush: null,
      handle: null,
      data: null,
      xScale: null
    }

    let chartCache = null

    // accessors
    // const getValue = ({value}) => value
    // const getDate = ({date}) => date

    // events
    const dispatcher = d3Dispatch.dispatch("brushStart", "brushMove", "brushEnd")

    /**
     * This function creates the graph using the selection as container
     * @param  {D3Selection} _selection A d3 selection that represents
     *                                  the container(s) where the chart(s) will be rendered
     * @param {BrushChartData} _data The data to attach and generate the chart
     */
    function init () {
      buildSVG()

      cache.data = extractBrushDimension(cloneData(chartCache.dataBySeries))
      buildScales()
      buildBrush()
      drawBrush()
    }
    init()

    /**
     * Builds the SVG element that will contain the chart
     * @param  {HTMLElement} container DOM element that will work as the container of the graph
     * @private
     */
    function buildSVG () {
      chartCache = cache.chart.getCache()
      setConfig(cache.chart.getConfig())

      cache.chartWidth = config.width - config.margin.left - config.margin.right
      cache.chartHeight = config.height - config.margin.top - config.margin.bottom

      if (!cache.svg) {
        cache.svg = chartCache.svg.append("g")
            .classed("brush-group", true)
      }

      cache.svg.attr("transform", `translate(${config.margin.left}, ${config.margin.top})`)
    }

    /**
     * Creates the brush element and attaches a listener
     * @return {void}
     */
    function buildBrush () {
      cache.brush = d3Brush.brushX()
          .extent([[0, 0], [cache.chartWidth, cache.chartHeight]])
          .on("start", handleBrushStart)
          .on("brush", handleBrushMove)
          .on("end", handleBrushEnd)
    }

    /**
     * Builds containers for the chart, the axis and a wrapper for all of them
     * Also applies the Margin convention
     * @private
     */
    function buildContainerGroups () {
      const container = cache.svg
          .append("g")
          .classed("container-group", true)
          .attr("transform", `translate(${config.margin.left}, ${config.margin.top})`)

      container
        .append("g")
        .classed("brush-group", true)
    }

    /**
     * Creates the x and y scales of the graph
     * @private
     */
    function buildScales () {
      cache.xScale = d3Scale.scaleTime()
          .domain(d3Array.extent(cache.data))
          .range([0, cache.chartWidth])
    }

    /**
     * Cleaning data adding the proper format
     *
     * @param  {BrushChartData} data Data
     */
    function extractBrushDimension (_data) {
      const merged = d3Array.merge(_data.map((d) => d[keys.VALUES_KEY]))
      return merged.map((d) => new Date(d[keys.DATE_KEY]))
          .sort((a, b) => (a.getTime() - b.getTime()))
    }

    /**
     * Draws the Brush components on its group
     * @return {void}
     */
    function drawBrush () {
      cache.chartBrush = cache.svg.call(cache.brush)

      cache.chartBrush.selectAll(".brush-rect")
        .attr("height", cache.chartHeight)
    }

    /**
     * When a brush event starts, we can extract info from the extension
     * of the brush.
     *
     * @return {void}
     */
    function handleBrushStart () {
      const s = d3Selection.event.selection
      const dateExtent = s.map(cache.xScale.invert)

      dispatcher.call("brushStart", this, dateExtent)
    }

    /**
     * When a brush event moves, we can extract info from the extension
     * of the brush.
     *
     * @return {void}
     */
    function handleBrushMove () {
      const s = d3Selection.event.selection
      const dateExtent = s.map(cache.xScale.invert)

      dispatcher.call("brushMove", this, dateExtent)
    }

    /**
     * Processes the end brush event, snapping the boundaries to days
     * as showed on the example on https://bl.ocks.org/mbostock/6232537
     * @return {void}
     * @private
     */
    function handleBrushEnd () {
      // Only transition after input, ignore empty selections.
      if (!d3Selection.event.sourceEvent || !d3Selection.event.selection) {
        return
      }

      const s = d3Selection.event.selection
      const dateExtent = s.map(cache.xScale.invert)
      const dateExtentRounded = dateExtent.map(d3Time.timeDay.round)

      // If empty when rounded, use floor & ceil instead.
      if (dateExtentRounded[0] >= dateExtentRounded[1]) {
        dateExtentRounded[0] = d3Time.timeDay.floor(dateExtent[0])
        dateExtentRounded[1] = d3Time.timeDay.offset(dateExtentRounded[0])
      }

      d3Selection.select(this)
        .transition()
        .call(d3Selection.event.target.move, dateExtentRounded.map(cache.xScale))

      dispatcher.call("brushEnd", this, dateExtentRounded)
    }

    /**
     * Sets a new brush extent within the passed percentage positions
     * @param {Number} a Percentage of data that the brush start with
     * @param {Number} b Percentage of data that the brush ends with
     * @example
     *     setBrushByPercentages(0.25, 0.5)
     */
    function setBrushByPercentages (_a, _b) {
      const x0 = _a * cache.chartWidth
      const x1 = _b * cache.chartWidth

      brush.move(chartBrush, [x0, x1])
    }

    /**
     * Sets a new brush extent within the passed dates
     * @param {String | Date} dateA Initial Date
     * @param {String | Date} dateB End Date
     */
    function setBrushByDates (_dateA, _dateB) {
      const x0 = cache.xScale(new Date(_dateA))
      const x1 = cache.xScale(new Date(_dateB))

      cache.brush.move(cache.chartBrush, [x0, x1])
    }

    /**
     * Updates visibility and position of the brush handlers
     * @param  {Number[]} dateExtent Date range
     * @return {void}
     */
    function updateHandlers (_dateExtent) {
      if (_dateExtent === null) {
        cache.handle.attr("display", "none")
      } else {
        cache.handle
          .attr("display", null)
          .attr("transform", (d, i) => `translate(${_dateExtent[i]},${cache.chartHeight / 2})`)
      }
    }

    // API

    /**
     * Gets or Sets the dateRange for the selected part of the brush
     * @param  {String[]} _x Desired dateRange for the graph
     * @return { dateRange | module} Current dateRange or Chart module to chain calls
     * @public
     */
    // function dateRange (_x) {
    //   if (!arguments.length) {
    //     return dateRange
    //   }
    //   dateRange = _x

    //   if (Array.isArray(dateRange)) {
    //     setBrushByDates(...dateRange)
    //   }

    //   return this
    // }

    /**
     * Exposes an 'on' method that acts as a bridge with the event dispatcher
     * We are going to expose this events:
     * brushStart, brushMove, brushEnd
     *
     * @return {module} Chart
     * @public
     */
    function on (...args) {
      return dispatcher.on(...args)
    }

    function setConfig (_config) {
      config = Object.assign({}, config, _config)
      return this
    }

    function getCache () {
      return cache
    }

    return {
      getCache,
      on,
      setConfig
    }
  }

})
