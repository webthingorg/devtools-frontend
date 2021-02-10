// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../platform/platform.js';  // eslint-disable-line no-unused-vars
import * as Root from '../root/root.js';  // eslint-disable-line no-unused-vars
import * as SDK from '../sdk/sdk.js';     // eslint-disable-line no-unused-vars

/**
 * @interface
 */
export class MarkerDecorator {
  /**
   * @param {!SDK.DOMModel.DOMNode} node
   * @return {?{title: string, color: string}}
   */
  decorate(node) {
    throw new Error('Not implemented yet');
  }
}

/**
 * @implements {MarkerDecorator}
 */
export class GenericDecorator {
  /**
   * @param {{marker: string, title: string, color: string}} extension
   */
  constructor(extension) {
    if (!extension.title || !extension.color) {
      throw new Error(`Generic decorator requires a color and a title: ${extension.marker}`);
    }
    this._title = extension.title;
    this._color = /** @type {string} */ (extension.color);
  }

  /**
   * @override
   * @param {!SDK.DOMModel.DOMNode} node
   * @return {?{title: string, color: string}}
   */
  decorate(node) {
    return {title: this._title, color: this._color};
  }
}

/** @type {!Array<!MarkerDecoratorRegistration>} */
const registeredDecorators = [];

/**
 * @param {!Array<!MarkerDecoratorRegistration>} registrations
 */
export function registerDecorators(registrations) {
  registeredDecorators.concat(registrations);
}

export function getRegisteredDecorators() {
  return registeredDecorators;
}

/**
  * @typedef {{
  *   decorator: MarkerDecorator,
  *   marker: string,
  *   color: string|undefined,
  *   title: Platform.UIString.LocalizedString|undefined
  * }}
  */
// @ts-ignore typedef
export let MarkerDecoratorRegistration;
