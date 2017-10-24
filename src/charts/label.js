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
    root: null,
    xAxisLabel: null,
    yAxisLabel: null,
    y2AxisLabel: null,
    xLabel: null,
    yLabel: null,
    y2Label: null,
    chartWidth: null,
    chartHeight: null
  }

  // events
  const dispatcher = d3.dispatch("axisLabelChange")

  function buildSVG () {
    cache.chartWidth = config.width - config.margin.left - config.margin.right
    cache.chartHeight = config.height - config.margin.top - config.margin.bottom

    if (!cache.root) {
      cache.root = cache.container
          .append("div")
          .attr("class", "label-group")
          .style("position", "absolute")
          .style("top", 0)
          .style("white-space", "nowrap")

      cache.xAxisLabel = cache.root.append("div")
        .attr("class", "axis-label x")
        .style("position", "absolute")
        .attr("contentEditable", true)
        .on("blur", function blur () {
          dispatcher.call("axisLabelChange", this, {value: this.innerText, type: "x"})
        })
        .on("keypress", function keypress () {
          if (d3.event.key === "Enter") {
            this.blur()
          }
        })
        .style("transform", "translate(-50%)")

      cache.yAxisLabel = cache.root.append("div")
        .attr("class", "axis-label y")
        .style("position", "absolute")
        .attr("contentEditable", true)
        .on("blur", function blur () {
          dispatcher.call("axisLabelChange", this, {value: this.innerText, type: "y"})
        })
        .on("keypress", function keypress () {
          if (d3.event.key === "Enter") {
            this.blur()
          }
        })
        .style("left", 0)
        .style("transform", "translate(-50%) rotate(-90deg)")

      cache.y2AxisLabel = cache.root.append("div")
        .attr("class", "axis-label y2")
        .style("position", "absolute")
        .attr("contentEditable", true)
        .on("blur", function blur () {
          dispatcher.call("axisLabelChange", this, {value: this.innerText, type: "y2"})
        })
        .on("keypress", function keypress () {
          if (d3.event.key === "Enter") {
            this.blur()
          }
        })
        .style("transform", "translate(-50%) rotate(90deg)")
    }

    cache.xAxisLabel
        .text(config.xLabel)
        .style("top", function top () {
          const textHeight = this.getBoundingClientRect().height
          return `${config.height - textHeight}px`
        })
        .style("left", `${config.margin.left + cache.chartWidth / 2}px`)

    cache.yAxisLabel
      .text(config.yLabel)
      .style("top", `${config.margin.top + cache.chartHeight / 2}px`)
      .style("left", function top () {
        const textWidth = this.getBoundingClientRect().width
        return `${textWidth / 2}px`
      })

    cache.y2AxisLabel
      .text(config.y2Label)
      .style("top", `${config.margin.top + cache.chartHeight / 2}px`)
      .style("left", function top () {
        const textWidth = this.getBoundingClientRect().width
        return `${config.width - textWidth / 2}px`
      })
  }

  function drawLabels () {
    buildSVG()
    return this
  }

  function setXLabels (_xLabel) {
    config.xLabel = _xLabel
    return this
  }

  function setYLabels (_yLabel) {
    config.yLabel = _yLabel
    return this
  }

  function setY2Labels (_y2Label) {
    config.y2Label = _y2Label
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

  return {
    on,
    setConfig,
    setXLabels,
    setYLabels,
    setY2Labels,
    drawLabels
  }
}
