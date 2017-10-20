import * as d3 from "./helpers/d3-service"

import {override} from "./helpers/common"

export default function Label (_container) {

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
    container: _container,
    parentDiv: null,
    xAxisLabel: null,
    yAxisLabel: null,
    xLabel: null,
    yLabel: null,
    y2AxisLabel: null,
    chartWidth: null,
    chartHeight: null
  }

  // events
  const dispatcher = d3.dispatch("axisLabelChanged")

  function buildSVG () {
    cache.chartWidth = config.width - config.margin.left - config.margin.right
    cache.chartHeight = config.height - config.margin.top - config.margin.bottom

    if (!cache.svg) {
      cache.inputGroup = cache.container
          .append("div")
          .attr("class", "label-group")
          .style("position", "absolute")
          .style("top", 0)
          .style("white-space", "nowrap")

      cache.xAxisLabel = cache.inputGroup.append("div")
        .attr("class", "axis-label x")
        .style("position", "absolute")
        .attr("contentEditable", true)
        .on("blur", function blur () {
          dispatcher.call("axisLabelChanged", this, {value: this.innerText, type: "x"})
        })
        .on("keypress", function keypress (d) {
          if (d3.event.key === "Enter") {
            this.blur()
          }
        })
        .style("transform", "translate(-50%)")

      cache.yAxisLabel = cache.inputGroup.append("div")
        .attr("class", "axis-label y")
        .style("position", "absolute")
        .attr("contentEditable", true)
        .on("blur", function blur () {
          dispatcher.call("axisLabelChanged", this, {value: this.innerText, type: "y"})
        })
        .on("keypress", function keypress (d) {
          if (d3.event.key === "Enter") {
            this.blur()
          }
        })
        .style("left", 0)
        .style("transform", "translate(-50%) rotate(-90deg)")
    }

    cache.xAxisLabel
        .text(config.xLabel)
        .style("top", function top () {
          const textHeight = this.getBoundingClientRect().height
          return `${config.height - textHeight}px`
        })
        .style("left", function left () {
          const textWidth = this.getBoundingClientRect().width
          return `${config.margin.left + cache.chartWidth / 2}px`
        })

      cache.yAxisLabel
        .text(config.yLabel)
        .style("top", function top () {
          const textHeight = this.getBoundingClientRect().height
          return `${config.margin.top + cache.chartHeight / 2}px`
        })
  }

  function drawLabels (_xLabel, _yLabel) {
    config.xLabel = _xLabel
    config.yLabel = _yLabel
    buildSVG()
    return this
  }

  function on (...args) {
    dispatcher.on(...args)
    return this
  }

  function setConfig (_config) {
    config = override(config, _config)
    return this
  }

  function setRangeMin (_range) {
    cache.inputMin.property("value", _range)
    return this
  }

  function setlabels (_labels) {

    return this
  }

  return {
    on,
    setConfig,
    drawLabels
  }
}
