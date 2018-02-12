import Tooltip from "./tooltip"

export default function Legend (_container) {
  const IS_LEGEND = true
  const cache = {
    legendComponent: Tooltip(_container, IS_LEGEND)
  }

  function setConfig (_config) {
    cache.legendComponent
      .setConfig(_config)
      .setConfig({tooltipIsEnabled: _config.legendIsEnabled})
      .setTitle(_config.legendTitle)
      .setXPosition(_config.legendXPosition)
      .setYPosition(_config.legendYPosition)
    return this
  }

  function setScales (_scales) {
    cache.legendComponent
      .setScales(_scales)
    return this
  }

  function setData (_dataObject) {
    const legendContent = _dataObject.dataBySeries
      .map((d) => ({
        id: d.id,
        key: d.key,
        label: d.label
      }))

    cache.legendComponent
      .setContent(legendContent)
      .render()
    return this
  }

  return {
    setConfig,
    setScales,
    setData
  }
}
