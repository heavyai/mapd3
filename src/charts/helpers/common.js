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

function sort (property = "value", order = "desc") {
  let sortFn

  if (order === "desc") {
    sortFn = (a, b) => {
      if (b[property] < a[property]) return  -1
      if (b[property] > a[property]) return 1
      return 0
    }
  } else {
    sortFn = (a, b) => {
      if (a[property] < b[property]) return -1
      if (a[property] > b[property]) return 1
      return 0
    }
  }

  return sortFn
}

export function sortData (_data, _keyType, _sortKey, _sortOrder) {
  const sortedData = cloneData(_data)
  if (_keyType === "time") {
    sortedData.forEach((d) => {
      d[keys.KEY] = new Date(d[keys.KEY])
    })
    sortedData.sort((a, b) => a[keys.KEY].getTime() - b[keys.KEY].getTime())
  } else if (_keyType === "string") {
    sortedData.sort(sort(_sortKey, _sortOrder))
  } else {
    sortedData.sort((a, b) => a[keys.KEY] - b[keys.KEY])
  }
  return sortedData
}

export function getUnique (arr, _keyType) {
  const obj = {}
  arr.forEach(d =>{
    obj[d] = null
  })
  const keys = Object.keys(obj)
  if (_keyType === "time") {
    return keys.map(d => new Date(d))
  } else {
    return keys
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
  console.log("stringToType", str, type, converted)
  return converted
}

export function getSizes (config, cache) {
  const width = config.width === "auto"
    ? (cache.container && cache.container.clientWidth || 0)
    : config.width
  const height = config.height === "auto"
    ? (cache.container && cache.container.clientHeight || 0)
    : config.height
  const chartWidth = Math.max(width - config.margin.left - config.margin.right, 0)
  const chartHeight = Math.max(height - config.margin.top - config.margin.bottom, 0)

  return {
    width,
    height,
    chartWidth,
    chartHeight
  }
}

export function isNumeric (val) {
    return Number(parseFloat(val)) === val;
}

export function extendIsValid (extent) {
  return extent
    && extent.length
    && extent.filter(d => !isNaN(d.valueOf()) // valueOf also catches Invalid Date
      && typeof d !== "undefined"
      && d !== null
    ).length == 2
}

export function uniqueId () {
  return `id-${Math.random().toString(36).substr(2, 16)}`
}
