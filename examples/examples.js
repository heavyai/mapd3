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
  * @param {Array.<number>} [config.stringMinMaxLength=[4, 8]] Length of generated strings
  * @param {number} [config.randomStepSize=50] Random pixel range to step vertically between each generated points
  * @param {number} [config.nullRatio=null] Percentage of generated values that are null

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
  lineCount: 4,
  stringMinMaxLength: [5, 10],
  randomStepSize: 50,
  nullRatio: 10
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
  * @param {object} [config.margin=margin: {top: 48, right: 32, bottom: 48, left: 32}] Margin object
  * @param {string} [config.keyType="time"] Data type of x values: time, number, string
  * @param {string} [config.chartType="line"] The type of marks: line, area, stackedArea, bar, stacked bar
  * @param {string} [config.extractType=null] The type of date to convert to from a number corresponding to a date part: isodow, month, quarter, hour, minute
  * @param {function} [config.ease=d3.easeLinear] Axis transition easing
  * @param {boolean} [config.useScrolling=false] If using horizontal scrolling when the bar width gets under a threshold

  * @param {boolean} [config.isAnimated=false] If using animated opening
  * @param {number} [config.animationDuration=1500] Animated opening duration

  * <scale>
  * @param {Array.<string>} [config.colorSchema] List of {key, value} colors to use on marks
  * @param {string} [config.defaultColor="skyblue"] Color for marks that doesn't match anything on the colorSchema
  * @param {(Array.<number>|"auto")} [config.xDomain="auto"] Set X axis domain or "auto" for using data extent
  * @param {(Array.<number>|"auto")} [config.yDomain="auto"] Set Y axis domain or "auto" for using data extent
  * @param {(Array.<number>|"auto")} [config.yDomain="auto"] Set 2nd Y axis domain or "auto" for using data extent

  * <data>
  * @param {string} [config.sortBy = alphaAscending] Sorting of columns in stack bar: totalAscending, totalDescending, alphaAscending, alphaDescending
  * @param {boolean} [config.fillData=false] If replacing nulls with zeroes

  * <axis>
  * @param {number} [config.tickPadding=5] Padding between tick and tick label
  * @param {number} [config.tickSizes=5] Tick length
  * @param {string} [config.xTickSkip="auto"] Indication for number of X ticks or "auto"
  * @param {string} [config.yTicks="auto"] Indication for number of Y ticks or "auto"
  * @param {string} [config.y2Ticks="auto"] Indication for number of Y2 ticks or "auto"
  * @param {string|function} [config.xAxisFormat="auto"] Format string for the X axis, "auto" or a formatting function
  * @param {string} [config.yAxisFormat=".2f"] Format string for the Y axis, "auto" or a formatting function
  * @param {string} [config.y2AxisFormat=".2f"] Format string for the Y2 axis, "auto" or a formatting function
  * @param {string} [config.grid="horizontal"] Background grid: horizontal, vertical, full
  * @param {number} [config.axisTransitionDuration=0] Animated transition duration
  * @param {boolean} [config.labelsAreRotated=false] If x axis ticks should be rotated

  * <hover>
  * @param {string} [config.dotRadius=4] Radius of hover dots

  * <tooltip>
  * @param {string} [config.tooltipFormat=".2f"] Format string for the tooltip values, "auto" or a formatting function
  * @param {string} [config.tooltipTitleFormat=null] Format string for the tooltip title, "auto" or a formatting function
  * @param {string} [config.tooltipTitle=""] Tooltip title
  * @param {number} [config.mouseChaseDuration=0] Duration of lag between cursor and tooltip
  * @param {function} [config.tooltipEase=d3.easeQuadInOut] Easing function for the tooltip following
  * @param {boolean} [config.tooltipIsEnabled="true"] If tooltip is enabled

  <format>
  * @param {string} [config.dateFormat="%b %d, %Y"] Default format for brush range and tooltip dates
  * @param {string} [config.inputDateFormat="%m-%d-%Y"] Default format for domain input date
  * @param {number} [config.numberFormat=".2f"] Default format for brush range, domain input and axis numbers

  * <legend>
  * @param {number|string} [config.legendXPosition="auto"] Legend x position or "auto" to dock right
  * @param {number|string} [config.legendYPosition="auto"] Legend y position or "auto" to dock top
  * @param {string} [config.legendTitle=""] Legend title
  * @param {boolean} [config.legendIsEnabled=true] Enable legend

  * <binning>
  * @param {string} [config.binningResolution="1mo"] Selected resolution
  * @param {boolean} [config.binningIsAuto=true] If "Auto" is selected
  * @param {string} [config.binningToggles=["10y", "1y", "1q", "1mo"] List of bins to select
  * @param {boolean} [config.binningIsEnabled=true] Enable binning

  * <domain>
  * @param {boolean} [config.xLock=false] If x axis domain is locked
  * @param {boolean} [config.yLock=false] If y axis domain is locked
  * @param {boolean} [config.y2Lock=false] If y2 axis domain is locked
  * @param {boolean} [config.xDomainEditorIsEnabled=true] Enable x domain editing
  * @param {boolean} [config.yDomainEditorIsEnabled=true] Enable y domain editing
  * @param {boolean} [config.y2DomainEditorIsEnabled=true] Enable y2 domain editing

  * <brush range>
  * @param {object<Date>|number} [config.brushRangeMin=null] Brush min range to display and to set brush
  * @param {object<Date>|number} [config.brushRangeMax=null] Brush max range to display and to set brush
  * @param {boolean} [config.brushRangeIsEnabled=true] Enable brush range editor

  * <brush>
  * @param {boolean} [config.brushIsEnabled=true] Enable brush

  * <label>
  * @param {string} [config.xLabel=""] X axis label
  * @param {string} [config.yLabel=""] Y axis label
  * @param {string} [config.y2Label=""] Y2 axis label

  * <line>
  * @param {string} [config.dotsToShow="none"] Which dots to show on line chart, all, isolated, none

  * <bar>
  * @param {number} [config.barSpacingPercent="none"] Bar charts gutter width as a % of the bar width
  * @param {Array.<string>} [config.selectedKeys=[]] Dimming all bars except for those listed in this array. Empty = none dimmed

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
  extractType: null, // isodow, month, quarter, hour, minute
  ease: d3.easeLinear,
  useScrolling: false,

  // intro animation
  isAnimated: false,
  animationDuration: 1500,

  // scale
  colorSchema: palette,
  defaultColor: "skyblue",
  xDomain: "auto",
  yDomain: "auto",
  y2Domain: "auto",

  // data
  sortBy: "alphaAscending", // totalAscending, totalDescending, alphaAscending, alphaDescending
  fillData: false,

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
  labelsAreRotated: false,

  // hover
  dotRadius: 4,

  // tooltip
  tooltipFormat: ".2f",
  tooltipTitleFormat: null,
  mouseChaseDuration: 0,
  tooltipEase: d3.easeQuadInOut,
  tooltipHeight: 48,
  tooltipWidth: 160,
  tooltipIsEnabled: true,
  tooltipTitle: null,

  // format
  dateFormat: "%b %d, %Y",
  inputDateFormat: "%m-%d-%Y",
  numberFormat: ".2f",

  // legend
  legendXPosition: "auto",
  legendYPosition: "auto",
  legendTitle: "",
  legendIsEnabled: true,

  // binning
  binningResolution: "1mo",
  binningIsAuto: true,
  binningToggles: ["10y", "1y", "1q", "1mo"],
  binningIsEnabled: true,

  // domain
  xLock: false,
  yLock: false,
  y2Lock: false,
  xDomainEditorIsEnabled: true,
  yDomainEditorIsEnabled: true,
  y2DomainEditorIsEnabled: true,

  // brush range
  brushRangeMin: null,
  brushRangeMax: null,
  brushRangeIsEnabled: true,

  // brush
  brushIsEnabled: true,

  // label
  xLabel: "",
  yLabel: "",
  y2Label: "",

  // bar
  barSpacingPercent: 10,
  selectedKeys: [],

  // line
  dotsToShow: "none" // all, isolated, none
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

/**
  * Get access to the event manager
  * @name getEvents
  * @returns {object} The EventManager instance
  * @memberof Chart
  * @instance
  * @example
  * mapd3.Chart(document.querySelector('.chart'))
  * .getEvents()
  */

/**
  * Get access to all exposed events
  * @namespace EventManager
  * @name EventManager
  * @param {function} onBrush: brushStart, brushMove, brushEnd
  * @param {function} onBinning: change
  * @param {function} onDomainEditor: domainChange, domainLockToggle
  * @param {function} onBrushRangeEditor: rangeChange
  * @param {function} onLabel: axisLabelChange
  * @param {function} onHover: hover
  * @param {function} onPanel: mouseOverPanel, mouseOutPanel, mouseMovePanel
  */

/**
  * Brush events
  * @name onBrush
  * @param {string} [name] Event name: brushStart, brushMove, brushEnd
  * @param {function} [callback] Event callback

  * @returns {object} The event instance.
  * @memberof EventManager
  * @instance
  * @example
  * mapd3.Chart(document.querySelector('.chart'))
  * .getEvents()
  * .onBrush("brushStart", (d) => console.log(d))
  */
/**
  * Binning selector events
  * @name onBinning
  * @param {string} [name] Event name: change
  * @param {function} [callback] Event callback

  * @returns {object} The event instance.
  * @memberof EventManager
  * @instance
  */
/**
  * Domain editor events
  * @name onDomainEditor
  * @param {string} [name] Event name: domainChange, domainLockToggle
  * @param {function} [callback] Event callback

  * @returns {object} The event instance.
  * @memberof EventManager
  * @instance
  */
/**
  * Brush range editor events
  * @name onBrushRangeEditor
  * @param {string} [name] Event name: rangeChange
  * @param {function} [callback] Event callback

  * @returns {object} The event instance.
  * @memberof EventManager
  * @instance
  */
/**
  * Label editor events
  * @name onLabel
  * @param {string} [name] Event name: axisLabelChange
  * @param {function} [callback] Event callback

  * @returns {object} The event instance.
  * @memberof EventManager
  * @instance
  */
/**
  * Hover events
  * @name onHover
  * @param {string} [name] Event name: hover
  * @param {function} [callback] Event callback

  * @returns {object} The event instance.
  * @memberof EventManager
  * @instance
  */
/**
  * Panel mouse events
  * @name onPanel
  * @param {string} [name] Event name: mouseOverPanel, mouseOutPanel, mouseMovePanel
  * @param {function} [callback] Event callback

  * @returns {object} The event instance.
  * @memberof EventManager
  * @instance
  */

chart.getEvents()
  .onBrush("brushStart", (d) => console.log(d))
  .onBrush("brushMove", (d) => console.log(d))
  .onBrush("brushEnd", (d) => console.log(d))
  .onBrush("brushClear", (d) => console.log(d))
  .onBinning("change", (d) => console.log(d))
  .onDomainEditor("domainChange", (d) => console.log(d))
  .onDomainEditor("domainLockToggle", (d) => console.log(d))
  .onBrushRangeEditor("rangeChange", (d) => console.log(d))
  .onLabel("axisLabelChange", (d) => console.log(d))
  .onHover("hover", (d) => console.log(d))
  .onPanel("mouseOverPanel", (d) => console.log(d))
  .onPanel("mouseOutPanel", (d) => console.log(d))
  .onPanel("mouseMovePanel", (d) => console.log(d))
