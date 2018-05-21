import * as d3 from "./helpers/d3-service"

import {comparators, keys} from "./helpers/constants"
import {ascendingComparator, descendingComparator, clamp, invertScale, sortData, cloneData, getUnique} from "./helpers/common"


export default function DataManager () {
  /* eslint-disable no-magic-numbers */
  let config = {
    keyType: "number", // number, string, time,
    range: [0, 100],
    pointCount: 200,
    groupCount: 2,
    lineCount: 4,
    stringMinMaxLength: [4, 8],
    randomStepSize: 50,
    nullRatio: null
  }
  const cache = {
    data: null,
    baseDate: null
  }

  // accessors
  const getKey = (d) => d[keys.KEY]
  const getID = (d) => d[keys.ID]

  const DAY_IN_MS = 1000 * 60 * 60 * 24

  function generateRandomString (_length) {
    let stringLength = _length
    if (!_length) {
      const range = config.stringMinMaxLength
      stringLength = Math.round(Math.random() * (range[1] - range[0])) + range[0]
    }
    return [...Array(stringLength)].map(() => String.fromCharCode(Math.round(Math.random() * 25) + 97)).join("")
  }

  function generateSeries (_dataKeys, _range) {
    let value = d3.randomUniform(..._range)()
    const randomWalkStepSize = (_range[1] - _range[0]) / config.randomStepSize
    const rnd = d3.randomNormal(0, 1)
    return _dataKeys.map(d => {
      const isRandomNull = config.nullRatio && (Math.random() * 100 / config.nullRatio) < 1
      value = clamp(value + rnd() * randomWalkStepSize, _range)
      return {
        value: isRandomNull ? null : value,
        key: config.keyType === "time" ? d.toISOString() : d
      }
    })
  }

  function generateTestDataset () {
    let dataKeys = null
    if (config.keyType === "time") {
      cache.baseDate = new Date()
      const previousDate = new Date(cache.baseDate.getTime() - DAY_IN_MS * config.pointCount)
      dataKeys = d3.timeDay.range(previousDate, cache.baseDate)
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
      values: generateSeries(dataKeys, config.range),
      measureName: `Measure ${d}`
    }))

    cache.data = {series}

    // console.log("generated data", cache.data)

    return cache.data
  }

  function convertToDate (_date) {
    // hacks to handle invalid date like "0014-06-08T00:00:00.000Z"
    return new Date(new Date(_date).toString())
  }

  function cleanData (_data, _keyType, _sortBy, _fillData) {
    const dataBySeries = cloneData(_data[keys.SERIES])
    dataBySeries.forEach((serie) => {
      // convert type
      serie[keys.VALUES].forEach((d) => {
        if (_keyType === "time") {
          d[keys.KEY] = convertToDate(d[keys.KEY])
        }
        if (_fillData) {
          d[keys.VALUE] = Number(d[keys.VALUE])
        }
      })
    })
    const flatData = []

    // get all unique keys
    let allKeys = []
    dataBySeries.forEach(d => { allKeys = allKeys.concat(d.values) })
    allKeys = allKeys.map(d => d.key)
    allKeys = getUnique(allKeys, _keyType)

    // Normalize dataBySeries
    dataBySeries.forEach((serie) => {
      const keyValues = {}
      serie[keys.VALUES].forEach(d => {
        keyValues[d.key] = d.value
      })
      // fill data
      let filled = serie[keys.VALUES]
      if (_fillData) {
        filled = allKeys.map(d => ({
          key: d,
          value: (typeof keyValues[d] === "undefined") ? null : keyValues[d]
        }))
      }

      // sort
      serie[keys.VALUES] = sortData(filled, _keyType)
    })

    // flatten data
    dataBySeries.forEach((serie) => {
      serie[keys.VALUES].forEach((d) => {
        const dataPoint = {}
        dataPoint[keys.LABEL] = serie[keys.LABEL]
        dataPoint[keys.GROUP] = serie[keys.GROUP]
        dataPoint[keys.ID] = serie[keys.ID]
        dataPoint[keys.KEY] = d[keys.KEY]
        dataPoint[keys.VALUE] = d[keys.VALUE]
        flatData.push(dataPoint)
      })
    })
    // sort flat data
    const flatDataSorted = sortData(flatData, _keyType)

    const dataByKey = d3.nest()
      .key(getKey)
      .entries(flatDataSorted)
      .map((d) => {
        const dataPoint = {}
        dataPoint[keys.KEY] = _keyType === "time" ? new Date(d.key) : d.key
        dataPoint[keys.SERIES] = d.values
        return dataPoint
      })

    // get group keys
    const groupKeys = {}
    dataBySeries.forEach((d) => {
      if (!groupKeys[d[keys.GROUP]]) {
        groupKeys[d[keys.GROUP]] = []
      }
      groupKeys[d[keys.GROUP]].push(d[keys.ID])
    })

    // stack data
    const stackData = dataByKey
      .map((d) => {
        const points = {
          key: d[keys.KEY]
        }
        d.series.forEach((dB) => {
          points[dB[keys.ID]] = dB[keys.VALUE]
        })
        return points
      })

    // d3 stack
    const stack = d3.stack()
      .keys(dataBySeries.map(getID))
      .value((d, key) => d[key] || 0)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone)

    // get stack totals
    const allKeyTotals = dataByKey.map(d => ({
      key: d[keys.KEY],
      total: d3.sum(d[keys.SERIES].map(dB => dB[keys.VALUE]))
    }))

    // sort
    switch (_sortBy) {
    case comparators.TOTAL_ASCENDING:
      allKeyTotals.sort(ascendingComparator("total"))
      break
    case comparators.TOTAL_DESCENDING:
      allKeyTotals.sort(descendingComparator("total"))
      break
    case comparators.ALPHA_ASCENDING:
      allKeyTotals.sort(ascendingComparator("key"))
      break
    case comparators.ALPHA_DESCENDING:
      allKeyTotals.sort(descendingComparator("key"))
      break
    default:
      break
    }

    return {dataBySeries, dataByKey, stack, stackData, flatDataSorted, groupKeys, allKeyTotals}
  }

  function getNearestDataPoint (_mouseX, _dataObject, _scales, _keyType) {
    const keyFromInvertedX = invertScale(_scales.xScale, _mouseX, _keyType)

    if (_keyType === "string") {
      // if we are keying on strings, simply find the value via a key match
      return _dataObject.dataByKey.find(d => d[keys.KEY] === keyFromInvertedX)
    }

    const bisectLeft = d3.bisector(getKey).left
    const dataEntryIndex = bisectLeft(_dataObject.dataByKey, keyFromInvertedX)
    const dataEntryForXPosition = _dataObject.dataByKey[dataEntryIndex]
    const dataEntryForXPositionPrev = _dataObject.dataByKey[Math.max(dataEntryIndex - 1, 0)]

    let nearestDataPoint = null
    if (keyFromInvertedX && dataEntryForXPosition && dataEntryForXPositionPrev) {
      if ((keyFromInvertedX - dataEntryForXPositionPrev.key)
          < (dataEntryForXPosition.key - keyFromInvertedX)) {
        nearestDataPoint = dataEntryForXPositionPrev
      } else {
        nearestDataPoint = dataEntryForXPosition
      }
    }
    return nearestDataPoint
  }

  function filterByKey (_extent) {
    const data = cloneData(cache.data)

    data[keys.SERIES].forEach((series) => {
      const values = series[keys.VALUES]
      const allKeys = values.map(d => d[keys.KEY])
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
        const epoch = new Date(d[keys.KEY]).getTime()
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
    cleanData,
    getNearestDataPoint,
    filterByDate,
    filterByKey,
    setConfig
  }
}
