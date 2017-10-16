import * as d3 from "./helpers/d3-service"

import {exclusiveToggle, toggleOnOff} from "./interactors"

export default function Binning (_chart) {

  let config = {
    margin: {
      top: 60,
      right: 30,
      bottom: 40,
      left: 70
    },
    toggle: ["auto"],
    exclusiveToggle: ["1y", "1q", "1mo", "1w"],
    label: "BIN:"
  }

  const cache = {
    chart: _chart,
    svg: null
  }

  let chartCache = {
    svg: null
  }

  // events
  const dispatcher = d3.dispatch("change")

  function render () {
    buildSVG()
  }
  render()

  function buildSVG () {
    chartCache = cache.chart.getCache()
    setConfig(cache.chart.getConfig())

    if (!cache.svg) {
      cache.svg = chartCache.svg.append("g")
          .classed("binning-group", true)
          .append("text")

      cache.svg.append("tspan")
        .text(config.label)
        .attr("y", "1em")
        .attr("class", "item")
    }

    cache.svg.attr("transform", `translate(${[config.margin.left, 0]})`)

    const items = cache.svg.selectAll(".toggleOnOff")
        .data(config.toggle)
    items.enter().append("tspan")
      .attr("class", (d) => `item ${d} toggleOnOff`)
      .attr("dx", "0.8em")
      .attr("y", "1em")
      .on("click.select", toggleOnOff(".binning-group .item.toggleOnOff"))
      .on("click.d3.dispatch", function click (d) {
        const isSelected = this.classList.contains("selected")
        dispatcher.call("change", this, d, {isSelected})
      })
      .merge(items)
      .text((d) => d)
    items.exit().remove()

    const itemsExclusive = cache.svg.selectAll(".toggleExclusive")
        .data(config.exclusiveToggle)
    itemsExclusive.enter().append("tspan")
      .attr("class", (d) => `item ${d} toggleExclusive`)
      .attr("dx", "0.8em")
      .attr("y", "1em")
      .on("click.select", exclusiveToggle(".binning-group .item.toggleExclusive"))
      .on("click.d3.dispatch", function click (d) {
        const isSelected = this.classList.contains("selected")
        dispatcher.call("change", this, d, {isSelected})
      })
      .merge(itemsExclusive)
      .text((d) => d)
    itemsExclusive.exit().remove()
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
