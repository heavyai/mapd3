define((require) => {
  "use strict"

  const d3Ease = require("d3-ease")
  const d3Format = require("d3-format")
  const d3TimeFormat = require("d3-time-format")

  const {keys} = require("./helpers/constants")

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

    function init () {
      cache.chart.on("mouseOver.tooltip", show)
        .on("mouseMove.tooltip", update)
        .on("mouseOut.tooltip", hide)

      buildSVG()
    }
    init()

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

    function getTooltipPosition (_mouseX) {
      const tooltipX = _mouseX + config.margin.left
      let offset = 0
      const tooltipY = config.margin.top

      if (_mouseX > (cache.chartWidth / 2)) {
        offset = -cache.tooltipWidth
      }

      return [tooltipX + offset, tooltipY]
    }

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

    function updatePositionAndSize (_xPosition) {
      const [tooltipX, tooltipY] = getTooltipPosition(_xPosition)

      cache.svg.attr("width", cache.tooltipWidth)
        .attr("height", cache.tooltipHeight)
        .transition()
        .duration(config.mouseChaseDuration)
        .ease(config.ease)
        .attr("transform", `translate(${tooltipX}, ${tooltipY})`)
    }

    function updateTitle (_dataPoint) {
      const key = _dataPoint[keys.DATA_KEY]
      let title = key
      if (config.isTimeseries) {
        title = d3TimeFormat.timeFormat(config.dateFormat)(key)
      }

      cache.tooltipTitle.text(title)
    }

    function sortByTopicsOrder (_series, _order = seriesOrder) {
      return _order.map((orderName) => _series.filter(({name}) => name === orderName)[0])
    }

    function sortByAlpha (_series) {
      // TO DO: make this immutable
      return _series.sort()
    }

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

    function updateTooltip (dataPoint, xPosition) {
      updateContent(dataPoint)
      updatePositionAndSize(xPosition)
    }

    // API

    function hide () {
      cache.svg.style("display", "none")

      return this
    }

    function show () {
      cache.svg.style("display", "block")

      return this
    }

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
