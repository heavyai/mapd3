import * as d3 from "./helpers/d3-service"

import {exclusiveToggle} from "./interactors"

export default function Binning (_container) {

  let config = {
    margin: {
      top: 60,
      right: 30,
      bottom: 40,
      left: 70
    },
    autoLabel: "auto",
    binningToggles: [],
    label: "BIN:",
    binningIsAuto: false,
    binningResolution: "1mo",
    binningIsEnabled: true
  }

  const cache = {
    container: _container,
    root: null,
    autoItem: null,
    binningItems: null,
    isEnabled: true
  }

  // events
  const dispatcher = d3.dispatch("change")

  function build () {

    if (!cache.root) {
      cache.root = cache.container.append("div")
        .attr("class", "binning-group")
        .style("float", "left")
        .style("padding-top", "12px")
        .style("padding-left", "12px")

      cache.label = cache.root.append("div")
        .attr("class", "bin-label")
        .text(config.label)

      cache.autoItem = cache.root.append("div")
        .attr("class", "item item-auto toggleOnOff")
        .on("click.select", function click () {
          const isSelected = this.classList.contains("selected")
          const toggled = !isSelected
          dispatcher.call("change", this, {name: config.autoLabel, isSelected: toggled})
        })
        .text(config.autoLabel)
    }

    setBinningToggles(config.binningToggles)

    const LINE_HEIGHT = 20
    cache.root
      .style("top", `${config.margin.top - LINE_HEIGHT}px`)
      .style("left", `${config.margin.left}px`)

    changeBinning(config.binningResolution)
    toggleAuto(config.binningIsAuto)
  }

  function setBinningToggles (_binningToggles) {
    cache.binningItems = cache.root.selectAll(".toggleExclusive")
      .data(_binningToggles)

    cache.binningItems.enter().append("div")
      .on("click.select", function click (d) {
        const isSelected = this.classList.contains("selected")
        dispatcher.call("change", this, {name: d, isSelected})
      })
      .merge(cache.binningItems)
      .attr("class", (d) => `item item-${d} toggleExclusive`)
      .text((d) => d)

    cache.binningItems.exit().remove()
  }

  function changeBinning (_selectedItemName) {
    if (_selectedItemName) {
      exclusiveToggle(cache.binningItems, cache.root.select(`.item-${_selectedItemName}`))
    }
  }

  function toggleAuto (_shouldBeSelected) {
    cache.autoItem
      .classed("selected", _shouldBeSelected)
      .classed("dimmed", !_shouldBeSelected)
  }

  function render () {
    if (config.binningIsEnabled) {
      build()
    } else {
      destroy()
    }
    return this
  }

  function on (...args) {
    dispatcher.on(...args)
    return this
  }

  function setConfig (_config) {
    config = Object.assign({}, config, _config)
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
