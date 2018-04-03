import * as d3 from "./helpers/d3-service"

import {override, stringToType, extendIsValid} from "./helpers/common"
import {blurOnEnter} from "./interactors"

export default function BrushRangeEditor (_container) {

  let config = {
    keyType: "time",
    dateFormat: "%b %d, %Y",
    numberFormat: ".2f",
    brushRangeIsEnabled: true,
    brushRangeMin: null,
    brushRangeMax: null
  }

  const cache = {
    container: _container,
    root: null,
    inputMin: null,
    inputMax: null
  }

  let scales = {
    xScale: null
  }

  // events
  const dispatcher = d3.dispatch("rangeChange")

  function handleFocus (selection) {
    return () => {
      let text = selection.text()
      const parsed = d3.timeParse(config.dateFormat)(text)
      if (parsed instanceof Date) {
        text = d3.timeFormat("%m-%d-%Y")(parsed)
        selection.text(text)
      }
    }
  }

  function buildSVG () {
    if (!cache.root) {
      cache.root = cache.container
        .append("div")
        .attr("class", "brush-range-input-group")
        .style("top", 0)
        .style("padding-top", "12px")

      cache.inputMax = cache.root.append("div")
        .attr("class", "brush-range-input max")
        .attr("contentEditable", true)

      const handleMaxFocus = handleFocus(cache.inputMax)

      cache.inputMax
        .on("focus", handleMaxFocus)
        .on("blur", function change () {
          const domain = scales.xScale.domain()
          const rangeMin = cache.rangeMin || domain[0]
          const oldValue = cache.rangeMax || domain[1]
          const newValue = stringToType(cache.inputMax.text(), config.keyType)

          if (newValue !== cache.rangeMax) {
            if (newValue > rangeMin) {
              cache.rangeMax = newValue
              dispatcher.call(
                "rangeChange",
                this,
                {extent: [rangeMin, cache.rangeMax]}
              )
            } else {
              const text = oldValue instanceof Date
                ? d3.utcFormat(config.dateFormat)(oldValue)
                : oldValue
              cache.inputMax.text(text)
            }
          }
        })
        .call(blurOnEnter)
        .style("float", "right")

      cache.root.append("div")
        .attr("class", "separator")
        .text("-")
        .style("float", "right")

      cache.inputMin = cache.root.append("div")
        .attr("class", "brush-range-input min")
        .attr("contentEditable", true)

      const handleMinFocus = handleFocus(cache.inputMin)

      cache.inputMin
        .on("focus", handleMinFocus)
        .on("blur", function change () {
          const domain = scales.xScale.domain()
          const rangeMax = cache.rangeMax || domain[1]
          const oldValue = cache.rangeMin || domain[0]
          const newValue = stringToType(cache.inputMin.text(), config.keyType)

          if (newValue !== cache.rangeMin) {
            if (newValue < rangeMax) {
              cache.rangeMin = newValue
              dispatcher.call(
                "rangeChange",
                this,
                {extent: [cache.rangeMin, rangeMax]}
              )
            } else {
              const text = oldValue instanceof Date
                ? d3.utcFormat(config.dateFormat)(oldValue)
                : oldValue
              cache.inputMin.text(text)
            }
          }
        })
        .call(blurOnEnter)
        .style("float", "right")
    }

    const domain = scales.xScale.domain()

    if (extendIsValid(domain)) {
      let rangeMin = config.brushRangeMin === null ? domain[0] : config.brushRangeMin
      let rangeMax = config.brushRangeMax === null ? domain[1] : config.brushRangeMax

      if (config.keyType === "time") {
        const format = d3.utcFormat(config.dateFormat)
        cache.rangeMin = new Date(rangeMin)
        cache.rangeMax = new Date(rangeMax)
        rangeMin = format(new Date(rangeMin))
        rangeMax = format(new Date(rangeMax))
      } else {
        const format = d3.format(config.numberFormat)
        cache.rangeMin = rangeMin
        cache.rangeMax = rangeMax
        rangeMin = format(rangeMin)
        rangeMax = format(rangeMax)
      }

      cache.inputMin.text(rangeMin)
      cache.inputMax.text(rangeMax)
    } else {
      cache.inputMin.text("")
      cache.inputMax.text("")
    }
  }

  function on (...args) {
    dispatcher.on(...args)
    return this
  }

  function setConfig (_config) {
    config = override(config, _config)
    return this
  }

  function setScales (_scales) {
    scales = override(scales, _scales)
    return this
  }

  function render () {
    if (config.brushRangeIsEnabled) {
      buildSVG()
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
    setConfig,
    render,
    setScales
  }
}
