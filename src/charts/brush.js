import * as d3 from "./helpers/d3-service"
import {d3TimeTranslation} from "./helpers/constants"
import {invertScale, override, extentIsValid} from "./helpers/common"

export default function Brush (_container) {

  let config = {
    margin: {
      top: 60,
      right: 30,
      bottom: 40,
      left: 70
    },
    width: 800,
    height: 500,
    keyType: null,
    brushRangeMin: null,
    brushRangeMax: null,
    brushIsEnabled: true,
    binningResolution: "1mo",

    zoomRangeMin: null,
    zoomRangeMax: null,
    zoomIsEnabled: true,

    markPanelWidth: null,
    chartHeight: null,

    binExtent: null
  }

  let scales = {
    xScale: null
  }

  const cache = {
    container: _container,
    dateRange: [null, null],
    brush: null,
    chartBrush: null,
    handle: null
  }

  let data = {
    dataBySeries: null
  }

  // events
  const dispatcher = d3.dispatch("brushStart", "brushMove", "brushEnd", "brushClear", "zoom", "zoomClear")

  function buildSVG () {
    if (!cache.root) {
      cache.root = cache.container.append("g")
        .classed("brush-group", true)

      cache.brush = d3.brushX()
        .on("start", handleBrushStart)
        .on("brush", handleBrushMove)
        .on("end", handleBrushEnd)

      /* okay, this is a little esoteric - in an ideal world, we'd probably have a separate "Zoom"
         component that would live alongside our "Brush" component here and handle the zooming. the
         problem is that d3.zoom swallows all mousemove events, which prevents us from brushing on the chart.
         (and you'll recall that we need to brush on the chart to set a filter, in addition to zooming in and out).

         So the solution is twofold - first of all, we do the zooming in here, and secondly we attach the zoom
         event to the <g> tag brush container. d3.brush adds on a few elements that directly handle the interaction,
         so we let them absorb the mousemove events for the brushing and bubble up the wheel events to the zoom
         in the container tag.

      */
      cache.zoom = d3.zoom()
        .on("zoom", handleZoom)

      cache.root.call(cache.zoom)

    }
  }

  function buildBrush () {
    cache.brush.extent([[0, 0], [config.markPanelWidth, config.chartHeight]])

    cache.chartBrush = cache.root.call(cache.brush)
    cache.root.call(cache.zoom)

    cache.chartBrush.selectAll(".brush-rect")
      .attr("height", config.chartHeight)

    setBrush()
  }

  function handleZoom () {

    // this is a little sloppy - we're always going to attach and consume the zoom events, but
    // this will govern if we actually do anything with them.
    if (!config.zoomIsEnabled) { return }

    // ensure we ignore mousemoves.
    if (!d3.event.sourceEvent ||
      (d3.event.sourceEvent && d3.event.sourceEvent.type === "mousemove")) {
      return
    }

    // a zoom action will assume that we have a change in y value - meaning we scrolled up
    // or down. If no scroll occurred (such as if the user scrolled left or right), we ignore

    const step = d3.event.sourceEvent.deltaY

    if (step === 0) { return }

    // Look at the CURRENT min/max values of the chart. If we've got a pre-existing zoom min/max,
    // use those. Otherwise, use the min/max of the current chart.
    const [chartMin, chartMax] = scales.xScale.range()

    const zmin = config.zoomRangeMin
      ? scales.xScale(config.zoomRangeMin)
      : chartMin
    const zmax = config.zoomRangeMax
      ? scales.xScale(config.zoomRangeMax)
      : chartMax

    // we should zoom in from the left and right at different speeds. If the user is positioned far to the edge,
    // they want to keep their zoomed view oriented in the same manner. So we figure out how far along the chart
    // we are and use that percentage to figure out how to distribute the step amount to the left and right sides.
    const xCoord = d3.mouse(this)[0]
    const coordPercentage = (xCoord - chartMin) / (chartMax - chartMin)

    // This is the _assumed_ new min/max extent range on the chart after the zoom. It needs a few corrections.
    const newZmin = zmin + coordPercentage * d3.event.sourceEvent.deltaY
    const newZmax = zmax - (1 - coordPercentage) * d3.event.sourceEvent.deltaY

    // if we're trying to zoom down to nothing so the min > max, then that's undefined. Bow out and do nothing.
    if (newZmin > newZmax) { return }

    // re-map our coordinates from numeric chart points to dates/bins/times/whatever.
    const coords = [
      scales.xScale.invert(newZmin),
      scales.xScale.invert(newZmax)
    ]

    // a little more correction - if we've zoomed outside the bounds, then we should clamp down on the edges instead.
    if (coords[0] < config.binExtent[0]) {
      coords[0] = config.binExtent[0]
    }
    if (coords[1] > config.binExtent[1]) {
      coords[1] = config.binExtent[1]
    }

    // and finally, if our new zoom range is the literal min and max values of the entire chart, we've "zoomed" to the entire
    // data set, so we should actually just clear the zoom filter.
    if (coords[0] === config.binExtent[0] && coords[1] === config.binExtent[1]) {
      dispatcher.call("zoomClear", this, config)
    } else {
      // otherwise, we've zoomed to some other range, so we just dispatch a zoom event.
      dispatcher.call("zoom", this, coords, config)
    }


  }

  function clampExtentToDateBin (extent) {
    return extent.map(d3TimeTranslation[config.binningResolution])
  }

  function getDataExtentUnderBrush () {
    const selection = d3.event.selection
    if (extentIsValid(selection)) {
      const extent = selection.map((d) => invertScale(scales.xScale, d, config.keyType))
      if (config.keyType === "time") {
        const clampedExtent = clampExtentToDateBin(extent)
        // prevent clamping to a span of 0
        if (clampedExtent[0].getTime() !== clampedExtent[1].getTime()) {
          return clampedExtent
        }
      }
      return extent
    } else {
      return null
    }
  }

  function setBrush () {
    let extent = [config.brushRangeMin, config.brushRangeMax]
    if (extentIsValid(extent)) {
      if (config.keyType === "time") {
        extent = extent.map(d => new Date(d))
      }
      cache.root.call(cache.brush.move, extent.map((d) => scales.xScale(d)))
    } else {
      cache.root.call(cache.brush.move, null)
    }
    return this
  }

  function handleBrushStart () {
    if (!d3.event.sourceEvent ||
      (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush")) {
      return
    }

    dispatcher.call("brushStart", this, getDataExtentUnderBrush(), config)
  }

  function handleBrushMove () {
    if (!d3.event.sourceEvent ||
      (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush")) {
      return
    }

    const extent = getDataExtentUnderBrush()

    if (extentIsValid(extent)) {
      cache.root.call(d3.event.target.move, extent.map((d) => scales.xScale(d)))
      dispatcher.call("brushMove", this, extent, config)
    }
  }

  function handleBrushEnd () {
    // Skip programatic setting
    if (!d3.event.sourceEvent ||
      (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush")) {
      return
    }

    // dispatch empty selection
    if (!d3.event.selection) {
      dispatcher.call("brushClear", this, config)
      return
    }

    dispatcher.call("brushEnd", this, getDataExtentUnderBrush(), config)
  }

  function on (...args) {
    dispatcher.on(...args)
    return this
  }

  function setConfig (_config) {
    config = override(config, _config)
    return this
  }

  function setScales (_scales) {
    scales = override(scales, _scales)
    return this
  }

  function setData (_data) {
    data = Object.assign({}, data, _data)
    return this
  }

  function render () {
    if (!config.brushIsEnabled) {
      destroy()
    }

    if (config.brushIsEnabled) {
      buildSVG()
    }

    if (config.brushIsEnabled && data.dataBySeries) {
      buildBrush()
    }

    return this
  }

  function destroy () {
    if (cache.root) {
      cache.root.remove()
      cache.root = null
    }
    return this
  }

  return {
    on,
    setConfig,
    setData,
    setScales,
    render,
    destroy
  }
}
