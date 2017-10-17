import * as d3 from "./helpers/d3-service"
export {bisector, extent, sum, range, merge} from "d3-array"

import {keys} from "./helpers/constants"
import {cloneData} from "./helpers/common"

export default function DataManager () {
  /* eslint-disable no-magic-numbers */
  let config = {
    keyType: "number", // number, string, time,
    range: [0, 100],
    pointCount: 200,
    groupCount: 2,
    lineCount: 4
  }
  const cache = {
    data: null,
    baseDate: null
  }

  function generateRandomString (_length) {
    return Math.random().toString(36).replace(/[^a-z0-9]+/g, "").substr(0, _length || 5)
  }

  function generateSeries (_dataKeys, _range, _allowNegative) {
    let value = d3.randomUniform(..._range)()
    const variabilityRatio = 50
    const randomWalkStepSize = (_range[1] - _range[0]) / variabilityRatio
    const rnd = d3.randomNormal(0, 1)
    return _dataKeys.map((d) => {
      value = value + rnd() * randomWalkStepSize
      if (!_allowNegative && value < randomWalkStepSize) {
        value = value + randomWalkStepSize
      }
      return {
        value,
        key: config.keyType === "time" ? d.toISOString() : d
      }
    })
  }

  function generateTestDataset () {
    let dataKeys = null
    if (config.keyType === "time") {
      cache.baseDate = new Date()
      dataKeys = d3.timeDay.range(d3.timeMonth.floor(cache.baseDate), d3.timeMonth.ceil(cache.baseDate))
    } else if (config.keyType === "string") {
      dataKeys = d3.range(0, config.pointCount).map(() => generateRandomString())
      dataKeys.sort((a, b) => a.localeCompare(b, "en", {numeric: false}))
    } else if (config.keyType === "number") {
      dataKeys = d3.range(0, config.pointCount).map((d, i) => i)
    }

    const series = d3.range(config.lineCount).map((d) => ({
      label: `Label ${d}`,
      id: d,
      group: d < config.groupCount ? d : 0,
      values: generateSeries(dataKeys, config.range)
    }))

    cache.data = {series}

    // console.log("generated data", cache.data)

    return cache.data
  }

  function filterByKey (_extent) {
    const data = cloneData(cache.data)

    data[keys.SERIES].forEach((series) => {
      const values = series[keys.VALUES]
      const allKeys = values.map(d => d[keys.DATA])
      const extentMinIndex = allKeys.indexOf(_extent[0])
      const extentMaxIndex = allKeys.indexOf(_extent[1])
      series[keys.VALUES] = series[keys.VALUES].slice(extentMinIndex, extentMaxIndex)
    })

    return data
  }

  function filterByDate (_dateExtent) {
    const data = cloneData(cache.data)

    data[keys.SERIES].forEach((series) => {
      series[keys.VALUES] = series[keys.VALUES].filter((d) => {
        const epoch = new Date(d[keys.DATA]).getTime()
        return epoch >= _dateExtent[0].getTime()
          && epoch <= _dateExtent[1].getTime()
      })
    })

    return data
  }

  function setConfig (_config) {
    config = Object.assign({}, config, _config)
    return this
  }

  return {
    generateTestDataset,
    generateSeries,
    filterByDate,
    filterByKey,
    setConfig
  }
}

