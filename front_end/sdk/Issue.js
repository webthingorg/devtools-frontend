// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';

import {NetworkRequest} from './NetworkRequest.js';  // eslint-disable-line no-unused-vars

/** @enum {symbol} */
export const IssueKind = {
  BreakingChange: Symbol('BreakingChange'),
};

/**
 * @typedef {{
  *            title:string,
  *            message: (function():!Element),
  *            issueKind: !IssueKind,
  *            link: string,
  *            linkTitle: string
  *          }}
  */
export let IssueDescription;  // eslint-disable-line no-unused-vars

/**
 * @abstract
 */
export class Issue extends Common.ObjectWrapper.ObjectWrapper {
  /**
   * @param {string} code
   */
  constructor(code) {
    super();
    /** @type {string} */
    this._code = code;
  }

  /**
   * @returns {string}
   */
  code() {
    return this._code;
  }

  /**
   * TODO(chromium:1063765): Strengthen types.
   * @returns {!Iterable<Protocol.Audits.AffectedCookie>}
   */
  cookies() {
    return [];
  }

  /**
   * @returns {!Iterable<Protocol.Audits.AffectedRequest>}
   */
  requests() {
    return [];
  }

  /**
   * @param {string} requestId
   * @returns {boolean}
   */
  isAssociatedWithRequestId(requestId) {
    for (const request of this.requests()) {
      if (request.requestId === requestId) {
        return true;
      }
    }
    return false;
  }

  /**
   * @abstract
   * @returns {?IssueDescription}
   */
  getDescription() {
  }

  /**
   * @abstract
   * @return {symbol}
   */
  getCategory() {
  }
}

/**
 * An `AggregatedIssue` representes a number of `Issue` objects that is displayed together. Currently only grouping by
 * issue code, is supported. The class provides helpers to support displaying of all resources that are affected by
 * the aggregated issues.
 */
export class AggregatedIssue extends Common.ObjectWrapper.ObjectWrapper {
  /**
   * @param {string} code
   */
  constructor(code) {
    super();
    this._code = code;
    // TODO(chromium:1063765): Strengthen types.
    /** @type {!Array<*>} */
    this._resources = [];
    /** @type {!Map<string, !Protocol.Audits.AffectedCookie>} */
    this._cookies = new Map();
    /** @type {!Map<string, !NetworkRequest>} */
    this._requests = new Map();
    /** @type {?Issue} */
    this._representative = null;
  }

  /**
   * @returns {string}
   */
  code() {
    return this._code;
  }

  /**
   * TODO(chromium:1063765): Strengthen types.
   * @returns {!Iterable<Protocol.Audits.AffectedCookie>}
   */
  cookies() {
    return this._cookies.values();
  }

  /**
   * @returns {!Iterable<!NetworkRequest>}
   */
  requests() {
    return this._requests.values();
  }

  getDescription() {
    if (this._representative) {
      return this._representative.getDescription();
    }
    return null;
  }

  /**
   * @param {!Issue} issue
   */
  addInstance(issue) {
    if (!this._representative) {
      this._representative = issue;
    }
    for (const cookie of issue.cookies()) {
      const key = JSON.stringify(cookie);
      if (!this._cookies.has(key)) {
        this._cookies.set(key, cookie);
      }
    }
    for (const request of issue.requests()) {
      if (request.request) {
        this._requests.set(request.requestId, request.request);
      }
    }
  }
}
