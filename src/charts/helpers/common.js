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
    && extent.filter(d =>
      typeof d !== "undefined"
      && d !== null
      && !isNaN(d.valueOf()) // valueOf also catches Invalid Date
    ).length === 2
}

export function uniqueId () {
  return `id-${Math.random().toString(36).substr(2, 16)}`
}

export function ascendingComparator (key, keyType) {
  if (keyType === "string"&& key === "key") {
    return (a, b) => a[key].localeCompare(b[key], "en", {numeric: false})
  } else {
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
}

export function descendingComparator (key, keyType) {
   if (keyType === "string" && key === "key") {
    return (a, b) => {
      return b[key].localeCompare(a[key], "en", {numeric: false})
    }
  } else {
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

export function getChartClass (_chartType) {
  switch (_chartType) {
  case "bar":
  case "stackedBar":
    return "bar"

  case "line":
  case "stackedArea":
    return "line"

  // TO DO: handle bar line combo chartType...
  case Array.isArray(_chartType):
    return "combo"

  default:
    return ""
  }
}

export function getDomainSign (domain) {
  let domainSign = null
  if (domain[0] >= 0 && domain[1] >= 0) {
    domainSign = "++"
  } else if (domain[0] <= 0 && domain[1] <= 0) {
    domainSign = "--"
  } else {
    domainSign = domain.map(d => d >= 0 ? "+" : "-").join("")
  }
  return domainSign
}

export function filterByKey (_data, _extent) {
  const data = cloneData(_data)

  data[keys.SERIES].forEach((series) => {
    const values = series[keys.VALUES]
    const allKeys = values.map(d => d[keys.KEY])
    const extentMinIndex = allKeys.indexOf(_extent[0])
    const extentMaxIndex = allKeys.indexOf(_extent[1])
    series[keys.VALUES] = series[keys.VALUES].slice(extentMinIndex, extentMaxIndex)
  })
  return data
}

export function filterByDate (_data, _extent) {
  const data = cloneData(_data)

  data[keys.SERIES].forEach((series) => {
    series[keys.VALUES] = series[keys.VALUES].filter(d => {
      const date = new Date(d[keys.KEY])
      return date >= _extent[0] && date <= _extent[1]
    })
  })
  return data
}
