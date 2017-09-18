define((require) => {
  "use strict"

  const d3Array = require("d3-array")
  const d3Random = require("d3-random")
  const {timeDay, timeMonth} = require("d3-time")
  const {keys} = require("./helpers/constants")

  return function dataManager () {

    const VALUE_RANGE = 100
    const POINT_COUNT = 30
    const cache = {
      data: null,
      baseDate: null
    }

    function generateRandomString (count) {
      return Math.random().toString(36).replace(/[^a-z0-9]+/g, "").substr(0, count || 5)
    }

    function generateRandomNumber (count) {
      return Math.floor(Math.random() * 100)
    }

    function generateSeries (_dataKeys, _range, _isTime, _allowNegative) {
      let value = 0
      const rnd = d3Random.randomNormal(0, 1)
      const STEP_RATIO = 100
      const STEP = _range / STEP_RATIO
      return _dataKeys.map((d) => {
        value = value + rnd() * STEP
        if (!_allowNegative && value < STEP) {
          value = value + (rnd() + 3) * STEP
        }
        return {
          value,
          key: _isTime ? d.toISOString() : d
        }
      })
    }

    function generateTestDataset (_isTime) {
      let dataKeys = null
      if (_isTime) {
        cache.baseDate = new Date()
        dataKeys = timeDay.range(timeMonth.floor(cache.baseDate), timeMonth.ceil(cache.baseDate))
      } else {
        dataKeys = d3Array.range(0, POINT_COUNT).map(() => generateRandomString())
        // dataKeys = d3Array.range(0, POINT_COUNT).map(() => generateRandomNumber().toString())
      }

      cache.data = {
        series: [
          {
            label: "line A",
            id: 1,
            group: 1,
            values: generateSeries(dataKeys, VALUE_RANGE, _isTime)
          },
          {
            label: "line B",
            id: 2,
            group: 1,
            values: generateSeries(dataKeys, VALUE_RANGE, _isTime)
          },
          {
            label: "line C",
            id: 3,
            group: 1,
            values: generateSeries(dataKeys, VALUE_RANGE * 2, _isTime)
          }
        ]
      }

      console.log(cache.data)

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
