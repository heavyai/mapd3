import {override} from "./helpers/common"

/**
 * ClipPath: component that creates an SVG defs element with a rectangular clipping path
 * @param {selection} _container d3 selection representing the svg element
 * @returns {object} object containing methods for the component
*/
export default function ClipPath (_container) {
  let config = {
    margin: {
      top: 60,
      right: 30,
      bottom: 40,
      left: 70
    },
    width: 800,
    height: 500,
    chartId: null,

    markPanelWidth: null,
    chartHeight: null
  }

  const cache = {
    container: _container,
    clipPath: null
  }

  function build () {
    if (!cache.clipPath) {
      cache.clipPath = cache.container.append("defs")
        .append("clipPath")
        .attr("id", `mark-clip-${config.chartId}`)
        .append("rect")
    }

    const HEIGHT_PADDING = 4
    cache.clipPath
      .attr("width", config.markPanelWidth)
      .attr("height", config.chartHeight + HEIGHT_PADDING)
  }

  function setConfig (_config) {
    config = override(config, _config)
    return this
  }

  function render () {
    build()
  }

  return {
    setConfig,
    render
  }
}
