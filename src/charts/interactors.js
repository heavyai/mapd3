import * as d3 from "./helpers/d3-service"

/**
 * Toggles selection on clickable elements. Will set classes "selected" and "dimmed".
 * @param  {Number} selector A valid selector of the elements to toggle
 * @example
 * barChart.on('customClick', britecharts.interactors.multiToggle('rect.bar'))
 *
 * @return {void}
 */

export function toggleOnOff (selector, bool) {
  const shouldBeSelected = typeof bool === "undefined" ? !d3.select(selector).classed("selected") : bool
  d3.select(selector)
    .classed("selected", shouldBeSelected)
    .classed("dimmed", !shouldBeSelected)
}

export function exclusiveToggle (othersSelection, selector) {
  return toggle(othersSelection, selector, {
    toggleOffIsEnabled: false,
    toggleMultipleIsEnabled: false
  })
}

export function toggle (othersSelection, selector, options = {toggleOffIsEnabled: false, toggleMultipleIsEnabled: false}) {
  /* eslint-disable consistent-this */
  let hasSelection = false
  const selectionNode = document.querySelector(selector)

  othersSelection.classed("selected", function selectedClass () {
    const isSelected = this.classList.contains("selected")
    const hasJustBeenClicked = this === selectionNode
    let shouldBeSelected = false

    if (hasJustBeenClicked) {
      shouldBeSelected = options.toggleOffIsEnabled ? !isSelected : true
    } else {
      shouldBeSelected = options.toggleMultipleIsEnabled ? isSelected : false
    }

    hasSelection = hasSelection || shouldBeSelected
    return shouldBeSelected
  })

  othersSelection.classed("dimmed", function dimmedClass () {
    return hasSelection && !this.classList.contains("selected")
  })
  /* eslint-enable consistent-this */
}

export function blurOnEnter (selection) {
  selection.on("keypress.enter", function keypress () {
    if (d3.event.key === "Enter") { this.blur() }
  })
}
