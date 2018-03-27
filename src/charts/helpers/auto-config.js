export function autoConfigure (config, cache, data) {
  const newConfig = {}
  if (config.width === "auto") {
    autoConfig.width = cache.container && cache.container.clientWidth || 0
  }
  if (config.height === "auto") {
    autoConfig.height = cache.container && cache.container.clientHeight || 0
  }
  return newConfig
}
