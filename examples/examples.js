/**
  * A data generator for MapD3 charts
  * @namespace DataManager
  * @name DataManager
  * @returns {object} The dataManager instance.
  * @example
  * mapd3.DataManager()
  *   .setConfig({
  *     keyType: "time",
  *     range: [0, 100],
  *     pointCount: 200,
  *     groupCount: 2,
  *     lineCount: 4
  *   })
  *   .generateTestDataset()
 */

const keyType = "number" // time, number, string
const chartType = "line" // line, area, stackedArea

const dataManager = mapd3.DataManager()

/**
  * Configure the data manager
  * @name setConfig
  * @param {object} config A config object.
  * @param {string} [config.keyType="number"] The x axis type: number, string, time
  * @param {Array.<number>} [config.range=[0, 100]] The value range
  * @param {number} [config.pointCount=200] The number of points
  * @param {number} [config.groupCount=2] The number of groups, 2 for adding a y2 axis
  * @param {number} [config.lineCount=4] The number of lines

  * @returns {object} The dataManager instance.
  * @memberof DataManager
  * @instance
  * @example
  * mapd3.DataManager()
  *   .setConfig({
  *     keyType,
  *     range: [0, 100],
  *     pointCount: 200,
  *     groupCount: 2,
  *     lineCount: 4
  *   })
  */
dataManager.setConfig({
  keyType,
  range: [0, 100],
  pointCount: 2000,
  groupCount: 1,
  lineCount: 4
})

/**
  * Generate some test data
  * @name generateTestDataset

  * @returns {object} A data object
  * @memberof DataManager
  * @instance
  * @example
  * mapd3.DataManager()
  *   .setConfig({
  *     keyType: "time",
  *     range: [0, 100],
  *     pointCount: 200,
  *     groupCount: 2,
  *     lineCount: 4
  *   })
  *   .generateTestDataset()
  *
  * {
  *   "series": [{
  *       "label": "Label 0",
  *       "id": 0,
  *       "group": 0,
  *       "values": [{
  *           "value": 16.85,
  *           "key": "2017-11-07T05:00:00.000Z"
  *       }, {
  *           "value": 17.94,
  *           "key": "2017-11-08T05:00:00.000Z"
  *       }, {
  *           "value": 19.03,
  *           "key": "2017-11-09T05:00:00.000Z"
  *       }, {
  *           "value": 18.97,
  *           "key": "2017-11-10T05:00:00.000Z"
  *       }]
  *   }, {
  *       "label": "Label 1",
  *       "id": 1,
  *       "group": 1,
  *       "values": [{
  *           "value": 13.31,
  *           "key": "2017-11-07T05:00:00.000Z"
  *       }, {
  *           "value": 13.15,
  *           "key": "2017-11-08T05:00:00.000Z"
  *       }, {
  *           "value": 15.76,
  *           "key": "2017-11-09T05:00:00.000Z"
  *       }, {
  *           "value": 17.74,
  *           "key": "2017-11-10T05:00:00.000Z"
  *       }]
  *   }]
  * }
  *
  */
const data = dataManager.generateTestDataset()

/**
 * A base chart for line/area/stacked area/bar/stacked bar charts.
 * @namespace Chart
 * @name Chart
 * @param {object} container The DOM element or selector for the container
 * @returns {object} The chart instance.
 * @example
 * mapd3.Chart(document.querySelector('.chart'))
 *    .setConfig({
 *      width: 800,
 *      height: 400,
 *      keyType: "time",
 *      chartType: "line"
 *    })
 *    .setData(data)
 */
const chart = mapd3.Chart(document.querySelector(".chart1"))

