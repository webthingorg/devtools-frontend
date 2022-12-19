/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e=e=>t=>"function"==typeof t?((e,t)=>(customElements.define(e,t),t))(e,t):((e,t)=>{const{kind:n,elements:r}=t;return{kind:n,elements:r,finisher(t){customElements.define(e,t)}}})(e,t)
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */,t=(e,t)=>"method"===t.kind&&t.descriptor&&!("value"in t.descriptor)?{...t,finisher(n){n.createProperty(t.key,e)}}:{kind:"field",key:Symbol(),placement:"own",descriptor:{},originalKey:t.key,initializer(){"function"==typeof t.initializer&&(this[t.key]=t.initializer.call(this))},finisher(n){n.createProperty(t.key,e)}};function n(e){return(n,r)=>void 0!==r?((e,t,n)=>{t.constructor.createProperty(n,e)})(e,n,r):t(e,n)
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */}function r(e){return n({...e,state:!0})}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const o=({finisher:e,descriptor:t})=>(n,r)=>{var o;if(void 0===r){const r=null!==(o=n.originalKey)&&void 0!==o?o:n.key,i=null!=t?{kind:"method",placement:"prototype",key:r,descriptor:t(n.key)}:{...n,key:r};return null!=e&&(i.finisher=function(t){e(t,r)}),i}{const o=n.constructor;void 0!==t&&Object.defineProperty(n,r,t(r)),null==e||e(o,r)}}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */;function i(e){return o({finisher:(t,n)=>{Object.assign(t.prototype[n],e)}})}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function l(e,t){return o({descriptor:n=>{const r={get(){var t,n;return null!==(n=null===(t=this.renderRoot)||void 0===t?void 0:t.querySelector(e))&&void 0!==n?n:null},enumerable:!0,configurable:!0};if(t){const t="symbol"==typeof n?Symbol():"__"+n;r.get=function(){var n,r;return void 0===this[t]&&(this[t]=null!==(r=null===(n=this.renderRoot)||void 0===n?void 0:n.querySelector(e))&&void 0!==r?r:null),this[t]}}return r}})}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function s(e){return o({descriptor:t=>({get(){var t,n;return null!==(n=null===(t=this.renderRoot)||void 0===t?void 0:t.querySelectorAll(e))&&void 0!==n?n:[]},enumerable:!0,configurable:!0})})}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function u(e){return o({descriptor:t=>({async get(){var t;return await this.updateComplete,null===(t=this.renderRoot)||void 0===t?void 0:t.querySelector(e)},enumerable:!0,configurable:!0})})}
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var c;const d=null!=(null===(c=window.HTMLSlotElement)||void 0===c?void 0:c.prototype.assignedElements)?(e,t)=>e.assignedElements(t):(e,t)=>e.assignedNodes(t).filter((e=>e.nodeType===Node.ELEMENT_NODE));function a(e){const{slot:t,selector:n}=null!=e?e:{};return o({descriptor:r=>({get(){var r;const o="slot"+(t?`[name=${t}]`:":not([name])"),i=null===(r=this.renderRoot)||void 0===r?void 0:r.querySelector(o),l=null!=i?d(i,e):[];return n?l.filter((e=>e.matches(n))):l},enumerable:!0,configurable:!0})})}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function y(e,t,n){let r,i=e;return"object"==typeof e?(i=e.slot,r=e):r={flatten:t},n?a({slot:i,flatten:t,selector:n}):o({descriptor:e=>({get(){var e,t;const n="slot"+(i?`[name=${i}]`:":not([name])"),o=null===(e=this.renderRoot)||void 0===e?void 0:e.querySelector(n);return null!==(t=null==o?void 0:o.assignedNodes(r))&&void 0!==t?t:[]},enumerable:!0,configurable:!0})})}export{e as customElement,i as eventOptions,n as property,l as query,s as queryAll,a as queryAssignedElements,y as queryAssignedNodes,u as queryAsync,r as state};
//# sourceMappingURL=decorators.js.map
