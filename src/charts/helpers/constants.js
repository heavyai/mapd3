import * as d3 from "./d3-service"

export const keys = {
  KEY: "x",
  VALUE: "y",
  ABSOLUTEVAL: "absoluteval",
  COUNTVAL: "countval",
  ID: "id",
  LABEL: "label",
  GROUP: "group",
  VALUES: "values",
  SERIES: "series"
}

export const dotsToShow = {
  ALL: "all",
  NONE: "none",
  ISOLATED: "isolated"
}

export const LEFT_AXIS_GROUP_INDEX = "0"
export const RIGHT_AXIS_GROUP_INDEX = "1"

export const dashStylesTranslation = {
  dashes: "4, 3",
  solid: null,
  dotted: "1 4"
}

export const MIN_MARK_WIDTH = 20
export const MAX_MARK_WIDTH = 200

export const comparators = {
  TOTAL_ASCENDING: "totalAscending",
  TOTAL_DESCENDING: "totalDescending",
  ALPHA_ASCENDING: "alphaAscending",
  ALPHA_DESCENDING: "alphaDescending",
  COUNTVAL_ASCENDING: "countvalAscending",
  COUNTVAL_DESCENDING: "countvalDescending"
}

export const stackOffset = {
  NONE: "stackOffsetNone",
  PERCENT: "stackOffsetExpand",
  STREAMGRAPH: "stackOffsetWiggle",
  CENTERED: "stackOffsetSilhouette",
  POSITIVE_NEGATIVE: "stackOffsetDiverging"
}

export const d3TimeTranslation = {
  "1c": d3.utcYear.round,
  "10y": d3.utcYear.round,
  "1y": d3.utcYear.round,
  "1q": d3.utcMonth.round,
  "1mo": d3.utcMonth.round,
  "1s": d3.utcSecond.round,
  "1m": d3.utcMinute.round,
  "1h": d3.utcHour.round,
  "1d": d3.utcDay.round,
  "1w": d3.utcWeek.round
}
