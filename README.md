# MapD3

MapD3 is a D3v4 charts library developed for [MapD Immerse](https://www.omnisci.com/platform/immerse/). It is in active development, currently at 0.16. We will accept PRs and bug reports once we reach 1.0.0.

The main component is `mapd3.chart`, which is a wrapper for a suite of sub-components, like axis, tooltip, marks, labels, etc. The chart type is nothing more than a configuration option (currently line, area, bar and variants of those).

## Documentation
The [documentation](https://omnisci.github.io/mapd3/doc/index.html) is generated with [documentationjs](http://documentation.js.org/).

The chart API is very simple: instantiate a chart, set configuration, set data, which automatically triggers a render, otherwise explicitely call render.

```javascript
mapd3.Chart(document.querySelector('.chart'))
    .setConfig({
        width: 800,
        height: 400,
        keyType: "time",
        chartType: "line"
    })
    .setData(data)
```
A complete example, including the use of a data generator, is available in this ObservaleHQ Notebook: https://beta.observablehq.com/@biovisualize/mapd3-test-sheet.

## Development
Look in [/package.json](package.json) for the build scripts. It is available as an [npm](https://www.npmjs.com/package/mapd3) package.

If, for some reason, you get errors about `d3/build/d3.js` missing, try running `yarn run clean` and `yarn install`.
