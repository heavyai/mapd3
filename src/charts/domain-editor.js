import * as d3 from "./helpers/d3-service"

import {override, stringToType} from "./helpers/common"
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
    inputDateFormat: "%m-%d-%Y",
    numberFormat: ".2f",
    xDomain: "auto",
    yDomain: "auto",
    y2Domain: "auto",
    xLock: false,
    yLock: false,
    y2Lock: false,
    xDomainEditorIsEnabled: true,
    yDomainEditorIsEnabled: true,
    y2DomainEditorIsEnabled: true,

    chartWidth: null,
    chartHeight: null
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
    xLockIcon: null
  }

  let scales = {
    xScale: null,
    yScale: null,
    y2Scale: null,
    hasSecondAxis: null
  }

  // events
  const dispatcher = d3.dispatch("domainChange", "domainLockToggle")

  function build () {
    const xDomain = config.xDomain === "auto" ? scales.xScale.domain() : config.xDomain
    const yDomain = (config.yDomain === "auto" && scales.yScale) ? scales.yScale.domain() : config.yDomain
    const y2Domain = (config.y2Domain === "auto" && scales.y2Scale) ? scales.y2Scale.domain() : config.y2Domain

    let yMinText = null
    let yMaxText = null
    let xMinText = null
    let xMaxText = null
    let y2MinText = null
    let y2MaxText = null

    const HOVER_ZONE_SIZE = 40
    const LOCK_SIZE = 12
    const INPUT_HEIGHT = 12
    const PADDING = 4

    let xFormatter = (d) => d
    if (config.keyType === "time") {
      xFormatter = d3.utcFormat(config.inputDateFormat)
    } else if (config.keyType === "number") {
      xFormatter = d3.format(config.numberFormat)
    }

    const yFormatter = d3.format(config.numberFormat)
    const y2Formatter = d3.format(config.numberFormat)

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
        .on("mouseover.dispatch", showY2Editor)
        .on("mouseout.dispatch", hideY2Editor)

      // y input group
      cache.yMaxInput = cache.yHitZone.append("div")
        .attr("class", "domain-input y max")
        .style("position", "absolute")
        .attr("contentEditable", true)
        .on("focus", function focus () {
          yMaxText = this.innerText
        })
        .on("blur", function change () {
          const input = this.innerText
          const domain = scales.yScale.domain()
          if (validateType(input, "number") && validateRange(input, domain, "max")) {
            yMaxText = input
            dispatcher.call("domainChange", this, {axis: "y", extent: [domain[0], Number(input)]})
          } else {
            this.innerText = yMaxText
          }
        })
        .call(blurOnEnter)

      cache.yMinInput = cache.yHitZone.append("div")
        .attr("class", "domain-input y min")
        .style("position", "absolute")
        .attr("contentEditable", true)
        .on("focus", function focus () {
          yMinText = this.innerText
        })
        .on("blur", function change () {
          const input = this.innerText
          const domain = scales.yScale.domain()
          if (validateType(input, "number") && validateRange(input, domain, "min")) {
            yMinText = input
            dispatcher.call("domainChange", this, {axis: "y", extent: [Number(input), domain[1]]})
          } else {
            this.innerText = yMinText
          }
        })
        .call(blurOnEnter)

      cache.yLockIcon = cache.yHitZone.append("div")
        .attr("class", "domain-lock y")
        .style("position", "absolute")
        .on("click", function change () {
          const isLocked = this.classList.contains("locked")
          this.classList.toggle("locked", !isLocked)
          const domain = scales.yScale.domain()
          dispatcher.call("domainLockToggle", this, {isLocked: !isLocked, axis: "y", extent: domain})
        })

      // y2 input group
      cache.y2MaxInput = cache.y2HitZone.append("div")
        .attr("class", "domain-input y2 max")
        .style("position", "absolute")
        .attr("contentEditable", true)
        .on("focus", function focus () {
          y2MaxText = this.innerText
        })
        .on("blur", function change () {
          const input = this.innerText
          const domain = scales.y2Scale.domain()
          if (validateType(input, "number") && validateRange(input, domain, "max")) {
            y2MaxText = input
            dispatcher.call("domainChange", this, {axis: "y2", extent: [domain[0], Number(input)]})
          } else {
            this.innerText = y2MaxText
          }
        })
        .call(blurOnEnter)

      cache.y2MinInput = cache.y2HitZone.append("div")
        .attr("class", "domain-input y2 min")
        .style("position", "absolute")
        .attr("contentEditable", true)
        .on("focus", function focus () {
          y2MinText = this.innerText
        })
        .on("blur", function change () {
          const input = this.innerText
          const domain = scales.y2Scale.domain()
          if (validateType(input, "number") && validateRange(input, domain, "min")) {
            y2MinText = input
            dispatcher.call("domainChange", this, {axis: "y2", extent: [Number(input), domain[1]]})
          } else {
            this.innerText = y2MinText
          }
        })
        .call(blurOnEnter)

      cache.y2LockIcon = cache.y2HitZone.append("div")
        .attr("class", "domain-lock y2")
        .style("position", "absolute")
        .on("click", function change () {
          const isLocked = this.classList.contains("locked")
          this.classList.toggle("locked", !isLocked)
          const domain = scales.y2Scale.domain()
          dispatcher.call("domainLockToggle", this, {isLocked: !isLocked, axis: "y2", extent: domain})
        })

      // x input group
      cache.xMinInput = cache.xHitZone.append("div")
        .attr("class", "domain-input x min")
        .style("position", "absolute")
        .attr("contentEditable", true)
        .on("focus", function focus () {
          xMinText = this.innerText
        })
        .on("blur", function change () {
          const input = this.innerText
          const domain = scales.xScale.domain()
          if (validateType(input, config.keyType) && validateRange(input, domain, "min", config.keyType)) {
            const min = stringToType(input, config.keyType)
            xMinText = input
            dispatcher.call("domainChange", this, {axis: "x", extent: [min, domain[1]]})
          } else {
            this.innerText = xMinText
          }
        })
        .call(blurOnEnter)

      cache.xMaxInput = cache.xHitZone.append("div")
        .attr("class", "domain-input x max")
        .style("position", "absolute")
        .attr("contentEditable", true)
        .on("focus", function focus () {
          xMaxText = this.innerText
        })
        .on("blur", function change () {
          const input = this.innerText
          const domain = scales.xScale.domain()
          if (validateType(input, config.keyType) && validateRange(input, domain, "max", config.keyType)) {
            const max = stringToType(this.innerText, config.keyType)
            xMaxText = input
            dispatcher.call("domainChange", this, {axis: "x", extent: [domain[0], max]})
          } else {
            this.innerText = xMaxText
          }
        })
        .call(blurOnEnter)

      cache.xLockIcon = cache.xHitZone.append("div")
        .attr("class", "domain-lock x")
        .style("position", "absolute")
        .on("click", function change () {
          const isLocked = this.classList.contains("locked")
          this.classList.toggle("locked", !isLocked)
          const domain = scales.xScale.domain()
          dispatcher.call("domainLockToggle", this, {isLocked: !isLocked, axis: "x", extent: domain})
        })

      hideYEditor()
      hideY2Editor()
      hideXEditor()
    }

    if (config.xDomainEditorIsEnabled) {
      cache.xHitZone.style("display", "block")
      cache.xHitZone
        .style("width", `${config.chartWidth + LOCK_SIZE}px`)
        .style("height", `${HOVER_ZONE_SIZE}px`)
        .style("top", `${config.margin.top + config.chartHeight}px`)
        .style("left", `${config.margin.left}px`)
        .style("display", "block")

      cache.xMinInput
        .style("top", `${PADDING}px`)
        .style("left", "0px")
        .text(xFormatter(xDomain[0]))

      cache.xMaxInput
        .style("top", `${PADDING}px`)
        .style("right", `${LOCK_SIZE}px`)
        .text(xFormatter(xDomain[1]))

      cache.xLockIcon
        .classed("locked", config.xLock)
        .style("width", `${LOCK_SIZE}px`)
        .style("height", `${LOCK_SIZE}px`)
        .style("right", "0px")
    } else {
      cache.xHitZone.style("display", "none")
    }

    if (config.yDomainEditorIsEnabled) {
      cache.yHitZone.style("display", "block")
      cache.yHitZone
        .style("width", `${HOVER_ZONE_SIZE}px`)
        .style("height", `${config.chartHeight + LOCK_SIZE}px`)
        .style("top", `${config.margin.top - LOCK_SIZE}px`)
        .style("left", `${config.margin.left - HOVER_ZONE_SIZE}px`)
        .style("display", "block")

      cache.yMaxInput
        .style("top", `${LOCK_SIZE}px`)
        .style("right", "0px")
        .text(yFormatter(yDomain[1]))

      cache.yMinInput
        .style("top", `${config.chartHeight + LOCK_SIZE - INPUT_HEIGHT}px`)
        .style("right", "0px")
        .text(yFormatter(yDomain[0]))

      cache.yLockIcon
        .classed("locked", config.yLock)
        .style("width", `${LOCK_SIZE}px`)
        .style("height", `${LOCK_SIZE}px`)
        .style("left", `${HOVER_ZONE_SIZE - LOCK_SIZE}px`)
        .style("top", `${LOCK_SIZE - LOCK_SIZE}px`)
    } else {
      cache.yHitZone.style("display", "none")
    }

    if (config.y2DomainEditorIsEnabled) {
      cache.y2HitZone.style("display", "block")
      cache.y2HitZone
        .style("width", `${HOVER_ZONE_SIZE}px`)
        .style("height", `${config.chartHeight + LOCK_SIZE}px`)
        .style("top", `${config.margin.top - LOCK_SIZE}px`)
        .style("left", `${config.margin.left + config.chartWidth}px`)

      cache.y2MaxInput
        .style("top", `${LOCK_SIZE}px`)
        .style("left", `${PADDING}px`)
        .text(y2Formatter(y2Domain[1]))

      cache.y2MinInput
        .style("top", `${config.chartHeight + LOCK_SIZE - INPUT_HEIGHT}px`)
        .style("left", `${PADDING}px`)
        .text(y2Formatter(y2Domain[0]))

      cache.y2LockIcon
        .classed("locked", config.y2Lock)
        .style("width", `${LOCK_SIZE}px`)
        .style("height", `${LOCK_SIZE}px`)
        .style("top", `${LOCK_SIZE - LOCK_SIZE}px`)
    } else {
      cache.y2HitZone.style("display", "none")
    }
  }

  function validateType (_input, _type) {
    if (_type === "time") {
      const date = d3.timeParse(config.inputDateFormat)(_input)
      return Boolean(date)
    } else {
      return !isNaN(_input)
    }
  }

  function validateRange (_input, _domain, _minOrMax, _type) {
    // TO DO: range; ordinal
    let input = _input
    if (_type === "time") {
      input = d3.timeParse(config.inputDateFormat)(_input)
    }
    if (_minOrMax === "min") {
      return input <= _domain[1]
    } else {
      return input >= _domain[0]
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

  function on (...args) {
    dispatcher.on(...args)
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

  function render () {
    if (config.xDomainEditorIsEnabled
        || config.yDomainEditorIsEnabled
        || config.y2DomainEditorIsEnabled) {
      build()
    } else {
      destroy()
    }
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
    setScales,
    setConfig,
    render,
    destroy
  }
}
