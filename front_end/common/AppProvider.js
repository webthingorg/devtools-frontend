// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Root from '../root/root.js';  // eslint-disable-line no-unused-vars

import {App} from './App.js';  // eslint-disable-line no-unused-vars

/**
 * @interface
 */
export class AppProvider {
  /**
   * @return {!App}
   */
  createApp() {
    throw new Error('not implemented');
  }
}


/** @type {!Array<!AppProviderRegistration>} */
const registeredAppProvider = [];

/**
 * @param {!AppProviderRegistration} registration
 */
export function registerAppProvider(registration) {
  registeredAppProvider.push(registration);
}
/**
 * @return {!Array<!AppProviderRegistration>}
 */
export function getRegisteredAppProviders() {
  return registeredAppProvider;
}

/**
  * @typedef {{
  *  loadAppProvider: function(): !Promise<!AppProvider>,
  *  condition: Root.Runtime.ConditionName|undefined,
  *  order: number,
  * }}
  */
// @ts-ignore typedef
export let AppProviderRegistration;
