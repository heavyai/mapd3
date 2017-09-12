define(() => {

  const axisTimeCombinations = {
    MINUTE_HOUR: "minute-hour",
    HOUR_DAY: "hour-daymonth",
    DAY_MONTH: "day-month",
    MONTH_YEAR: "month-year"
  }

  const timeBenchmarks = {
    ONE_AND_A_HALF_YEARS: 47304000000,
    ONE_YEAR: 31536000365,
    ONE_DAY: 86400001
  }

  const keys = {
    DATE_KEY: "date",
    VALUE_KEY: "value",
    ID_KEY: "id",
    LABEL_KEY: "label",
    GROUP_KEY: "group",
    VALUES_KEY: "values",
    SERIES_KEY: "series"
  }

  return {
    keys,
    axisTimeCombinations,
    timeBenchmarks,
    lineGradientId: "lineGradientId"
  }
})

