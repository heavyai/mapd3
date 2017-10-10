/*
to do:
  - on
  - destroy
  - tooltip
  - brush
  - dataManager
*/

const keyType = "number" // time, number, string
const chartType = "line" // line, area, stackedArea

const dataManager = mapd3.DataManager()
    .setConfig({
      keyType,
      range: [0, 100],
      pointCount: 100,
      groupCount: 2
    })
const data = dataManager.generateTestDataset()

/**
 * A base chart for line/area/stacked charts.
 * @namespace Chart
 * @name Chart
 * @param {object} container The DOM element or selector for the container
 * @returns {object} The chart instance.
 * @example
 * mapd3.Chart(document.querySelector('.chart'))
 */
const chart = mapd3.Chart(document.querySelector(".chart1"))

/**
 * Configure the chart
 * @name setConfig
 * @param {object} config A config object.
 * @param {string} config.keyType Data type of x values: time, number, string
 * @param {string} config.chartType The type of marks: line, area, stackedArea
 * @param {number} config.width Outer chart width, including margins
 * @param {number} config.height Outer chart height, including margins
 * @param {object} config.margin Margin object {top, right, bottom, left}
 * @param {string} config.grid Grid visibility: horizontal, vertical, full
 * @param {string} config.xAxisFormat d3-format string for x axis
 * @param {string} config.yAxisFormat d3-format string for y axis
 * @param {string} config.yTicks Suggestion for the number of y ticks
 * @param {Array.<string>} config.colorSchema List of {key, value} colors to use on marks
 * @param {number} config.tickSkip The number of ticks to skip to simplify the x axis
 * @returns {object} The chart instance.
 * @memberof Chart
 * @instance
 * @example
 * mapd3.Chart(document.querySelector('.chart'))
 * .setConfig({
 *     width: 100
 * })
 */
chart.setConfig({
  width: 800,
  height: 400,
  margin: {
    top: 8,
    right: 32,
    bottom: 32,
    left: 32
  },
  grid: "horizontal",
  xAxisFormat: "%x",
  yAxisFormat: ".1f",
  yTicks: 5,
  colorSchema: mapd3.colors.mapdColors.map((d, i) => ({key: i, value: d})),
  keyType,
  chartType,
  tickSkip: 20
})

/**
 * Set the data
 * @name setData
 * @param {object} data The data object.
 * @returns {object} The chart instance.
 * @memberof Chart
 * @instance
 * @example
 * mapd3.Chart(document.querySelector('.chart'))
 * .setData({
 *   "series": [{
 *     "label": "line A",
 *     "id": 1,
 *      "group": 1,
 *      "values": [{
 *          "value": 3.7868887622782648,
 *          "key": 0
 *      }]
 *  }, {
 *      "label": "line B",
 *      "id": 2,
 *      "group": 1,
 *      "values": [{
 *          "value": 56.994525844854344,
 *          "key": 0
 *      }]
 *  }, {
 *      "label": "line C",
 *      "id": 3,
 *      "group": 2,
 *      "values": [{
 *          "value": 10.118456503844255,
 *          "key": 0
 *      }]
 *  }]
 *})
 */

chart.setData(data)


/**
 * Forces a render, for example after using setConfig.
 * Automatically called by setData, Uses cached data.
 * @name render
 * @returns {object} The chart instance.
 * @memberof Chart
 * @instance
 * @example
 * mapd3.Chart(document.querySelector('.chart'))
 * .setConfig({width: 100})
 * .render()
 */
chart.setConfig({width: 700})
  .render()

/**
 * A simple tooltip.
 * @namespace Tooltip
 * @name Tooltip
 * @param {object} chart The chart object to apply the tooltip to
 * @returns {object} The tooltip instance.
 * @example
 * var chart = mapd3.Chart(document.querySelector('.chart'))
 * mapd3.Tooltip(chart)
 */
mapd3.Tooltip(chart)

/**
 * Some hover marks.
 * @namespace Hover
 * @name Hover
 * @param {object} chart The chart object to apply the hover to
 * @returns {object} The hover instance.
 * @example
 * var chart = mapd3.Chart(document.querySelector('.chart'))
 * mapd3.Hover(chart)
 */
mapd3.Hover(chart1)
