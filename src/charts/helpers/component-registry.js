import {rebind} from "./common"

export default function ComponentRegistry () {
  let components = {}
  const events = {}

  function capitalizeFirstLetter(string) {
    return string[0].toUpperCase() + string.slice(1)
  }

  function register (_components) {
    components = _components
    for (const key in components) {
      if (components[key].on) {
        events[`on${capitalizeFirstLetter(key)}`] = rebind(components[key])
      }
    }
    return this
  }

  function getEvents () {
    return events
  }

  function getComponents () {
    return components
  }

  function render (options) {
    for (const key in components) {
      const component = components[key]
      if (component.setConfig) { component.setConfig(options.config) }
      if (component.setScales) { component.setScales(options.scales) }
      if (component.setData) { component.setData(options.data) }
      if (component.render) { component.render() }
      if (component.bindEvents) { component.bindEvents(options.dispatcher) }
    }
    return this
  }

  return {
    register,
    getEvents,
    getComponents,
    render
  }
}
