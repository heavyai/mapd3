define((require) => {
  "use strict"

  const {dispatch} = require("d3-dispatch")

  return function observer (_dataManager) {
    const dispatcher = dispatch("brushChange", "dataFilter")
    const dataManager = _dataManager

    dispatcher.on("brushChange.observer", (_e, _brushConfig) => {
      const filtered = _brushConfig.isTimeseries ? dataManager.filterByDate(_e)
        : dataManager.filterByKey(_e)
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
})
