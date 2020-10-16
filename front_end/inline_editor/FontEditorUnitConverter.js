// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// TODO(crbug.com/1011811): Enable TypeScript compiler checks

import * as CssOverviewModule from '../css_overview/css_overview.js';
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

const [model] = SDK.SDKModel.TargetManager.instance().models(CssOverviewModule.CSSOverviewModel.CSSOverviewModel);
const computedArrayFontSizeIndex = 6;

/**
 * @return {string}
 */
function getPxMultiplier() {
  return '1';
}
/**
 * @param {boolean=} isFontSizeProperty
 * @return {Promise<string>}
 */
async function getEmMultiplier(isFontSizeProperty) {
  const selectedNode = UI.Context.Context.instance().flavor(SDK.DOMModel.DOMNode);
  let currentFontSize;
  if (selectedNode && selectedNode.nodeName() !== 'HTML') {
    const fontSizeNodeId = isFontSizeProperty ? selectedNode.parentNode.id : selectedNode.id;
    currentFontSize = await model.getComputedStyleForNode(fontSizeNodeId).then(findFontSizeValue);
  } else {
    currentFontSize = '16px';
  }
  currentFontSize = currentFontSize.replace(/[a-z]/g, '');
  return currentFontSize;
}

/**
 * @return {!Promise<string>}
 */
async function getRemMultiplier() {
  const selectedNode = UI.Context.Context.instance().flavor(SDK.DOMModel.DOMNode);
  const htmlNode = findHtmlNode(selectedNode);
  if (!htmlNode || !htmlNode.id) {
    return '16px';
  }
  let rootFontSize = await model.getComputedStyleForNode(htmlNode.id).then(findFontSizeValue);
  rootFontSize = rootFontSize.replace(/[a-z]/g, '');
  return rootFontSize;
}

/**
 * @param {boolean=} isFontSizeProperty
 * @return {Promise<string>}
 */
async function getPercentMultiplier(isFontSizeProperty) {
  const emMultiplier = await getEmMultiplier(isFontSizeProperty);
  const percMultiplier = parseFloat(emMultiplier) / 100;
  return percMultiplier.toString();
}

/**
 * @return {!Promise<string>}
 */
async function getVhMultiplier() {
  const viewportObject = await getViewportObject();
  if (!viewportObject) {
    return '1';
  }
  const viewportHeight = viewportObject.height;
  const vhMultiplier = viewportHeight / 100;
  return vhMultiplier.toString();
}

/**
 * @return {!Promise<string>}
 */
async function getVwMultiplier() {
  const viewportObject = await getViewportObject();
  if (!viewportObject) {
    return '1';
  }
  const viewportWidth = viewportObject.width;
  const vwMultiplier = viewportWidth / 100;
  return vwMultiplier.toString();
}

/**
 * @return {!Promise<string>}
 */
async function getVminMultiplier() {
  const viewportObject = await getViewportObject();
  if (!viewportObject) {
    return '1';
  }
  const viewportWidth = viewportObject.width;
  const viewportHeight = viewportObject.height;
  const minViewportSize = Math.min(viewportWidth, viewportHeight);
  const vminMultiplier = minViewportSize / 100;
  return vminMultiplier.toString();
}

/**
 * @return {!Promise<string>}
 */
async function getVmaxMultiplier() {
  const viewportObject = await getViewportObject();
  if (!viewportObject) {
    return '1';
  }
  const viewportWidth = viewportObject.width;
  const viewportHeight = viewportObject.height;
  const maxViewportSize = Math.max(viewportWidth, viewportHeight);
  const vmaxMultiplier = maxViewportSize / 100;
  return vmaxMultiplier.toString();
}

/**
 * @return {string}
 */
function getCmMultiplier() {
  return '37.795';
}

/**
 * @return {string}
 */
function getMmMultiplier() {
  return '3.7795';
}

/**
 * @return {string}
 */
function getInMultiplier() {
  return '96';
}

/**
 * @return {string}
 */
function getPtMultiplier() {
  return '1.333';
}

/**
 * @return {string}
 */
function getPcMultiplier() {
  return '16';
}

/**
 * @param {{computedStyle: !Array<!{name: string, value: string}>, getError: function}} computedObject
 */
function findFontSizeValue(computedObject) {
  /** @type {!Array<{name: string, value: string}>} */
  const computedArray = computedObject.computedStyle;
  let index = computedArrayFontSizeIndex;
  if (computedArray[index].name && computedArray[index].name !== 'font-size') {
    for (let i = 0; i < computedArray.length; i++) {
      if (computedArray[i].name === 'font-size') {
        index = i;
        break;
      }
    }
  }
  return computedArray[index].value;
}

