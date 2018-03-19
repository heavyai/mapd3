import * as d3 from "./helpers/d3-service"

import {keys} from "./helpers/constants"
import {invertScale, sortData, cloneData, getUnique} from "./helpers/common"


export default function DataManager () {
  /* eslint-disable no-magic-numbers */
  let config = {
    keyType: "number", // number, string, time,
    range: [0, 100],
    pointCount: 200,
    groupCount: 2,
    lineCount: 4,
    stringMinMaxLength: [4, 8],
    barSortProperty: null,
    barSortOrder: null
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
      values: generateSeries(dataKeys, config.range)
    }))

    cache.data = {series}

    // console.log("generated data", cache.data)

    return cache.data
  }

  function convertToDate (_date) {
    // hacks to handle invalid date like "0014-06-08T00:00:00.000Z"
    return new Date(new Date(_date).toString())
  }

  function cleanData (_data, _keyType) {
    const dataBySeries = cloneData(_data[keys.SERIES])
    dataBySeries.forEach((serie) => {
      // convert type
      serie[keys.VALUES].forEach((d) => {
        if (_keyType === "time") {
          d[keys.KEY] = convertToDate(d[keys.KEY])
        }
        d[keys.VALUE] = Number(d[keys.VALUE])
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
      const filled = allKeys.map(d => ({
        key: d,
        value: (typeof keyValues[d] === "undefined") ? null : keyValues[d]
      }))
      // sort
      serie[keys.VALUES] = sortData(filled, _keyType, config.barSortProperty, config.barSortOrder)
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
    const flatDataSorted = sortData(flatData, _keyType, config.barSortProperty, config.barSortOrder)

    const dataByKey = d3.nest()
      .key(getKey)
      .entries(flatDataSorted)
      .map((d) => {
        const dataPoint = {}
        dataPoint[keys.KEY] = _keyType === "time" ? new Date(d.key) : d.key
        dataPoint[keys.SERIES] = d.values
        dataPoint[keys.TOTAL] = d.values.reduce((acc, cur) => acc + cur.value, 0)
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
            key: d[keys.KEY],
            total: d[keys.TOTAL]
          }
          d.series.forEach((dB) => {
            points[dB[keys.ID]] = dB[keys.VALUE]
          })
          return points
        })

    // d3 stack
    const stack = d3.stack()
        .keys(dataBySeries.map(getID))
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone)

    return {dataBySeries, dataByKey, stack, stackData, flatDataSorted, groupKeys}
  }

  function getNearestDataPoint (_mouseX, _dataObject, _scales, _keyType) {
    const keyFromInvertedX = invertScale(_scales.xScale, _mouseX, _keyType)
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

  function resortData (property = "total", order = "desc", dataObject) {
    let sortFn;

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

    const stackData = [...dataObject.stackData].sort(sortFn)
    return stackData
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
    resortData,
    setConfig
  }
}
