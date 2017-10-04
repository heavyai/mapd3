import {select} from "d3-selection"

/**
 * Toggles selection on clickable elements. Will set classes "selected" and "dimmed".
 * @param  {Number} selector A valid selector of the elements to toggle
 * @example
 * barChart.on('customClick', britecharts.interactors.multiToggle('rect.bar'))
 *
 * @return {void}
 */

export function toggleOnOff (selector) {
  return exclusiveToggle(selector, {
    toggleOffIsEnabled: true,
    toggleMultipleIsEnabled: false
  })
}

export function exclusiveToggle (selector, options = {toggleOffIsEnabled: false, toggleMultipleIsEnabled: false}) {

  return function toggle () {
    /* eslint-disable consistent-this */
    const that = this
    let hasSelection = false
    const selection = select(this.farthestViewportElement)
        .selectAll(selector)

    selection.classed("selected", function selectedClass () {
      const isSelected = this.classList.contains("selected")
      const hasJustBeenClicked = this === that
      let shouldBeSelected = false

      if (hasJustBeenClicked) {
        shouldBeSelected = options.toggleOffIsEnabled ? !isSelected : true
      } else {
        shouldBeSelected = options.toggleMultipleIsEnabled ? isSelected : false
      }

      hasSelection = hasSelection || shouldBeSelected
      return shouldBeSelected
    })
    selection.classed("dimmed", function dimmedClass () {
      return hasSelection && !this.classList.contains("selected")
    })
    /* eslint-enable consistent-this */
  }
}
