import * as d3 from "./helpers/d3-service"

import {override} from "./helpers/common"
import {blurOnEnter} from "./interactors"

export default function DomainEditor (_container) {

  let config = {
    margin: {
      top: 60,
      right: 30,
      bottom: 40,
      left: 70
    },
    width: 800,
    height: 500,
    keyType: null,
    xDomainEditorFormat: "%b %d, %Y",
    yDomainEditorFormat: ".2f",
    y2DomainEditorFormat: ".2f"
  }

  const cache = {
    container: _container,
    root: null,
    xHitZone: null,
    yHitZone: null,
    y2HitZone: null,
    yMaxInput: null,
    yMinInput: null,
    yLockIcon: null,
    y2MaxInput: null,
    y2MinInput: null,
    y2LockIcon: null,
    xMinInput: null,
    xMaxInput: null,
    xLockIcon: null,
    chartWidth: null,
    chartHeight: null,
    isEnabled: true
  }

  let scales = {
    xScale: null,
    yScale: null,
    yScale2: null,
    hasSecondAxis: null
  }

  // events
  const dispatcher = d3.dispatch("domainChange", "domainLockToggle")

  function buildSVG () {
    cache.chartWidth = config.width - config.margin.left - config.margin.right
    cache.chartHeight = config.height - config.margin.top - config.margin.bottom
    const xDomain = cache.xDomain === "auto" ? scales.xScale.domain() : cache.xDomain
    const yDomain = cache.yDomain === "auto" ? scales.yScale.domain() : cache.yDomain
    const y2Domain = (cache.y2Domain === "auto" && scales.y2Scale) ? scales.y2Scale.domain() : cache.y2Domain

    let xFormatter = (d) => d
    if (config.xDomainEditorFormat) {
      if (config.keyType === "time") {
        xFormatter = d3.timeFormat(config.xDomainEditorFormat)
      }
    } else if (config.keyType === "number") {
      xFormatter = d3.format(config.xDomainEditorFormat)
    }

    const yFormatter = d3.format(config.yDomainEditorFormat)
    const y2Formatter = d3.format(config.y2DomainEditorFormat)

    if (!cache.root) {
      cache.root = cache.container
          .append("div")
          .attr("class", "domain-input-group")
          .style("position", "absolute")
          .style("top", 0)

      // hit zones
      cache.xHitZone = cache.root.append("div")
          .attr("class", "hit-zone x")
          .style("pointer-events", "all")
          .style("position", "absolute")
          .on("mouseover.dispatch", showXEditor)
          .on("mouseout.dispatch", hideXEditor)

      cache.yHitZone = cache.root.append("div")
          .attr("class", "hit-zone y")
          .style("pointer-events", "all")
          .style("position", "absolute")
          .on("mouseover.dispatch", showYEditor)
          .on("mouseout.dispatch", hideYEditor)

      cache.y2HitZone = cache.root.append("div")
          .attr("class", "hit-zone y2")
          .style("pointer-events", "all")
          .style("position", "absolute")
      if (scales.hasSecondAxis) {
        cache.y2HitZone
          .on("mouseover.dispatch", showY2Editor)
          .on("mouseout.dispatch", hideY2Editor)
      }

      // y input group
      cache.yMaxInput = cache.yHitZone.append("div")
        .attr("class", "domain-input y max")
        .style("position", "absolute")
        .attr("contentEditable", true)
        .on("blur", function change () {
          dispatcher.call("domainChange", this, {value: this.innerText, axis: "y", type: "max"})
        })
        .call(blurOnEnter)

      cache.yMinInput = cache.yHitZone.append("div")
        .attr("class", "domain-input y min")
        .style("position", "absolute")
        .attr("contentEditable", true)
        .on("blur", function change () {
          dispatcher.call("domainChange", this, {value: this.innerText, axis: "y", type: "min"})
        })
        .call(blurOnEnter)

      cache.yLockIcon = cache.yHitZone.append("div")
        .attr("class", "domain-lock y")
        .style("position", "absolute")
        .on("click", function change () {
          const isLocked = this.classList.contains("locked")
          this.classList.toggle("locked", !isLocked)
          dispatcher.call("domainLockToggle", this, {isLocked: !isLocked, axis: "y"})
        })

      // y2 input group
      cache.y2MaxInput = cache.y2HitZone.append("div")
        .attr("class", "domain-input y2 max")
        .style("position", "absolute")
        .attr("contentEditable", true)
        .on("blur", function change () {
          dispatcher.call("domainChange", this, {value: this.innerText, axis: "y2", type: "max"})
        })
        .call(blurOnEnter)

      cache.y2MinInput = cache.y2HitZone.append("div")
        .attr("class", "domain-input y2 min")
        .style("position", "absolute")
        .attr("contentEditable", true)
        .on("blur", function change () {
          dispatcher.call("domainChange", this, {value: this.innerText, axis: "y2", type: "min"})
        })
        .call(blurOnEnter)

      cache.y2LockIcon = cache.y2HitZone.append("div")
        .attr("class", "domain-lock y2")
        .style("position", "absolute")
        .on("click", function change () {
          const isLocked = this.classList.contains("locked")
          this.classList.toggle("locked", !isLocked)
          dispatcher.call("domainLockToggle", this, {isLocked: !isLocked, axis: "y2"})
        })

      // x input group
      cache.xMinInput = cache.xHitZone.append("div")
        .attr("class", "domain-input x min")
        .style("position", "absolute")
        .attr("contentEditable", true)
        .on("blur", function change () {
          dispatcher.call("domainChange", this, {value: this.innerText, axis: "x", type: "min"})
        })
        .call(blurOnEnter)

      cache.xMaxInput = cache.xHitZone.append("div")
        .attr("class", "domain-input x max")
        .style("position", "absolute")
        .attr("contentEditable", true)
        .on("blur", function change () {
          dispatcher.call("domainChange", this, {value: this.innerText, axis: "x", type: "max"})
        })
        .call(blurOnEnter)

      cache.xLockIcon = cache.xHitZone.append("div")
        .attr("class", "domain-lock x")
        .style("position", "absolute")
        .on("click", function change () {
          const isLocked = this.classList.contains("locked")
          this.classList.toggle("locked", !isLocked)
          dispatcher.call("domainLockToggle", this, {isLocked: !isLocked, axis: "x"})
        })

      hideYEditor()
      hideY2Editor()
      hideXEditor()
    }

    const HOVER_ZONE_SIZE = 40
    const LOCK_SIZE = 12
    const INPUT_HEIGHT = 12
    const PADDING = 4
    const INPUT_WIDTH = HOVER_ZONE_SIZE - PADDING

    cache.xHitZone
      .style("width", `${cache.chartWidth + HOVER_ZONE_SIZE * 2}px`)
      .style("height", `${HOVER_ZONE_SIZE}px`)
      .style("top", `${config.margin.top + cache.chartHeight}px`)
      .style("left", `${config.margin.left - HOVER_ZONE_SIZE}px`)

    cache.yHitZone
      .style("width", `${HOVER_ZONE_SIZE}px`)
      .style("height", `${cache.chartHeight + HOVER_ZONE_SIZE}px`)
      .style("top", `${config.margin.top - HOVER_ZONE_SIZE}px`)
      .style("left", `${config.margin.left - HOVER_ZONE_SIZE}px`)

    cache.y2HitZone
      .style("width", `${HOVER_ZONE_SIZE}px`)
      .style("height", `${cache.chartHeight + HOVER_ZONE_SIZE}px`)
      .style("top", `${config.margin.top - HOVER_ZONE_SIZE}px`)
      .style("left", `${config.margin.left + cache.chartWidth}px`)

    cache.yMaxInput
      .style("width", `${INPUT_WIDTH}px`)
      .style("top", `${HOVER_ZONE_SIZE}px`)
      .text(yFormatter(yDomain[1]))

    cache.yMinInput
      .style("width", `${INPUT_WIDTH}px`)
      .style("top", `${cache.chartHeight + HOVER_ZONE_SIZE - INPUT_HEIGHT}px`)
      .text(yFormatter(yDomain[0]))

    cache.yLockIcon
      .style("width", `${LOCK_SIZE}px`)
      .style("height", `${LOCK_SIZE}px`)
      .style("left", `${HOVER_ZONE_SIZE - LOCK_SIZE}px`)
      .style("top", `${HOVER_ZONE_SIZE - LOCK_SIZE}px`)

    cache.y2MaxInput
      .style("width", `${INPUT_WIDTH}px`)
      .style("top", `${HOVER_ZONE_SIZE}px`)
      .style("left", `${PADDING}px`)
      .text(y2Formatter(y2Domain[1]))

    cache.y2MinInput
      .style("width", `${INPUT_WIDTH}px`)
      .style("top", `${cache.chartHeight + HOVER_ZONE_SIZE - INPUT_HEIGHT}px`)
      .style("left", `${PADDING}px`)
      .text(y2Formatter(y2Domain[0]))

    cache.y2LockIcon
      .style("width", `${LOCK_SIZE}px`)
      .style("height", `${LOCK_SIZE}px`)
      .style("top", `${HOVER_ZONE_SIZE - LOCK_SIZE}px`)

    cache.xMinInput
      .style("width", `${INPUT_WIDTH}px`)
      .style("top", `${PADDING}px`)
      .style("left", `${HOVER_ZONE_SIZE}px`)
      .text(xFormatter(xDomain[0]))

    cache.xMaxInput
      .style("width", `${INPUT_WIDTH}px`)
      .style("top", `${PADDING}px`)
      .style("left", `${HOVER_ZONE_SIZE + cache.chartWidth - INPUT_WIDTH}px`)
      .text(xFormatter(xDomain[1]))

    cache.xLockIcon
      .style("width", `${LOCK_SIZE}px`)
      .style("height", `${LOCK_SIZE}px`)
      .style("left", `${HOVER_ZONE_SIZE + cache.chartWidth}px`)
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
    if (cache.isEnabled) {
      buildSVG()
    } else {
      destroy()
    }
    return this
  }

  function on (...args) {
    dispatcher.on(...args)
    return this
  }

  function setXDomain (_xDomain) {
    cache.xDomain = _xDomain
    return this
  }

  function setYDomain (_yDomain) {
    cache.yDomain = _yDomain
    return this
  }

  function setY2Domain (_y2Domain) {
    cache.y2Domain = _y2Domain
    return this
  }

  function setXLock (_xLock) {
    cache.xLock = _xLock
    return this
  }

  function setYLock (_yLock) {
    cache.yLock = _yLock
    return this
  }

  function setY2Lock (_y2Lock) {
    cache.y2Lock = _y2Lock
    return this
  }

  function setVisibility (_shouldBeVisible) {
    cache.isEnabled = _shouldBeVisible
    drawDomainEditor()
    return this
  }

  function setScales (_scales) {
    scales = override(scales, _scales)
    return this
  }

  function setConfig (_config) {
    config = override(config, _config)
    return this
  }

  function destroy () {
    if (cache.root) {
      cache.root.remove()
    }
  }

  return {
    on,
    setScales,
    setConfig,
    setXDomain,
    setYDomain,
    setY2Domain,
    setXLock,
    setYLock,
    setY2Lock,
    drawDomainEditor,
    setVisibility,
    destroy
  }
}
