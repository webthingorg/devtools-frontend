// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import {IssuesModel} from './IssuesModel.js';

export class Issue extends Common.ObjectWrapper.ObjectWrapper {
  /**
   * @param {string} code
   * @param {!Protocol.Audits.AffectedResources} resources
   */
  constructor(code, resources) {
    super();
    /** @type {string} */
    this._code = code;
    /** @type {!Protocol.Audits.AffectedResources} */
    this._resources = resources;
  }

  /**
   * @returns {string}
   */
  code() {
    return this._code;
  }

  /**
   * @returns {!Protocol.Audits.AffectedResources}
   */
  resources() {
    return this._resources;
  }

  /**
   * @param {string} requestId
   * @returns {boolean}
   */
  isAssociatedWithRequestId(requestId) {
    if (this._resources.requests) {
      for (const request of this._resources.requests) {
        if (request.requestId === requestId) {
          return true;
        }
      }
    }
    return false;
  }
}

export class AggregatedIssue extends Common.ObjectWrapper.ObjectWrapper {
  /**
   * @param {string} code
   */
  constructor(code) {
    super();
    this._code = code;
    /** @type {!Map<string, !Protocol.Audits.AffectedCookie>} */
    this._cookies = new Map();
    /** @type {!Map<string, !Protocol.Audits.AffectedRequest>} */
    this._requests = new Map();
  }

  code() {
    return this._code;
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
   * @param {!Issue} issue
   */
  addInstance(issue) {
    const resources = issue.resources();
    if (resources.cookies) {
      for (const cookie of resources.cookies) {
        IssuesModel.connectWithIssue(cookie, issue);
        const key = JSON.stringify(cookie);
        if (!this._cookies.has(key)) {
          this._cookies.set(key, cookie);
        }
      }
    }
  }
}
