define((require) => {
  "use strict"

  const d3Random = require("d3-random")
  const {timeDay, timeMonth} = require("d3-time")
  const {keys} = require("./helpers/constants")

  return function dataManager () {

    const VALUE_RANGE = 100
    const cache = {
      data: null,
      baseDate: null
    }

    function generateSeries (_range, isTime) {
      cache.baseDate = new Date()
      const dateRange = timeDay.range(timeMonth.floor(cache.baseDate), timeMonth.ceil(cache.baseDate))
      let value = 0
      const rnd = d3Random.randomNormal(0, 1)
      const STEP_RATIO = 100
      const STEP = _range / STEP_RATIO
      return dateRange.map((d, i) => {
        value = value + rnd() * STEP
        return {
          value,
          key: isTime ? d.toISOString() : (10 + i).toString(36)
        }
      })
    }

    function generateTestDataset (isTime) {
      cache.data = {
        series: [
          {
            label: "line A",
            id: 1,
            group: 1,
            values: generateSeries(VALUE_RANGE, isTime)
          },
          {
            label: "line B",
            id: 2,
            group: 1,
            values: generateSeries(VALUE_RANGE, isTime)
          },
          {
            label: "line C",
            id: 3,
            group: 2,
            values: generateSeries(VALUE_RANGE * 2, isTime)
          }
        ]
      }

      return cache.data
    }

    function filterByKey (_extent) {
      const data = JSON.parse(JSON.stringify(cache.data))

      data[keys.SERIES_KEY].forEach((series) => {
        const values = series[keys.VALUES_KEY]
        const allKeys = values.map(d => d[keys.DATA_KEY])
        const extentMinIndex = allKeys.indexOf(_extent[0])
        const extentMaxIndex = allKeys.indexOf(_extent[1])
        series[keys.VALUES_KEY] = series[keys.VALUES_KEY].slice(extentMinIndex, extentMaxIndex)
      })

      return data
    }

    function filterByDate (_dateExtent) {
      const data = JSON.parse(JSON.stringify(cache.data))

      data[keys.SERIES_KEY].forEach((series) => {
        series[keys.VALUES_KEY] = series[keys.VALUES_KEY].filter((d) => {
          const epoch = new Date(d[keys.DATA_KEY]).getTime()
          return epoch >= _dateExtent[0].getTime()
            && epoch <= _dateExtent[1].getTime()
        })
      })

      return data
    }

    return {
      generateTestDataset,
      generateSeries,
      filterByDate,
      filterByKey
    }
  }
})
