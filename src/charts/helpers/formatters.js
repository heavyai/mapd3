import * as d3 from "./d3-service"

const DAYS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun"
]

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
]

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"]

const HOURS = [
  "12AM", "1AM", "2AM", "3AM", "4AM", "5AM",
  "6AM", "7AM", "8AM", "9AM", "10AM", "11AM",
  "12PM", "1PM", "2PM", "3PM", "4PM", "5PM",
  "6PM", "7PM", "8PM", "9PM", "10PM", "11PM"
]

export function getExtractFormatter (extractType) {
  switch (extractType) {
  case "isodow":
    return ((d) => DAYS[d - 1])
  case "month":
    return ((d) => MONTHS[d - 1])
  case "quarter":
    return ((d) => QUARTERS[d - 1])
  case "hour":
    return ((d) => HOURS[d])
  case "minute":
    return ((d) => d + 1)
  default:
    return ((d) => d)
  }
}

export function autoFormat (extent) {
  const max = extent[1]
  const min = extent[0]
  let formatter = (d => d)
  if (Math.abs(max) < 1000) {
    if ((max - min) <= 0.02) {
      formatter = d3.format(".4f")
    } else if ((max - min) <= 0.2) {
      formatter = d3.format(".3f")
    } else if ((max - min) <= 1.1) {
      formatter = d3.format(".2f")
    } else if ((max - min) < 100) {
      formatter = d3.format(".1f")
    } else if ((max - min) < 1000) {
      formatter = d3.format(".0f")
    }
  } else {
    formatter = d => {
      const abs = Math.abs(d)
      if (abs < 1000) {
        return d3.format(",.2f")(d)
      } else {
        return d3.format(",.2s")(d)
      }
    }
  }
  return formatter
}

// slightly modified version of d3's default time-formatting to always use abbrev month names and in UTC
const formatMillisecond = d3.utcFormat(".%L")
const formatSecond = d3.utcFormat(":%S")
const formatMinute = d3.utcFormat("%I:%M")
const formatHour = d3.utcFormat("%I %p")
const formatDay = d3.utcFormat("%a %d")
const formatWeek = d3.utcFormat("%b %d")
const formatMonth = d3.utcFormat("%b")
const formatYear = d3.utcFormat("%Y")

/**
 * auto formats a date obj to a string using d3-time-format
 * @param {Date} date object to format
 * @returns {string} date string
*/
export function multiFormat (date) {
  /* eslint-disable no-nested-ternary */
  return (d3.utcSecond(date) < date ? formatMillisecond
    : d3.utcMinute(date) < date ? formatSecond
      : d3.utcHour(date) < date ? formatMinute
        : d3.utcDay(date) < date ? formatHour
          : d3.utcMonth(date) < date ? (d3.utcWeek(date) < date ? formatDay : formatWeek)
            : d3.utcYear(date) < date ? formatMonth
              : formatYear)(date)
  /* eslint-enable no-nested-ternary */
}

/**
 *  Format dates when binned by quarter, decade, century
*/
export function formatOddDateBin (specifier, value) {
  switch (specifier) {
  // reproducing the old line chart behavior, even if it's wrong
  case "1w":
    return `${d3.utcFormat("%b %d")(value)} - ${d3.utcFormat("%b %d,")(d3.utcDay.offset(value, 6))}`
  case "1c":
    return `${d3.utcFormat("%Y")(value)} - ${d3.utcFormat("%Y")(d3.utcYear.offset(value, 99))}`
  case "10y":
    return `${d3.utcFormat("%Y")(value)} - ${d3.utcFormat("%Y")(d3.utcYear.offset(value, 9))}`
  case "1q":
    const monthNumber = d3.utcFormat("%m")(value) // convert to integer month (01 - 12)
    return `Q${Math.floor((parseInt(monthNumber, 10) + 3) / 3)} ${d3.utcFormat("%Y")(value)}`
  default:
    return value
  }
}

// translate bin from human readable code to d3 time format specifier
export const binTranslation = {
  "1y": "%Y",
  "1mo": "%b %Y",
  "1s": "%b %d, %Y %H:%M:%S",
  "1m": "%b %d, %Y %H:%M",
  "1h": "%b %d, %Y %H:%M",
  "1d": "%b %d, %Y"
}

export function formatTooltipNumber (d) {
  if (d === null) {
    return "null"
  }
  // tooltip use en-us locale format
  return d.toLocaleString("en-us")
}

export function formatPercentage (format) {
  if (format === "auto") {
    return d3.format(".0%")
  } else {
    return d3.format(format)
  }
}
