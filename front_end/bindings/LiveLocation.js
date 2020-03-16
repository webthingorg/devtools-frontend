// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Workspace from '../workspace/workspace.js';  // eslint-disable-line no-unused-vars

/** @interface */
export class LiveLocation {
  /**
   * @return {!Promise}
   */
  update() {
  }

  /**
   * @return {!Promise<?Workspace.UISourceCode.UILocation>}
   */
  uiLocation() {
  }

  dispose() {
  }

  /**
   * @return {!Promise<boolean>}
   */
  isBlackboxed() {}
}

/**
 * @implements {LiveLocation}
 * @unrestricted
 */
export class LiveLocationWithPool {
  /**
   * @param {function(!LiveLocation)} updateDelegate
   * @param {!LiveLocationPool} locationPool
   */
  constructor(updateDelegate, locationPool) {
    this._updateDelegate = updateDelegate;
    this._locationPool = locationPool;
    this._locationPool._add(this);
    this._promise = null;
  }

  /**
   * @override
   */
  async update() {
    if (!this._updateDelegate) {
      return;
    }
    if (this._promise) {
      await this._promise.then(() => this.update());
    } else {
      this._promise = this._updateDelegate(this);
      await this._promise;
      this._promise = null;
    }
  }

  /**
   * @override
   * @return {!Promise<?Workspace.UISourceCode.UILocation>}
   */
  async uiLocation() {
    throw 'Not implemented';
  }

  /**
   * @override
   */
  dispose() {
    this._locationPool._delete(this);
    this._updateDelegate = null;
  }

  /**
   * @override
   * @return {!Promise<boolean>}
   */
  async isBlackboxed() {
    throw 'Not implemented';
  }
}

/**
 * @unrestricted
 */
export class LiveLocationPool {
  constructor() {
    this._locations = new Set();
  }

  /**
   * @param {!LiveLocation} location
   */
  _add(location) {
    this._locations.add(location);
  }

  /**
   * @param {!LiveLocation} location
   */
  _delete(location) {
    this._locations.delete(location);
  }

  disposeAll() {
    for (const location of this._locations) {
      location.dispose();
    }
  }
}
