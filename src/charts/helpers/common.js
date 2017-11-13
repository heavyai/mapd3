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
  if (_keyType === "time" || _keyType === "number") {
    return _scale.invert(_mouseX)
  } else {
    const bandStep = _scale.step()
    const index = Math.round((_mouseX) / bandStep)
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
    converted = new Date(str)
  } else if (type === "number") {
    converted = Number(str)
  }
  return converted
}
