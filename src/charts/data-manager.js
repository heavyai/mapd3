import * as d3 from "./helpers/d3-service"

import {keys} from "./helpers/constants"
import {invertScale, sortData, cloneData} from "./helpers/common"


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

  // accessors
  const getKey = (d) => d[keys.DATA]
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
        value: value.toFixed(2),
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

  function cleanData (_data, _keyType) {
    const dataBySeries = cloneData(_data[keys.SERIES])
    const flatData = []

    // Normalize dataBySeries
    dataBySeries.forEach((serie) => {
      serie[keys.VALUES] = sortData(serie[keys.VALUES], _keyType)
      serie[keys.VALUES].forEach((d) => {
        d[keys.DATA] = _keyType === "time" ? new Date(d[keys.DATA]) : d[keys.DATA]
        d[keys.VALUE] = Number(d[keys.VALUE])
      })
    })

    dataBySeries.forEach((serie) => {
      serie[keys.VALUES].forEach((d) => {
        const dataPoint = {}
        dataPoint[keys.LABEL] = serie[keys.LABEL]
        dataPoint[keys.GROUP] = serie[keys.GROUP]
        dataPoint[keys.ID] = serie[keys.ID]
        dataPoint[keys.DATA] = _keyType === "time" ? new Date(d[keys.DATA]) : d[keys.DATA]
        dataPoint[keys.VALUE] = d[keys.VALUE]
        flatData.push(dataPoint)
      })
    })

    const flatDataSorted = sortData(flatData, _keyType)

    const dataByKey = d3.nest()
      .key(getKey)
      .entries(flatDataSorted)
      .map((d) => {
        const dataPoint = {}
        dataPoint[keys.DATA] = _keyType === "time" ? new Date(d.key) : d.key
        dataPoint[keys.SERIES] = d.values
        return dataPoint
      })

    const groupKeys = {}
    dataBySeries.forEach((d) => {
      if (!groupKeys[d[keys.GROUP]]) {
        groupKeys[d[keys.GROUP]] = []
      }
      groupKeys[d[keys.GROUP]].push(d[keys.ID])
    })

    const stackData = dataByKey
        .map((d) => {
          const points = {
            key: d[keys.DATA]
          }
          d.series.forEach((dB) => {
            points[dB[keys.ID]] = dB[keys.VALUE]
          })

          return points
        })

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
    cleanData,
    getNearestDataPoint,
    filterByDate,
    filterByKey,
    setConfig
  }
}

