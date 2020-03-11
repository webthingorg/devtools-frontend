// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import {IssuesModel} from './IssuesModel.js';

export class Issue extends Common.ObjectWrapper.ObjectWrapper {
  /**
   * @param {string} code
   */
  constructor(code) {
    super();
    this._code = code;
    /** @type {!Array<!Protocol.Audits.AffectedResources>} */
    this._resources = [];
    /** @type {!Map<string, !Protocol.Audits.AffectedCookie>} */
    this._cookies = new Map();
  }

  get code() {
    return this._code;
  }

  static create(code) {
    return new Issue(code);
  }

  /**
   * @returns {!Iterable<!Protocol.Audits.AffectedCookie>}
   */
  cookies() {
    return this._cookies.values();
  }

  /**
   * @returns {number}
   */
  numberOfCookies() {
    return this._cookies.size;
  }

  /**
   * @param {!Protocol.Audits.AffectedResources} resources
   */
  addInstanceResources(resources) {
    if (!resources) {
      return;
    }

    this._resources.push(resources);

    if (resources.cookies) {
      for (const cookie of resources.cookies) {
        IssuesModel.connectWithIssue(cookie, this);
        const key = JSON.stringify(cookie);
        if (!this._cookies.has(key)) {
          this._cookies.set(key, cookie);
          this.dispatchEventToListeners(Events.CookieAdded, cookie);
        }
      }
    }
  }
}

export const Events = {
  CookieAdded: Symbol('CookieAdded'),
};
