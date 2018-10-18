export const underline = `<filter id="underline">
  <feOffset dx="0" dy="2" result="offsetblur"/>
  <feFlood flood-color="white" flood-opacity="1"/>
  <feComposite in2="offsetblur" operator="in"/>
  <feMerge>
    <feMergeNode/>
    <feMergeNode in="SourceGraphic"/>
  </feMerge>
</filter>`

export const shadow = `<filter id="shadow">
  <feGaussianBlur in="SourceAlpha" stdDeviation="0.5"/>
  <feOffset dx="0.5" dy="1.5" result="offsetblur"/>
  <feFlood flood-color="rgba(0,0,0,0.3)"/>
  <feComposite in2="offsetblur" operator="in"/>
  <feMerge>
    <feMergeNode/>
    <feMergeNode in="SourceGraphic"/>
  </feMerge>
</filter>`