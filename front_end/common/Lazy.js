// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const UNINITIALIZED = Symbol('uninitialized');
const ERROR_STATE = Symbol('error');

/**
 * @template T
 * @param {() => T} producer
 * @returns {() => symbol|T}
 */
export function lazy(producer) {
  /** @type {symbol|T} */
  let value = UNINITIALIZED;
  /** @type {Error|null} */
  let error = null;

  return () => {
    if (value === ERROR_STATE) {
      throw error;
    } else if (value !== UNINITIALIZED) {
      return value;
    }

    try {
      value = producer();
      return value;
    } catch (err) {
      error = err;
      value = ERROR_STATE;
      throw error;
    }
  };
}
