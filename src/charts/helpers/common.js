define(function (require) {
  "use strict"

  const d3Format = require("d3-format")
  const {keys} = require("./constants")

  /**
   * Calculates percentage of value from total
   * @param  {Number}  value    Value to check
   * @param  {Number}  total    Sum of values
   * @param  {String}  decimals Specifies number of decimals https://github.com/d3/d3-format
   * @return {String}           Percentage
   */
  function calculatePercent (value, total, decimals) {
    return d3Format.format(decimals)(value / total * 100)
  }

  /**
   * Checks if a number is an integer of has decimal values
   * @param  {Number}  value Value to check
   * @return {Boolean}       If it is an iteger
   */
  function isInteger (value) {
    return value % 1 === 0
  }

  /**
   * Clones the passed array of data
   * @param  {Object[]} dataToClone Data to clone
   * @return {Object[]}             Cloned data
   */
  function cloneData (dataToClone) {
    return JSON.parse(JSON.stringify(dataToClone))
  }

  function sortData (data, _isTimeseries) {
    const sortedData = cloneData(data)
    if (_isTimeseries) {
      sortedData.sort((a, b) => new Date(a[keys.DATA_KEY]).getTime() - new Date(b[keys.DATA_KEY]).getTime())
    } else {
      sortedData.sort((a, b) => a[keys.DATA_KEY].localeCompare(b[keys.DATA_KEY], "en", {numeric: false}))
    }
    return sortedData
  }

  function invertScale (_scale, _mouseX, _isTimeseries) {
    if (_isTimeseries) {
      return _scale.invert(_mouseX)
    } else {
      const bandStep = _scale.step()
      const index = Math.round((_mouseX) / bandStep)
      return _scale.domain()[index]
    }
  }

  return {
    calculatePercent,
    isInteger,
    cloneData,
    sortData,
    invertScale
  }

})
