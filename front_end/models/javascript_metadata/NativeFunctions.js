// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// Generated from javascript_natives/helpers.js

export const NativeFunctions = [
  {
    name: 'eval',
    signatures: [['x']]
  },
  {
    name: 'parseInt',
    signatures: [['string','?radix']]
  },
  {
    name: 'parseFloat',
    signatures: [['string']]
  },
  {
    name: 'isNaN',
    signatures: [['number']]
  },
  {
    name: 'isFinite',
    signatures: [['number']]
  },
  {
    name: 'decodeURI',
    signatures: [['encodedURI']]
  },
  {
    name: 'decodeURIComponent',
    signatures: [['encodedURIComponent']]
  },
  {
    name: 'encodeURI',
    signatures: [['uri']]
  },
  {
    name: 'encodeURIComponent',
    signatures: [['uriComponent']]
  },
  {
    name: 'escape',
    signatures: [['string']]
  },
  {
    name: 'unescape',
    signatures: [['string']]
  },
  {
    name: 'toString',
    signatures: [['?radix']],
    receivers: ['Number']
  },
  {
    name: 'get',
    signatures: [['?options']],
    receivers: ['CredentialsContainer']
  },
  {
    name: 'get',
    signatures: [['name']],
    receivers: ['CustomElementRegistry','FormData','Headers','URLSearchParams']
  },
  {
    name: 'get',
    signatures: [['query']],
    receivers: ['IDBIndex','IDBObjectStore']
  },
  {
    name: 'get',
    signatures: [['keyId']],
    receivers: ['MediaKeyStatusMap']
  },
  {
    name: 'set',
    signatures: [['v']],
    receivers: ['PropertyDescriptor']
  },
  {
    name: 'set',
    signatures: [['array','?offset']],
    receivers: ['Int8Array','Uint8Array','Uint8ClampedArray','Int16Array','Uint16Array','Int32Array','Uint32Array','Float32Array','Float64Array']
  },
  {
    name: 'set',
    signatures: [['name','value','?fileName']],
    receivers: ['FormData']
  },
  {
    name: 'set',
    signatures: [['name','value']],
    receivers: ['Headers','URLSearchParams']
  },
  {
    name: 'toLocaleString',
    signatures: [['?locales','?options']],
    receivers: ['Date','Number']
  },
  {
    name: 'hasOwnProperty',
    signatures: [['v']]
  },
  {
    name: 'isPrototypeOf',
    signatures: [['v']]
  },
  {
    name: 'propertyIsEnumerable',
    signatures: [['v']]
  },
  {
    name: 'getPrototypeOf',
    signatures: [['o']]
  },
  {
    name: 'getOwnPropertyDescriptor',
    signatures: [['o','p']]
  },
  {
    name: 'getOwnPropertyNames',
    signatures: [['o']]
  },
  {
    name: 'create',
    signatures: [['o','?properties']],
    receivers: ['ObjectConstructor']
  },
  {
    name: 'create',
    signatures: [['?options']],
    receivers: ['CredentialsContainer']
  },
  {
    name: 'defineProperty',
    signatures: [['o','p','attributes']]
  },
  {
    name: 'defineProperties',
    signatures: [['o','properties']]
  },
  {
    name: 'seal',
    signatures: [['o']]
  },
  {
    name: 'freeze',
    signatures: [['f'],['o']]
  },
  {
    name: 'preventExtensions',
    signatures: [['o']]
  },
  {
    name: 'isSealed',
    signatures: [['o']]
  },
  {
    name: 'isFrozen',
    signatures: [['o']]
  },
  {
    name: 'isExtensible',
    signatures: [['o']]
  },
  {
    name: 'keys',
    signatures: [['o']],
    receivers: ['ObjectConstructor']
  },
  {
    name: 'keys',
    signatures: [['?request','?options']],
    receivers: ['Cache']
  },
  {
    name: 'apply',
    signatures: [['thisArg','?argArray']],
    receivers: ['Function']
  },
  {
    name: 'apply',
    signatures: [['thisArg','?args']],
    receivers: ['CallableFunction','NewableFunction']
  },
  {
    name: 'call',
    signatures: [['thisArg','...argArray']],
    receivers: ['Function']
  },
  {
    name: 'call',
    signatures: [['thisArg','...args']],
    receivers: ['CallableFunction','NewableFunction']
  },
  {
    name: 'bind',
    signatures: [['thisArg','...argArray']],
    receivers: ['Function']
  },
  {
    name: 'bind',
    signatures: [['thisArg','?arg0','?arg1','?arg2','?arg3'],['thisArg','...args']],
    receivers: ['CallableFunction','NewableFunction']
  },
  {
    name: 'charAt',
    signatures: [['pos']]
  },
  {
    name: 'charCodeAt',
    signatures: [['index']]
  },
  {
    name: 'concat',
    signatures: [['...strings']],
    receivers: ['String']
  },
  {
    name: 'concat',
    signatures: [['...items']],
    receivers: ['ReadonlyArray','Array']
  },
  {
    name: 'indexOf',
    signatures: [['searchString','?position']],
    receivers: ['String']
  },
  {
    name: 'indexOf',
    signatures: [['searchElement','?fromIndex']],
    receivers: ['ReadonlyArray','Array','Int8Array','Uint8Array','Uint8ClampedArray','Int16Array','Uint16Array','Int32Array','Uint32Array','Float32Array','Float64Array']
  },
  {
    name: 'lastIndexOf',
    signatures: [['searchString','?position']],
    receivers: ['String']
  },
  {
    name: 'lastIndexOf',
    signatures: [['searchElement','?fromIndex']],
    receivers: ['ReadonlyArray','Array','Int8Array','Uint8Array','Uint8ClampedArray','Int16Array','Uint16Array','Int32Array','Uint32Array','Float32Array','Float64Array']
  },
  {
    name: 'localeCompare',
    signatures: [['that','?locales','?options']]
  },
  {
    name: 'match',
    signatures: [['regexp']],
    receivers: ['String']
  },
  {
    name: 'match',
    signatures: [['request','?options']],
    receivers: ['Cache','CacheStorage']
  },
  {
    name: 'replace',
    signatures: [['searchValue','replaceValue'],['searchValue','replacer']],
    receivers: ['String']
  },
  {
    name: 'replace',
    signatures: [['text']],
    receivers: ['CSSStyleSheet']
  },
  {
    name: 'replace',
    signatures: [['token','newToken']],
    receivers: ['DOMTokenList']
  },
  {
    name: 'replace',
    signatures: [['url']],
    receivers: ['Location']
  },
  {
    name: 'search',
    signatures: [['regexp']]
  },
  {
    name: 'slice',
    signatures: [['?start','?end']],
    receivers: ['String','ReadonlyArray','ConcatArray','Array','Int8Array','Uint8Array','Uint8ClampedArray','Int16Array','Uint16Array','Int32Array','Uint32Array','Float32Array','Float64Array']
  },
  {
    name: 'slice',
    signatures: [['begin','?end']],
    receivers: ['ArrayBuffer']
  },
  {
    name: 'slice',
    signatures: [['?start','?end','?contentType']],
    receivers: ['Blob']
  },
  {
    name: 'split',
    signatures: [['separator','?limit']]
  },
  {
    name: 'substring',
    signatures: [['start','?end']]
  },
  {
    name: 'toLocaleLowerCase',
    signatures: [['?locales']]
  },
  {
    name: 'toLocaleUpperCase',
    signatures: [['?locales']]
  },
  {
    name: 'substr',
    signatures: [['from','?length']]
  },
  {
    name: 'fromCharCode',
    signatures: [['...codes']]
  },
  {
    name: 'toFixed',
    signatures: [['?fractionDigits']]
  },
  {
    name: 'toExponential',
    signatures: [['?fractionDigits']]
  },
  {
    name: 'toPrecision',
    signatures: [['?precision']]
  },
  {
    name: 'abs',
    signatures: [['x']]
  },
  {
    name: 'acos',
    signatures: [['x']]
  },
  {
    name: 'asin',
    signatures: [['x']]
  },
  {
    name: 'atan',
    signatures: [['x']]
  },
  {
    name: 'atan2',
    signatures: [['y','x']]
  },
  {
    name: 'ceil',
    signatures: [['x']]
  },
  {
    name: 'cos',
    signatures: [['x']]
  },
  {
    name: 'exp',
    signatures: [['x']]
  },
  {
    name: 'floor',
    signatures: [['x']]
  },
  {
    name: 'log',
    signatures: [['x']],
    receivers: ['Math']
  },
  {
    name: 'log',
    signatures: [['...data']],
    receivers: ['Console']
  },
  {
    name: 'max',
    signatures: [['...values']]
  },
  {
    name: 'min',
    signatures: [['...values']]
  },
  {
    name: 'pow',
    signatures: [['x','y']]
  },
  {
    name: 'round',
    signatures: [['x']]
  },
  {
    name: 'sin',
    signatures: [['x']]
  },
  {
    name: 'sqrt',
    signatures: [['x']]
  },
  {
    name: 'tan',
    signatures: [['x']]
  },
  {
    name: 'toLocaleDateString',
    signatures: [['?locales','?options']]
  },
  {
    name: 'toLocaleTimeString',
    signatures: [['?locales','?options']]
  },
  {
    name: 'setTime',
    signatures: [['time']]
  },
  {
    name: 'setMilliseconds',
    signatures: [['ms']]
  },
  {
    name: 'setUTCMilliseconds',
    signatures: [['ms']]
  },
  {
    name: 'setSeconds',
    signatures: [['sec','?ms']]
  },
  {
    name: 'setUTCSeconds',
    signatures: [['sec','?ms']]
  },
  {
    name: 'setMinutes',
    signatures: [['min','?sec','?ms']]
  },
  {
    name: 'setUTCMinutes',
    signatures: [['min','?sec','?ms']]
  },
  {
    name: 'setHours',
    signatures: [['hours','?min','?sec','?ms']]
  },
  {
    name: 'setUTCHours',
    signatures: [['hours','?min','?sec','?ms']]
  },
  {
    name: 'setDate',
    signatures: [['date']]
  },
  {
    name: 'setUTCDate',
    signatures: [['date']]
  },
  {
    name: 'setMonth',
    signatures: [['month','?date']]
  },
  {
    name: 'setUTCMonth',
    signatures: [['month','?date']]
  },
  {
    name: 'setFullYear',
    signatures: [['year','?month','?date']]
  },
  {
    name: 'setUTCFullYear',
    signatures: [['year','?month','?date']]
  },
  {
    name: 'toJSON',
    signatures: [['?key']],
    receivers: ['Date']
  },
  {
    name: 'parse',
    signatures: [['s']],
    receivers: ['DateConstructor']
  },
  {
    name: 'parse',
    signatures: [['text','?reviver']],
    receivers: ['JSON']
  },
  {
    name: 'UTC',
    signatures: [['year','monthIndex','?date','?hours','?minutes','?seconds','?ms']]
  },
  {
    name: 'exec',
    signatures: [['string']]
  },
  {
    name: 'test',
    signatures: [['string']]
  },
  {
    name: 'compile',
    signatures: [['pattern','?flags']]
  },
  {
    name: 'stringify',
    signatures: [['value','?replacer','?space']]
  },
  {
    name: 'join',
    signatures: [['?separator']]
  },
  {
    name: 'every',
    signatures: [['predicate','?thisArg']]
  },
  {
    name: 'some',
    signatures: [['predicate','?thisArg']]
  },
  {
    name: 'forEach',
    signatures: [['callbackfn','?thisArg']]
  },
  {
    name: 'map',
    signatures: [['callbackfn','?thisArg']]
  },
  {
    name: 'filter',
    signatures: [['predicate','?thisArg']]
  },
  {
    name: 'reduce',
    signatures: [['callbackfn','?initialValue']]
  },
  {
    name: 'reduceRight',
    signatures: [['callbackfn','?initialValue']]
  },
  {
    name: 'push',
    signatures: [['...items']]
  },
  {
    name: 'sort',
    signatures: [['?compareFn']],
    receivers: ['Array','Int8Array','Uint8Array','Uint8ClampedArray','Int16Array','Uint16Array','Int32Array','Uint32Array','Float32Array','Float64Array']
  },
  {
    name: 'splice',
    signatures: [['start','?deleteCount','...items']]
  },
  {
    name: 'unshift',
    signatures: [['...items']]
  },
  {
    name: 'isArray',
    signatures: [['arg']]
  },
  {
    name: 'then',
    signatures: [['?onfulfilled','?onrejected']]
  },
  {
    name: 'catch',
    signatures: [['?onrejected']]
  },
  {
    name: 'isView',
    signatures: [['arg']]
  },
  {
    name: 'getFloat32',
    signatures: [['byteOffset','?littleEndian']]
  },
  {
    name: 'getFloat64',
    signatures: [['byteOffset','?littleEndian']]
  },
  {
    name: 'getInt8',
    signatures: [['byteOffset']]
  },
  {
    name: 'getInt16',
    signatures: [['byteOffset','?littleEndian']]
  },
  {
    name: 'getInt32',
    signatures: [['byteOffset','?littleEndian']]
  },
  {
    name: 'getUint8',
    signatures: [['byteOffset']]
  },
  {
    name: 'getUint16',
    signatures: [['byteOffset','?littleEndian']]
  },
  {
    name: 'getUint32',
    signatures: [['byteOffset','?littleEndian']]
  },
  {
    name: 'setFloat32',
    signatures: [['byteOffset','value','?littleEndian']]
  },
  {
    name: 'setFloat64',
    signatures: [['byteOffset','value','?littleEndian']]
  },
  {
    name: 'setInt8',
    signatures: [['byteOffset','value']]
  },
  {
    name: 'setInt16',
    signatures: [['byteOffset','value','?littleEndian']]
  },
  {
    name: 'setInt32',
    signatures: [['byteOffset','value','?littleEndian']]
  },
  {
    name: 'setUint8',
    signatures: [['byteOffset','value']]
  },
  {
    name: 'setUint16',
    signatures: [['byteOffset','value','?littleEndian']]
  },
  {
    name: 'setUint32',
    signatures: [['byteOffset','value','?littleEndian']]
  },
  {
    name: 'copyWithin',
    signatures: [['target','start','?end']]
  },
  {
    name: 'fill',
    signatures: [['value','?start','?end']],
    receivers: ['Int8Array','Uint8Array','Uint8ClampedArray','Int16Array','Uint16Array','Int32Array','Uint32Array','Float32Array','Float64Array']
  },
  {
    name: 'fill',
    signatures: [['?fillRule'],['path','?fillRule']],
    receivers: ['CanvasDrawPath']
  },
  {
    name: 'find',
    signatures: [['predicate','?thisArg']]
  },
  {
    name: 'findIndex',
    signatures: [['predicate','?thisArg']]
  },
  {
    name: 'subarray',
    signatures: [['?begin','?end']]
  },
  {
    name: 'of',
    signatures: [['...items']]
  },
  {
    name: 'from',
    signatures: [['arrayLike','?mapfn','?thisArg']]
  },
  {
    name: 'drawArraysInstancedANGLE',
    signatures: [['mode','first','count','primcount']]
  },
  {
    name: 'drawElementsInstancedANGLE',
    signatures: [['mode','count','type','offset','primcount']]
  },
  {
    name: 'vertexAttribDivisorANGLE',
    signatures: [['index','divisor']]
  },
  {
    name: 'abort',
    signatures: [['?reason']],
    receivers: ['AbortController','WritableStream','WritableStreamDefaultWriter']
  },
  {
    name: 'addEventListener',
    signatures: [['type','listener','?options']],
    receivers: ['AbortSignal','AbstractWorker','Animation','AudioBufferSourceNode','AudioContext','AudioScheduledSourceNode','AudioWorkletNode','BaseAudioContext','BroadcastChannel','CSSAnimation','CSSTransition','CanvasCaptureMediaStreamTrack','ConstantSourceNode','Document','DocumentAndElementEventHandlers','Element','EventSource','FileReader','FontFaceSet','GlobalEventHandlers','HTMLAnchorElement','HTMLAreaElement','HTMLAudioElement','HTMLBRElement','HTMLBaseElement','HTMLBodyElement','HTMLButtonElement','HTMLCanvasElement','HTMLDListElement','HTMLDataElement','HTMLDataListElement','HTMLDetailsElement','HTMLDialogElement','HTMLDirectoryElement','HTMLDivElement','HTMLDocument','HTMLElement','HTMLEmbedElement','HTMLFieldSetElement','HTMLFontElement','HTMLFormElement','HTMLFrameElement','HTMLFrameSetElement','HTMLHRElement','HTMLHeadElement','HTMLHeadingElement','HTMLHtmlElement','HTMLIFrameElement','HTMLImageElement','HTMLInputElement','HTMLLIElement','HTMLLabelElement','HTMLLegendElement','HTMLLinkElement','HTMLMapElement','HTMLMarqueeElement','HTMLMediaElement','HTMLMenuElement','HTMLMetaElement','HTMLMeterElement','HTMLModElement','HTMLOListElement','HTMLObjectElement','HTMLOptGroupElement','HTMLOptionElement','HTMLOutputElement','HTMLParagraphElement','HTMLParamElement','HTMLPictureElement','HTMLPreElement','HTMLProgressElement','HTMLQuoteElement','HTMLScriptElement','HTMLSelectElement','HTMLSlotElement','HTMLSourceElement','HTMLSpanElement','HTMLStyleElement','HTMLTableCaptionElement','HTMLTableCellElement','HTMLTableColElement','HTMLTableDataCellElement','HTMLTableElement','HTMLTableHeaderCellElement','HTMLTableRowElement','HTMLTableSectionElement','HTMLTemplateElement','HTMLTextAreaElement','HTMLTimeElement','HTMLTitleElement','HTMLTrackElement','HTMLUListElement','HTMLUnknownElement','HTMLVideoElement','IDBDatabase','IDBOpenDBRequest','IDBRequest','IDBTransaction','MathMLElement','MediaDevices','MediaKeySession','MediaQueryList','MediaRecorder','MediaSource','MediaStream','MediaStreamTrack','MessagePort','Notification','OfflineAudioContext','OffscreenCanvas','OscillatorNode','PaymentRequest','Performance','PermissionStatus','PictureInPictureWindow','RTCDTMFSender','RTCDataChannel','RTCDtlsTransport','RTCIceTransport','RTCPeerConnection','RTCSctpTransport','RemotePlayback','SVGAElement','SVGAnimateElement','SVGAnimateMotionElement','SVGAnimateTransformElement','SVGAnimationElement','SVGCircleElement','SVGClipPathElement','SVGComponentTransferFunctionElement','SVGDefsElement','SVGDescElement','SVGElement','SVGEllipseElement','SVGFEBlendElement','SVGFEColorMatrixElement','SVGFEComponentTransferElement','SVGFECompositeElement','SVGFEConvolveMatrixElement','SVGFEDiffuseLightingElement','SVGFEDisplacementMapElement','SVGFEDistantLightElement','SVGFEDropShadowElement','SVGFEFloodElement','SVGFEFuncAElement','SVGFEFuncBElement','SVGFEFuncGElement','SVGFEFuncRElement','SVGFEGaussianBlurElement','SVGFEImageElement','SVGFEMergeElement','SVGFEMergeNodeElement','SVGFEMorphologyElement','SVGFEOffsetElement','SVGFEPointLightElement','SVGFESpecularLightingElement','SVGFESpotLightElement','SVGFETileElement','SVGFETurbulenceElement','SVGFilterElement','SVGForeignObjectElement','SVGGElement','SVGGeometryElement','SVGGradientElement','SVGGraphicsElement','SVGImageElement','SVGLineElement','SVGLinearGradientElement','SVGMPathElement','SVGMarkerElement','SVGMaskElement','SVGMetadataElement','SVGPathElement','SVGPatternElement','SVGPolygonElement','SVGPolylineElement','SVGRadialGradientElement','SVGRectElement','SVGSVGElement','SVGScriptElement','SVGSetElement','SVGStopElement','SVGStyleElement','SVGSwitchElement','SVGSymbolElement','SVGTSpanElement','SVGTextContentElement','SVGTextElement','SVGTextPathElement','SVGTextPositioningElement','SVGTitleElement','SVGUseElement','SVGViewElement','ScreenOrientation','ScriptProcessorNode','ServiceWorker','ServiceWorkerContainer','ServiceWorkerRegistration','ShadowRoot','SharedWorker','SourceBuffer','SourceBufferList','SpeechSynthesis','SpeechSynthesisUtterance','TextTrack','TextTrackCue','TextTrackList','VTTCue','VisualViewport','WebSocket','Window','WindowEventHandlers','Worker','XMLDocument','XMLHttpRequest','XMLHttpRequestEventTarget','XMLHttpRequestUpload']
  },
  {
    name: 'addEventListener',
    signatures: [['type','callback','?options']],
    receivers: ['EventTarget']
  },
  {
    name: 'removeEventListener',
    signatures: [['type','listener','?options']],
    receivers: ['AbortSignal','AbstractWorker','Animation','AudioBufferSourceNode','AudioContext','AudioScheduledSourceNode','AudioWorkletNode','BaseAudioContext','BroadcastChannel','CSSAnimation','CSSTransition','CanvasCaptureMediaStreamTrack','ConstantSourceNode','Document','DocumentAndElementEventHandlers','Element','EventSource','FileReader','FontFaceSet','GlobalEventHandlers','HTMLAnchorElement','HTMLAreaElement','HTMLAudioElement','HTMLBRElement','HTMLBaseElement','HTMLBodyElement','HTMLButtonElement','HTMLCanvasElement','HTMLDListElement','HTMLDataElement','HTMLDataListElement','HTMLDetailsElement','HTMLDialogElement','HTMLDirectoryElement','HTMLDivElement','HTMLDocument','HTMLElement','HTMLEmbedElement','HTMLFieldSetElement','HTMLFontElement','HTMLFormElement','HTMLFrameElement','HTMLFrameSetElement','HTMLHRElement','HTMLHeadElement','HTMLHeadingElement','HTMLHtmlElement','HTMLIFrameElement','HTMLImageElement','HTMLInputElement','HTMLLIElement','HTMLLabelElement','HTMLLegendElement','HTMLLinkElement','HTMLMapElement','HTMLMarqueeElement','HTMLMediaElement','HTMLMenuElement','HTMLMetaElement','HTMLMeterElement','HTMLModElement','HTMLOListElement','HTMLObjectElement','HTMLOptGroupElement','HTMLOptionElement','HTMLOutputElement','HTMLParagraphElement','HTMLParamElement','HTMLPictureElement','HTMLPreElement','HTMLProgressElement','HTMLQuoteElement','HTMLScriptElement','HTMLSelectElement','HTMLSlotElement','HTMLSourceElement','HTMLSpanElement','HTMLStyleElement','HTMLTableCaptionElement','HTMLTableCellElement','HTMLTableColElement','HTMLTableDataCellElement','HTMLTableElement','HTMLTableHeaderCellElement','HTMLTableRowElement','HTMLTableSectionElement','HTMLTemplateElement','HTMLTextAreaElement','HTMLTimeElement','HTMLTitleElement','HTMLTrackElement','HTMLUListElement','HTMLUnknownElement','HTMLVideoElement','IDBDatabase','IDBOpenDBRequest','IDBRequest','IDBTransaction','MathMLElement','MediaDevices','MediaKeySession','MediaQueryList','MediaRecorder','MediaSource','MediaStream','MediaStreamTrack','MessagePort','Notification','OfflineAudioContext','OffscreenCanvas','OscillatorNode','PaymentRequest','Performance','PermissionStatus','PictureInPictureWindow','RTCDTMFSender','RTCDataChannel','RTCDtlsTransport','RTCIceTransport','RTCPeerConnection','RTCSctpTransport','RemotePlayback','SVGAElement','SVGAnimateElement','SVGAnimateMotionElement','SVGAnimateTransformElement','SVGAnimationElement','SVGCircleElement','SVGClipPathElement','SVGComponentTransferFunctionElement','SVGDefsElement','SVGDescElement','SVGElement','SVGEllipseElement','SVGFEBlendElement','SVGFEColorMatrixElement','SVGFEComponentTransferElement','SVGFECompositeElement','SVGFEConvolveMatrixElement','SVGFEDiffuseLightingElement','SVGFEDisplacementMapElement','SVGFEDistantLightElement','SVGFEDropShadowElement','SVGFEFloodElement','SVGFEFuncAElement','SVGFEFuncBElement','SVGFEFuncGElement','SVGFEFuncRElement','SVGFEGaussianBlurElement','SVGFEImageElement','SVGFEMergeElement','SVGFEMergeNodeElement','SVGFEMorphologyElement','SVGFEOffsetElement','SVGFEPointLightElement','SVGFESpecularLightingElement','SVGFESpotLightElement','SVGFETileElement','SVGFETurbulenceElement','SVGFilterElement','SVGForeignObjectElement','SVGGElement','SVGGeometryElement','SVGGradientElement','SVGGraphicsElement','SVGImageElement','SVGLineElement','SVGLinearGradientElement','SVGMPathElement','SVGMarkerElement','SVGMaskElement','SVGMetadataElement','SVGPathElement','SVGPatternElement','SVGPolygonElement','SVGPolylineElement','SVGRadialGradientElement','SVGRectElement','SVGSVGElement','SVGScriptElement','SVGSetElement','SVGStopElement','SVGStyleElement','SVGSwitchElement','SVGSymbolElement','SVGTSpanElement','SVGTextContentElement','SVGTextElement','SVGTextPathElement','SVGTextPositioningElement','SVGTitleElement','SVGUseElement','SVGViewElement','ScreenOrientation','ScriptProcessorNode','ServiceWorker','ServiceWorkerContainer','ServiceWorkerRegistration','ShadowRoot','SharedWorker','SourceBuffer','SourceBufferList','SpeechSynthesis','SpeechSynthesisUtterance','TextTrack','TextTrackCue','TextTrackList','VTTCue','VisualViewport','WebSocket','Window','WindowEventHandlers','Worker','XMLDocument','XMLHttpRequest','XMLHttpRequestEventTarget','XMLHttpRequestUpload']
  },
  {
    name: 'removeEventListener',
    signatures: [['type','callback','?options']],
    receivers: ['EventTarget']
  },
  {
    name: 'getByteFrequencyData',
    signatures: [['array']]
  },
  {
    name: 'getByteTimeDomainData',
    signatures: [['array']]
  },
  {
    name: 'getFloatFrequencyData',
    signatures: [['array']]
  },
  {
    name: 'getFloatTimeDomainData',
    signatures: [['array']]
  },
  {
    name: 'animate',
    signatures: [['keyframes','?options']]
  },
  {
    name: 'getAnimations',
    signatures: [['?options']],
    receivers: ['Animatable']
  },
  {
    name: 'cancel',
    signatures: [['?reason']],
    receivers: ['ReadableStream','ReadableStreamGenericReader']
  },
  {
    name: 'updatePlaybackRate',
    signatures: [['playbackRate']]
  },
  {
    name: 'updateTiming',
    signatures: [['?timing']]
  },
  {
    name: 'cancelAnimationFrame',
    signatures: [['handle']]
  },
  {
    name: 'requestAnimationFrame',
    signatures: [['callback']]
  },
  {
    name: 'copyFromChannel',
    signatures: [['destination','channelNumber','?bufferOffset']]
  },
  {
    name: 'copyToChannel',
    signatures: [['source','channelNumber','?bufferOffset']]
  },
  {
    name: 'getChannelData',
    signatures: [['channel']]
  },
  {
    name: 'start',
    signatures: [['?when','?offset','?duration']],
    receivers: ['AudioBufferSourceNode']
  },
  {
    name: 'start',
    signatures: [['?when']],
    receivers: ['AudioScheduledSourceNode']
  },
  {
    name: 'start',
    signatures: [['?timeslice']],
    receivers: ['MediaRecorder']
  },
  {
    name: 'start',
    signatures: [['index']],
    receivers: ['TimeRanges']
  },
  {
    name: 'close',
    signatures: [['?returnValue']],
    receivers: ['HTMLDialogElement']
  },
  {
    name: 'close',
    signatures: [['?code','?reason']],
    receivers: ['WebSocket']
  },
  {
    name: 'createMediaElementSource',
    signatures: [['mediaElement']]
  },
  {
    name: 'createMediaStreamSource',
    signatures: [['mediaStream']]
  },
  {
    name: 'suspend',
    signatures: [['suspendTime']],
    receivers: ['OfflineAudioContext']
  },
  {
    name: 'setOrientation',
    signatures: [['x','y','z','xUp','yUp','zUp']],
    receivers: ['AudioListener']
  },
  {
    name: 'setOrientation',
    signatures: [['x','y','z']],
    receivers: ['PannerNode']
  },
  {
    name: 'setPosition',
    signatures: [['x','y','z']],
    receivers: ['AudioListener','PannerNode']
  },
  {
    name: 'setPosition',
    signatures: [['node','?offset']],
    receivers: ['Selection']
  },
  {
    name: 'connect',
    signatures: [['destinationParam','?output'],['destinationNode','?output','?input']]
  },
  {
    name: 'disconnect',
    signatures: [['?output'],['destinationNode','?output','?input'],['destinationParam','?output']],
    receivers: ['AudioNode']
  },
  {
    name: 'cancelAndHoldAtTime',
    signatures: [['cancelTime']]
  },
  {
    name: 'cancelScheduledValues',
    signatures: [['cancelTime']]
  },
  {
    name: 'exponentialRampToValueAtTime',
    signatures: [['value','endTime']]
  },
  {
    name: 'linearRampToValueAtTime',
    signatures: [['value','endTime']]
  },
  {
    name: 'setTargetAtTime',
    signatures: [['target','startTime','timeConstant']]
  },
  {
    name: 'setValueAtTime',
    signatures: [['value','startTime']]
  },
  {
    name: 'setValueCurveAtTime',
    signatures: [['values','startTime','duration']]
  },
  {
    name: 'stop',
    signatures: [['?when']],
    receivers: ['AudioScheduledSourceNode']
  },
  {
    name: 'createBuffer',
    signatures: [['numberOfChannels','length','sampleRate']],
    receivers: ['BaseAudioContext']
  },
  {
    name: 'createChannelMerger',
    signatures: [['?numberOfInputs']]
  },
  {
    name: 'createChannelSplitter',
    signatures: [['?numberOfOutputs']]
  },
  {
    name: 'createDelay',
    signatures: [['?maxDelayTime']]
  },
  {
    name: 'createIIRFilter',
    signatures: [['feedforward','feedback']]
  },
  {
    name: 'createPeriodicWave',
    signatures: [['real','imag','?constraints']]
  },
  {
    name: 'createScriptProcessor',
    signatures: [['?bufferSize','?numberOfInputChannels','?numberOfOutputChannels']]
  },
  {
    name: 'decodeAudioData',
    signatures: [['audioData','?successCallback','?errorCallback']]
  },
  {
    name: 'getFrequencyResponse',
    signatures: [['frequencyHz','magResponse','phaseResponse']]
  },
  {
    name: 'postMessage',
    signatures: [['message']],
    receivers: ['BroadcastChannel']
  },
  {
    name: 'postMessage',
    signatures: [['message','transfer'],['message','?options']],
    receivers: ['MessagePort','ServiceWorker','Worker']
  },
  {
    name: 'postMessage',
    signatures: [['message','?options'],['message','targetOrigin','?transfer']],
    receivers: ['Window']
  },
  {
    name: 'deleteRule',
    signatures: [['index']],
    receivers: ['CSSGroupingRule','CSSStyleSheet']
  },
  {
    name: 'deleteRule',
    signatures: [['select']],
    receivers: ['CSSKeyframesRule']
  },
  {
    name: 'insertRule',
    signatures: [['rule','?index']]
  },
  {
    name: 'appendRule',
    signatures: [['rule']]
  },
  {
    name: 'findRule',
    signatures: [['select']]
  },
  {
    name: 'item',
    signatures: [['index']],
    receivers: ['CSSRuleList','CSSStyleDeclaration','DOMRectList','DOMStringList','DOMTokenList','FileList','HTMLCollectionBase','HTMLCollectionOf','HTMLSelectElement','MediaList','MimeTypeArray','NamedNodeMap','NodeList','NodeListOf','Plugin','PluginArray','SpeechRecognitionResult','SpeechRecognitionResultList','StyleSheetList','TouchList']
  },
  {
    name: 'item',
    signatures: [['?nameOrIndex']],
    receivers: ['HTMLAllCollection']
  },
  {
    name: 'getPropertyPriority',
    signatures: [['property']]
  },
  {
    name: 'getPropertyValue',
    signatures: [['property']]
  },
  {
    name: 'removeProperty',
    signatures: [['property']]
  },
  {
    name: 'setProperty',
    signatures: [['property','value','?priority']]
  },
  {
    name: 'addRule',
    signatures: [['?selector','?style','?index']]
  },
  {
    name: 'removeRule',
    signatures: [['?index']]
  },
  {
    name: 'replaceSync',
    signatures: [['text']]
  },
  {
    name: 'add',
    signatures: [['request']],
    receivers: ['Cache']
  },
  {
    name: 'add',
    signatures: [['...tokens']],
    receivers: ['DOMTokenList']
  },
  {
    name: 'add',
    signatures: [['data','?type']],
    receivers: ['DataTransferItemList']
  },
  {
    name: 'add',
    signatures: [['element','?before']],
    receivers: ['HTMLOptionsCollection','HTMLSelectElement']
  },
  {
    name: 'add',
    signatures: [['value','?key']],
    receivers: ['IDBObjectStore']
  },
  {
    name: 'addAll',
    signatures: [['requests']]
  },
  {
    name: 'delete',
    signatures: [['request','?options']],
    receivers: ['Cache']
  },
  {
    name: 'delete',
    signatures: [['cacheName']],
    receivers: ['CacheStorage']
  },
  {
    name: 'delete',
    signatures: [['name']],
    receivers: ['FormData','Headers','URLSearchParams']
  },
  {
    name: 'delete',
    signatures: [['query']],
    receivers: ['IDBObjectStore']
  },
  {
    name: 'matchAll',
    signatures: [['?request','?options']]
  },
  {
    name: 'put',
    signatures: [['request','response']],
    receivers: ['Cache']
  },
  {
    name: 'put',
    signatures: [['value','?key']],
    receivers: ['IDBObjectStore']
  },
  {
    name: 'has',
    signatures: [['cacheName']],
    receivers: ['CacheStorage']
  },
  {
    name: 'has',
    signatures: [['name']],
    receivers: ['FormData','Headers','URLSearchParams']
  },
  {
    name: 'has',
    signatures: [['keyId']],
    receivers: ['MediaKeyStatusMap']
  },
  {
    name: 'open',
    signatures: [['cacheName']],
    receivers: ['CacheStorage']
  },
  {
    name: 'open',
    signatures: [['?unused1','?unused2'],['url','name','features']],
    receivers: ['Document']
  },
  {
    name: 'open',
    signatures: [['name','?version']],
    receivers: ['IDBFactory']
  },
  {
    name: 'open',
    signatures: [['?url','?target','?features']],
    receivers: ['Window']
  },
  {
    name: 'open',
    signatures: [['method','url','?async','?username','?password']],
    receivers: ['XMLHttpRequest']
  },
  {
    name: 'drawImage',
    signatures: [['image','dx','dy','?dw','?dh'],['image','sx','sy','sw','sh','dx','dy','dw','dh']]
  },
  {
    name: 'clip',
    signatures: [['?fillRule'],['path','?fillRule']]
  },
  {
    name: 'isPointInPath',
    signatures: [['x','y','?fillRule'],['path','x','y','?fillRule']]
  },
  {
    name: 'isPointInStroke',
    signatures: [['x','y'],['path','x','y']],
    receivers: ['CanvasDrawPath']
  },
  {
    name: 'isPointInStroke',
    signatures: [['?point']],
    receivers: ['SVGGeometryElement']
  },
  {
    name: 'stroke',
    signatures: [['?path']]
  },
  {
    name: 'createConicGradient',
    signatures: [['startAngle','x','y']]
  },
  {
    name: 'createLinearGradient',
    signatures: [['x0','y0','x1','y1']]
  },
  {
    name: 'createPattern',
    signatures: [['image','repetition']]
  },
  {
    name: 'createRadialGradient',
    signatures: [['x0','y0','r0','x1','y1','r1']]
  },
  {
    name: 'addColorStop',
    signatures: [['offset','color']]
  },
  {
    name: 'createImageData',
    signatures: [['imagedata'],['sw','sh','?settings']]
  },
  {
    name: 'getImageData',
    signatures: [['sx','sy','sw','sh','?settings']]
  },
  {
    name: 'putImageData',
    signatures: [['imagedata','dx','dy','?dirtyX','?dirtyY','?dirtyWidth','?dirtyHeight']]
  },
  {
    name: 'arc',
    signatures: [['x','y','radius','startAngle','endAngle','?counterclockwise']]
  },
  {
    name: 'arcTo',
    signatures: [['x1','y1','x2','y2','radius']]
  },
  {
    name: 'bezierCurveTo',
    signatures: [['cp1x','cp1y','cp2x','cp2y','x','y']]
  },
  {
    name: 'ellipse',
    signatures: [['x','y','radiusX','radiusY','rotation','startAngle','endAngle','?counterclockwise']]
  },
  {
    name: 'lineTo',
    signatures: [['x','y']]
  },
  {
    name: 'moveTo',
    signatures: [['x','y']]
  },
  {
    name: 'quadraticCurveTo',
    signatures: [['cpx','cpy','x','y']]
  },
  {
    name: 'rect',
    signatures: [['x','y','w','h']]
  },
  {
    name: 'roundRect',
    signatures: [['x','y','w','h','?radii']]
  },
  {
    name: 'setLineDash',
    signatures: [['segments']]
  },
  {
    name: 'setTransform',
    signatures: [['?transform']],
    receivers: ['CanvasPattern']
  },
  {
    name: 'setTransform',
    signatures: [['?transform'],['a','b','c','d','e','f']],
    receivers: ['CanvasTransform']
  },
  {
    name: 'clearRect',
    signatures: [['x','y','w','h']]
  },
  {
    name: 'fillRect',
    signatures: [['x','y','w','h']]
  },
  {
    name: 'strokeRect',
    signatures: [['x','y','w','h']]
  },
  {
    name: 'fillText',
    signatures: [['text','x','y','?maxWidth']]
  },
  {
    name: 'measureText',
    signatures: [['text']]
  },
  {
    name: 'strokeText',
    signatures: [['text','x','y','?maxWidth']]
  },
  {
    name: 'rotate',
    signatures: [['angle']],
    receivers: ['CanvasTransform']
  },
  {
    name: 'rotate',
    signatures: [['?rotX','?rotY','?rotZ']],
    receivers: ['DOMMatrixReadOnly']
  },
  {
    name: 'scale',
    signatures: [['x','y']],
    receivers: ['CanvasTransform']
  },
  {
    name: 'scale',
    signatures: [['?scaleX','?scaleY','?scaleZ','?originX','?originY','?originZ']],
    receivers: ['DOMMatrixReadOnly']
  },
  {
    name: 'transform',
    signatures: [['a','b','c','d','e','f']]
  },
  {
    name: 'translate',
    signatures: [['x','y']],
    receivers: ['CanvasTransform']
  },
  {
    name: 'translate',
    signatures: [['?tx','?ty','?tz']],
    receivers: ['DOMMatrixReadOnly']
  },
  {
    name: 'drawFocusIfNeeded',
    signatures: [['element'],['path','element']]
  },
  {
    name: 'appendData',
    signatures: [['data']]
  },
  {
    name: 'deleteData',
    signatures: [['offset','count']]
  },
  {
    name: 'insertData',
    signatures: [['offset','data']]
  },
  {
    name: 'replaceData',
    signatures: [['offset','count','data']]
  },
  {
    name: 'substringData',
    signatures: [['offset','count']]
  },
  {
    name: 'after',
    signatures: [['...nodes']]
  },
  {
    name: 'before',
    signatures: [['...nodes']]
  },
  {
    name: 'remove',
    signatures: [['...tokens']],
    receivers: ['DOMTokenList']
  },
  {
    name: 'remove',
    signatures: [['index']],
    receivers: ['DataTransferItemList','HTMLOptionsCollection']
  },
  {
    name: 'remove',
    signatures: [['?index']],
    receivers: ['HTMLSelectElement']
  },
  {
    name: 'remove',
    signatures: [['start','end']],
    receivers: ['SourceBuffer']
  },
  {
    name: 'replaceWith',
    signatures: [['...nodes']]
  },
  {
    name: 'read',
    signatures: [['view']],
    receivers: ['ReadableStreamBYOBReader']
  },
  {
    name: 'write',
    signatures: [['data']],
    receivers: ['Clipboard']
  },
  {
    name: 'write',
    signatures: [['...text']],
    receivers: ['Document']
  },
  {
    name: 'write',
    signatures: [['?chunk']],
    receivers: ['WritableStreamDefaultWriter']
  },
  {
    name: 'writeText',
    signatures: [['data']]
  },
  {
    name: 'getType',
    signatures: [['type']]
  },
  {
    name: 'initCompositionEvent',
    signatures: [['typeArg','?bubblesArg','?cancelableArg','?viewArg','?dataArg']]
  },
  {
    name: 'store',
    signatures: [['credential']]
  },
  {
    name: 'getRandomValues',
    signatures: [['array']]
  },
  {
    name: 'define',
    signatures: [['name','constructor','?options']]
  },
  {
    name: 'upgrade',
    signatures: [['root']]
  },
  {
    name: 'whenDefined',
    signatures: [['name']]
  },
  {
    name: 'initCustomEvent',
    signatures: [['type','?bubbles','?cancelable','?detail']]
  },
  {
    name: 'createDocument',
    signatures: [['namespace','qualifiedName','?doctype']]
  },
  {
    name: 'createDocumentType',
    signatures: [['qualifiedName','publicId','systemId']]
  },
  {
    name: 'createHTMLDocument',
    signatures: [['?title']]
  },
  {
    name: 'hasFeature',
    signatures: [['...args']]
  },
  {
    name: 'multiplySelf',
    signatures: [['?other']]
  },
  {
    name: 'preMultiplySelf',
    signatures: [['?other']]
  },
  {
    name: 'rotateAxisAngleSelf',
    signatures: [['?x','?y','?z','?angle']]
  },
  {
    name: 'rotateFromVectorSelf',
    signatures: [['?x','?y']]
  },
  {
    name: 'rotateSelf',
    signatures: [['?rotX','?rotY','?rotZ']]
  },
  {
    name: 'scale3dSelf',
    signatures: [['?scale','?originX','?originY','?originZ']]
  },
  {
    name: 'scaleSelf',
    signatures: [['?scaleX','?scaleY','?scaleZ','?originX','?originY','?originZ']]
  },
  {
    name: 'setMatrixValue',
    signatures: [['transformList']]
  },
  {
    name: 'skewXSelf',
    signatures: [['?sx']]
  },
  {
    name: 'skewYSelf',
    signatures: [['?sy']]
  },
  {
    name: 'translateSelf',
    signatures: [['?tx','?ty','?tz']]
  },
  {
    name: 'multiply',
    signatures: [['?other']]
  },
  {
    name: 'rotateAxisAngle',
    signatures: [['?x','?y','?z','?angle']]
  },
  {
    name: 'rotateFromVector',
    signatures: [['?x','?y']]
  },
  {
    name: 'scale3d',
    signatures: [['?scale','?originX','?originY','?originZ']]
  },
  {
    name: 'scaleNonUniform',
    signatures: [['?scaleX','?scaleY']]
  },
  {
    name: 'skewX',
    signatures: [['?sx']]
  },
  {
    name: 'skewY',
    signatures: [['?sy']]
  },
  {
    name: 'transformPoint',
    signatures: [['?point']]
  },
  {
    name: 'parseFromString',
    signatures: [['string','type']]
  },
  {
    name: 'matrixTransform',
    signatures: [['?matrix']]
  },
  {
    name: 'contains',
    signatures: [['string']],
    receivers: ['DOMStringList']
  },
  {
    name: 'contains',
    signatures: [['token']],
    receivers: ['DOMTokenList']
  },
  {
    name: 'contains',
    signatures: [['other']],
    receivers: ['Node']
  },
  {
    name: 'supports',
    signatures: [['token']]
  },
  {
    name: 'toggle',
    signatures: [['token','?force']]
  },
  {
    name: 'clearData',
    signatures: [['?format']]
  },
  {
    name: 'getData',
    signatures: [['format']]
  },
  {
    name: 'setData',
    signatures: [['format','data']]
  },
  {
    name: 'setDragImage',
    signatures: [['image','x','y']]
  },
  {
    name: 'getAsString',
    signatures: [['callback']]
  },
  {
    name: 'clear',
    signatures: [['mask']],
    receivers: ['WebGLRenderingContextBase']
  },
  {
    name: 'adoptNode',
    signatures: [['node']]
  },
  {
    name: 'caretRangeFromPoint',
    signatures: [['x','y']]
  },
  {
    name: 'createAttribute',
    signatures: [['localName']]
  },
  {
    name: 'createAttributeNS',
    signatures: [['namespace','qualifiedName']]
  },
  {
    name: 'createCDATASection',
    signatures: [['data']]
  },
  {
    name: 'createComment',
    signatures: [['data']]
  },
  {
    name: 'createElement',
    signatures: [['tagName','?options']]
  },
  {
    name: 'createElementNS',
    signatures: [['namespaceURI','qualifiedName','?options'],['namespace','qualifiedName','?options']]
  },
  {
    name: 'createEvent',
    signatures: [['eventInterface']]
  },
  {
    name: 'createNodeIterator',
    signatures: [['root','?whatToShow','?filter']]
  },
  {
    name: 'createProcessingInstruction',
    signatures: [['target','data']]
  },
  {
    name: 'createTextNode',
    signatures: [['data']]
  },
  {
    name: 'createTreeWalker',
    signatures: [['root','?whatToShow','?filter']]
  },
  {
    name: 'execCommand',
    signatures: [['commandId','?showUI','?value']]
  },
  {
    name: 'getElementById',
    signatures: [['elementId']]
  },
  {
    name: 'getElementsByClassName',
    signatures: [['classNames']]
  },
  {
    name: 'getElementsByName',
    signatures: [['elementName']]
  },
  {
    name: 'getElementsByTagName',
    signatures: [['qualifiedName']]
  },
  {
    name: 'getElementsByTagNameNS',
    signatures: [['namespaceURI','localName'],['namespace','localName']]
  },
  {
    name: 'importNode',
    signatures: [['node','?deep']]
  },
  {
    name: 'queryCommandEnabled',
    signatures: [['commandId']]
  },
  {
    name: 'queryCommandIndeterm',
    signatures: [['commandId']]
  },
  {
    name: 'queryCommandState',
    signatures: [['commandId']]
  },
  {
    name: 'queryCommandSupported',
    signatures: [['commandId']]
  },
  {
    name: 'queryCommandValue',
    signatures: [['commandId']]
  },
  {
    name: 'writeln',
    signatures: [['...text']]
  },
  {
    name: 'elementFromPoint',
    signatures: [['x','y']]
  },
  {
    name: 'elementsFromPoint',
    signatures: [['x','y']]
  },
  {
    name: 'attachShadow',
    signatures: [['init']]
  },
  {
    name: 'closest',
    signatures: [['selector'],['selectors']]
  },
  {
    name: 'getAttribute',
    signatures: [['qualifiedName']]
  },
  {
    name: 'getAttributeNS',
    signatures: [['namespace','localName']]
  },
  {
    name: 'getAttributeNode',
    signatures: [['qualifiedName']]
  },
  {
    name: 'getAttributeNodeNS',
    signatures: [['namespace','localName']]
  },
  {
    name: 'hasAttribute',
    signatures: [['qualifiedName']]
  },
  {
    name: 'hasAttributeNS',
    signatures: [['namespace','localName']]
  },
  {
    name: 'hasPointerCapture',
    signatures: [['pointerId']]
  },
  {
    name: 'insertAdjacentElement',
    signatures: [['where','element']]
  },
  {
    name: 'insertAdjacentHTML',
    signatures: [['position','text']]
  },
  {
    name: 'insertAdjacentText',
    signatures: [['where','data']]
  },
  {
    name: 'matches',
    signatures: [['selectors']]
  },
  {
    name: 'releasePointerCapture',
    signatures: [['pointerId']]
  },
  {
    name: 'removeAttribute',
    signatures: [['qualifiedName']]
  },
  {
    name: 'removeAttributeNS',
    signatures: [['namespace','localName']]
  },
  {
    name: 'removeAttributeNode',
    signatures: [['attr']]
  },
  {
    name: 'requestFullscreen',
    signatures: [['?options']]
  },
  {
    name: 'scroll',
    signatures: [['?options'],['x','y']]
  },
  {
    name: 'scrollBy',
    signatures: [['?options'],['x','y']]
  },
  {
    name: 'scrollIntoView',
    signatures: [['?arg']]
  },
  {
    name: 'scrollTo',
    signatures: [['?options'],['x','y']]
  },
  {
    name: 'setAttribute',
    signatures: [['qualifiedName','value']]
  },
  {
    name: 'setAttributeNS',
    signatures: [['namespace','qualifiedName','value']]
  },
  {
    name: 'setAttributeNode',
    signatures: [['attr']]
  },
  {
    name: 'setAttributeNodeNS',
    signatures: [['attr']]
  },
  {
    name: 'setPointerCapture',
    signatures: [['pointerId']]
  },
  {
    name: 'toggleAttribute',
    signatures: [['qualifiedName','?force']]
  },
  {
    name: 'webkitMatchesSelector',
    signatures: [['selectors']]
  },
  {
    name: 'setFormValue',
    signatures: [['value','?state']]
  },
  {
    name: 'setValidity',
    signatures: [['?flags','?message','?anchor']]
  },
  {
    name: 'initEvent',
    signatures: [['type','?bubbles','?cancelable']]
  },
  {
    name: 'handleEvent',
    signatures: [['object']]
  },
  {
    name: 'dispatchEvent',
    signatures: [['event']]
  },
  {
    name: 'readAsArrayBuffer',
    signatures: [['blob']]
  },
  {
    name: 'readAsBinaryString',
    signatures: [['blob']]
  },
  {
    name: 'readAsDataURL',
    signatures: [['blob']]
  },
  {
    name: 'readAsText',
    signatures: [['blob','?encoding']]
  },
  {
    name: 'getDirectory',
    signatures: [['?path','?options','?successCallback','?errorCallback']],
    receivers: ['FileSystemDirectoryEntry']
  },
  {
    name: 'getFile',
    signatures: [['?path','?options','?successCallback','?errorCallback']],
    receivers: ['FileSystemDirectoryEntry']
  },
  {
    name: 'getDirectoryHandle',
    signatures: [['name','?options']]
  },
  {
    name: 'getFileHandle',
    signatures: [['name','?options']]
  },
  {
    name: 'removeEntry',
    signatures: [['name','?options']]
  },
  {
    name: 'resolve',
    signatures: [['possibleDescendant']]
  },
  {
    name: 'readEntries',
    signatures: [['successCallback','?errorCallback']]
  },
  {
    name: 'getParent',
    signatures: [['?successCallback','?errorCallback']]
  },
  {
    name: 'file',
    signatures: [['successCallback','?errorCallback']]
  },
  {
    name: 'isSameEntry',
    signatures: [['other']]
  },
  {
    name: 'load',
    signatures: [['font','?text']],
    receivers: ['FontFaceSet']
  },
  {
    name: 'load',
    signatures: [['sessionId']],
    receivers: ['MediaKeySession']
  },
  {
    name: 'check',
    signatures: [['font','?text']]
  },
  {
    name: 'append',
    signatures: [['name','value','?fileName']],
    receivers: ['FormData']
  },
  {
    name: 'append',
    signatures: [['name','value']],
    receivers: ['Headers','URLSearchParams']
  },
  {
    name: 'append',
    signatures: [['...nodes']],
    receivers: ['ParentNode']
  },
  {
    name: 'getAll',
    signatures: [['name']],
    receivers: ['FormData','URLSearchParams']
  },
  {
    name: 'getAll',
    signatures: [['?query','?count']],
    receivers: ['IDBIndex','IDBObjectStore']
  },
  {
    name: 'clearWatch',
    signatures: [['watchId']]
  },
  {
    name: 'getCurrentPosition',
    signatures: [['successCallback','?errorCallback','?options']]
  },
  {
    name: 'watchPosition',
    signatures: [['successCallback','?errorCallback','?options']]
  },
  {
    name: 'namedItem',
    signatures: [['name']]
  },
  {
    name: 'setCustomValidity',
    signatures: [['error']]
  },
  {
    name: 'captureStream',
    signatures: [['?frameRequestRate']]
  },
  {
    name: 'getContext',
    signatures: [['contextId','?options']]
  },
  {
    name: 'toBlob',
    signatures: [['callback','?type','?quality']]
  },
  {
    name: 'toDataURL',
    signatures: [['?type','?quality']]
  },
  {
    name: 'show',
    signatures: [['?detailsPromise']],
    receivers: ['PaymentRequest']
  },
  {
    name: 'requestSubmit',
    signatures: [['?submitter']]
  },
  {
    name: 'decode',
    signatures: [['?input','?options']],
    receivers: ['TextDecoder']
  },
  {
    name: 'setRangeText',
    signatures: [['replacement','?start','?end','?selectionMode']]
  },
  {
    name: 'setSelectionRange',
    signatures: [['start','end','?direction']]
  },
  {
    name: 'stepDown',
    signatures: [['?n']]
  },
  {
    name: 'stepUp',
    signatures: [['?n']]
  },
  {
    name: 'addTextTrack',
    signatures: [['kind','?label','?language']]
  },
  {
    name: 'canPlayType',
    signatures: [['type']]
  },
  {
    name: 'fastSeek',
    signatures: [['time']]
  },
  {
    name: 'setMediaKeys',
    signatures: [['mediaKeys']]
  },
  {
    name: 'focus',
    signatures: [['?options']],
    receivers: ['HTMLOrSVGElement']
  },
  {
    name: 'assign',
    signatures: [['...nodes']],
    receivers: ['HTMLSlotElement']
  },
  {
    name: 'assign',
    signatures: [['url']],
    receivers: ['Location']
  },
  {
    name: 'assignedElements',
    signatures: [['?options']]
  },
  {
    name: 'assignedNodes',
    signatures: [['?options']]
  },
  {
    name: 'deleteRow',
    signatures: [['index']]
  },
  {
    name: 'insertRow',
    signatures: [['?index']]
  },
  {
    name: 'deleteCell',
    signatures: [['index']]
  },
  {
    name: 'insertCell',
    signatures: [['?index']]
  },
  {
    name: 'cancelVideoFrameCallback',
    signatures: [['handle']]
  },
  {
    name: 'requestVideoFrameCallback',
    signatures: [['callback']]
  },
  {
    name: 'go',
    signatures: [['?delta']]
  },
  {
    name: 'pushState',
    signatures: [['data','unused','?url']]
  },
  {
    name: 'replaceState',
    signatures: [['data','unused','?url']]
  },
  {
    name: 'advance',
    signatures: [['count']]
  },
  {
    name: 'continue',
    signatures: [['?key']]
  },
  {
    name: 'continuePrimaryKey',
    signatures: [['key','primaryKey']]
  },
  {
    name: 'update',
    signatures: [['value']],
    receivers: ['IDBCursor']
  },
  {
    name: 'update',
    signatures: [['response']],
    receivers: ['MediaKeySession']
  },
  {
    name: 'createObjectStore',
    signatures: [['name','?options']]
  },
  {
    name: 'deleteObjectStore',
    signatures: [['name']]
  },
  {
    name: 'transaction',
    signatures: [['storeNames','?mode','?options']]
  },
  {
    name: 'cmp',
    signatures: [['first','second']]
  },
  {
    name: 'deleteDatabase',
    signatures: [['name']]
  },
  {
    name: 'count',
    signatures: [['?query']],
    receivers: ['IDBIndex','IDBObjectStore']
  },
  {
    name: 'count',
    signatures: [['?label']],
    receivers: ['Console']
  },
  {
    name: 'getAllKeys',
    signatures: [['?query','?count']]
  },
  {
    name: 'getKey',
    signatures: [['query']],
    receivers: ['IDBIndex','IDBObjectStore']
  },
  {
    name: 'getKey',
    signatures: [['name']],
    receivers: ['PushSubscription']
  },
  {
    name: 'openCursor',
    signatures: [['?query','?direction']]
  },
  {
    name: 'openKeyCursor',
    signatures: [['?query','?direction']]
  },
  {
    name: 'includes',
    signatures: [['key']]
  },
  {
    name: 'createIndex',
    signatures: [['name','keyPath','?options']]
  },
  {
    name: 'deleteIndex',
    signatures: [['name']]
  },
  {
    name: 'index',
    signatures: [['name']]
  },
  {
    name: 'objectStore',
    signatures: [['name']]
  },
  {
    name: 'transferFromImageBitmap',
    signatures: [['bitmap']]
  },
  {
    name: 'observe',
    signatures: [['target']],
    receivers: ['IntersectionObserver']
  },
  {
    name: 'observe',
    signatures: [['target','?options']],
    receivers: ['MutationObserver','ResizeObserver']
  },
  {
    name: 'observe',
    signatures: [['?options']],
    receivers: ['PerformanceObserver']
  },
  {
    name: 'unobserve',
    signatures: [['target']]
  },
  {
    name: 'getModifierState',
    signatures: [['keyArg']]
  },
  {
    name: 'initKeyboardEvent',
    signatures: [['typeArg','?bubblesArg','?cancelableArg','?viewArg','?keyArg','?locationArg','?ctrlKey','?altKey','?shiftKey','?metaKey']]
  },
  {
    name: 'setKeyframes',
    signatures: [['keyframes']]
  },
  {
    name: 'query',
    signatures: [['permissionDesc']],
    receivers: ['Permissions']
  },
  {
    name: 'request',
    signatures: [['name','callback'],['name','options','callback']]
  },
  {
    name: 'decodingInfo',
    signatures: [['configuration']]
  },
  {
    name: 'encodingInfo',
    signatures: [['configuration']]
  },
  {
    name: 'getDisplayMedia',
    signatures: [['?options']]
  },
  {
    name: 'getUserMedia',
    signatures: [['?constraints']]
  },
  {
    name: 'generateRequest',
    signatures: [['initDataType','initData']]
  },
  {
    name: 'createSession',
    signatures: [['?sessionType']]
  },
  {
    name: 'setServerCertificate',
    signatures: [['serverCertificate']]
  },
  {
    name: 'appendMedium',
    signatures: [['medium']]
  },
  {
    name: 'deleteMedium',
    signatures: [['medium']]
  },
  {
    name: 'addListener',
    signatures: [['callback']]
  },
  {
    name: 'removeListener',
    signatures: [['callback']]
  },
  {
    name: 'setActionHandler',
    signatures: [['action','handler']]
  },
  {
    name: 'setPositionState',
    signatures: [['?state']]
  },
  {
    name: 'addSourceBuffer',
    signatures: [['type']]
  },
  {
    name: 'endOfStream',
    signatures: [['?error']]
  },
  {
    name: 'removeSourceBuffer',
    signatures: [['sourceBuffer']]
  },
  {
    name: 'setLiveSeekableRange',
    signatures: [['start','end']]
  },
  {
    name: 'addTrack',
    signatures: [['track']],
    receivers: ['MediaStream']
  },
  {
    name: 'addTrack',
    signatures: [['track','...streams']],
    receivers: ['RTCPeerConnection']
  },
  {
    name: 'getTrackById',
    signatures: [['trackId']],
    receivers: ['MediaStream']
  },
  {
    name: 'getTrackById',
    signatures: [['id']],
    receivers: ['TextTrackList']
  },
  {
    name: 'removeTrack',
    signatures: [['track']],
    receivers: ['MediaStream']
  },
  {
    name: 'removeTrack',
    signatures: [['sender']],
    receivers: ['RTCPeerConnection']
  },
  {
    name: 'applyConstraints',
    signatures: [['?constraints']]
  },
  {
    name: 'initMessageEvent',
    signatures: [['type','?bubbles','?cancelable','?data','?origin','?lastEventId','?source','?ports']]
  },
  {
    name: 'initMouseEvent',
    signatures: [['typeArg','canBubbleArg','cancelableArg','viewArg','detailArg','screenXArg','screenYArg','clientXArg','clientYArg','ctrlKeyArg','altKeyArg','shiftKeyArg','metaKeyArg','buttonArg','relatedTargetArg']]
  },
  {
    name: 'initMutationEvent',
    signatures: [['typeArg','?bubblesArg','?cancelableArg','?relatedNodeArg','?prevValueArg','?newValueArg','?attrNameArg','?attrChangeArg']]
  },
  {
    name: 'getNamedItem',
    signatures: [['qualifiedName']]
  },
  {
    name: 'getNamedItemNS',
    signatures: [['namespace','localName']]
  },
  {
    name: 'removeNamedItem',
    signatures: [['qualifiedName']]
  },
  {
    name: 'removeNamedItemNS',
    signatures: [['namespace','localName']]
  },
  {
    name: 'setNamedItem',
    signatures: [['attr']]
  },
  {
    name: 'setNamedItemNS',
    signatures: [['attr']]
  },
  {
    name: 'disable',
    signatures: [['cap']],
    receivers: ['WebGLRenderingContextBase']
  },
  {
    name: 'enable',
    signatures: [['cap']],
    receivers: ['WebGLRenderingContextBase']
  },
  {
    name: 'setHeaderValue',
    signatures: [['value']]
  },
  {
    name: 'canShare',
    signatures: [['?data']]
  },
  {
    name: 'requestMediaKeySystemAccess',
    signatures: [['keySystem','supportedConfigurations']]
  },
  {
    name: 'sendBeacon',
    signatures: [['url','?data']]
  },
  {
    name: 'share',
    signatures: [['?data']]
  },
  {
    name: 'vibrate',
    signatures: [['pattern']]
  },
  {
    name: 'registerProtocolHandler',
    signatures: [['scheme','url']]
  },
  {
    name: 'appendChild',
    signatures: [['node']]
  },
  {
    name: 'cloneNode',
    signatures: [['?deep']]
  },
  {
    name: 'compareDocumentPosition',
    signatures: [['other']]
  },
  {
    name: 'getRootNode',
    signatures: [['?options']]
  },
  {
    name: 'insertBefore',
    signatures: [['node','child']]
  },
  {
    name: 'isDefaultNamespace',
    signatures: [['namespace']]
  },
  {
    name: 'isEqualNode',
    signatures: [['otherNode']]
  },
  {
    name: 'isSameNode',
    signatures: [['otherNode']]
  },
  {
    name: 'lookupNamespaceURI',
    signatures: [['prefix']]
  },
  {
    name: 'lookupPrefix',
    signatures: [['namespace']]
  },
  {
    name: 'removeChild',
    signatures: [['child']]
  },
  {
    name: 'replaceChild',
    signatures: [['node','child']]
  },
  {
    name: 'blendEquationSeparateiOES',
    signatures: [['buf','modeRGB','modeAlpha']]
  },
  {
    name: 'blendEquationiOES',
    signatures: [['buf','mode']]
  },
  {
    name: 'blendFuncSeparateiOES',
    signatures: [['buf','srcRGB','dstRGB','srcAlpha','dstAlpha']]
  },
  {
    name: 'blendFunciOES',
    signatures: [['buf','src','dst']]
  },
  {
    name: 'colorMaskiOES',
    signatures: [['buf','r','g','b','a']]
  },
  {
    name: 'disableiOES',
    signatures: [['target','index']]
  },
  {
    name: 'enableiOES',
    signatures: [['target','index']]
  },
  {
    name: 'bindVertexArrayOES',
    signatures: [['arrayObject']]
  },
  {
    name: 'deleteVertexArrayOES',
    signatures: [['arrayObject']]
  },
  {
    name: 'isVertexArrayOES',
    signatures: [['arrayObject']]
  },
  {
    name: 'framebufferTextureMultiviewOVR',
    signatures: [['target','attachment','texture','level','baseViewIndex','numViews']]
  },
  {
    name: 'setPeriodicWave',
    signatures: [['periodicWave']]
  },
  {
    name: 'prepend',
    signatures: [['...nodes']]
  },
  {
    name: 'querySelector',
    signatures: [['selectors']]
  },
  {
    name: 'querySelectorAll',
    signatures: [['selectors']]
  },
  {
    name: 'replaceChildren',
    signatures: [['...nodes']]
  },
  {
    name: 'addPath',
    signatures: [['path','?transform']]
  },
  {
    name: 'updateWith',
    signatures: [['detailsPromise']]
  },
  {
    name: 'complete',
    signatures: [['?result']]
  },
  {
    name: 'retry',
    signatures: [['?errorFields']]
  },
  {
    name: 'clearMarks',
    signatures: [['?markName']]
  },
  {
    name: 'clearMeasures',
    signatures: [['?measureName']]
  },
  {
    name: 'getEntriesByName',
    signatures: [['name','?type']]
  },
  {
    name: 'getEntriesByType',
    signatures: [['type']]
  },
  {
    name: 'mark',
    signatures: [['markName','?markOptions']]
  },
  {
    name: 'measure',
    signatures: [['measureName','?startOrMeasureOptions','?endMark']]
  },
  {
    name: 'setResourceTimingBufferSize',
    signatures: [['maxSize']]
  },
  {
    name: 'permissionState',
    signatures: [['?options']]
  },
  {
    name: 'subscribe',
    signatures: [['?options']]
  },
  {
    name: 'insertDTMF',
    signatures: [['tones','?duration','?interToneGap']]
  },
  {
    name: 'send',
    signatures: [['data']],
    receivers: ['RTCDataChannel','WebSocket']
  },
  {
    name: 'send',
    signatures: [['?body']],
    receivers: ['XMLHttpRequest']
  },
  {
    name: 'addIceCandidate',
    signatures: [['?candidate','?successCallback','?failureCallback']]
  },
  {
    name: 'addTransceiver',
    signatures: [['trackOrKind','?init']]
  },
  {
    name: 'createAnswer',
    signatures: [['?options'],['successCallback','failureCallback']]
  },
  {
    name: 'createDataChannel',
    signatures: [['label','?dataChannelDict']]
  },
  {
    name: 'createOffer',
    signatures: [['?options'],['successCallback','failureCallback','?options']]
  },
  {
    name: 'getStats',
    signatures: [['?selector']],
    receivers: ['RTCPeerConnection']
  },
  {
    name: 'setConfiguration',
    signatures: [['?configuration']]
  },
  {
    name: 'setLocalDescription',
    signatures: [['?description','?successCallback','?failureCallback']]
  },
  {
    name: 'setRemoteDescription',
    signatures: [['description','?successCallback','?failureCallback']]
  },
  {
    name: 'replaceTrack',
    signatures: [['withTrack']]
  },
  {
    name: 'setParameters',
    signatures: [['parameters']]
  },
  {
    name: 'setStreams',
    signatures: [['...streams']]
  },
  {
    name: 'setCodecPreferences',
    signatures: [['codecs']]
  },
  {
    name: 'collapse',
    signatures: [['?toStart']],
    receivers: ['Range']
  },
  {
    name: 'collapse',
    signatures: [['node','?offset']],
    receivers: ['Selection']
  },
  {
    name: 'compareBoundaryPoints',
    signatures: [['how','sourceRange']]
  },
  {
    name: 'comparePoint',
    signatures: [['node','offset']]
  },
  {
    name: 'createContextualFragment',
    signatures: [['fragment']]
  },
  {
    name: 'insertNode',
    signatures: [['node']]
  },
  {
    name: 'intersectsNode',
    signatures: [['node']]
  },
  {
    name: 'isPointInRange',
    signatures: [['node','offset']]
  },
  {
    name: 'selectNode',
    signatures: [['node']]
  },
  {
    name: 'selectNodeContents',
    signatures: [['node']]
  },
  {
    name: 'setEnd',
    signatures: [['node','offset']]
  },
  {
    name: 'setEndAfter',
    signatures: [['node']]
  },
  {
    name: 'setEndBefore',
    signatures: [['node']]
  },
  {
    name: 'setStart',
    signatures: [['node','offset']]
  },
  {
    name: 'setStartAfter',
    signatures: [['node']]
  },
  {
    name: 'setStartBefore',
    signatures: [['node']]
  },
  {
    name: 'surroundContents',
    signatures: [['newParent']]
  },
  {
    name: 'enqueue',
    signatures: [['chunk']],
    receivers: ['ReadableByteStreamController']
  },
  {
    name: 'enqueue',
    signatures: [['?chunk']],
    receivers: ['ReadableStreamDefaultController','TransformStreamDefaultController']
  },
  {
    name: 'error',
    signatures: [['?e']],
    receivers: ['ReadableByteStreamController','ReadableStreamDefaultController','WritableStreamDefaultController']
  },
  {
    name: 'error',
    signatures: [['?reason']],
    receivers: ['TransformStreamDefaultController']
  },
  {
    name: 'error',
    signatures: [['...data']],
    receivers: ['Console']
  },
  {
    name: 'getReader',
    signatures: [['?options']]
  },
  {
    name: 'pipeThrough',
    signatures: [['transform','?options']]
  },
  {
    name: 'pipeTo',
    signatures: [['destination','?options']]
  },
  {
    name: 'respond',
    signatures: [['bytesWritten']]
  },
  {
    name: 'respondWithNewView',
    signatures: [['view']]
  },
  {
    name: 'cancelWatchAvailability',
    signatures: [['?id']]
  },
  {
    name: 'prompt',
    signatures: [['?message','?_default']],
    receivers: ['Window']
  },
  {
    name: 'watchAvailability',
    signatures: [['callback']]
  },
  {
    name: 'convertToSpecifiedUnits',
    signatures: [['unitType']]
  },
  {
    name: 'newValueSpecifiedUnits',
    signatures: [['unitType','valueInSpecifiedUnits']]
  },
  {
    name: 'beginElementAt',
    signatures: [['offset']]
  },
  {
    name: 'endElementAt',
    signatures: [['offset']]
  },
  {
    name: 'setStdDeviation',
    signatures: [['stdDeviationX','stdDeviationY']]
  },
  {
    name: 'getPointAtLength',
    signatures: [['distance']]
  },
  {
    name: 'isPointInFill',
    signatures: [['?point']]
  },
  {
    name: 'getBBox',
    signatures: [['?options']]
  },
  {
    name: 'appendItem',
    signatures: [['newItem']]
  },
  {
    name: 'getItem',
    signatures: [['index']],
    receivers: ['SVGLengthList','SVGNumberList','SVGPointList','SVGStringList','SVGTransformList']
  },
  {
    name: 'getItem',
    signatures: [['key']],
    receivers: ['Storage']
  },
  {
    name: 'getItem',
    signatures: [['dimension1Index','...dimensionNIndexes']],
    receivers: ['VBArray']
  },
  {
    name: 'initialize',
    signatures: [['newItem']]
  },
  {
    name: 'insertItemBefore',
    signatures: [['newItem','index']]
  },
  {
    name: 'removeItem',
    signatures: [['index']],
    receivers: ['SVGLengthList','SVGNumberList','SVGPointList','SVGStringList','SVGTransformList']
  },
  {
    name: 'removeItem',
    signatures: [['key']],
    receivers: ['Storage']
  },
  {
    name: 'replaceItem',
    signatures: [['newItem','index']]
  },
  {
    name: 'setOrientToAngle',
    signatures: [['angle']]
  },
  {
    name: 'checkEnclosure',
    signatures: [['element','rect']]
  },
  {
    name: 'checkIntersection',
    signatures: [['element','rect']]
  },
  {
    name: 'createSVGTransformFromMatrix',
    signatures: [['?matrix']]
  },
  {
    name: 'getEnclosureList',
    signatures: [['rect','referenceElement']]
  },
  {
    name: 'getIntersectionList',
    signatures: [['rect','referenceElement']]
  },
  {
    name: 'setCurrentTime',
    signatures: [['seconds']]
  },
  {
    name: 'suspendRedraw',
    signatures: [['maxWaitMilliseconds']]
  },
  {
    name: 'unsuspendRedraw',
    signatures: [['suspendHandleID']]
  },
  {
    name: 'getCharNumAtPosition',
    signatures: [['?point']]
  },
  {
    name: 'getEndPositionOfChar',
    signatures: [['charnum']]
  },
  {
    name: 'getExtentOfChar',
    signatures: [['charnum']]
  },
  {
    name: 'getRotationOfChar',
    signatures: [['charnum']]
  },
  {
    name: 'getStartPositionOfChar',
    signatures: [['charnum']]
  },
  {
    name: 'getSubStringLength',
    signatures: [['charnum','nchars']]
  },
  {
    name: 'selectSubString',
    signatures: [['charnum','nchars']]
  },
  {
    name: 'setMatrix',
    signatures: [['?matrix']]
  },
  {
    name: 'setRotate',
    signatures: [['angle','cx','cy']]
  },
  {
    name: 'setScale',
    signatures: [['sx','sy']]
  },
  {
    name: 'setSkewX',
    signatures: [['angle']]
  },
  {
    name: 'setSkewY',
    signatures: [['angle']]
  },
  {
    name: 'setTranslate',
    signatures: [['tx','ty']]
  },
  {
    name: 'lock',
    signatures: [['orientation']]
  },
  {
    name: 'addRange',
    signatures: [['range']]
  },
  {
    name: 'containsNode',
    signatures: [['node','?allowPartialContainment']]
  },
  {
    name: 'extend',
    signatures: [['node','?offset']]
  },
  {
    name: 'getRangeAt',
    signatures: [['index']]
  },
  {
    name: 'modify',
    signatures: [['?alter','?direction','?granularity']]
  },
  {
    name: 'removeRange',
    signatures: [['range']]
  },
  {
    name: 'selectAllChildren',
    signatures: [['node']]
  },
  {
    name: 'setBaseAndExtent',
    signatures: [['anchorNode','anchorOffset','focusNode','focusOffset']]
  },
  {
    name: 'getRegistration',
    signatures: [['?clientURL']]
  },
  {
    name: 'register',
    signatures: [['scriptURL','?options']]
  },
  {
    name: 'getNotifications',
    signatures: [['?filter']]
  },
  {
    name: 'showNotification',
    signatures: [['title','?options']]
  },
  {
    name: 'appendBuffer',
    signatures: [['data']]
  },
  {
    name: 'changeType',
    signatures: [['type']]
  },
  {
    name: 'speak',
    signatures: [['utterance']]
  },
  {
    name: 'key',
    signatures: [['index']]
  },
  {
    name: 'setItem',
    signatures: [['key','value']]
  },
  {
    name: 'initStorageEvent',
    signatures: [['type','?bubbles','?cancelable','?key','?oldValue','?newValue','?url','?storageArea']]
  },
  {
    name: 'matchMedium',
    signatures: [['mediaquery']]
  },
  {
    name: 'decrypt',
    signatures: [['algorithm','key','data']]
  },
  {
    name: 'deriveBits',
    signatures: [['algorithm','baseKey','length']]
  },
  {
    name: 'deriveKey',
    signatures: [['algorithm','baseKey','derivedKeyType','extractable','keyUsages']]
  },
  {
    name: 'digest',
    signatures: [['algorithm','data']]
  },
  {
    name: 'encrypt',
    signatures: [['algorithm','key','data']]
  },
  {
    name: 'exportKey',
    signatures: [['format','key']]
  },
  {
    name: 'generateKey',
    signatures: [['algorithm','extractable','keyUsages']]
  },
  {
    name: 'importKey',
    signatures: [['format','keyData','algorithm','extractable','keyUsages']]
  },
  {
    name: 'sign',
    signatures: [['algorithm','key','data']]
  },
  {
    name: 'unwrapKey',
    signatures: [['format','wrappedKey','unwrappingKey','unwrapAlgorithm','unwrappedKeyAlgorithm','extractable','keyUsages']]
  },
  {
    name: 'verify',
    signatures: [['algorithm','key','signature','data']]
  },
  {
    name: 'wrapKey',
    signatures: [['format','key','wrappingKey','wrapAlgorithm']]
  },
  {
    name: 'splitText',
    signatures: [['offset']]
  },
  {
    name: 'encode',
    signatures: [['?input']]
  },
  {
    name: 'encodeInto',
    signatures: [['source','destination']]
  },
  {
    name: 'addCue',
    signatures: [['cue']]
  },
  {
    name: 'removeCue',
    signatures: [['cue']]
  },
  {
    name: 'getCueById',
    signatures: [['id']]
  },
  {
    name: 'end',
    signatures: [['index']]
  },
  {
    name: 'initUIEvent',
    signatures: [['typeArg','?bubblesArg','?cancelableArg','?viewArg','?detailArg']]
  },
  {
    name: 'getTranslatedShaderSource',
    signatures: [['shader']]
  },
  {
    name: 'drawBuffersWEBGL',
    signatures: [['buffers']]
  },
  {
    name: 'multiDrawArraysInstancedWEBGL',
    signatures: [['mode','firstsList','firstsOffset','countsList','countsOffset','instanceCountsList','instanceCountsOffset','drawcount']]
  },
  {
    name: 'multiDrawArraysWEBGL',
    signatures: [['mode','firstsList','firstsOffset','countsList','countsOffset','drawcount']]
  },
  {
    name: 'multiDrawElementsInstancedWEBGL',
    signatures: [['mode','countsList','countsOffset','type','offsetsList','offsetsOffset','instanceCountsList','instanceCountsOffset','drawcount']]
  },
  {
    name: 'multiDrawElementsWEBGL',
    signatures: [['mode','countsList','countsOffset','type','offsetsList','offsetsOffset','drawcount']]
  },
  {
    name: 'beginQuery',
    signatures: [['target','query']]
  },
  {
    name: 'beginTransformFeedback',
    signatures: [['primitiveMode']]
  },
  {
    name: 'bindBufferBase',
    signatures: [['target','index','buffer']]
  },
  {
    name: 'bindBufferRange',
    signatures: [['target','index','buffer','offset','size']]
  },
  {
    name: 'bindSampler',
    signatures: [['unit','sampler']]
  },
  {
    name: 'bindTransformFeedback',
    signatures: [['target','tf']]
  },
  {
    name: 'bindVertexArray',
    signatures: [['array']]
  },
  {
    name: 'blitFramebuffer',
    signatures: [['srcX0','srcY0','srcX1','srcY1','dstX0','dstY0','dstX1','dstY1','mask','filter']]
  },
  {
    name: 'clearBufferfi',
    signatures: [['buffer','drawbuffer','depth','stencil']]
  },
  {
    name: 'clearBufferfv',
    signatures: [['buffer','drawbuffer','values','?srcOffset']]
  },
  {
    name: 'clearBufferiv',
    signatures: [['buffer','drawbuffer','values','?srcOffset']]
  },
  {
    name: 'clearBufferuiv',
    signatures: [['buffer','drawbuffer','values','?srcOffset']]
  },
  {
    name: 'clientWaitSync',
    signatures: [['sync','flags','timeout']]
  },
  {
    name: 'compressedTexImage3D',
    signatures: [['target','level','internalformat','width','height','depth','border','imageSize','offset'],['target','level','internalformat','width','height','depth','border','srcData','?srcOffset','?srcLengthOverride']]
  },
  {
    name: 'compressedTexSubImage3D',
    signatures: [['target','level','xoffset','yoffset','zoffset','width','height','depth','format','imageSize','offset'],['target','level','xoffset','yoffset','zoffset','width','height','depth','format','srcData','?srcOffset','?srcLengthOverride']]
  },
  {
    name: 'copyBufferSubData',
    signatures: [['readTarget','writeTarget','readOffset','writeOffset','size']]
  },
  {
    name: 'copyTexSubImage3D',
    signatures: [['target','level','xoffset','yoffset','zoffset','x','y','width','height']]
  },
  {
    name: 'deleteQuery',
    signatures: [['query']]
  },
  {
    name: 'deleteSampler',
    signatures: [['sampler']]
  },
  {
    name: 'deleteSync',
    signatures: [['sync']]
  },
  {
    name: 'deleteTransformFeedback',
    signatures: [['tf']]
  },
  {
    name: 'deleteVertexArray',
    signatures: [['vertexArray']]
  },
  {
    name: 'drawArraysInstanced',
    signatures: [['mode','first','count','instanceCount']]
  },
  {
    name: 'drawBuffers',
    signatures: [['buffers']]
  },
  {
    name: 'drawElementsInstanced',
    signatures: [['mode','count','type','offset','instanceCount']]
  },
  {
    name: 'drawRangeElements',
    signatures: [['mode','start','end','count','type','offset']]
  },
  {
    name: 'endQuery',
    signatures: [['target']]
  },
  {
    name: 'fenceSync',
    signatures: [['condition','flags']]
  },
  {
    name: 'framebufferTextureLayer',
    signatures: [['target','attachment','texture','level','layer']]
  },
  {
    name: 'getActiveUniformBlockName',
    signatures: [['program','uniformBlockIndex']]
  },
  {
    name: 'getActiveUniformBlockParameter',
    signatures: [['program','uniformBlockIndex','pname']]
  },
  {
    name: 'getActiveUniforms',
    signatures: [['program','uniformIndices','pname']]
  },
  {
    name: 'getBufferSubData',
    signatures: [['target','srcByteOffset','dstBuffer','?dstOffset','?length']]
  },
  {
    name: 'getFragDataLocation',
    signatures: [['program','name']]
  },
  {
    name: 'getIndexedParameter',
    signatures: [['target','index']]
  },
  {
    name: 'getInternalformatParameter',
    signatures: [['target','internalformat','pname']]
  },
  {
    name: 'getQuery',
    signatures: [['target','pname']]
  },
  {
    name: 'getQueryParameter',
    signatures: [['query','pname']]
  },
  {
    name: 'getSamplerParameter',
    signatures: [['sampler','pname']]
  },
  {
    name: 'getSyncParameter',
    signatures: [['sync','pname']]
  },
  {
    name: 'getTransformFeedbackVarying',
    signatures: [['program','index']]
  },
  {
    name: 'getUniformBlockIndex',
    signatures: [['program','uniformBlockName']]
  },
  {
    name: 'getUniformIndices',
    signatures: [['program','uniformNames']]
  },
  {
    name: 'invalidateFramebuffer',
    signatures: [['target','attachments']]
  },
  {
    name: 'invalidateSubFramebuffer',
    signatures: [['target','attachments','x','y','width','height']]
  },
  {
    name: 'isQuery',
    signatures: [['query']]
  },
  {
    name: 'isSampler',
    signatures: [['sampler']]
  },
  {
    name: 'isSync',
    signatures: [['sync']]
  },
  {
    name: 'isTransformFeedback',
    signatures: [['tf']]
  },
  {
    name: 'isVertexArray',
    signatures: [['vertexArray']]
  },
  {
    name: 'readBuffer',
    signatures: [['src']]
  },
  {
    name: 'renderbufferStorageMultisample',
    signatures: [['target','samples','internalformat','width','height']]
  },
  {
    name: 'samplerParameterf',
    signatures: [['sampler','pname','param']]
  },
  {
    name: 'samplerParameteri',
    signatures: [['sampler','pname','param']]
  },
  {
    name: 'texImage3D',
    signatures: [['target','level','internalformat','width','height','depth','border','format','type','pboOffset'],['target','level','internalformat','width','height','depth','border','format','type','source'],['target','level','internalformat','width','height','depth','border','format','type','srcData','?srcOffset']]
  },
  {
    name: 'texStorage2D',
    signatures: [['target','levels','internalformat','width','height']]
  },
  {
    name: 'texStorage3D',
    signatures: [['target','levels','internalformat','width','height','depth']]
  },
  {
    name: 'texSubImage3D',
    signatures: [['target','level','xoffset','yoffset','zoffset','width','height','depth','format','type','pboOffset'],['target','level','xoffset','yoffset','zoffset','width','height','depth','format','type','source'],['target','level','xoffset','yoffset','zoffset','width','height','depth','format','type','srcData','?srcOffset']]
  },
  {
    name: 'transformFeedbackVaryings',
    signatures: [['program','varyings','bufferMode']]
  },
  {
    name: 'uniform1ui',
    signatures: [['location','v0']]
  },
  {
    name: 'uniform1uiv',
    signatures: [['location','data','?srcOffset','?srcLength']]
  },
  {
    name: 'uniform2ui',
    signatures: [['location','v0','v1']]
  },
  {
    name: 'uniform2uiv',
    signatures: [['location','data','?srcOffset','?srcLength']]
  },
  {
    name: 'uniform3ui',
    signatures: [['location','v0','v1','v2']]
  },
  {
    name: 'uniform3uiv',
    signatures: [['location','data','?srcOffset','?srcLength']]
  },
  {
    name: 'uniform4ui',
    signatures: [['location','v0','v1','v2','v3']]
  },
  {
    name: 'uniform4uiv',
    signatures: [['location','data','?srcOffset','?srcLength']]
  },
  {
    name: 'uniformBlockBinding',
    signatures: [['program','uniformBlockIndex','uniformBlockBinding']]
  },
  {
    name: 'uniformMatrix2x3fv',
    signatures: [['location','transpose','data','?srcOffset','?srcLength']]
  },
  {
    name: 'uniformMatrix2x4fv',
    signatures: [['location','transpose','data','?srcOffset','?srcLength']]
  },
  {
    name: 'uniformMatrix3x2fv',
    signatures: [['location','transpose','data','?srcOffset','?srcLength']]
  },
  {
    name: 'uniformMatrix3x4fv',
    signatures: [['location','transpose','data','?srcOffset','?srcLength']]
  },
  {
    name: 'uniformMatrix4x2fv',
    signatures: [['location','transpose','data','?srcOffset','?srcLength']]
  },
  {
    name: 'uniformMatrix4x3fv',
    signatures: [['location','transpose','data','?srcOffset','?srcLength']]
  },
  {
    name: 'vertexAttribDivisor',
    signatures: [['index','divisor']]
  },
  {
    name: 'vertexAttribI4i',
    signatures: [['index','x','y','z','w']]
  },
  {
    name: 'vertexAttribI4iv',
    signatures: [['index','values']]
  },
  {
    name: 'vertexAttribI4ui',
    signatures: [['index','x','y','z','w']]
  },
  {
    name: 'vertexAttribI4uiv',
    signatures: [['index','values']]
  },
  {
    name: 'vertexAttribIPointer',
    signatures: [['index','size','type','stride','offset']]
  },
  {
    name: 'waitSync',
    signatures: [['sync','flags','timeout']]
  },
  {
    name: 'bufferData',
    signatures: [['target','size','usage'],['target','srcData','usage','?srcOffset','?length']],
    receivers: ['WebGL2RenderingContextOverloads']
  },
  {
    name: 'bufferData',
    signatures: [['target','size','usage'],['target','data','usage']],
    receivers: ['WebGLRenderingContextOverloads']
  },
  {
    name: 'bufferSubData',
    signatures: [['target','dstByteOffset','srcData','?srcOffset','?length']],
    receivers: ['WebGL2RenderingContextOverloads']
  },
  {
    name: 'bufferSubData',
    signatures: [['target','offset','data']],
    receivers: ['WebGLRenderingContextOverloads']
  },
  {
    name: 'compressedTexImage2D',
    signatures: [['target','level','internalformat','width','height','border','imageSize','offset'],['target','level','internalformat','width','height','border','srcData','?srcOffset','?srcLengthOverride']],
    receivers: ['WebGL2RenderingContextOverloads']
  },
  {
    name: 'compressedTexImage2D',
    signatures: [['target','level','internalformat','width','height','border','data']],
    receivers: ['WebGLRenderingContextOverloads']
  },
  {
    name: 'compressedTexSubImage2D',
    signatures: [['target','level','xoffset','yoffset','width','height','format','imageSize','offset'],['target','level','xoffset','yoffset','width','height','format','srcData','?srcOffset','?srcLengthOverride']],
    receivers: ['WebGL2RenderingContextOverloads']
  },
  {
    name: 'compressedTexSubImage2D',
    signatures: [['target','level','xoffset','yoffset','width','height','format','data']],
    receivers: ['WebGLRenderingContextOverloads']
  },
  {
    name: 'readPixels',
    signatures: [['x','y','width','height','format','type','dstData','?dstOffset'],['x','y','width','height','format','type','offset']],
    receivers: ['WebGL2RenderingContextOverloads']
  },
  {
    name: 'readPixels',
    signatures: [['x','y','width','height','format','type','pixels']],
    receivers: ['WebGLRenderingContextOverloads']
  },
  {
    name: 'texImage2D',
    signatures: [['target','level','internalformat','format','type','source'],['target','level','internalformat','width','height','border','format','type','pixels'],['target','level','internalformat','width','height','border','format','type','pboOffset'],['target','level','internalformat','width','height','border','format','type','source'],['target','level','internalformat','width','height','border','format','type','srcData','srcOffset']],
    receivers: ['WebGL2RenderingContextOverloads']
  },
  {
    name: 'texImage2D',
    signatures: [['target','level','internalformat','format','type','source'],['target','level','internalformat','width','height','border','format','type','pixels']],
    receivers: ['WebGLRenderingContextOverloads']
  },
  {
    name: 'texSubImage2D',
    signatures: [['target','level','xoffset','yoffset','format','type','source'],['target','level','xoffset','yoffset','width','height','format','type','pixels'],['target','level','xoffset','yoffset','width','height','format','type','pboOffset'],['target','level','xoffset','yoffset','width','height','format','type','source'],['target','level','xoffset','yoffset','width','height','format','type','srcData','srcOffset']],
    receivers: ['WebGL2RenderingContextOverloads']
  },
  {
    name: 'texSubImage2D',
    signatures: [['target','level','xoffset','yoffset','format','type','source'],['target','level','xoffset','yoffset','width','height','format','type','pixels']],
    receivers: ['WebGLRenderingContextOverloads']
  },
  {
    name: 'uniform1fv',
    signatures: [['location','data','?srcOffset','?srcLength']],
    receivers: ['WebGL2RenderingContextOverloads']
  },
  {
    name: 'uniform1fv',
    signatures: [['location','v']],
    receivers: ['WebGLRenderingContextOverloads']
  },
  {
    name: 'uniform1iv',
    signatures: [['location','data','?srcOffset','?srcLength']],
    receivers: ['WebGL2RenderingContextOverloads']
  },
  {
    name: 'uniform1iv',
    signatures: [['location','v']],
    receivers: ['WebGLRenderingContextOverloads']
  },
  {
    name: 'uniform2fv',
    signatures: [['location','data','?srcOffset','?srcLength']],
    receivers: ['WebGL2RenderingContextOverloads']
  },
  {
    name: 'uniform2fv',
    signatures: [['location','v']],
    receivers: ['WebGLRenderingContextOverloads']
  },
  {
    name: 'uniform2iv',
    signatures: [['location','data','?srcOffset','?srcLength']],
    receivers: ['WebGL2RenderingContextOverloads']
  },
  {
    name: 'uniform2iv',
    signatures: [['location','v']],
    receivers: ['WebGLRenderingContextOverloads']
  },
  {
    name: 'uniform3fv',
    signatures: [['location','data','?srcOffset','?srcLength']],
    receivers: ['WebGL2RenderingContextOverloads']
  },
  {
    name: 'uniform3fv',
    signatures: [['location','v']],
    receivers: ['WebGLRenderingContextOverloads']
  },
  {
    name: 'uniform3iv',
    signatures: [['location','data','?srcOffset','?srcLength']],
    receivers: ['WebGL2RenderingContextOverloads']
  },
  {
    name: 'uniform3iv',
    signatures: [['location','v']],
    receivers: ['WebGLRenderingContextOverloads']
  },
  {
    name: 'uniform4fv',
    signatures: [['location','data','?srcOffset','?srcLength']],
    receivers: ['WebGL2RenderingContextOverloads']
  },
  {
    name: 'uniform4fv',
    signatures: [['location','v']],
    receivers: ['WebGLRenderingContextOverloads']
  },
  {
    name: 'uniform4iv',
    signatures: [['location','data','?srcOffset','?srcLength']],
    receivers: ['WebGL2RenderingContextOverloads']
  },
  {
    name: 'uniform4iv',
    signatures: [['location','v']],
    receivers: ['WebGLRenderingContextOverloads']
  },
  {
    name: 'uniformMatrix2fv',
    signatures: [['location','transpose','data','?srcOffset','?srcLength']],
    receivers: ['WebGL2RenderingContextOverloads']
  },
  {
    name: 'uniformMatrix2fv',
    signatures: [['location','transpose','value']],
    receivers: ['WebGLRenderingContextOverloads']
  },
  {
    name: 'uniformMatrix3fv',
    signatures: [['location','transpose','data','?srcOffset','?srcLength']],
    receivers: ['WebGL2RenderingContextOverloads']
  },
  {
    name: 'uniformMatrix3fv',
    signatures: [['location','transpose','value']],
    receivers: ['WebGLRenderingContextOverloads']
  },
  {
    name: 'uniformMatrix4fv',
    signatures: [['location','transpose','data','?srcOffset','?srcLength']],
    receivers: ['WebGL2RenderingContextOverloads']
  },
  {
    name: 'uniformMatrix4fv',
    signatures: [['location','transpose','value']],
    receivers: ['WebGLRenderingContextOverloads']
  },
  {
    name: 'activeTexture',
    signatures: [['texture']]
  },
  {
    name: 'attachShader',
    signatures: [['program','shader']]
  },
  {
    name: 'bindAttribLocation',
    signatures: [['program','index','name']]
  },
  {
    name: 'bindBuffer',
    signatures: [['target','buffer']]
  },
  {
    name: 'bindFramebuffer',
    signatures: [['target','framebuffer']]
  },
  {
    name: 'bindRenderbuffer',
    signatures: [['target','renderbuffer']]
  },
  {
    name: 'bindTexture',
    signatures: [['target','texture']]
  },
  {
    name: 'blendColor',
    signatures: [['red','green','blue','alpha']]
  },
  {
    name: 'blendEquation',
    signatures: [['mode']]
  },
  {
    name: 'blendEquationSeparate',
    signatures: [['modeRGB','modeAlpha']]
  },
  {
    name: 'blendFunc',
    signatures: [['sfactor','dfactor']]
  },
  {
    name: 'blendFuncSeparate',
    signatures: [['srcRGB','dstRGB','srcAlpha','dstAlpha']]
  },
  {
    name: 'checkFramebufferStatus',
    signatures: [['target']]
  },
  {
    name: 'clearColor',
    signatures: [['red','green','blue','alpha']]
  },
  {
    name: 'clearDepth',
    signatures: [['depth']]
  },
  {
    name: 'clearStencil',
    signatures: [['s']]
  },
  {
    name: 'colorMask',
    signatures: [['red','green','blue','alpha']]
  },
  {
    name: 'compileShader',
    signatures: [['shader']]
  },
  {
    name: 'copyTexImage2D',
    signatures: [['target','level','internalformat','x','y','width','height','border']]
  },
  {
    name: 'copyTexSubImage2D',
    signatures: [['target','level','xoffset','yoffset','x','y','width','height']]
  },
  {
    name: 'createShader',
    signatures: [['type']]
  },
  {
    name: 'cullFace',
    signatures: [['mode']]
  },
  {
    name: 'deleteBuffer',
    signatures: [['buffer']]
  },
  {
    name: 'deleteFramebuffer',
    signatures: [['framebuffer']]
  },
  {
    name: 'deleteProgram',
    signatures: [['program']]
  },
  {
    name: 'deleteRenderbuffer',
    signatures: [['renderbuffer']]
  },
  {
    name: 'deleteShader',
    signatures: [['shader']]
  },
  {
    name: 'deleteTexture',
    signatures: [['texture']]
  },
  {
    name: 'depthFunc',
    signatures: [['func']]
  },
  {
    name: 'depthMask',
    signatures: [['flag']]
  },
  {
    name: 'depthRange',
    signatures: [['zNear','zFar']]
  },
  {
    name: 'detachShader',
    signatures: [['program','shader']]
  },
  {
    name: 'disableVertexAttribArray',
    signatures: [['index']]
  },
  {
    name: 'drawArrays',
    signatures: [['mode','first','count']]
  },
  {
    name: 'drawElements',
    signatures: [['mode','count','type','offset']]
  },
  {
    name: 'enableVertexAttribArray',
    signatures: [['index']]
  },
  {
    name: 'framebufferRenderbuffer',
    signatures: [['target','attachment','renderbuffertarget','renderbuffer']]
  },
  {
    name: 'framebufferTexture2D',
    signatures: [['target','attachment','textarget','texture','level']]
  },
  {
    name: 'frontFace',
    signatures: [['mode']]
  },
  {
    name: 'generateMipmap',
    signatures: [['target']]
  },
  {
    name: 'getActiveAttrib',
    signatures: [['program','index']]
  },
  {
    name: 'getActiveUniform',
    signatures: [['program','index']]
  },
  {
    name: 'getAttachedShaders',
    signatures: [['program']]
  },
  {
    name: 'getAttribLocation',
    signatures: [['program','name']]
  },
  {
    name: 'getBufferParameter',
    signatures: [['target','pname']]
  },
  {
    name: 'getExtension',
    signatures: [['extensionName'],['name']]
  },
  {
    name: 'getFramebufferAttachmentParameter',
    signatures: [['target','attachment','pname']]
  },
  {
    name: 'getParameter',
    signatures: [['pname']],
    receivers: ['WebGLRenderingContextBase']
  },
  {
    name: 'getParameter',
    signatures: [['namespaceURI','localName']],
    receivers: ['XSLTProcessor']
  },
  {
    name: 'getProgramInfoLog',
    signatures: [['program']]
  },
  {
    name: 'getProgramParameter',
    signatures: [['program','pname']]
  },
  {
    name: 'getRenderbufferParameter',
    signatures: [['target','pname']]
  },
  {
    name: 'getShaderInfoLog',
    signatures: [['shader']]
  },
  {
    name: 'getShaderParameter',
    signatures: [['shader','pname']]
  },
  {
    name: 'getShaderPrecisionFormat',
    signatures: [['shadertype','precisiontype']]
  },
  {
    name: 'getShaderSource',
    signatures: [['shader']]
  },
  {
    name: 'getTexParameter',
    signatures: [['target','pname']]
  },
  {
    name: 'getUniform',
    signatures: [['program','location']]
  },
  {
    name: 'getUniformLocation',
    signatures: [['program','name']]
  },
  {
    name: 'getVertexAttrib',
    signatures: [['index','pname']]
  },
  {
    name: 'getVertexAttribOffset',
    signatures: [['index','pname']]
  },
  {
    name: 'hint',
    signatures: [['target','mode']]
  },
  {
    name: 'isBuffer',
    signatures: [['buffer']]
  },
  {
    name: 'isEnabled',
    signatures: [['cap']]
  },
  {
    name: 'isFramebuffer',
    signatures: [['framebuffer']]
  },
  {
    name: 'isProgram',
    signatures: [['program']]
  },
  {
    name: 'isRenderbuffer',
    signatures: [['renderbuffer']]
  },
  {
    name: 'isShader',
    signatures: [['shader']]
  },
  {
    name: 'isTexture',
    signatures: [['texture']]
  },
  {
    name: 'lineWidth',
    signatures: [['width']]
  },
  {
    name: 'linkProgram',
    signatures: [['program']]
  },
  {
    name: 'pixelStorei',
    signatures: [['pname','param']]
  },
  {
    name: 'polygonOffset',
    signatures: [['factor','units']]
  },
  {
    name: 'renderbufferStorage',
    signatures: [['target','internalformat','width','height']]
  },
  {
    name: 'sampleCoverage',
    signatures: [['value','invert']]
  },
  {
    name: 'scissor',
    signatures: [['x','y','width','height']]
  },
  {
    name: 'shaderSource',
    signatures: [['shader','source']]
  },
  {
    name: 'stencilFunc',
    signatures: [['func','ref','mask']]
  },
  {
    name: 'stencilFuncSeparate',
    signatures: [['face','func','ref','mask']]
  },
  {
    name: 'stencilMask',
    signatures: [['mask']]
  },
  {
    name: 'stencilMaskSeparate',
    signatures: [['face','mask']]
  },
  {
    name: 'stencilOp',
    signatures: [['fail','zfail','zpass']]
  },
  {
    name: 'stencilOpSeparate',
    signatures: [['face','fail','zfail','zpass']]
  },
  {
    name: 'texParameterf',
    signatures: [['target','pname','param']]
  },
  {
    name: 'texParameteri',
    signatures: [['target','pname','param']]
  },
  {
    name: 'uniform1f',
    signatures: [['location','x']]
  },
  {
    name: 'uniform1i',
    signatures: [['location','x']]
  },
  {
    name: 'uniform2f',
    signatures: [['location','x','y']]
  },
  {
    name: 'uniform2i',
    signatures: [['location','x','y']]
  },
  {
    name: 'uniform3f',
    signatures: [['location','x','y','z']]
  },
  {
    name: 'uniform3i',
    signatures: [['location','x','y','z']]
  },
  {
    name: 'uniform4f',
    signatures: [['location','x','y','z','w']]
  },
  {
    name: 'uniform4i',
    signatures: [['location','x','y','z','w']]
  },
  {
    name: 'useProgram',
    signatures: [['program']]
  },
  {
    name: 'validateProgram',
    signatures: [['program']]
  },
  {
    name: 'vertexAttrib1f',
    signatures: [['index','x']]
  },
  {
    name: 'vertexAttrib1fv',
    signatures: [['index','values']]
  },
  {
    name: 'vertexAttrib2f',
    signatures: [['index','x','y']]
  },
  {
    name: 'vertexAttrib2fv',
    signatures: [['index','values']]
  },
  {
    name: 'vertexAttrib3f',
    signatures: [['index','x','y','z']]
  },
  {
    name: 'vertexAttrib3fv',
    signatures: [['index','values']]
  },
  {
    name: 'vertexAttrib4f',
    signatures: [['index','x','y','z','w']]
  },
  {
    name: 'vertexAttrib4fv',
    signatures: [['index','values']]
  },
  {
    name: 'vertexAttribPointer',
    signatures: [['index','size','type','normalized','stride','offset']]
  },
  {
    name: 'viewport',
    signatures: [['x','y','width','height']]
  },
  {
    name: 'alert',
    signatures: [['?message']]
  },
  {
    name: 'cancelIdleCallback',
    signatures: [['handle']]
  },
  {
    name: 'confirm',
    signatures: [['?message']]
  },
  {
    name: 'getComputedStyle',
    signatures: [['elt','?pseudoElt']]
  },
  {
    name: 'matchMedia',
    signatures: [['query']]
  },
  {
    name: 'moveBy',
    signatures: [['x','y']]
  },
  {
    name: 'requestIdleCallback',
    signatures: [['callback','?options']]
  },
  {
    name: 'resizeBy',
    signatures: [['x','y']]
  },
  {
    name: 'resizeTo',
    signatures: [['width','height']]
  },
  {
    name: 'atob',
    signatures: [['data']]
  },
  {
    name: 'btoa',
    signatures: [['data']]
  },
  {
    name: 'clearInterval',
    signatures: [['id']]
  },
  {
    name: 'clearTimeout',
    signatures: [['id']]
  },
  {
    name: 'createImageBitmap',
    signatures: [['image','?options'],['image','sx','sy','sw','sh','?options']]
  },
  {
    name: 'fetch',
    signatures: [['input','?init']]
  },
  {
    name: 'queueMicrotask',
    signatures: [['callback']]
  },
  {
    name: 'reportError',
    signatures: [['e']]
  },
  {
    name: 'setInterval',
    signatures: [['handler','?timeout','...arguments']]
  },
  {
    name: 'setTimeout',
    signatures: [['handler','?timeout','...arguments']]
  },
  {
    name: 'structuredClone',
    signatures: [['value','?options']]
  },
  {
    name: 'addModule',
    signatures: [['moduleURL','?options']]
  },
  {
    name: 'getResponseHeader',
    signatures: [['name']]
  },
  {
    name: 'overrideMimeType',
    signatures: [['mime']]
  },
  {
    name: 'setRequestHeader',
    signatures: [['name','value']]
  },
  {
    name: 'serializeToString',
    signatures: [['root']]
  },
  {
    name: 'createExpression',
    signatures: [['expression','?resolver']]
  },
  {
    name: 'createNSResolver',
    signatures: [['nodeResolver']]
  },
  {
    name: 'evaluate',
    signatures: [['expression','contextNode','?resolver','?type','?result']],
    receivers: ['XPathEvaluatorBase']
  },
  {
    name: 'evaluate',
    signatures: [['contextNode','?type','?result']],
    receivers: ['XPathExpression']
  },
  {
    name: 'snapshotItem',
    signatures: [['index']]
  },
  {
    name: 'importStylesheet',
    signatures: [['style']]
  },
  {
    name: 'removeParameter',
    signatures: [['namespaceURI','localName']]
  },
  {
    name: 'setParameter',
    signatures: [['namespaceURI','localName','value']]
  },
  {
    name: 'transformToDocument',
    signatures: [['source']]
  },
  {
    name: 'transformToFragment',
    signatures: [['source','output']]
  },
  {
    name: 'assert',
    signatures: [['?condition','...data']]
  },
  {
    name: 'countReset',
    signatures: [['?label']]
  },
  {
    name: 'debug',
    signatures: [['...data']]
  },
  {
    name: 'dir',
    signatures: [['?item','?options']]
  },
  {
    name: 'dirxml',
    signatures: [['...data']]
  },
  {
    name: 'group',
    signatures: [['...data']]
  },
  {
    name: 'groupCollapsed',
    signatures: [['...data']]
  },
  {
    name: 'info',
    signatures: [['...data']]
  },
  {
    name: 'table',
    signatures: [['?tabularData','?properties']]
  },
  {
    name: 'time',
    signatures: [['?label']]
  },
  {
    name: 'timeEnd',
    signatures: [['?label']]
  },
  {
    name: 'timeLog',
    signatures: [['?label','...data']]
  },
  {
    name: 'timeStamp',
    signatures: [['?label']]
  },
  {
    name: 'trace',
    signatures: [['...data']]
  },
  {
    name: 'warn',
    signatures: [['...data']]
  },
  {
    name: 'importScripts',
    signatures: [['...urls']]
  },
  {
    name: 'Write',
    signatures: [['s']]
  },
  {
    name: 'WriteLine',
    signatures: [['s']]
  },
  {
    name: 'WriteBlankLines',
    signatures: [['intLines']]
  },
  {
    name: 'Read',
    signatures: [['characters']]
  },
  {
    name: 'Skip',
    signatures: [['characters']]
  },
  {
    name: 'lbound',
    signatures: [['?dimension']]
  },
  {
    name: 'ubound',
    signatures: [['?dimension']]
  }
];
