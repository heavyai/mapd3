import * as d3 from "./helpers/d3-service"

import {toggleOnOff} from "./interactors"
import {override} from "./helpers/common"

export default function DomainEditor (_container) {

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
    yInputGroup: null,
    chartWidth: null,
    chartHeight: null
  }

  // events
  const dispatcher = d3.dispatch("domainChanged", "domainLockToggled")

  function buildSVG () {
    cache.chartWidth = config.width - config.margin.left - config.margin.right
    cache.chartHeight = config.height - config.margin.top - config.margin.bottom

    if (!cache.svg) {
      cache.parentDiv = d3.select(cache.container.node().parentNode)

      cache.inputGroup = cache.parentDiv
          .append("div")
          .attr("class", "domain-input-group")
          .style("position", "absolute")
          .style("top", 0)

      const HOVER_ZONE_SIZE = 30
      const LOCK_SIZE = 12
      const INPUT_HEIGHT = 16

      // hit zones
      const xInputHitZone = cache.inputGroup.append("div")
        .attr("class", "hit-zone x")
        .style("pointer-events", "all")
        .style("position", "absolute")
        .on("mouseover.dispatch", showXEditor)
        .on("mouseout.dispatch", hideXEditor)
        .style("width", `${cache.chartWidth}px`)
        .style("height", `${HOVER_ZONE_SIZE}px`)
        .style("top", `${config.margin.top + cache.chartHeight}px`)
        .style("left", `${config.margin.left}px`)

      const yInputHitZone = cache.inputGroup.append("div")
        .attr("class", "hit-zone y")
        .style("pointer-events", "all")
        .style("position", "absolute")
        .on("mouseover.dispatch", showYEditor)
        .on("mouseout.dispatch", hideYEditor)
        .style("width", `${HOVER_ZONE_SIZE}px`)
        .style("height", `${cache.chartHeight}px`)
        .style("left", `${config.margin.left - HOVER_ZONE_SIZE}px`)
        .style("top", `${config.margin.top}px`)

      const y2InputHitZone = cache.inputGroup.append("div")
        .attr("class", "hit-zone y2")
        .style("pointer-events", "all")
        .style("position", "absolute")
        .on("mouseover.dispatch", showY2Editor)
        .on("mouseout.dispatch", hideY2Editor)
        .style("width", `${HOVER_ZONE_SIZE}px`)
        .style("height", `${cache.chartHeight}px`)
        .style("left", `${config.margin.left + cache.chartWidth}px`)
        .style("top", `${config.margin.top}px`)

      // y input group
      cache.yInputGroup = yInputHitZone.append("div")
          .attr("class", "y-domain-input-group")

      cache.yInputGroup.append("input")
        .attr("class", "domain-input y min")
        .style("position", "absolute")
        .on("change", function change () {
          dispatcher.call("domainChanged", this, {value: this.value, axis: "y", type: "min"})
        })
        .style("top", `${LOCK_SIZE}px`)
        .style("width", `${HOVER_ZONE_SIZE}px`)
        .style("height", `${INPUT_HEIGHT}px`)

      cache.yInputGroup.append("input")
        .attr("class", "domain-input y max")
        .style("position", "absolute")
        .on("change", function change () {
          dispatcher.call("domainChanged", this, {value: this.value, axis: "y", type: "max"})
        })
        .style("top", `${cache.chartHeight - INPUT_HEIGHT}px`)
        .style("width", `${HOVER_ZONE_SIZE}px`)

      cache.yInputGroup.append("div")
        .attr("class", "domain-lock y")
        .style("position", "absolute")
        .on("click", function change () {
          const isLocked = this.classList.contains("locked")
          this.classList.toggle("locked", !isLocked)
          dispatcher.call("domainLockToggled", this, {isLocked: !isLocked, axis: "y"})
        })
        .style("width", `${LOCK_SIZE}px`)
        .style("height", `${LOCK_SIZE}px`)
        .style("left", `${HOVER_ZONE_SIZE - LOCK_SIZE}px`)

      // y2 input group
      cache.y2InputGroup = y2InputHitZone.append("div")
          .attr("class", "y2-domain-input-group")

      cache.y2InputGroup.append("input")
        .attr("class", "domain-input y2 min")
        .style("position", "absolute")
        .on("change", function change () {
          dispatcher.call("domainChanged", this, {value: this.value, axis: "y2", type: "min"})
        })
        .style("top", `${LOCK_SIZE}px`)
        .style("width", `${HOVER_ZONE_SIZE}px`)
        .style("height", `${INPUT_HEIGHT}px`)

      cache.y2InputGroup.append("input")
        .attr("class", "domain-input y2 max")
        .style("position", "absolute")
        .on("change", function change () {
          dispatcher.call("domainChanged", this, {value: this.value, axis: "y2", type: "max"})
        })
        .style("top", `${cache.chartHeight - INPUT_HEIGHT}px`)
        .style("width", `${HOVER_ZONE_SIZE}px`)

      cache.y2InputGroup.append("div")
        .attr("class", "domain-lock y2")
        .style("position", "absolute")
        .on("click", function change () {
          const isLocked = this.classList.contains("locked")
          this.classList.toggle("locked", !isLocked)
          dispatcher.call("domainLockToggled", this, {isLocked: !isLocked, axis: "y2"})
        })
        .style("width", `${LOCK_SIZE}px`)
        .style("height", `${LOCK_SIZE}px`)

      // x input group
      cache.xInputGroup = xInputHitZone.append("div")
          .attr("class", "x-domain-input-group")

      cache.xInputGroup.append("input")
        .attr("class", "domain-input x min")
        .style("position", "absolute")
        .on("change", function change () {
          dispatcher.call("domainChanged", this, {value: this.value, axis: "x", type: "min"})
        })
        .style("left", `${LOCK_SIZE}px`)
        .style("width", `${HOVER_ZONE_SIZE}px`)
        .style("height", `${INPUT_HEIGHT}px`)

      cache.xInputGroup.append("input")
        .attr("class", "domain-input x max")
        .style("position", "absolute")
        .on("change", function change () {
          dispatcher.call("domainChanged", this, {value: this.value, axis: "x", type: "max"})
        })
        .style("left", `${cache.chartWidth - HOVER_ZONE_SIZE}px`)
        .style("width", `${HOVER_ZONE_SIZE}px`)

      cache.xInputGroup.append("div")
        .attr("class", "domain-lock x")
        .style("position", "absolute")
        .on("click", function change () {
          const isLocked = this.classList.contains("locked")
          this.classList.toggle("locked", !isLocked)
          dispatcher.call("domainLockToggled", this, {isLocked: !isLocked, axis: "x"})
        })
        .style("width", `${LOCK_SIZE}px`)
        .style("height", `${LOCK_SIZE}px`)

      hideYEditor()
      hideY2Editor()
      hideXEditor()
    }
  }

  function showYEditor () {
    cache.yInputGroup.style("visibility", "visible")
  }

  function hideYEditor () {
    cache.yInputGroup.style("visibility", "hidden")
  }

  function showY2Editor () {
    cache.y2InputGroup.style("visibility", "visible")
  }

  function hideY2Editor () {
    cache.y2InputGroup.style("visibility", "hidden")
  }

  function showXEditor () {
    cache.xInputGroup.style("visibility", "visible")
  }

  function hideXEditor () {
    cache.xInputGroup.style("visibility", "hidden")
  }

  function drawDomainEditor () {
    buildSVG()
    return this
  }

  function on (...args) {
    return dispatcher.on(...args)
  }

  function setConfig (_config) {
    config = override(config, _config)
    return this
  }

  function destroy () {
    cache.parentDiv.remove()
  }

  function update () {
    render()
    return this
  }

  return {
    on,
    setConfig,
    drawDomainEditor,
    destroy,
    update
  }
}