/**
 * @param {!SDK.DOMModel.DOMNode | null} selectedNode
 * @return {!SDK.DOMModel.DOMNode | null}
 */
function findHtmlNode(selectedNode) {
  let node = selectedNode;
  while (node && node.nodeName() !== 'HTML') {
    if (node.parentNode) {
      node = node.parentNode;
    } else {
      break;
    }
  }
  return node;
}

const widthEvaluateParams = {
  expression: 'window.innerWidth',
  objectGroup: undefined,
  includeCommandLineAPI: false,
  silent: true,
  contextId: undefined,
  returnByValue: false,
  generatePreview: false,
  userGesture: false,
  awaitPromise: true,
  throwOnSideEffect: false,
  timeout: undefined,
  disableBreaks: true,
  replMode: false,
  allowUnsafeEvalBlockedByCSP: false
};

const heightEvaluateParams = {
  expression: 'window.innerHeight',
  objectGroup: undefined,
  includeCommandLineAPI: false,
  silent: true,
  contextId: undefined,
  returnByValue: false,
  generatePreview: false,
  userGesture: false,
  awaitPromise: true,
  throwOnSideEffect: false,
  timeout: undefined,
  disableBreaks: true,
  replMode: false,
  allowUnsafeEvalBlockedByCSP: false
};

/**
 * @return {!Promise<?{width: number, height: number}>}
 */
async function getViewportObject() {
  const currentExecutionContext = UI.Context.Context.instance().flavor(SDK.RuntimeModel.ExecutionContext);
  let width, height;
  if (currentExecutionContext) {
    const widthObject = await currentExecutionContext.evaluate(widthEvaluateParams, false, false);
    const heightObject = await currentExecutionContext.evaluate(heightEvaluateParams, false, false);
    // @ts-ignore Return object for evaluate has two typedef, one with object parameter and one without.
    if (widthObject.object) {
      // @ts-ignore
      width = widthObject.object.value;
    }
    // @ts-ignore Return object for evaluate has two typedef, one with object parameter and one without.
    if (heightObject.object) {
      // @ts-ignore
      height = heightObject.object.value;
    }
  }
  if (width === undefined || height === undefined) {
    const selectedNode = UI.Context.Context.instance().flavor(SDK.DOMModel.DOMNode);
    if (!selectedNode) {
      return null;
    }
    const pageLayout = await selectedNode.domModel().target().pageAgent().invoke_getLayoutMetrics();
    const zoom = pageLayout.visualViewport.zoom ? pageLayout.visualViewport.zoom : 1;
    height = pageLayout.visualViewport.clientHeight / zoom;
    width = pageLayout.visualViewport.clientWidth / zoom;
  }
  return {width, height};
}

const unitConversionMap = new Map();
unitConversionMap.set('px', getPxMultiplier);
unitConversionMap.set('em', getEmMultiplier);
unitConversionMap.set('rem', getRemMultiplier);
unitConversionMap.set('%', getPercentMultiplier);
unitConversionMap.set('vh', getVhMultiplier);
unitConversionMap.set('vw', getVwMultiplier);
unitConversionMap.set('vmin', getVminMultiplier);
unitConversionMap.set('vmax', getVmaxMultiplier);
unitConversionMap.set('cm', getCmMultiplier);
unitConversionMap.set('mm', getMmMultiplier);
unitConversionMap.set('in', getInMultiplier);
unitConversionMap.set('pt', getPtMultiplier);
unitConversionMap.set('pc', getPcMultiplier);

/**
 * @param {!string} prevUnit
 * @param {!string} newUnit
 * @param {boolean=} isFontSize
 * @return {!Promise<number>}
 */
export async function getUnitConversionMultiplier(prevUnit, newUnit, isFontSize) {
  if (prevUnit === '') {
    prevUnit = 'em';
  }
  if (newUnit === '') {
    newUnit = 'em';
  }
  let prevUnitMultiplier, newUnitMultiplier;
  const prevUnitFunction = unitConversionMap.get(prevUnit);
  const newUnitFunction = unitConversionMap.get(newUnit);
  if (prevUnitFunction && newUnitFunction) {
    if (prevUnit === 'em' || prevUnit === '%') {
      prevUnitMultiplier = await prevUnitFunction(isFontSize);
    } else {
      prevUnitMultiplier = await prevUnitFunction();
    }
    if (newUnit === 'em' || newUnit === '%') {
      newUnitMultiplier = await newUnitFunction(isFontSize);
    } else {
      newUnitMultiplier = await newUnitFunction();
    }
  } else {
    return 1;
  }
  return prevUnitMultiplier / newUnitMultiplier;
}
