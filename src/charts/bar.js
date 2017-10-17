import {keys} from "./helpers/constants"

export default function Bar (config, cache) {

  const getColor = (d) => cache.colorScale(d[keys.ID])

  function drawBars () {
    const bars = cache.svg.select(".chart-group")
        .selectAll(".mark")
        .data(cache.dataBySeries[0].values)

    bars.enter()
      .append("rect")
      .attr("class", () => ["mark", "rect"].join(" "))
      .merge(bars)
      .attr("x", (d) => cache.xScale(d[keys.DATA]))
      .attr("y", (d) => cache.yScale(d[keys.VALUE]))
      .attr("width", () => cache.xScale.bandwidth())
      .attr("height", (d) => cache.chartHeight - cache.yScale(d[keys.VALUE]))
      .style("stroke", "white")
      .style("fill", getColor)

    bars.exit().remove()
  }

  function drawStackedBars () {

    const stackedBarGroups = cache.svg.select(".chart-group")
        .selectAll(".mark-group")
        .data(cache.stack(cache.stackData))

    const stackedUpdate = stackedBarGroups.enter()
      .append("g")
      .attr("class", "mark-group")
      .merge(stackedBarGroups)
      .attr("fill", (d) => cache.colorScale(d.key))
      .attr("stroke", "white")

    stackedBarGroups.exit().remove()

    const stackedBars = stackedUpdate.selectAll(".mark")
        .data((d) => d)

    stackedBars.enter()
      .append("rect")
      .attr("class", "mark")
      .merge(stackedBars)
      .attr("x", (d) => cache.xScale(d.data[keys.DATA]))
      .attr("y", (d) => cache.yScale(d[1]))
      .attr("height", (d) => cache.yScale(d[0]) - cache.yScale(d[1]))
      .attr("width", cache.xScale.bandwidth())

    stackedBars.exit().remove()
  }

  return {
    drawBars,
    drawStackedBars
  }
}
