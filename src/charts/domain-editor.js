import * as d3 from "./helpers/d3-service"

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
    root: null,
    xHitZone: null,
    yHitZone: null,
    y2HitZone: null,
    chartWidth: null,
    chartHeight: null
  }

  // events
  const dispatcher = d3.dispatch("domainChanged", "domainLockToggled")

  function buildSVG () {
    cache.chartWidth = config.width - config.margin.left - config.margin.right
    cache.chartHeight = config.height - config.margin.top - config.margin.bottom

    if (!cache.root) {
      cache.root = cache.container
          .append("div")
          .attr("class", "domain-input-group")
          .style("position", "absolute")
          .style("top", 0)

      const HOVER_ZONE_SIZE = 40
      const LOCK_SIZE = 12
      const INPUT_HEIGHT = 12
      const PADDING = 4
      const INPUT_WIDTH = HOVER_ZONE_SIZE - PADDING

      // hit zones
      cache.xHitZone = cache.root.append("div")
          .attr("class", "hit-zone x")
          .style("pointer-events", "all")
          .style("position", "absolute")
          .on("mouseover.dispatch", showXEditor)
          .on("mouseout.dispatch", hideXEditor)
          .style("width", `${cache.chartWidth + HOVER_ZONE_SIZE * 2}px`)
          .style("height", `${HOVER_ZONE_SIZE}px`)
          .style("top", `${config.margin.top + cache.chartHeight}px`)
          .style("left", `${config.margin.left - HOVER_ZONE_SIZE}px`)

      cache.yHitZone = cache.root.append("div")
          .attr("class", "hit-zone y")
          .style("pointer-events", "all")
          .style("position", "absolute")
          .on("mouseover.dispatch", showYEditor)
          .on("mouseout.dispatch", hideYEditor)
          .style("width", `${HOVER_ZONE_SIZE}px`)
          .style("height", `${cache.chartHeight + HOVER_ZONE_SIZE}px`)
          .style("top", `${config.margin.top - HOVER_ZONE_SIZE}px`)
          .style("left", `${config.margin.left - HOVER_ZONE_SIZE}px`)

      cache.y2HitZone = cache.root.append("div")
          .attr("class", "hit-zone y2")
          .style("pointer-events", "all")
          .style("position", "absolute")
          .on("mouseover.dispatch", showY2Editor)
          .on("mouseout.dispatch", hideY2Editor)
          .style("width", `${HOVER_ZONE_SIZE}px`)
          .style("height", `${cache.chartHeight + HOVER_ZONE_SIZE}px`)
          .style("top", `${config.margin.top - HOVER_ZONE_SIZE}px`)
          .style("left", `${config.margin.left + cache.chartWidth}px`)

      // y input group
      cache.yHitZone.append("input")
        .attr("class", "domain-input y max")
        .style("position", "absolute")
        .on("change", function change () {
          dispatcher.call("domainChanged", this, {value: this.value, axis: "y", type: "max"})
        })
        .style("width", `${INPUT_WIDTH}px`)
        .style("height", `${INPUT_HEIGHT}px`)
        .style("top", `${HOVER_ZONE_SIZE}px`)

      cache.yHitZone.append("input")
        .attr("class", "domain-input y min")
        .style("position", "absolute")
        .on("change", function change () {
          dispatcher.call("domainChanged", this, {value: this.value, axis: "y", type: "min"})
        })
        .style("width", `${INPUT_WIDTH}px`)
        .style("height", `${INPUT_HEIGHT}px`)
        .style("top", `${cache.chartHeight + HOVER_ZONE_SIZE - INPUT_HEIGHT}px`)

      cache.yHitZone.append("div")
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
        .style("top", `${HOVER_ZONE_SIZE - LOCK_SIZE}px`)

      // y2 input group
      cache.y2HitZone.append("input")
        .attr("class", "domain-input y2 max")
        .style("position", "absolute")
        .on("change", function change () {
          dispatcher.call("domainChanged", this, {value: this.value, axis: "y2", type: "max"})
        })
        .style("width", `${INPUT_WIDTH}px`)
        .style("height", `${INPUT_HEIGHT}px`)
        .style("top", `${HOVER_ZONE_SIZE}px`)
        .style("left", `${PADDING}px`)

      cache.y2HitZone.append("input")
        .attr("class", "domain-input y2 min")
        .style("position", "absolute")
        .on("change", function change () {
          dispatcher.call("domainChanged", this, {value: this.value, axis: "y2", type: "min"})
        })
        .style("width", `${INPUT_WIDTH}px`)
        .style("height", `${INPUT_HEIGHT}px`)
        .style("top", `${cache.chartHeight + HOVER_ZONE_SIZE - INPUT_HEIGHT}px`)
        .style("left", `${PADDING}px`)

      cache.y2HitZone.append("div")
        .attr("class", "domain-lock y2")
        .style("position", "absolute")
        .on("click", function change () {
          const isLocked = this.classList.contains("locked")
          this.classList.toggle("locked", !isLocked)
          dispatcher.call("domainLockToggled", this, {isLocked: !isLocked, axis: "y2"})
        })
        .style("width", `${LOCK_SIZE}px`)
        .style("height", `${LOCK_SIZE}px`)
        .style("top", `${HOVER_ZONE_SIZE - LOCK_SIZE}px`)

      // x input group
      cache.xHitZone.append("input")
        .attr("class", "domain-input x min")
        .style("position", "absolute")
        .on("change", function change () {
          dispatcher.call("domainChanged", this, {value: this.value, axis: "x", type: "min"})
        })
        .style("width", `${INPUT_WIDTH}px`)
        .style("height", `${INPUT_HEIGHT}px`)
        .style("top", `${PADDING}px`)
        .style("left", `${HOVER_ZONE_SIZE}px`)

      cache.xHitZone.append("input")
        .attr("class", "domain-input x max")
        .style("position", "absolute")
        .on("change", function change () {
          dispatcher.call("domainChanged", this, {value: this.value, axis: "x", type: "max"})
        })
        .style("width", `${INPUT_WIDTH}px`)
        .style("height", `${INPUT_HEIGHT}px`)
        .style("top", `${PADDING}px`)
        .style("left", `${HOVER_ZONE_SIZE + cache.chartWidth - INPUT_WIDTH}px`)

      cache.xHitZone.append("div")
        .attr("class", "domain-lock x")
        .style("position", "absolute")
        .on("click", function change () {
          const isLocked = this.classList.contains("locked")
          this.classList.toggle("locked", !isLocked)
          dispatcher.call("domainLockToggled", this, {isLocked: !isLocked, axis: "x"})
        })
        .style("width", `${LOCK_SIZE}px`)
        .style("height", `${LOCK_SIZE}px`)
        .style("left", `${HOVER_ZONE_SIZE + cache.chartWidth}px`)

      hideYEditor()
      hideY2Editor()
      hideXEditor()
    }
  }

  function showYEditor () {
    cache.yHitZone.style("opacity", "1")
  }

  function hideYEditor () {
    cache.yHitZone.style("opacity", "0")
  }

  function showY2Editor () {
    cache.y2HitZone.style("opacity", "1")
  }

  function hideY2Editor () {
    cache.y2HitZone.style("opacity", "0")
  }

  function showXEditor () {
    cache.xHitZone.style("opacity", "1")
  }

  function hideXEditor () {
    cache.xHitZone.style("opacity", "0")
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

  return {
    on,
    setConfig,
    drawDomainEditor
  }
}
