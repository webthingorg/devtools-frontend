// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';

/**
 * @unrestricted
 */
export class Issue extends Common.ObjectWrapper.ObjectWrapper {
  constructor(code) {
    super();
    this._code = code;
    this._instances = [];
    this._cookies = new Map();
    this._requests = new Map();
  }

  static create(code) {
    return new Issue(code);
  }

  get code() {
    return this._code;
  }

  instances() {
    return this._instances;
  }

  cookies() {
    return this._cookies;
  }

  numberOfCookies() {
    return this._cookies.size;
  }

  addInstance(issue) {
    this._instances.push(issue.resources);
    const cookie = issue.resources.cookie;
    if (cookie) {
      const key = JSON.stringify(cookie);
      if (!this._cookies.has(key)) {
        const parsedURL = Common.ParsedURL.ParsedURL.fromString(issue.resources.site_for_cookie.url);
        cookie.securityOrigin = parsedURL.securityOrigin();
        this._cookies.set(key, cookie);
        this.dispatchEventToListeners(Events.CookieAdded, cookie);
      }
    }

    const request = issue.resources.request;
    if (request) {
      const key = request.url;
      if (!this._requests.has(key)) {
        this._requests.set(key, request);
        this.dispatchEventToListeners(Events.RequestAdded, request);
      }
    }
    this.dispatchEventToListeners(Events.InstanceAdded, issue);
  }
}

export const Events = {
  InstanceAdded: Symbol('InstanceAdded'),
  CookieAdded: Symbol('CookieAdded'),
  RequestAdded: Symbol('RequestAdded'),
};
