import * as d3 from "./helpers/d3-service"

import {keys} from "./helpers/constants"
import {getUnique} from "./helpers/common"

export default function Scale (config, cache) {

  const getID = (d) => d[keys.ID]
  const getKey = (d) => d[keys.DATA]
  const getValue = (d) => d[keys.VALUE]

  function buildStackedScales () {
    const allStackHeights = cache.dataByKey.map((d) => d3.sum(d.series.map((dB) => dB.value)))

    cache.stackData = cache.dataByKey.map((d) => {
      const points = {
        key: d[keys.DATA]
      }
      d.series.forEach((dB) => {
        points[dB[keys.ID]] = dB[keys.VALUE]
      })

      return points
    })

    cache.d3.stack = d3.stack()
      .keys(cache.dataBySeries.map(getID))
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone)

    const valuesExtent = d3.extent(allStackHeights)

    const allKeys = cache.flatDataSorted.map(getKey)
    const allUniqueKeys = getUnique(allKeys)

    buildXScale(allUniqueKeys)
    buildColorScale()
    buildYScale([0, valuesExtent[1]])
  }

  function buildXScale (_allKeys) {
    let datesExtent = null
    if (config.keyType === "time") {
      datesExtent = d3.extent(_allKeys)
      cache.xScale = d3.scaleTime()
    } else {
      datesExtent = _allKeys
      cache.xScale = (config.chartType === "bar" || config.chartType === "stackedBar") ? d3.scaleBand() : d3.scalePoint()
      cache.xScale.padding(0)
    }

    cache.xScale.domain(datesExtent)
      .range([0, cache.chartWidth])
  }

  function buildColorScale () {
    const ids = cache.dataBySeries.map(getID)
    cache.colorScale = d3.scaleOrdinal()
        .range(config.colorSchema.map((d) => d.value))
        .domain(config.colorSchema.map((d, i) => d.key || ids[i]))
        .unknown(config.defaultColor)
  }

  function buildYScale (_extent) {
    cache.yScale = d3.scaleLinear()
        .domain(_extent)
        .rangeRound([cache.chartHeight, 0])
        .nice()
  }

  function splitByGroups () {
    const groups = {}
    cache.dataBySeries.forEach((d) => {
      const key = d[keys.GROUP]
      if (!groups[key]) {
        groups[key] = {
          allValues: [],
          allKeys: []
        }
      }
      groups[key].allValues = groups[key].allValues.concat(d[keys.VALUES].map(getValue))
      groups[key].allKeys = groups[key].allKeys.concat(d[keys.VALUES].map(getKey))
    })

    return groups
  }

  function buildScales () {
    const groups = splitByGroups()

    cache.hasSecondAxis = cache.groupKeys.length > 1

    const groupAxis1 = groups[cache.groupKeys[0]]
    const allUniqueKeys = groupAxis1.allKeys
    const valuesExtent = d3.extent(groupAxis1.allValues)

    buildXScale(allUniqueKeys)
    buildColorScale()
    buildYScale(valuesExtent)

    if (cache.hasSecondAxis) {
      const groupAxis2 = groups[cache.groupKeys[1]]
      const valuesExtent2 = d3.extent(groupAxis2.allValues)

      cache.yScale2 = cache.yScale.copy()
        .domain(valuesExtent2)
    }
  }

  return {
    buildStackedScales,
    buildScales
  }
}
