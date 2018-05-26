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
    height: 500,
    xLabel: "",
    yLabel: "",
    y2Label: "",

    chartWidth: null,
    chartHeight: null
  }

  const cache = {
    container: _container,
    root: null,
    xAxisLabel: null,
    yAxisLabel: null,
    y2AxisLabel: null
  }

  // events
  const dispatcher = d3.dispatch("axisLabelChange")

  function build () {
    if (!cache.root) {
      cache.root = cache.container
        .append("div")
        .attr("class", "label-group")

      cache.xAxisLabel = cache.root.append("div")
        .attr("class", "axis-label x")
        .attr("contentEditable", true)
        .on("blur", function blur () {
          dispatcher.call("axisLabelChange", this, {value: this.innerText, type: "x"})
        })
        .on("keypress", function keypress () {
          if (d3.event.key === "Enter") {
            this.blur()
          }
        })

      cache.yAxisLabel = cache.root.append("div")
        .attr("class", "axis-label y")
        .attr("contentEditable", true)
        .on("blur", function blur () {
          dispatcher.call("axisLabelChange", this, {value: this.innerText, type: "y"})
        })
        .on("keypress", function keypress () {
          if (d3.event.key === "Enter") {
            this.blur()
          }
        })

      cache.y2AxisLabel = cache.root.append("div")
        .attr("class", "axis-label y2")
        .attr("contentEditable", true)
        .on("blur", function blur () {
          dispatcher.call("axisLabelChange", this, {value: this.innerText, type: "y2"})
        })
        .on("keypress", function keypress () {
          if (d3.event.key === "Enter") {
            this.blur()
          }
        })
    }

    cache.xAxisLabel
      .text(config.xLabel)
      .style("max-width", `${config.chartWidth}px`)
      .style("top", function top () {
        const LABEL_PADDING = 18
        const textHeight = this.getBoundingClientRect().height || LABEL_PADDING
        return `${config.height - textHeight - LABEL_PADDING}px`
      })
      .style("left", `${config.margin.left + config.chartWidth / 2}px`)

    cache.yAxisLabel
      .text(config.yLabel)
      .style("max-width", `${config.chartHeight}px`)
      .style("top", `${config.margin.top + config.chartHeight / 2}px`)
      .style("left", function top () {
        const LABEL_PADDING = 4
        const textWidth = this.getBoundingClientRect().width
        return `${textWidth / 2 + LABEL_PADDING}px`
      })

    cache.y2AxisLabel
      .text(config.y2Label)
      .style("max-width", `${config.chartHeight}px`)
      .style("top", `${config.margin.top + config.chartHeight / 2}px`)
      .style("left", function top () {
        const LABEL_PADDING = 4
        const textWidth = this.getBoundingClientRect().width
        return `${config.width - textWidth / 2 - LABEL_PADDING}px`
      })
  }

  function on (...args) {
    dispatcher.on(...args)
    return this
  }

  function setConfig (_config) {
    config = override(config, _config)
    return this
  }

  function render () {
    build()
    return this
  }

  function destroy () {
    if (cache.root) {
      cache.root.remove()
      cache.root = null
    }
    return this
  }

  return {
    on,
    setConfig,
    render,
    destroy
  }
}
