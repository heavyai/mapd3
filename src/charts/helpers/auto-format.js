import * as d3 from "./d3-service"

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

export function formatNumber(format, value) {
  if (/[{}]/.test(format)) {
    return formatPrefixSuffix(format, value)
  } else if (/\|/.test(format)) {
    return formatForcedSuffix(format, value)
  } else {
    return applyNumberFormat(format, value)
  }
}

function validateDateFormat(format, value) {
  const formatted = d3.timeFormat(format)(value)

  return formatted !== format
}

function applyDateFormat(format, value) {
  if (!validateDateFormat(format, value)) {
    return String(value)
  }
  return d3.timeFormat(format)(value)
}

function formatDate(format, value) {
  return applyDateFormat(format, value)
}

function parseType(format, value) {
  if (typeof value === "number") {
    return formatNumber(format, value)
  } else if (value instanceof Date) {
    return formatDate(format, value)
  } else {
    return String(value)
  }
}

function getFormatFromKey(cachedFormat, key) {
  if (Array.isArray(cachedFormat)) {
    const match = cachedFormat.filter(d => d.key === key)[0]
    if (match && match.format) {
      // matching format
      return match.format
    } else {
      // no matching format
      return null
    }
  } else {
    // no format by key
    return null
  }
}

function hasFormatForKey(cachedFormat, key) {
  if (Array.isArray(cachedFormat)) {
    return Boolean(getFormatFromKey(cachedFormat, key))
  } else {
    // format for all keys
    return Boolean(cachedFormat)
  }
}

export default function autoFormatter(_format) {
  // no format
  if (!_format || (Array.isArray(_format) && _format.length === 0)) {
    return null
  }

  const cachedFormat = _format

  return function formatter(value, key) {
    const hasKey = typeof key !== "undefined"

    if (hasKey && !hasFormatForKey(cachedFormat, key)) {
      return null
    }

    let format = cachedFormat

    // pick format from key
    if (Array.isArray(cachedFormat)) {
      if (hasKey) {
        format = getFormatFromKey(cachedFormat, key)
      } else {
        format = cachedFormat[0] && cachedFormat[0].format
      }
    }

    if (Array.isArray(value)) {
      // format each element of an array of values
      return value.map(d => parseType(format, d)).join(" - ")
    } else {
      // format value
      return parseType(format, value)
    }
  }
}
