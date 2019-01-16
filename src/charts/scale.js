import * as d3 from "./helpers/d3-service"

import {
  keys,
  LEFT_AXIS_GROUP_INDEX,
  RIGHT_AXIS_GROUP_INDEX
} from "./helpers/constants"
import {override, getDomainSign} from "./helpers/common"

export default function Scale () {

  let config = {
    keyType: null,
    chartType: null,
    colorSchema: null,
    defaultColor: null,
    xDomain: "auto",
    yDomain: "auto",
    y2Domain: "auto",

    chartWidth: null,
    chartHeight: null,
    markPanelWidth: null,
    markWidth: null
  }

  let data = {
    dataByKey: null,
    dataBySeries: null,
    flatDataSorted: null,
    groupKeys: null,
    allKeyTotals: null
  }

  const getID = (d) => d[keys.ID]
  const getKey = (d) => d.key
  const getValue = (d) => d[keys.VALUE]

  function buildXScale (_allKeys) {
    let xScale = null
    let domain = null

    if (config.keyType === "time") {
      xScale = d3.scaleTime()
    } else if (config.keyType === "number") {
      xScale = d3.scaleLinear()
    } else {
      xScale = d3.scalePoint()
      xScale.padding(0)
    }

    if (config.xDomain === "auto") {
      if (config.keyType === "string") {
        domain = _allKeys
      } else if (config.keyType === "number") {
        domain = d3.extent(_allKeys.map(d => Number(d)))
      } else {
        domain = d3.extent(_allKeys)
      }
    } else {
      domain = config.xDomain
    }

    const needsXOuterPadding = config.chartType === "bar"
      || config.chartType === "stackedBar"
      || (Array.isArray(config.chartType) && config.chartType.filter(d => d === "bar").length)

    const markWidthOffset = needsXOuterPadding ? config.markWidth / 2 : 0
    xScale.domain(domain)
      .range([markWidthOffset, config.markPanelWidth - markWidthOffset])

    return xScale
  }

  function buildYScale (_extent) {
    const yScale = d3.scaleLinear()
      .domain(_extent)
      .rangeRound([config.chartHeight, 0])

    return yScale
  }

  function buildColorScale () {
    const ids = data.dataBySeries.map(getID)
    const colorScale = d3.scaleOrdinal()
      .range(config.colorSchema.map((d) => d.value))
      .domain(config.colorSchema.map((d, i) => ((typeof d.id === "undefined") ? ids[i] : d.id)))
      .unknown(config.defaultColor)

    return colorScale
  }

  function buildStyleScale () {
    const ids = data.dataBySeries.map(getID)
    const styleScale = d3.scaleOrdinal()
      .range(config.colorSchema.map((d) => d.style))
      .domain(config.colorSchema.map((d, i) => d.id || ids[i]))
      .unknown("solid")

    return styleScale
  }

  function buildMeasureNameLookup () {
    return d => {
      if (d === "x") {
        return data.dataBySeries[0].dimensionName
      } else if (d === "y") {
        const groupKey = data.groupKeys[LEFT_AXIS_GROUP_INDEX][0]
        const groupData = data.dataBySeries.find(ds => ds.id === groupKey)
        return groupData.measureName
      } else if (d === "y2") {
        const groupKey = data.groupKeys[RIGHT_AXIS_GROUP_INDEX][0]
        const groupData = data.dataBySeries.find(ds => ds.id === groupKey)
        return groupData.measureName
      } else {
        return data.dataBySeries[d] && data.dataBySeries[d].measureName
      }
    }
  }

  function buildChartTypeScale () {
    const ids = data.dataBySeries.map(getID)
    const chartTypeScale = d3.scaleOrdinal()
      .range(config.colorSchema.map((d) => d.type))
      .domain(config.colorSchema.map((d, i) => d.id || ids[i]))
      .unknown("line")

    return chartTypeScale
  }

  function splitByGroups () {
    const groups = {}
    data.dataBySeries.forEach((d) => {
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

  function getStackedScales () {
    const stack = data.stack(data.stackData)
    const allKeys = data.allKeyTotals.map(getKey)

    const xScale = buildXScale(allKeys)
    const colorScale = buildColorScale()
    const styleScale = buildStyleScale()
    const chartTypeScale = buildChartTypeScale()
    const measureNameLookup = buildMeasureNameLookup()

    let yDomain = null
    if (config.yDomain === "auto") {
      const valuesExtent = d3.extent(d3.merge(d3.merge(stack)))
      if (valuesExtent[0] < 0) {
        yDomain = valuesExtent
      } else {
        // force domain to 0 if domain min is positive
        yDomain = [0, valuesExtent[1]]
      }
    } else {
      yDomain = config.yDomain
    }

    const yDomainSign = getDomainSign(yDomain)
    if (yDomainSign === "--") {
      yDomain.reverse()
    }

    const yScale = buildYScale(yDomain)
    const y2Scale = null

    return {
      xScale,
      yScale,
      y2Scale,
      colorScale,
      styleScale,
      chartTypeScale,
      measureNameLookup,
      yDomainSign
    }
  }

  function validateDomain (domain) {
    if (typeof domain[0] === "undefined" || typeof domain[1] === "undefined") {
      return [0, 0]
    } else {
      return domain
    }
  }

  function getHorizontalScales () {
    const groups = splitByGroups()
    const groupKeys = Object.keys(groups) || []
    const allKeys = data.allKeyTotals.map(getKey)

    const hasLeftAxis = groupKeys.indexOf(LEFT_AXIS_GROUP_INDEX) > -1
    const hasRightAxis = groupKeys.indexOf(RIGHT_AXIS_GROUP_INDEX) > -1

    const xScale = buildXScale(allKeys)

    const colorScale = buildColorScale()
    const styleScale = buildStyleScale()
    const chartTypeScale = buildChartTypeScale()
    const measureNameLookup = buildMeasureNameLookup()

    let yDomainSign = "++"
    let y2DomainSign = "++"

    let yScale = null
    if (hasLeftAxis) {
      let yDomain = null
      if (config.yDomain === "auto") {
        const groupLeftAxis = groups[LEFT_AXIS_GROUP_INDEX]
        yDomain = d3.extent(groupLeftAxis.allValues)
      } else {
        yDomain = config.yDomain
      }

      yDomainSign = getDomainSign(yDomain)
      if (yDomainSign === "--") {
        yDomain.reverse()
      }

      yScale = buildYScale(validateDomain(yDomain))
    }

    let y2Scale = null
    if (hasRightAxis) {
      let y2Domain = null
      if (config.y2Domain === "auto") {
        const groupRightAxis = groups[RIGHT_AXIS_GROUP_INDEX]
        y2Domain = d3.extent(groupRightAxis.allValues)
      } else {
        y2Domain = config.y2Domain
      }

      y2DomainSign = getDomainSign(y2Domain)
      if (y2DomainSign === "--") {
        y2Domain.reverse()
      }

      y2Scale = buildYScale(y2Domain)
    }

    return {
      hasSecondAxis: hasRightAxis,
      yDomainSign,
      y2DomainSign,
      xScale,
      yScale,
      y2Scale,
      colorScale,
      styleScale,
      chartTypeScale,
      measureNameLookup
    }
  }

  function getScales () {
    if (config.chartType === "stackedBar"
      || config.chartType === "stackedArea") {
      return getStackedScales()
    } else {
      return getHorizontalScales()
    }
  }

  function setConfig (_config) {
    config = override(config, _config)
    return this
  }

  function setData (_data) {
    data = Object.assign({}, data, _data)
    return this
  }

  return {
    setConfig,
    setData,
    getScales
  }
}
