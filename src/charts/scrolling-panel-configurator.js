import * as d3 from "./helpers/d3-service"
import {override, getSizes} from "./helpers/common"

export default function ScrollingPanelConfigurator (_container) {
  let config = {
    margin: {
      top: 60,
      right: 30,
      bottom: 40,
      left: 70
    },
    width: 800,
    height: 500,
  }

  function build () {
    const {markPanelWidth, chartHeight} = getSizes(config, {})
    _container
      .attr('width', markPanelWidth)
      .attr('height', chartHeight + config.margin.bottom)
      .attr("transform", `translate(0,${config.margin.top})`)
  }

  function setConfig (_config) {
    config = override(config, _config)
    return this
  }

  function render() {
    build()
  }

  return {
    setConfig,
    render
  }
}
