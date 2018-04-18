import {keys} from "./constants"
import * as d3 from "./d3-service"

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
      d[keys.KEY] = new Date(d[keys.KEY])
    })
    sortedData.sort((a, b) => a[keys.KEY].getTime() - b[keys.KEY].getTime())
  } else if (_keyType === "string") {
    sortedData.sort((a, b) => a[keys.KEY].localeCompare(b[keys.KEY], "en", {numeric: false}))
  } else {
    sortedData.sort((a, b) => a[keys.KEY] - b[keys.KEY])
  }
  return sortedData
}

export function getUnique (arr, _keyType) {
  const obj = {}
  arr.forEach(d => {
    obj[d] = null
  })
  const allKeys = Object.keys(obj)
  if (_keyType === "time") {
    return allKeys.map(d => new Date(d))
  } else {
    return allKeys
  }
}

export function invertScale (_scale, _mouseX, _keyType) {
  if (_keyType === "time" || _keyType === "number") {
    return _scale.invert(_mouseX)
  } else {
    const index = Math.round((_mouseX) / _scale.step() - 0.5)
    return _scale.domain()[index]
  }
}

export function override (a, b) {
  const accum = {}
  for (const x in a) {
    if (a.hasOwnProperty(x)) {
      accum[x] = (x in b) ? b[x] : a[x]
    }
  }
  return accum
}

export function throttle (callback, limit) {
  let wait = false
  let timer = null
  return function throttleFn (...args) {
    if (!wait) {
      wait = true
      clearTimeout(timer)
      timer = setTimeout(() => {
        wait = false
        callback(...args)
      }, limit)
    }
  }
}

export function rebind (target) {
  return function reapply (...args) {
    target.on(`${args[0]}.rebind`, ...args.slice(1))
    return this
  }
}

export function stringToType (str, type) {
  let converted = str
  if (type === "time") {
    converted = d3.timeParse("%m-%d-%Y")(str)
  } else if (type === "number") {
    converted = Number(str)
  }
  return converted
}

export function isNumberString (val) {
  // eslint-disable-next-line eqeqeq
  return Number(parseFloat(val)) == val
}

export function isNumeric (val) {
  return Number(parseFloat(val)) === val
}

export function extendIsValid (extent) {
  return extent
    && extent.length
    && extent.filter(d => !isNaN(d.valueOf()) // valueOf also catches Invalid Date
      && typeof d !== "undefined"
      && d !== null
    ).length === 2
}

export function uniqueId () {
  return `id-${Math.random().toString(36).substr(2, 16)}`
}

export function ascendingComparator (key) {
  return (a, b) => {
    if (a[key] < b[key]) {
      return -1
    }
    if (a[key] > b[key]) {
      return 1
    }
    return 0
  }
}

export function descendingComparator (key) {
  return (a, b) => {
    if (b[key] < a[key]) {
      return -1
    }
    if (b[key] > a[key]) {
      return 1
    }
    return 0
  }
}

export function clamp (value, clampMinMax) {
  return Math.min(Math.max(clampMinMax[0], value), clampMinMax[1])
}

export function hasBars (_chartType) {
  return _chartType === "bar"
    || _chartType === "stackedBar"
    || _chartType === "groupedBar"
    || (Array.isArray(_chartType) && _chartType.filter(d => d === "bar").length > 0)
}
