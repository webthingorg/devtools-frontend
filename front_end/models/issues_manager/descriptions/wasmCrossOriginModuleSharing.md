# Share WebAssembly modules only between same-origin contexts

Starting in Chrome M95, WebAssembly modules may only be shared between same-origin environments. This means that [same-site but cross-origin](sameSiteAndSameOrigin) environments won't be able to share WebAssembly modules via `postMessage` anymore.

To fix this, ensure that WebAssembly modules are only transferred between environments of the same origin.
