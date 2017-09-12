define((require) => {
  "use strict"

  const d3Ease = require("d3-ease")
  const d3Format = require("d3-format")
  const d3TimeFormat = require("d3-time-format")

  const {keys} = require("./helpers/constants")

  /**
   * Tooltip Component reusable API class that renders a
   * simple and configurable tooltip element for MapD3's
   * line chart or stacked area chart.
   *
   * @module Tooltip
   * @tutorial tooltip
   * @requires d3-array, d3-axis, d3-dispatch, d3-format, d3-scale, d3-selection, d3-transition
   *
   * @example
   * var lineChart = line(),
   *     tooltip = tooltip();
   *
   * tooltip
   *     .title('Tooltip title');
   *
   * lineChart
   *     .width(500)
   *     .on('customMouseOver', function() {
   *          tooltip.show();
   *     })
   *     .on('customMouseMove', function(dataPoint, topicColorMap, dataPointXPosition) {
   *          tooltip.update(dataPoint, topicColorMap, dataPointXPosition);
   *     })
   *     .on('customMouseOut', function() {
   *          tooltip.hide();
   *     });
   *
   * d3Selection.select('.css-selector')
   *     .datum(dataset)
   *     .call(lineChart);
   *
   * d3Selection.select('.metadata-group .hover-marker')
   *     .datum([])
   *     .call(tooltip);
   *
   */
  return function module (_chart) {

    let config = {
      margin: {
        top: 2,
        right: 2,
        bottom: 2,
        left: 2
      },
      width: 250,
      height: 45,

      title: "",
      valueFormat: ".2s",

      tooltipOffset: {
        y: -55,
        x: 0
      },
      tooltipMaxTopicLength: 170,
      tooltipBorderRadius: 3,
      entryLineLimit: 3,

      // Animations
      mouseChaseDuration: 30,
      ease: d3Ease.easeQuadInOut,

      titleHeight: 32,
      elementHeight: 24,
      padding: 8,
      dotRadius: 4,

      dateFormat: "%x",
      seriesOrder: []
    }

    const cache = {
      chart: _chart,
      svg: null,
      colorMap: null,
      chartWidth: null,
      chartHeight: null,
      tooltipDivider: null,
      tooltipBody: null,
      tooltipTitle: null,
      tooltipHeight: 48,
      tooltipWidth: 150,
      tooltipBackground: null
    }

    let chartCache = null

    /**
     * This function creates the graph using the selection as container
     * @param {D3Selection} _selection A d3 selection that represents
     *                                  the container(s) where the chart(s) will be rendered
     * @param {Object} _data The data to attach and generate the chart
     */
    function init () {
      cache.chart.on("mouseOver.tooltip", show)
        .on("mouseMove.tooltip", update)
        .on("mouseOut.tooltip", hide)

      buildSVG()
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

      if (!cache.svg) {
        cache.svg = chartCache.svg.append("g")
            .classed("mapd3 mapd3-tooltip", true)

        cache.tooltipBackground = cache.svg.append("rect")
            .classed("tooltip-text-container", true)

        cache.tooltipTitle = cache.svg.append("text")
            .classed("tooltip-title", true)
            .attr("dominant-baseline", "hanging")

        cache.tooltipDivider = cache.svg.append("line")
            .classed("tooltip-divider", true)

        cache.tooltipBody = cache.svg.append("g")
            .classed("tooltip-body", true)
      }

      cache.chartWidth = config.width - config.margin.left - config.margin.right
      cache.chartHeight = config.height - config.margin.top - config.margin.bottom

      cache.svg.attr("width", config.width)
        .attr("height", config.height)

      cache.tooltipBackground.attr("width", cache.tooltipWidth)
          .attr("height", cache.tooltipHeight)
          .attr("rx", config.tooltipBorderRadius)
          .attr("ry", config.tooltipBorderRadius)

      cache.tooltipTitle.attr("dy", config.padding)
          .attr("dx", config.padding)

      cache.tooltipDivider.attr("x2", cache.tooltipWidth)
          .attr("y1", config.titleHeight)
          .attr("y2", config.titleHeight)

      cache.tooltipBody = cache.svg.append("g")
          .classed("tooltip-body", true)

      hide()
    }

    /**
     * Draws the data entries inside the tooltip for a given series
     * @param  {Object} series series to extract data from
     * @return void
     */
    function updateSeriesContent (_series) {
      const tooltipLeft = cache.tooltipBody.selectAll(".tooltip-left-text")
          .data(_series)
      tooltipLeft.enter().append("text")
        .classed("tooltip-left-text", true)
        .attr("dominant-baseline", "hanging")
        .attr("dy", config.padding)
        .attr("dx", config.padding * 2 + config.dotRadius)
        .merge(tooltipLeft)
        .attr("y", (d, i) => i * config.elementHeight + config.titleHeight)
        .text((d) => d[keys.LABEL_KEY])
      tooltipLeft.exit().remove()

      const tooltipRight = cache.tooltipBody.selectAll(".tooltip-right-text")
          .data(_series)
      tooltipRight.enter().append("text")
        .classed("tooltip-right-text", true)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "hanging")
        .attr("dy", config.padding)
        .attr("dx", -config.padding)
        .merge(tooltipRight)
        .attr("x", cache.tooltipWidth)
        .attr("y", (d, i) => i * config.elementHeight + config.titleHeight)
        .text(getValueText)
      tooltipRight.exit().remove()

      const tooltipCircles = cache.tooltipBody.selectAll(".tooltip-circle")
          .data(_series)
      tooltipCircles.enter().append("circle")
        .classed("tooltip-circle", true)
        .merge(tooltipCircles)
        .attr("cx", config.padding + config.dotRadius)
        .attr("cy", (d, i) => i * config.elementHeight + config.titleHeight + config.elementHeight / 2)
        .attr("r", config.dotRadius)
        .style("fill", (d) => chartCache.seriesColorScale[d[keys.ID_KEY]])
      tooltipCircles.exit().remove()

      cache.tooltipHeight = cache.tooltipBody.node().getBBox().height
      cache.tooltipBackground.attr("width", cache.tooltipWidth)
        .attr("height", cache.tooltipHeight + config.titleHeight + config.padding)
    }

    /**
     * Calculates the desired position for the tooltip
     * @param  {Number} mouseX             Current horizontal mouse position
     * @param  {Number} mouseY             Current vertical mouse position
     * @return {Number[]}                  X and Y position
     */
    function getTooltipPosition (_mouseX) {
      const tooltipX = _mouseX + config.margin.left
      let offset = 0
      const tooltipY = config.margin.top

      if (_mouseX > (cache.chartWidth / 2)) {
        offset = -cache.tooltipWidth
      }

      return [tooltipX + offset, tooltipY]
    }

    /**
     * Extracts the value from the data object
     * @param  {Object} data Data value containing the info
     * @return {String}      Value to show
     */
    function getValueText (_data) {
      const value = _data[keys.VALUE_KEY]
      let valueText = null
      const format = d3Format.format(config.valueFormat)

      if (data.missingValue) {
        valueText = "-"
      } else {
        valueText = format(value)
      }

      return valueText
    }

    /**
     * Updates size and position of tooltip depending on the side of the chart we are in
     *
     * @param  {Object} dataPoint DataPoint of the tooltip
     * @param  {Number} xPosition DataPoint's x position in the chart
     * @param  {Number} xPosition DataPoint's y position in the chart
     * @return void
     */
    function updatePositionAndSize (_xPosition) {
      const [tooltipX, tooltipY] = getTooltipPosition(_xPosition)

      cache.svg.attr("width", cache.tooltipWidth)
        .attr("height", cache.tooltipHeight)
        .transition()
        .duration(config.mouseChaseDuration)
        .ease(config.ease)
        .attr("transform", `translate(${tooltipX}, ${tooltipY})`)
    }

    /**
     * Updates value of tooltipTitle with the data meaning and the date
     * @param  {Object} dataPoint Point of data to use as source
     * @return void
     */
    function updateTitle (_dataPoint) {
      const date = new Date(_dataPoint[keys.DATE_KEY])
      const format = d3TimeFormat.timeFormat(config.dateFormat)
      const tooltipTitleText = [config.title, format(date)].join("")

      cache.tooltipTitle.text(tooltipTitleText)
    }

    /**
     * Helper method to sort the passed topics array by the names passed int he order arary
     * @param  {Object[]} topics    Topics data, retrieved from datapoint passed by line chart
     * @param  {Object[]} order     Array of names in the order to sort topics by
     * @return {Object[]}           sorted topics object
     */
    function sortByTopicsOrder (_series, _order = seriesOrder) {
      return _order.map((orderName) => _series.filter(({name}) => name === orderName)[0])
    }

    /**
     * Sorts series by alphabetical order for arrays of objects with a name proeprty
     * @param  {Array} topics   List of series objects
     * @return {Array}          List of series name strings
     */
    function sortByAlpha (_series) {
      // TO DO: make this immutable
      return _series.sort()
    }

    /**
     * Draws the data entries inside the tooltip
     * @param  {Object} dataPoint   Data entry from to take the info
     * @return void
     */
    function updateContent (dataPoint) {
      let series = dataPoint[keys.SERIES_KEY]

      if (config.seriesOrder.length) {
        series = sortByTopicsOrder(series)
      } else if (series.length && series[0].name) {
        series = sortByAlpha(series)
      }

      updateTitle(dataPoint)
      updateSeriesContent(series)
    }

    /**
     * Updates tooltip title, content, size and position
     * sorts by alphatical name order if not forced order given
     *
     * @param  {lineChartPointByDate} dataPoint  Current datapoint to show info about
     * @param  {Number} xPosition           Position of the mouse on the X axis
     * @return void
     */
    function updateTooltip (dataPoint, xPosition) {
      updateContent(dataPoint)
      updatePositionAndSize(xPosition)
    }

    // API

    /**
     * Hides the tooltip
     * @return {Module} Tooltip module to chain calls
     * @public
     */
    function hide () {
      cache.svg.style("display", "none")

      return this
    }

    /**
     * Shows the tooltip
     * @return {Module} Tooltip module to chain calls
     * @public
     */
    function show () {
      cache.svg.style("display", "block")

      return this
    }

    /**
     * Updates the position and content of the tooltip
     * @param  {Object} dataPoint    Datapoint to represent
     * @param  {Object} colorMapping Color scheme of the topics
     * @param  {Number} position     X-scale position in pixels
     * @return {Module} Tooltip module to chain calls
     * @public
     */
    function update (_dataPoint, _colorMapping, _xPosition, _yPosition = null) {
      updateTooltip(_dataPoint, _xPosition, _yPosition)

      return this
    }

    function setConfig (_config) {
      config = Object.assign({}, config, _config)
      return this
    }

    function getCache () {
      return cache
    }

    return {
      hide,
      show,
      update,
      setConfig,
      getCache
    }
  }
})
