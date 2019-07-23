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

    fullXDomain: null
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

    // this is just an inherently complex (and yet self-contained!) function. Sorry.
    /* eslint complexity: ["error", 30] */

    // this is a little sloppy - we're always going to attach and consume the zoom events, but
    // this will govern if we actually do anything with them.
    if (!config.zoomIsEnabled) { return }

    // ensure we ignore mousemoves.
    if (!d3.event.sourceEvent ||
      (d3.event.sourceEvent && d3.event.sourceEvent.type === "mousemove")) {
      return
    }

    // the zoomScale maps the FULL X Domain (which is the min -> max across all VDF dimensions)
    // to the chart's coordinate range.
    const zoomScale = scales.xScale.copy()
    zoomScale.domain(config.fullXDomain)

    // we're gonna allow the user to zoom in/out with a scroll, or pan left/right with shift + scroll
    // This is _stupid_. We only want to pan with the shift key, but apparently some (but not all!)
    // mice will not pass through a shift+scroll event. Until we've got it figured out, we're gonna allow
    // holding down shift OR option to pan.
    const scrollAction = d3.event.sourceEvent.shiftKey || d3.event.sourceEvent.altKey
      ? "pan"
      : "zoom"

    // a zoom action will assume that we have a change in y value - meaning we scrolled up
    // or down. If no scroll occurred (such as if the user scrolled left or right), we ignore
    // we step in the opposite direction of our scroll, since that's more standard.
    const unadjustedStep = -d3.event.sourceEvent.deltaY

    if (unadjustedStep === 0) { return }

    // Look at the CURRENT min/max values of the chart. If we've got a pre-existing zoom min/max,
    // use those. Otherwise, use the min/max of the current chart.
    const [chartMin, chartMax] = zoomScale.range()

    // because of re-scaling, it's possible that the zoom min/max are now outside the chart's bin extent
    // correct that to use the proper value so zoom doesn't go beyond the actual edges.
    const zmin = config.zoomRangeMin
      ? zoomScale(Math.max(config.zoomRangeMin, config.fullXDomain[0]))
      : chartMin
    const zmax = config.zoomRangeMax
      ? zoomScale(Math.min(config.zoomRangeMax, config.fullXDomain[1]))
      : chartMax

    /* okay, this is pretty epic. The actual pixel coordinates we moved by scrolling needs to be
       adjusted for the scale we're operating at. When we're fully zoomed out, a step on the wheel
       is 3-5px or so. But as we get zoomed in farther, the distance between the low and high bars
       on our zoom brush could be < 3-5px and as a result if we tried to zoom in that far we'd overzoom
       so our min > max and it'd fail and prevent it.

       Instead, we adjust our step value - it should be proportional to the ratio of our current zoomed
       range to the overall chart range. So if we moved the wheel by 2px and our chart range is 0->100,
       that's cool - adjust our step by 2px. If we've already zoomed in to a range of 0->1, then don't
       step by 2px at a time, only step by 0.02px (1 / 100).

       This has two effects -
       * we zoom in at a constant speed. Previously we'd zoom faster as we got closer in.
       * We can zoom into much finer resolutions than we previously could.

    */
    const stepAdjustment = (zmax - zmin) / (chartMax - chartMin)
    const step = unadjustedStep * stepAdjustment

    // we should zoom in from the left and right at different speeds. If the user is positioned far to the edge,
    // they want to keep their zoomed view oriented in the same manner. So we figure out how far along the chart
    // we are and use that percentage to figure out how to distribute the step amount to the left and right sides.
    const xCoord = d3.mouse(this)[0]
    // BUT...if we're panning left/right, we actually want to move both the left and right edges by the same amount,
    // so we cheat and claim that we're actually halfway.
    const coordPercentage = scrollAction === "zoom"
      ? (xCoord - chartMin) / (chartMax - chartMin)
      : 0.5

    // This is the _assumed_ new min/max extent range on the chart after the zoom. It needs a few corrections.
    const newZmin = zmin + coordPercentage * step
    // if it's a zoom action, then we're moving the edges closer/farther apart from each other.
    // but if it's a pan action, then they move in the same direction.
    // so flip how we change the max value based upon the scroll direction.
    const newZmax = zmax + (1 - coordPercentage) * step * (scrollAction === "zoom" ? -1 : 1)

    // if we're trying to zoom down to nothing so the min > max, then that's undefined. Bow out and do nothing.
    if (newZmin > newZmax) { return }

    // scale the full domain of all the data to the current coords
    const binBounds = [
      zoomScale(config.fullXDomain[0]),
      zoomScale(config.fullXDomain[1])
    ]

    // re-map our coordinates from numeric chart points to dates/bins/times/whatever.
    // if we're trying to map outside of the bin range, then force ourselves back into it.
    const coords = [
      Math.max(newZmin, binBounds[0]),
      Math.min(newZmax, binBounds[1])
    ]

    // if we're attempting to pan...
    if (scrollAction === "pan") {
      // and our min coord is at the bin bounds AND was not previously at the bin bounds, then
      // don't move our max coord
      if (coords[0] === binBounds[0] && zmin <= binBounds[0]) {
        coords[1] = zmax
      }

      // and our max coord is at the bin bounds AND was not previously at the bin bounds, then
      // don't move our min coord
      if (coords[1] === binBounds[1] && zmax >= binBounds[1]) {
        coords[0] = zmin
      }
    }

    // there's no need to do -anything- if we haven't actually changed our zoom levels. Bow out.
    if (coords[0] === zmin && coords[1] === zmax) {
      return
    }

    // map our correct coordinates back along the inverted scale.
    coords[0] = zoomScale.invert(coords[0])
    coords[1] = zoomScale.invert(coords[1])

    /* Yet another correction we need. After all of that, it's possible that we've managed
       to zoom down to a zero width area. That's an error and would prevent the user from
       zooming back out. BUT - the actual pixel coordinates on the chart may be different,
       but end up at the same place when the d3 scale is inverted. So map back to the domain
       and see if the difference is small enough. If it is, then we bow out and refuse to
       zoom in any farther.

       The magic number here is 1/10ms, which seemed like a good threshold.

    */
    if (coords[1] - coords[0] < 0.0001) {
      return
    }

    // and finally, if our new zoom range is the literal min and max values of the entire chart, we've "zoomed" to the entire
    // data set, so we should actually just clear the zoom filter.
    if (newZmin <= binBounds[0] && newZmax >= binBounds[1]) {
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
