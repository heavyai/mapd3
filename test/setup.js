const jsdom = require("jsdom")
const {JSDOM} = jsdom

global.window = new JSDOM(
  "<!doctype html><html><body></body></html>",
  {
    resources: "usable",
    runScripts: "dangerously",
    url: "http://localhost"
  }
).window
global.document = global.window.document
// global.window.atob = atob
// global.window.btoa = btoa
// global.window.URL = url
window.console = global.console
global.Node = global.window.Node
global.Text = global.window.Text
global.HTMLElement = global.window.HTMLElement

Object.keys(global.window).forEach(property => {
  if (typeof global[property] === "undefined") {
    global[property] = global.window[property]
  }
})

global.navigator = {
  userAgent: "node.js"
}
