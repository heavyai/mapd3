import * as d3 from "./helpers/d3-service"

import {filterByDate, filterByKey} from "./helpers/common"

export default function Observer (_dataManager) {
  const dispatcher = d3.dispatch("brushChange", "dataFilter")
  const dataManager = _dataManager

  dispatcher.on("brushChange.observer", (_e, _brushConfig) => {
    const filtered = _brushConfig.keyType === "time" ? filterByDate(_e)
      : filterByKey(_e)
    pub("dataFilter", filtered)
  })

  function sub (...args) {
    dispatcher.on(...args)
    return this
  }

  function pub (_channelName, ...args) {
    dispatcher.call(_channelName, this, ...args)
    return this
  }

  return {
    sub,
    pub
  }
}
