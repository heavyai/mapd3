import {expect} from "chai"
import Scale from "../src/charts/scale"
import {baseConfig, generateComponentData} from "./test-utils"
import {augmentConfig} from "../src/charts/helpers/auto-config"

describe("Scales", () => {

  const dataConfig = {
    keyType: "time",
    range: [0, 100],
    pointCount: 30,
    groupCount: 2,
    lineCount: 2
  }
  let scale = null
  let scales = null
  let data = null

  before(() => {
    data = generateComponentData(dataConfig)

    const autoConfig = augmentConfig(baseConfig, null, data)
    const config = Object.assign({}, baseConfig, autoConfig)

    scale = Scale()
    scales = scale.setConfig(config)
      .setData(data)
      .getScales()
  })

  after(() => {
    scale = null
    scales = null
    data = null
  })

  describe("General functionalities", () => {

    it("instantiates and exposes API get/setters", () => {
      expect(scale).to.include.all.keys(
        "setConfig",
        "setData",
        "getScales"
      )
    })

    it("returns all scales", () => {
      expect(scales).to.include.all.keys(
        "hasSecondAxis",
        "xScale",
        "yScale",
        "y2Scale",
        "colorScale",
        "styleScale",
        "chartTypeScale"
      )
    })

    it("configures the xScale range and domain", () => {
      expect(scales.xScale.domain()[0]).instanceof(Date)
      expect(scales.xScale.domain()[1]).instanceof(Date)
      expect(scales.xScale.range()[0]).to.be.at.least(0)
      expect(scales.xScale.range()[1]).to.be.at.most(baseConfig.width)
    })

    it("configures the yScale range and domain", () => {
      expect(scales.yScale.range()[0]).to.be.below(baseConfig.height)
      expect(scales.yScale.domain()[0]).to.be.at.least(dataConfig.range[0])
      expect(scales.yScale.domain()[1]).to.be.at.most(dataConfig.range[1])
    })
  })
})
