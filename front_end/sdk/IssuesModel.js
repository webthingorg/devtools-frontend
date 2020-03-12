// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';  // eslint-disable-line no-unused-vars

import {CookieModel} from './CookieModel.js';
import {AggregatedIssue, Issue} from './Issue.js';
import {Events as NetworkManagerEvents, NetworkManager} from './NetworkManager.js';
import {NetworkRequest,  // eslint-disable-line no-unused-vars
        setCookieBlockedReasonToAttribute, setCookieBlockedReasonToUiString,} from './NetworkRequest.js';
import {Events as ResourceTreeModelEvents, ResourceTreeModel} from './ResourceTreeModel.js';
import {Capability, SDKModel, Target} from './SDKModel.js';  // eslint-disable-line no-unused-vars

const connectedIssueSymbol = Symbol('issue');

/**
 * @implements {Protocol.AuditsDispatcher}
 */
export class IssuesModel extends SDKModel {
  /**
   * @param {!Target} target
   */
  constructor(target) {
    super(target);
    this._enabled = false;
    this._issues = [];
    /** @type {!Map<string, !AggregatedIssue>} */
    this._aggregatedIssuesByCode = new Map();
    this._cookiesModel = target.model(CookieModel);
    /** @type {?Protocol.AuditsAgent} */
    this._auditsAgent = null;

    const networkManager = target.model(NetworkManager);
    if (networkManager) {
      networkManager.addEventListener(NetworkManagerEvents.RequestFinished, this._handleRequestFinished, this);
    }

    const resourceTreeModel = /** @type {?ResourceTreeModel} */ (target.model(ResourceTreeModel));
    if (resourceTreeModel) {
      resourceTreeModel.addEventListener(
        ResourceTreeModelEvents.MainFrameNavigated, this._onMainFrameNavigated, this);
    }
  }

  /**
   * @param {!Common.EventTarget.EventTargetEvent} event
   */
  _onMainFrameNavigated(event) {
    const mainFrame = /** @type {!SDK.ResourceTreeFrame} */ (event.data);
    // TODO: This clears too many issues, see crbug.com/1060628.
    this._issues = this._issues.filter(issue => issue.isAssociatedWithRequestId(mainFrame.loaderId));
    this._aggregatedIssuesByCode = new Map();
    for (const issue of this._issues) {
      this._aggregateIssue(issue);
    }
    this.dispatchEventToListeners(Events.FullUpdateRequired);
  }

  ensureEnabled() {
    if (this._enabled) {
      return;
    }

    this._enabled = true;
    this.target().registerAuditsDispatcher(this);
    this._auditsAgent = this.target().auditsAgent();
    this._auditsAgent.enable();
  }

  /**
   * @param {!Issue} issue
   * @returns {!AggregatedIssue}
   */
  _aggregateIssue(issue) {
    if (!this._aggregatedIssuesByCode.has(issue.code())) {
      this._aggregatedIssuesByCode.set(issue.code(), new AggregatedIssue(issue.code()));
    }
    const aggregatedIssue = this._aggregatedIssuesByCode.get(issue.code());
    aggregatedIssue.addInstance(issue);
    return aggregatedIssue;
  }

  /**
   * @override
   * @param {!Protocol.Audits.InspectorIssue} inspectorIssue
   */
  issueAdded(inspectorIssue) {
    const issue = new Issue(inspectorIssue.code, inspectorIssue.resources);
    this._issues.push(issue);
    const aggregatedIssue = this._aggregateIssue(issue);
    this.dispatchEventToListeners(Events.AggregatedIssueUpdated, aggregatedIssue);
  }

  /**
   * @returns {!Iterator<AggregatedIssue>}
   */
  aggregatedIssues() {
    return this._aggregatedIssuesByCode.values();
  }

   /**
   * @return {number}
   */
  numberOfAggregatedIssues() {
    return this._aggregatedIssuesByCode.size;
  }

  /**
   * @param {!*} obj
   * @param {!Issue} issue
   */
  static connectWithIssue(obj, issue) {
    if (!obj) {
      return;
    }

    if (!obj[connectedIssueSymbol]) {
      obj[connectedIssueSymbol] = new Set();
    }

    obj[connectedIssueSymbol].add(issue);
  }

  /**
   * @param {!*} obj
   */
  static hasIssues(obj) {
    if (!obj) {
      return false;
    }

    return obj[connectedIssueSymbol] && obj[connectedIssueSymbol].length;
  }

  /**
   * @param {!Common.EventTarget.EventTargetEvent} event
   */
  _handleRequestFinished(event) {
    const request = /** @type {!NetworkRequest} */ (event.data);

    const blockedResponseCookies = request.blockedResponseCookies();
    for (const blockedCookie of blockedResponseCookies) {
      const cookie = blockedCookie.cookie;
      if (!cookie) {
        continue;
      }

      const issue = new Issue(Protocol.InspectorIssueCode.SameSiteCookiesSameSiteNoneMissingForThirdParty, {});

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
export const Events = {
  AggregatedIssueUpdated: Symbol('IssueUpdated'),
  FullUpdateRequired: Symbol('FullUpdateRequired'),
};

SDKModel.register(IssuesModel, Capability.None, true);
