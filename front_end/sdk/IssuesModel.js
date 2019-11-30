// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


class Issue {
  constructor(name, data) {
    this._name = name;
    this._data = data;
  }
}

const connectedIssuesSymbol = Symbol('issues');

/**
 * @unrestricted
 */
export default class IssuesModel extends SDK.SDKModel {
  /**
   * @param {?SDK.Target=} target
   */
  constructor(target) {
    super(target);

    const networkManager = target.model(SDK.NetworkManager);
    if (networkManager) {
      networkManager.addEventListener(SDK.NetworkManager.Events.RequestFinished, this._handleRequestFinished, this);
    }

    this._issues = [];
  }


  static connectWithIssue(target, issue) {
    if (!target[connectedIssuesSymbol]) {
      target[connectedIssuesSymbol] = [];
    }

    target[connectedIssuesSymbol].push(issue);
  }

  static hasIssues(target) {
    return target[connectedIssuesSymbol] && target[connectedIssuesSymbol].length;
  }

  /**
   * @param {!Common.Event} event
   */
  _handleRequestFinished(event) {
    const request = /** @type {!SDK.NetworkRequest} */ (event.data);

    const blockedResponseCookies = request.blockedResponseCookies();
    for (const blockedCookie of blockedResponseCookies) {
      const issue = new Issue(blockedCookie.blockedReasons[0], {request, cookie: blockedCookie.cookie});

      IssuesModel.connectWithIssue(request, issue);
      IssuesModel.connectWithIssue(blockedCookie.cookie, issue);
    }
  }

  /**
   * @return {?SDK.Target}
   */
  target() {
    return this._target;
  }
}

/* Legacy exported object */
self.SDK = self.SDK || {};

/* Legacy exported object */
SDK = SDK || {};

/** @constructor */
SDK.IssuesModel = IssuesModel;

SDK.SDKModel.register(IssuesModel, SDK.Target.Capability.None, true);
