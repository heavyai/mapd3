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

    zoomRangeMin : null,
    zoomRangeMax : null,
    zoomIsEnabled : true,

    markPanelWidth: null,
    chartHeight: null,

    binExtent : null,
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
  const dispatcher = d3.dispatch("brushStart", "brushMove", "brushEnd", "brushClear", "zoom")

  function buildSVG () {
    if (!cache.root) {
      cache.root = cache.container.append("g")
        .classed("brush-group", true)

      cache.brush = d3.brushX()
        .on("start", handleBrushStart)
        .on("brush", handleBrushMove)
        .on("end", handleBrushEnd)

        cache.zoom = d3.zoom()
          .on("zoom", handleZoom);

        cache.root.call(cache.zoom);

    }
  }

  function buildBrush () {
    cache.brush.extent([[0, 0], [config.markPanelWidth, config.chartHeight]])
console.log("BUILDS BRUSH WITH : ", config);
    cache.chartBrush = cache.root.call(cache.brush)
cache.root.call(cache.zoom);
    cache.chartBrush.selectAll(".brush-rect")
      .attr("height", config.chartHeight)

    //cache.root.selectAll('.overlay').call(cache.zoom)
console.log("OVERLAY IS : ", cache.root.selectAll('.overlay'));
    setBrush()
  }

  function handleZoom () {
console.log("HZ 1 : ", d3.event.sourceEvent.type, config, scales);

    if (! config.zoomIsEnabled) { return }

    if (!d3.event.sourceEvent ||
      (d3.event.sourceEvent && d3.event.sourceEvent.type === "mousemove")) {
        console.log("I NEED TO BRUSH THIS : ", brush);
      return
    }

    const zoomScale = scales.xScale;//.copy().domain([config.zoomRangeMin, config.zoomRangeMax]);

console.log("ZOOMS FROM : ", config.zoomRangeMin, config.zoomRangeMax, config, zoomScale, zoomScale.domain, zoomScale.domain());
    const step = d3.event.sourceEvent.deltaY;

    const [chartMin, chartMax] = zoomScale.range();

    const zmin = config.zoomRangeMin
      ? zoomScale(config.zoomRangeMin)
      : chartMin;
    const zmax = config.zoomRangeMax
      ? zoomScale(config.zoomRangeMax)
      : chartMax;

    const xCoord = d3.mouse(this)[0];
    const coordPercentage = (xCoord - chartMin) / (chartMax - chartMin);

    const newZmin = zmin + coordPercentage * d3.event.sourceEvent.deltaY;
    const newZmax = zmax - (1 - coordPercentage) * d3.event.sourceEvent.deltaY;

    if (newZmin > newZmax) { return }

    const coords = [
      //zoomScale.invert( Math.min( Math.max(chartMin, newZmin), chartMax) ),
      //zoomScale.invert( Math.max( Math.min(chartMax, newZmax), chartMin) )
      zoomScale.invert( newZmin ),
      zoomScale.invert( newZmax ),
    ];


    console.log("ZOOM DATES : ",
    [chartMin, chartMax],
    [newZmin, newZmax],
    Math.max(chartMin, newZmin),
    Math.min(chartMax, newZmax),
    [zoomScale.invert( chartMin ),zoomScale.invert( newZmin ),],
    [zoomScale.invert( chartMax ),zoomScale.invert( newZmax ),]
  );

console.log("ZOOM COORDS IN  : ", xCoord, zmin, zmax, d3.event.sourceEvent.deltaY, coordPercentage, newZmin, newZmax, coords, chartMin, chartMax);

console.log("ZOOM MODS : ",
  zmin, newZmin,
  zmax, newZmax,
  coordPercentage,
  config.zoomRangeMin, config.zoomRangeMax,
  ['INVERTED MIN/MAX', zoomScale(config.zoomRangeMin), zoomScale(config.zoomRangeMax)],
  xCoord,
d3.event.sourceEvent.deltaY)


console.log("ZOOM : ", config.brushRangeMin, config.brushRangeMax, zmin, zmax);
    console.log("HANDLES ZOOM : ", d3.event, d3.event.sourceEvent.type);

    //const invertedScale = invertScale(zoomScale);

    //dispatcher.call("zoom", this, [config.markPanelWidth - 10, config.chartHeight])
console.log("ZOOM COMPARE 1 : ",
  coords[0], config.zoomRangeMin, coords[0] === config.zoomRangeMin,
  coords[1], config.zoomRangeMax, coords[1] === config.zoomRangeMax,
);

console.log("UPDATED COORDS : ", coords, config.binExtent);

  if (coords[0] < config.binExtent[0]) {
    coords[0] = config.binExtent[0];
  }
  if (coords[1] > config.binExtent[1]) {
    coords[1] = config.binExtent[1];
  }

  console.log("UPDATED COORDS 2 : ", coords, config.binExtent);

    if (coords[0] !== config.zoomRangeMin || coords[1] !== config.zoomRangeMax) {
      dispatcher.call("zoom", this, coords, config)
    }



    return;

    if (!d3.event.sourceEvent ||
      (d3.event.sourceEvent && d3.event.sourceEvent.type === "mousemove")) {
      return
    }

    let extent = getDataExtentUnderZoom()

    if (extentIsValid(extent)) {
      cache.root.call(d3.event.target.move, extent.map((d) => scales.xScale(d)))
      console.log("HBM : ", extent);
      dispatcher.call("zoomMove", this, extent, config)
    }
  }

  function clampExtentToDateBin (extent) {
    return extent.map(d3TimeTranslation[config.binningResolution])
  }

  function getDataExtentUnderZoom () {
    const halfStep = d3.event.sourceEvent.deltaY / 2;
    const selection = [400, config.markPanelWidth]
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

  function getDataExtentUnderBrush () {
    const selection = d3.event.selection
    console.log("GDEU : ", selection, config, d3.event);
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
    console.log("SET BRUSH");
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
    console.log("HBS HERE : ", d3.event);
    console.log("HBS : ", getDataExtentUnderBrush());
    dispatcher.call("brushStart", this, getDataExtentUnderBrush(), config)
  }

  function handleBrushMove () {
    console.log("HBM");
    if (!d3.event.sourceEvent ||
      (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush")) {
      return
    }

    let extent = getDataExtentUnderBrush()
console.log("WITH EXTENT : ", extent);
    if (extentIsValid(extent)) {
      cache.root.call(d3.event.target.move, extent.map((d) => scales.xScale(d)))
      console.log("HBM : ", extent);
      dispatcher.call("brushMove", this, extent, config)
console.log('dispatched hbm');
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
console.log("HBE : ", getDataExtentUnderBrush());
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
