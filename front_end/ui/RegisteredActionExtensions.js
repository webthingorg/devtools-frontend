// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import {ActionRegistration, PreRegisteredAction} from './ActionRegistration.js';  // eslint-disable-line no-unused-vars


/** @type {!Array<!PreRegisteredAction>} */
const registeredActionExtensions = [];

/**
 * @param {!ActionRegistration} registration
 */
export function registerActionExtension(registration) {
  registeredActionExtensions.push(new PreRegisteredAction(registration));
}

/**
 * @return {!Array.<!PreRegisteredAction>}
 */
export function getRegisteredActionExtensions() {
  return registeredActionExtensions;
}
