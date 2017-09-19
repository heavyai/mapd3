import {keys} from "./constants"

/**
 * Clones the passed array of data
 * @param  {Object[]} dataToClone Data to clone
 * @return {Object[]}             Cloned data
 */
export function cloneData (_dataToClone) {
  return JSON.parse(JSON.stringify(_dataToClone))
}

export function sortData (_data, _keyType) {
  const sortedData = cloneData(_data)
  if (_keyType === "time") {
    sortedData.forEach((d) => {
      d[keys.DATA_KEY] = new Date(d[keys.DATA_KEY])
    })
    sortedData.sort((a, b) => a[keys.DATA_KEY].getTime() - b[keys.DATA_KEY].getTime())
  } else if (_keyType === "string") {
    sortedData.sort((a, b) => a[keys.DATA_KEY].localeCompare(b[keys.DATA_KEY], "en", {numeric: false}))
  } else {
    sortedData.sort((a, b) => a[keys.DATA_KEY] - b[keys.DATA_KEY])
  }
  return sortedData
}

export function getUnique (arr) {
  return [...new Set(arr)]
}

export function invertScale (_scale, _mouseX, _keyType) {
  if (_keyType === "time") {
    return _scale.invert(_mouseX)
  } else {
    const bandStep = _scale.step()
    const index = Math.round((_mouseX) / bandStep)
    return _scale.domain()[index]
  }
}
