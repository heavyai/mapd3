import * as d3 from "./helpers/d3-service"

import {exclusiveToggle, toggleOnOff} from "./interactors"

export default function Binning (_container) {

  let config = {
    margin: {
      top: 60,
      right: 30,
      bottom: 40,
      left: 70
    },
    width: 800,
    height: 500,
    toggle: ["auto"],
    exclusiveToggle: ["1y", "1q", "1mo", "1w"],
    label: "BIN:"
  }

  const cache = {
    container: _container,
    root: null
  }

  // events
  const dispatcher = d3.dispatch("change")

  function buildSVG () {

    if (!cache.root) {
      cache.root = cache.container.append("div")
          .attr("class", "binning-group")
          .style("float", "left")

      cache.label = cache.root.append("div")
          .attr("class", "label")
    }

    const LINE_HEIGHT = 20
    cache.root
      .style("top", config.margin.top - LINE_HEIGHT)
      .style("left", config.margin.left)

    cache.label.text(config.label)

    const items = cache.root.selectAll(".toggleOnOff")
        .data(config.toggle)
    items.enter().append("div")
      .attr("class", (d) => `item ${d} toggleOnOff`)
      .on("click.select", toggleOnOff(".binning-group .item.toggleOnOff"))
      .on("click.d3.dispatch", function click (d) {
        const isSelected = this.classList.contains("selected")
        dispatcher.call("change", this, d, {isSelected})
      })
      .merge(items)
      .text((d) => d)
    items.exit().remove()

    const itemsExclusive = cache.root.selectAll(".toggleExclusive")
        .data(config.exclusiveToggle)
    itemsExclusive.enter().append("div")
      .attr("class", (d) => `item ${d} toggleExclusive`)
      .on("click.select", exclusiveToggle(".binning-group .item.toggleExclusive"))
      .on("click.d3.dispatch", function click (d) {
        const isSelected = this.classList.contains("selected")
        dispatcher.call("change", this, d, {isSelected})
      })
      .merge(itemsExclusive)
      .text((d) => d)
    itemsExclusive.exit().remove()
  }

  function drawBinning () {
    buildSVG()

    return this
  }

  function on (...args) {
    return dispatcher.on(...args)
  }

  function setConfig (_config) {
    config = Object.assign({}, config, _config)
    return this
  }

  function destroy () {
    cache.root.remove()
  }

  return {
    on,
    setConfig,
    destroy,
    drawBinning
  }
}
