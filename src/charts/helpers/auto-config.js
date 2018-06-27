import {MIN_MARK_WIDTH, MAX_MARK_WIDTH} from "./constants"
import {clamp} from "./common"

export function getSizes (config, data) {
  const sizes = {}
  sizes.chartWidth = Math.max(config.width - config.margin.left - config.margin.right, 0)
  sizes.chartHeight = Math.max(config.height - config.margin.top - config.margin.bottom, 0)
  sizes.markPanelWidth = sizes.chartWidth

  if (data) {
    const markCount = data && data.allKeyTotals && data.allKeyTotals.length || 0
    const minMarkWidth = config.useScrolling ? MIN_MARK_WIDTH : 0
    const minMarkPanelWidth = markCount * minMarkWidth
    sizes.markPanelWidth = sizes.chartWidth < minMarkPanelWidth ? minMarkPanelWidth : sizes.chartWidth
    sizes.markWidth = sizes.markPanelWidth / markCount
    sizes.markWidth = clamp(sizes.markWidth, [minMarkWidth, MAX_MARK_WIDTH])
  }

  return sizes
}

export function autoConfigure (config, cache, data) {
  const newConfig = {}
  if (config.width === "auto" && cache.container) {
    newConfig.width = cache.container && cache.container.clientWidth || 0
  }
  if (config.height === "auto" && cache.container) {
    newConfig.height = cache.container && cache.container.clientHeight || 0
  }

  const sizes = getSizes({...config, ...newConfig}, data)

  return {...newConfig, ...sizes}
}