/**
  * Configure the chart
  * @name setConfig
  * @param {object} config A config object.
  * @param {number} [config.width=800] Outer chart width, including margins
  * @param {number} [config.height=500] Outer chart height, including margins
  * @param {.<string, number>} [config.margin=margin: {top: 48, right: 32, bottom: 48, left: 32}] Margin object
  * @param {string} [config.keyType="time"] Data type of x values: time, number, string
  * @param {string} [config.chartType="line"] The type of marks: line, area, stackedArea, bar, stacked bar

  * @param {boolean} [config.isAnimated=false] If using animated opening
  * @param {number} [config.animationDuration=1500] Animated opening duration

  * <scale>
  * @param {Array.<string>} [config.colorSchema] List of {key, value} colors to use on marks
  * @param {string} [config.defaultColor="skyblue"] Color for marks that doesn't match anything on the colorSchema
  * @param {(Array.<number>|"auto")} [config.xDomain="auto"] Set X axis domain or "auto" for using data extent
  * @param {(Array.<number>|"auto")} [config.yDomain="auto"] Set Y axis domain or "auto" for using data extent
  * @param {(Array.<number>|"auto")} [config.yDomain="auto"] Set 2nd Y axis domain or "auto" for using data extent

  * <axis>
  * @param {number} [config.tickPadding=5] Padding between tick and tick label
  * @param {number} [config.tickSizes=5] Tick length
  * @param {string} [config.xTickSkip="auto"] Indication for number of X ticks or "auto"
  * @param {string} [config.yTicks="auto"] Indication for number of Y ticks or "auto"
  * @param {string} [config.y2Ticks="auto"] Indication for number of Y2 ticks or "auto"
  * @param {string} [config.xAxisFormat="auto"] Format string for the X axis or "auto"
  * @param {string} [config.yAxisFormat=".2f"] Format string for the Y axis
  * @param {string} [config.y2AxisFormat=".2f"] Format string for the Y2 axis
  * @param {string} [config.grid="horizontal"] Background grid: horizontal, vertical, full
  * @param {number} [config.axisTransitionDuration=0] Animated transition duration

  * <hover>
  * @param {string} [config.dotRadius=4] Radius of hover dots

  * <tooltip>
  * @param {string} [config.valueFormat=".2f"] Format string for values in tooltip/legend
  * @param {number} [config.mouseChaseDuration=0] Duration of lag between cursor and tooltip
  * @param {string} [config.dateFormat="%b %d, %Y"] Format string for title when it's a date

  * <legend>
  * @param {number|string} [config.legendXPosition="auto"] Legend x position or "auto" to dock right
  * @param {number|string} [config.legendYPosition="auto"] Legend y position or "auto" to dock top
  * @param {string} [config.legendTitle="Dataset"] Legend title
  * @param {boolean} [config.legendIsEnabled=true] Enable legend

  * <binning>
  * @param {string} [config.binningResolution="1mo"] Selected resolution
  * @param {boolean} [config.binningIsAuto=true] If "Auto" is selected
  * @param {string} [config.binningToggles=["10y", "1y", "1q", "1mo"] List of bins to select
  * @param {boolean} [config.binningIsEnabled=true] Enable binning

  * <domain>
  * @param {string} [config.xDomainEditorFormat="%b %d, %Y"] Format string for x domain editor
  * @param {string} [config.yDomainEditorFormat=".2f"] Format string for y domain editor
  * @param {string} [config.y2DomainEditorFormat=".2f"] Format string for y domain editor
  * @param {boolean} [config.domainEditorIsEnabled=true] Enable domain editing

  * <brush range>
  * @param {object<Date>|number} [config.brushRangeMin="Jan 01, 2001"] Brush min range to display and to set brush
  * @param {object<Date>|number} [config.brushRangeMax="Jan 02, 2002"] Brush max range to display and to set brush
  * @param {boolean} [config.brushRangeIsEnabled=true] Enable brush range editor

  * <brush>
  * @param {boolean} [config.brushIsEnabled=true] Enable brush

  * <label>
  * @param {string} [config.xLabel="X Axis Label"] X axis label
  * @param {string} [config.yLabel="Y Axis Label"] Y axis label
  * @param {string} [config.y2Label="Y2 Axis Label"] Y2 axis label

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
  // common
  width: 800,
  height: 400,
  margin: {
    top: 32,
    right: 70,
    bottom: 64,
    left: 70
  },
  keyType, // time, number, string
  chartType, // line, area, stackedArea, bar, stackedBar

  // intro animation
  isAnimated: false,
  animationDuration: 1500,

  // scale
  colorSchema: palette,
  defaultColor: "skyblue",
  xDomain: "auto",
  yDomain: "auto",
  y2Domain: "auto",

  // axis
  tickPadding: 5,
  tickSizes: 8,
  yTicks: "auto",
  y2Ticks: "auto",
  xTickSkip: "auto",
  xAxisFormat: "auto",
  yAxisFormat: ".2f",
  y2AxisFormat: ".2f",
  grid: "horizontal",
  axisTransitionDuration: 0,

  // hover
  dotRadius: 4,

  // tooltip
  valueFormat: ".2f",
  mouseChaseDuration: 0,
  tooltipHeight: 48,
  tooltipWidth: 160,
  dateFormat: "%b %d, %Y",

  // legend
  legendXPosition: "auto",
  legendYPosition: "auto",
  legendTitle: "Dataset",
  legendIsEnabled: true,

  // binning
  binningResolution: "1mo",
  binningIsAuto: true,
  binningToggles: ["10y", "1y", "1q", "1mo"],
  binningIsEnabled: true,

  // domain
  domainEditorIsEnabled: true,
  xDomainEditorFormat: "%b %d, %Y",
  yDomainEditorFormat: ".2f",
  y2DomainEditorFormat: ".2f",

  // brush range
  brushRangeMin: "Jan 01, 2001",
  brushRangeMax: "Jan 02, 2002",
  brushRangeIsEnabled: true,

  // brush
  brushIsEnabled: true,

  // label
  xLabel: "X Axis Label",
  yLabel: "Y Axis Label",
  y2Label: "Y2 Axis Label"
})

/**
  * Set data and render
  * @name setData
  * @returns {object} The chart instance.
  * @memberof Chart
  * @instance
  * @example
  * mapd3.Chart(document.querySelector('.chart'))
  * .setData(data)
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
chart.render()
