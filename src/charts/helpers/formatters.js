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

export function autoFormat (extent, format) {
  const max = extent[1]
  const min = extent[0]
  if ((max - min) <= 0.02) {
    format = ".4f"
  } else if ((max - min) <= 0.2) {
    format = ".3f"
  } else if ((max - min) <= 1.1) {
    format = ".2f"
  } else if ((max - min) <= 100) {
    format = ".1f"
  } else if ((max - min) <= 1000) {
    format = ".0f"
  } else if ((max - min) <= 100000) {
    format = ".2s"
  } else {
    format = ".2s"
  }
  return format
}

// slightly modified version of d3's default time-formatting to always use abbrev month names
const formatMillisecond = d3.timeFormat(".%L");
const formatSecond = d3.timeFormat(":%S");
const formatMinute = d3.timeFormat("%I:%M");
const formatHour = d3.timeFormat("%I %p");
const formatDay = d3.timeFormat("%a %d");
const formatWeek = d3.timeFormat("%b %d");
const formatMonth = d3.timeFormat("%b");
const formatYear = d3.timeFormat("%Y");

/**
 * auto formats a date obj to a string using d3-time-format
 * @param {Date} date object to format
 * @returns {string} date string
*/
export function multiFormat(date) {
  return (d3.timeSecond(date) < date ? formatMillisecond
      : d3.timeMinute(date) < date ? formatSecond
      : d3.timeHour(date) < date ? formatMinute
      : d3.timeDay(date) < date ? formatHour
      : d3.timeMonth(date) < date ? (d3.timeWeek(date) < date ? formatDay : formatWeek)
      : d3.timeYear(date) < date ? formatMonth
      : formatYear)(date);
}

/**
 *  Format dates when binned by quarter, decade, century
*/

function formatQuarter(val) {
  val = d3.utcFormat('%m')(val) // convert to integer month (01 - 12)
  return `Q${Math.floor((parseInt(val, 10) + 3) / 3)}`;
}

export function formatOddDateBin(specifier, val) {
  switch (specifier) {
    case "1c":
      return
    case "10y":
      return
    case "1q":
      return formatQuarter(val)
    default:
      return
  }
}
