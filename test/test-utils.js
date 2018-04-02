import DataManager from "../src/charts/data-manager"

export const baseConfig = {
  // common
  margin: {
    top: 48,
    right: 32,
    bottom: 48,
    left: 32
  },
  width: 800,
  height: 500,
  keyType: "time",
  chartId: "1234",
  chartType: "line", // line, area, stackedLine, stackedArea
  extractType: null, // isodow, month, quarter, hour, minute
  useScrolling: false,

  // intro animation
  isAnimated: false,
  animationDuration: 1500,

  // scale
  colorSchema: [{key: "a", value: "red", style: "dotted"}],
  defaultColor: "skyblue",
  xDomain: "auto",
  yDomain: "auto",
  y2Domain: "auto",

  // axis
  tickPadding: 5,
  xAxisFormat: "auto",
  yAxisFormat: ".2f",
  y2AxisFormat: ".2f",
  tickSizes: 8,
  yTicks: "auto",
  y2Ticks: "auto",
  xTickSkip: 0,
  grid: null,
  axisTransitionDuration: 0,
  labelsAreRotated: false,

  // data
  sortBy: null,

  xTitle: "",
  yTitle: "",

  // hover
  dotRadius: 4,

  // tooltip
  mouseChaseDuration: 0,
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
  barSpacingPercent: 10
}

export function generateComponentData (_config) {
  const baseDataConfig = {
    keyType: "time",
    range: [0, 100],
    pointCount: 200,
    groupCount: 2,
    lineCount: 2
  }

  const config = Object.assign({}, baseDataConfig, _config)

  const dataManager = DataManager()
    .setConfig(config)
  const inputData = dataManager.generateTestDataset()
  const cleanData = dataManager.cleanData(inputData, config.keyType)

  return cleanData
}
