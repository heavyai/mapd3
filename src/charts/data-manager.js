define((require) => {
  "use strict"

  const d3Random = require("d3-random")

  const {timeDay, timeMonth} = require("d3-time")

  return function dataManager () {

    const VALUE_RANGE = 100
    const cache = {
      data: null,
      baseDate: null
    }

    function generateSeries (_range) {
      cache.baseDate = new Date()
      const dateRange = timeDay.range(timeMonth.floor(cache.baseDate), timeMonth.ceil(cache.baseDate))
      let value = 0
      const rnd = d3Random.randomNormal(0, 1)
      const STEP_RATIO = 100
      const STEP = _range / STEP_RATIO
      return dateRange.map((d) => {
        value = value + rnd() * STEP
        return {
          value,
          date: d.toISOString()
        }
      })
    }

    function generateTestDataset () {
      cache.data = {
        series: [
          {
            label: "line A",
            id: 1,
            group: 1,
            values: generateSeries(VALUE_RANGE)
          },
          {
            label: "line B",
            id: 2,
            group: 1,
            values: generateSeries(VALUE_RANGE)
          },
          {
            label: "line C",
            id: 3,
            group: 2,
            values: generateSeries(VALUE_RANGE * 2)
          }
        ]
      }

      return cache.data
    }

    function filterByDate (_dateExtent) {
      const data = JSON.parse(JSON.stringify(cache.data))
      data.series.forEach((series) => {
        series.values = series.values.filter((d) => {
          const epoch = new Date(d.date).getTime()
          return epoch >= _dateExtent[0].getTime()
            && epoch <= _dateExtent[1].getTime()
        })
      })

      return data
    }

    return {
      generateTestDataset,
      generateSeries,
      filterByDate
    }
  }
})
