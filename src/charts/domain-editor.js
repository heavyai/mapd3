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
    position: {x: 0, y: 0}
  }

  const cache = {
    chart: _chart,
    svg: null,
    parentHtmlNode: null
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

    if (!cache.svg) {
      cache.svg = chartCache.svg.append("g")
          .classed("domain-editor-group", true)

      const panel = cache.svg.append("rect")
        .attr("width", "10")
        .attr("height", "14")
        .attr("opacity", "0")

      const lock = cache.svg.append("g")
        .attr("class", "lock-icon")
        .attr("transform", "scale(0.2, 0.3)")
        .attr("pointer-events", "none")
      lock.append("rect")
        .attr("x", "3")
        .attr("y", "26")
        .attr("width", "42")
        .attr("height", "21")
      const loop = lock.append("path")
        .attr("class", "loop closed")
        .attr("d", "M24,0c0,0 -5,-0 -10,2c-4,3 -4,9 -4,9l-0,14l4,0l0,-14c0,0 0,-5 3,-6c3,-1 7,-1 7,-1c0,0 3,-0 7,1c3,1 3,6 3,6l4,0c0,0 0,-6 -4,-9c-4,-3 -10,-2 -10,-2")
        .attr("transform", "translate(0, 14)")

      panel.on("click", function click () {
        const isClosed = this.classList.contains("closed")
        loop.transition().attr("transform", `translate(0, ${isClosed ? "14" : "6"})`)
        this.classList.toggle("closed", !isClosed)
      })

      cache.svg.append("text")
        .attr("class", "domain-min")

      cache.parentHtmlNode = cache.svg.node().ownerSVGElement.parentNode
      d3.select(cache.parentHtmlNode).append("input")
        .style("position", "absolute")
        .style("top", config.position.x)
        .style("left", config.position.y)


      cache.svg.append("text")
        .attr("class", "domain-max")
    }

    // cache.svg.attr("transform", `translate(${[config.margin.left, 0]})`)

    // const items = cache.svg.selectAll(".toggleOnOff")
    //     .data(config.toggle)
    // items.enter().append("tspan")
    //   .attr("class", (d) => `item ${d} toggleOnOff`)
    //   .attr("dx", "0.8em")
    //   .attr("y", "1em")
    //   .on("click.d3.select", toggleOnOff(".binning-group .item.toggleOnOff"))
    //   .on("click.d3.dispatch", function click (d) {
    //     const isSelected = this.classList.contains("selected")
    //     dispatcher.call("change", this, d, {isSelected})
    //   })
    //   .merge(items)
    //   .text((d) => d)
    // items.exit().remove()
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
