// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const connectedIssuesSymbol = Symbol('issues');

import {CookieModel} from './CookieModel.js';
import {NetworkManager} from './NetworkManager.js';
import {NetworkRequest,  // eslint-disable-line no-unused-vars
        setCookieBlockedReasonToAttribute, setCookieBlockedReasonToUiString,} from './NetworkRequest.js';
import {Capability, SDKModel, Target} from './SDKModel.js';  // eslint-disable-line no-unused-vars

import {Issue} from '../sdk/Issue.js';

/**
 * @unrestricted
 */
export class IssuesModel extends SDKModel {
  /**
   * @param {!Target} target
   */
  constructor(target) {
    super(target);

    target.registerAuditsDispatcher(this);
    this._auditsAgent = target.auditsAgent();
    this._auditsAgent.enable();

    const networkManager = target.model(NetworkManager);
    if (networkManager) {
      // networkManager.addEventListener(Events.RequestFinished, this._handleRequestFinished, this);
    }

    this._cookiesModel = target.model(CookieModel);

    this._issues = [];
    this._browserIssues = [];
    this._browserIssuesByCode = new Map();
  }

  /**
   * @override
   * @param {!Protocol.Issues.Issue} payload
   */
  issueAdded(payload) {
    if (!this._browserIssuesByCode.has(payload.code)) {
      const issue = new Issue(payload.code, payload.resources);
      this._browserIssuesByCode.set(payload.code, issue);
      this.dispatchEventToListeners(IssuesModel.Events.IssueAdded, issue);
    } else {
      const issue = this._browserIssuesByCode.get(payload.code);
      // issue.addResources(payload.resources);
      this.dispatchEventToListeners(IssuesModel.Events.IssueUpdated, issue);
    }
  }

  /**
   * @param {!*} obj
   * @param {!Issue} issue
   */
  static connectWithIssue(obj, issue) {
    if (!obj) {
      return;
    }

    if (!obj[connectedIssuesSymbol]) {
      obj[connectedIssuesSymbol] = [];
    }

    obj[connectedIssuesSymbol].push(issue);
  }

  /**
   * @param {!*} obj
   */
  static hasIssues(obj) {
    if (!obj) {
      return false;
    }

    return obj[connectedIssuesSymbol] && obj[connectedIssuesSymbol].length;
  }

  /**
   * @param {!Common.Event} event
   */
  _handleRequestFinished(event) {
    const request = /** @type {!NetworkRequest} */ (event.data);

    const blockedResponseCookies = request.blockedResponseCookies();
    for (const blockedCookie of blockedResponseCookies) {
      const cookie = blockedCookie.cookie;
      if (!cookie) {
        continue;
      }

      const reason = blockedCookie.blockedReasons[0];
      const issue = new Issue(Issue.Categories.SameSite, reason, {request, cookie});

      IssuesModel.connectWithIssue(request, issue);
      IssuesModel.connectWithIssue(cookie, issue);

      this._cookiesModel.addBlockedCookie(
          cookie, blockedCookie.blockedReasons.map(blockedReason => ({
                                                     attribute: setCookieBlockedReasonToAttribute(blockedReason),
                                                     uiString: setCookieBlockedReasonToUiString(blockedReason)
                                                   })));
    }
  }
}

/** @enum {symbol} */
IssuesModel.Events = {
  Updated: Symbol('Updated'),
  IssueAdded: Symbol('IssueAdded'),
  IssueUpdated: Symbol('IssueUpdated'),
};

SDKModel.register(IssuesModel, Capability.None, false);
