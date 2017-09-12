define((require) => {
  "use strict"

  const {dispatch} = require("d3-dispatch")

  return function observer (_dataManager) {
    const dispatcher = dispatch("brushChange", "dataFilter")
    const dataManager = _dataManager

    dispatcher.on("brushChange.observer", (e) => {
      const filtered = dataManager.filterByDate(e)
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
