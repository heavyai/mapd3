import {keys} from "./helpers/constants"

export default function Hover (config, cache) {

  const getColor = (d) => cache.colorScale(d[keys.ID])

  function highlightDataPoints (_dataPoint) {
    const dotsData = _dataPoint[keys.SERIES]

    drawHighlightDataPoints(dotsData)
  }

  function drawHighlightDataPoints (_dotsData) {
    const dots = cache.verticalMarkerContainer.selectAll(".dot")
        .data(_dotsData)

    dots.enter()
      .append("circle")
      .attr("class", "dot")
      .merge(dots)
      .attr("cy", (d) => cache.yScale(d[keys.VALUE]))
      .attr("r", config.dotRadius)
      .style("stroke", "none")
      .style("fill", getColor)

    dots.exit().remove()
  }

  function highlightStackedDataPoints (_dataPoint) {
    const stackedDataPoint = {key: _dataPoint[keys.DATA]}
    _dataPoint.series.forEach((d) => {
      const id = d[keys.ID]
      stackedDataPoint[id] = d[keys.VALUE]
    })

    const dotsStack = cache.stack([stackedDataPoint])
    const dotsData = dotsStack.map((d) => {
      const dot = {value: d[0][1]}
      dot[keys.ID] = d.key
      return dot
    })

    drawHighlightDataPoints(dotsData)
  }

  function drawVerticalMarker () {
    cache.verticalMarkerContainer = cache.svg.select(".metadata-group .vertical-marker-container")
        .attr("transform", "translate(9999, 0)")

    cache.verticalMarkerLine = cache.verticalMarkerContainer.selectAll("path")
        .data([])

    cache.verticalMarkerLine.enter()
      .append("line")
      .classed("vertical-marker", true)
      .merge(cache.verticalMarkerLine)
      .attr("y1", cache.chartHeight)

    cache.verticalMarkerLine.exit().remove()
  }

  function moveVerticalMarker (_verticalMarkerXPosition) {
    cache.verticalMarkerContainer.attr("transform", `translate(${_verticalMarkerXPosition},0)`)
  }

  return {
    highlightDataPoints,
    highlightStackedDataPoints,
    drawVerticalMarker,
    moveVerticalMarker
  }
}
