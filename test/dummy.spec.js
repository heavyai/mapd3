import {expect} from "chai"
import Scale from "../src/charts/scale"
import DataManager from "../src/charts/data-manager"
import {baseConfig} from "./base-config"

function generateData (_config) {
  const baseDataConfig = {
    keyType: "time",
    range: [0, 100],
    pointCount: 200,
    groupCount: 2,
    lineCount: 2
  }

  const config = Object.assign({}, _config, baseDataConfig)

  const dataManager = DataManager()
    .setConfig(config)
  const inputData = dataManager.generateTestDataset()
  const cleanData = dataManager.cleanData(inputData, "time")

  return cleanData
}

describe("Array", () => {
  describe("#indexOf()", () => {
    it("should return -1 when the value is not present", () => {
      expect([1, 2, 3].indexOf(4)).to.equal(-1)
    })

    it("should do something", () => {
      const data = generateData()
      const scale = Scale()
      const scales = scale.setConfig(baseConfig)
        .setData(data)
        .getScales()

      expect([1, 2, 3].indexOf(4)).to.equal(-1)
    })
  })
})
