// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @unrestricted
 */
export class Issue {
  /**
   * @param {string} code
   */
  constructor(code) {
    /** @type {string} */
    this._code = code;
  }

  get code() {
    return this._code;
  }

  /**
   *
   * @param {string} code
   */
  static create(code) {
    return new Issue(code);
  }
}
