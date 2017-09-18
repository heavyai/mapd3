import {keys} from "./constants"

/**
 * Clones the passed array of data
 * @param  {Object[]} dataToClone Data to clone
 * @return {Object[]}             Cloned data
 */
export function cloneData (dataToClone) {
  return JSON.parse(JSON.stringify(dataToClone))
}

export function sortData (data, _isTimeseries) {
  const sortedData = cloneData(data)
  if (_isTimeseries) {
    sortedData.sort((a, b) => new Date(a[keys.DATA_KEY]).getTime() - new Date(b[keys.DATA_KEY]).getTime())
  } else {
    sortedData.sort((a, b) => a[keys.DATA_KEY].localeCompare(b[keys.DATA_KEY], "en", {numeric: false}))
  }
  return sortedData
}

export function invertScale (_scale, _mouseX, _isTimeseries) {
  if (_isTimeseries) {
    return _scale.invert(_mouseX)
  } else {
    const bandStep = _scale.step()
    const index = Math.round((_mouseX) / bandStep)
    return _scale.domain()[index]
  }
}