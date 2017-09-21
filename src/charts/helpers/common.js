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
      d[keys.DATA] = new Date(d[keys.DATA])
    })
    sortedData.sort((a, b) => a[keys.DATA].getTime() - b[keys.DATA].getTime())
  } else if (_keyType === "string") {
    sortedData.sort((a, b) => a[keys.DATA].localeCompare(b[keys.DATA], "en", {numeric: false}))
  } else {
    sortedData.sort((a, b) => a[keys.DATA] - b[keys.DATA])
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
