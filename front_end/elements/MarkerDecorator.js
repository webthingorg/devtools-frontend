// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../platform/platform.js';  // eslint-disable-line no-unused-vars
import {ls} from '../platform/platform.js';
import * as SDK from '../sdk/sdk.js';  // eslint-disable-line no-unused-vars

import {PseudoStateMarkerDecorator} from './ElementsPanel.js';  // eslint-disable-line no-unused-vars

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

/**
 * @return {!Array<!MarkerDecoratorRegistration>}
 */
export function getRegisteredDecorators() {
  return [
    new (function() {
      this.marker = 'breakpoint-marker';
      this.title = ls`DOM Breakpoint`;
      this.color = 'rgb(105, 140, 254)';
      this.decorator = new GenericDecorator(this);
    })(),
    new (function() {
      this.marker = 'hidden-marker';
      this.title = ls`Element is hidden`;
      this.color = '#555';
      this.decorator = new GenericDecorator(this);
    })(),
    {
      decorator: PseudoStateMarkerDecorator.instance(),
      marker: 'pseudo-state-marker',
      title: undefined,
      color: undefined,
    },
  ];
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
