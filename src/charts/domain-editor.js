import * as d3 from "./helpers/d3-service"

import {toggleOnOff} from "./interactors"

export default function DomainEditor (_chart) {

  let config = {
    margin: {
      top: 60,
      right: 30,
      bottom: 40,
      left: 70
    },
    width: 800,
    height: 500,
    position: {x: 0, y: 0},
    size: {h: 16, w: 40}
  }

  const cache = {
    chart: _chart,
    svg: null,
    parentDiv: null,
    chartWidth: null,
    chartHeight: null
  }

  let chartCache = {
    svg: null
  }

  // events
  const dispatcher = d3.dispatch("lockToggle", "domainChanged")

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
          .classed("domain-editor-group", true)

      cache.parentDiv = d3.select(cache.svg.node().ownerSVGElement.parentNode)
      cache.parentDiv.append("input")
        .attr("class", "input domain-y-min")
        .style("position", "absolute")
        .style("top", `${config.margin.top}px`)
        .style("left", `${config.margin.left - config.size.w}px`)
        .style("width", `${config.size.w}px`)
        .style("height", `${config.size.h}px`)

      cache.parentDiv.append("input")
        .attr("class", "input domain-y-max")
        .style("position", "absolute")
        .style("top", `${config.margin.top + cache.chartHeight - config.size.h}px`)
        .style("left", `${config.margin.left - config.size.w}px`)
        .style("width", `${config.size.w}px`)

      const lockSize = 12
      cache.parentDiv.append("div")
        .attr("class", "domain-lock")
        .style("position", "absolute")
        .style("width", `${lockSize}px`)
        .style("height", `${lockSize}px`)
        .style("top", `${config.margin.top - lockSize}px`)
        .style("left", `${config.margin.left - lockSize}px`)


      // panel.on("click", function click () {
      //   const isClosed = this.classList.contains("closed")
      //   loop.transition().attr("transform", `translate(0, ${isClosed ? "14" : "6"})`)
      //   this.classList.toggle("closed", !isClosed)
      // })

      cache.chart.on("hoverYAxis", (d) => console.log(d))
    }
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
