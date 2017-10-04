import {dispatch} from "d3-dispatch"

import {exclusiveToggle} from "./interactors"

export default function Binning (_chart) {

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
    chartHeight: null
  }

  let chartCache = {
    svg: null
  }

  const data = ["auto", "1y", "1q", "1mo", "1w"]

  // events
  const dispatcher = dispatch("change")

  function render () {
    buildSVG()
  }
  render()

  function buildSVG () {
    chartCache = cache.chart.getCache()
    setConfig(cache.chart.getConfig())

    cache.chartWidth = config.width - config.margin.left - config.margin.right
    cache.chartHeight = config.height - config.margin.top - config.margin.bottom

    if (!cache.svg) {
      cache.svg = chartCache.svg.append("g")
          .classed("binning-group", true)
          .append("text")
    }

    cache.svg.attr("transform", `translate(${[config.margin.left, config.margin.top / 2]})`)

    const texts = cache.svg.selectAll(".item")
      .data(["BIN:"].concat(data))
    texts.enter().append("tspan").classed("item", true)
      .attr("dx", "0.5em")
      .on("click.dispatch", (d) => {
        dispatcher.call("change", this, d)
      })
      .on("click.select", exclusiveToggle(".binning-group tspan.item"))
      .merge(texts)
      .text((d) => d)
    texts.exit().remove()
  }

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

  function destroy () {
    cache.svg.remove()
  }

  function update () {
    render()
    return this
  }

  return {
    getCache,
    on,
    setConfig,
    destroy,
    update
  }
}
