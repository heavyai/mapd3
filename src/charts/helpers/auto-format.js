import * as d3 from "./d3-service"
// import { all, has } from "ramda"

/* eslint-disable no-magic-numbers */
const prefixTranslation = {
  k: Math.pow(10, 3),
  K: Math.pow(10, 3),
  m: Math.pow(10, 6),
  M: Math.pow(10, 6),
  g: Math.pow(10, 9),
  G: Math.pow(10, 9),
  t: Math.pow(10, 12),
  T: Math.pow(10, 12)
}
// /* eslint-enable no-magic-numbers */
// function validateFormat(format) {
//   // valid d3-format characters
//   const hasOnlyValidCharacters = /^[-$+,.efsrpd%(0-9kKmMgGtT]+$/.test(format)
//   // no invalid formats with duplicated valid characters like `.2ff`
//   const hasNonRepeatingCharacters = !/([a-zA-Z]).*?\1/.test(format)
//   return hasOnlyValidCharacters && hasNonRepeatingCharacters
// }

// function applyNumberFormatWithSuffix(tokens, value) {
//   if (
//     validateFormat(tokens[0]) &&
//     tokens.length === 2 &&
//     has(tokens[1], prefixTranslation)
//   ) {
//     try {
//       return d3v4.formatPrefix(tokens[0], prefixTranslation[tokens[1]])(value)
//     } catch (e) {
//       // eslint-disable-next-line no-console
//       console.warn(e)
//       return value
//     }
//   } else {
//     return value
//   }
// }

// function applyNumberFormat(format, value) {
//   try {
//     return validateFormat(format) ? d3v4.format(format)(value) : value
//   } catch (e) {
//     // eslint-disable-next-line no-console
//     console.warn(e)
//     return value
//   }
// }

function applyNumberFormat(format, value) {
  try {
    return d3.format(format)(value)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("Invalid format", format)
    return value
  }
}

function applyNumberFormatWithSuffix(tokens, value) {
  if (
    tokens.length === 2 &&
    prefixTranslation[tokens[1]]
  ) {
    try {
      return d3.formatPrefix(tokens[0], prefixTranslation[tokens[1]])(value)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Invalid format", tokens)
      return value
    }
  } else {
    return value
  }
}

function formatPrefixSuffix(format, value) {
  // format like `foo {.2f} bar`
  const tokens = format.split(/[{}]/)
  const d3FormatToken = tokens[1]
  const d3FormattedValue = applyNumberFormat(d3FormatToken, value)
  return `${tokens[0]}${d3FormattedValue}${tokens[2]}`
}

function formatForcedSuffix(format, value) {
  // format like `.2f|k`
  const tokens = format.split("|")
  return applyNumberFormatWithSuffix(tokens, value)
}

// export function formatterUsingIndex(measureFormats) {
//   const measuresWithFormat = measureFormats.map(d => d.key)
//   if (measuresWithFormat.length) {
//     return (value, key) => {
//       const formatIndex = measuresWithFormat.indexOf(key)
//       if (!key && measuresWithFormat.length === 1) {
//         const format = measureFormats[0].format
//         return formatNumber(format, value)
//       } else if (formatIndex > -1 && typeof value === "number") {
//         const format = measureFormats[formatIndex].format
//         return formatNumber(format, value)
//       } else {
//         return value
//       }
//     }
//   } else {
//     return null
//   }
// }

// export function formatterWithArray(format) {
//   if (format) {
//     return value => {
//       if (format && typeof value === "number") {
//         return formatNumber(format, value)
//       } else if (
//         format &&
//         Array.isArray(value) &&
//         all(d => typeof d === "number", value)
//       ) {
//         return value.map(d => formatNumber(format, d))
//       } else {
//         return null
//       }
//     }
//   } else {
//     return null
//   }
// }

// export function formatterSingleValue(format) {
//   if (format) {
//     return value => formatNumber(format, value)
//   } else {
//     return null
//   }
// }

export function formatNumber(format, value) {
  if (/[{}]/.test(format)) {
    return formatPrefixSuffix(format, value)
  } else if (/\|/.test(format)) {
    return formatForcedSuffix(format, value)
  } else {
    return applyNumberFormat(format, value)
  }
}

// function applyDateFormat(format, value) {
//   try {
//     return format ? d3v4.timeFormat(format)(value) : value
//   } catch (e) {
//     // eslint-disable-next-line no-console
//     console.warn(e)
//     return value
//   }
// }

// export function dateFormatterUsingIndex(dimensionFormats) {
//   const dimensionsWithFormat = dimensionFormats.map(d => d.key)
//   if (dimensionFormats.length) {
//     return (value, key) => {
//       const formatIndex = dimensionsWithFormat.indexOf(key)
//       if (formatIndex > -1 && value instanceof Date) {
//         const format = dimensionFormats[formatIndex].format
//         return formatDate(format, value)
//       } else {
//         return null
//       }
//     }
//   } else {
//     return null
//   }
// }

// export function dateFormatterWithArray(format) {
//   if (format) {
//     return value => {
//       if (format && value instanceof Date) {
//         return formatDate(format, value)
//       } else if (
//         format &&
//         Array.isArray(value) &&
//         all(d => d instanceof Date, value)
//       ) {
//         return value.map(d => formatDate(format, d))
//       } else {
//         return null
//       }
//     }
//   } else {
//     return null
//   }
// }

// export function formatterSingleDateValue(format) {
//   return () => value => (format ? formatDate(format, value) : null)
// }

export function formatDate(format, value) {
  return applyDateFormat(format, value)
}

export function parseType(format, value) {
  if (typeof value === "number") {
    return formatNumber(format, value)
  } else if (value instanceof Date) {
    return formatDate(format, value)
  } else {
    return String(value)
  }
}

export function autoFormatter(_format) {
  console.log("autoFormatter", _format)
  return (value, key) => {
    console.log("to format", value, key)

    // To do: format from key
    const format = _format

    if (!format) {
      return null
    }

    if (Array.isArray(value)) {
      return value.map(d => parseType(format, d)).join(" - ")
    } else {
      return parseType(format, value)
    }


    // if (typeof key === "undefined") {
    //   return formatNumber(format, value)
    // }
  }
}
