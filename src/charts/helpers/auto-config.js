import {MIN_MARK_WIDTH, MAX_MARK_WIDTH} from "./constants"
import {clamp} from "./common"

export function getSizes (config, data) {
  const sizes = {}

  const markCount = data && data.allKeyTotals && data.allKeyTotals.length || 0

  sizes.chartWidth = Math.max(config.width - config.margin.left - config.margin.right, 0)
  sizes.chartHeight = Math.max(config.height - config.margin.top - config.margin.bottom, 0)

  sizes.markPanelWidth = sizes.chartWidth
  if (markCount) {
    const minMarkPanelWidth = markCount * MIN_MARK_WIDTH
    sizes.markPanelWidth = sizes.chartWidth < minMarkPanelWidth ? minMarkPanelWidth : sizes.chartWidth
    sizes.markWidth = sizes.markPanelWidth / markCount
    sizes.markWidth = clamp(sizes.markWidth, [MIN_MARK_WIDTH, MAX_MARK_WIDTH])
  }

  return sizes
}

export function autoConfigure (config, cache, data) {
  const newConfig = {}
  if (config.width === "auto") {
    newConfig.width = cache.container && cache.container.clientWidth || 0
  }
  if (config.height === "auto") {
    newConfig.height = cache.container && cache.container.clientHeight || 0
  }
  const sizes = getSizes(config, data)
  Object.assign(newConfig, sizes)

  return newConfig
}
