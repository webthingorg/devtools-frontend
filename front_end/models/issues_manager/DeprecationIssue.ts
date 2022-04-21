// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../core/i18n/i18n.js';
import type * as SDK from '../../core/sdk/sdk.js';
import * as Protocol from '../../generated/protocol.js';

import {Issue, IssueCategory, IssueKind} from './Issue.js';
import type {MarkdownIssueDescription} from './MarkdownIssueDescription.js';
import {resolveLazyDescription} from './MarkdownIssueDescription.js';

const UIStrings = {
  // Store strings used across messages in this block.
  /**
   * @description This links to the chrome feature status page when one exists.
   */
  feature: 'Check the feature status page for more details.',
  /**
   * @description This links to the chromium dash schedule when a milestone is set.
   * @example {100} milestone
   */
  milestone: 'This change will go into effect with milestone {milestone}.',
  /**
   *@description Title of issue raised when a deprecated feature is used
   */
  title: 'Deprecated Feature Used',

  // Store alphabetized messages per DeprecationIssueType in this block.
  /**
   *@description This message is shown when the deprecated feature is used
   */
  authorizationCoveredByWildcard:
      '"Authorization" will not be covered by the wildcard symbol (*)in CORS "Access-Control-Allow-Headers" handling.',
  /**
   *@description This message is shown when the deprecated feature is used
   */
  cookieWithTruncatingChar: 'Cookies containing a `\\(0|r|n)` character will be rejected instead of truncated.',
  /**
   *@description This message is shown when the deprecated feature is used
   */
  crossOriginAccessBasedOnDocumentDomain:
      'Relaxing the same-origin policy by setting "document.domain" is deprecated, and will be disabled by default. This deprecation warning is for a cross-origin access that was enabled by setting document.domain.',
  /**
   *@description This message is shown when the deprecated feature is used
   */
  crossOriginWindowAlert:
      'Triggering window.alert from cross origin iframes has been deprecated and will be removed in the future.',
  /**
   *@description This message is shown when the deprecated feature is used
   */
  crossOriginWindowConfirm:
      'Triggering window.confirm from cross origin iframes has been deprecated and will be removed in the future.',
  /**
   *@description This message is shown when the deprecated feature is used
   */
  deprecationExample: 'This is an example of a translated deprecation issue message.',
  /**
   *@description This message is shown when the deprecated feature is used
   */
  v8SharedArrayBufferConstructedInExtensionWithoutIsolation:
      'Extensions should opt into cross-origin isolation to continue using SharedArrayBuffer. See https://developer.chrome.com/docs/extensions/mv3/cross-origin-isolation/.',
  /**
   *@description This message is shown when the deprecated feature is used
   */
  webCodecsVideoFrameDefaultTimestamp:
      'Constructing a VideoFrame without a timestamp is deprecated and support will be removed. Please provide a timestamp via VideoFrameInit.',
  /**
   *@description This message is shown when the deprecated feature is used
   */
  xhrJSONEncodingDetection: 'UTF-16 is not supported by response json in XMLHttpRequest',
  /**
   *@description This message is shown when the deprecated feature is used
   */
  xmlHttpRequestSynchronousInNonWorkerOutsideBeforeUnload:
      'Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user\'s experience. For more help, check https://xhr.spec.whatwg.org/.',
};
const str_ = i18n.i18n.registerUIStrings('models/issues_manager/DeprecationIssue.ts', UIStrings);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);

export class DeprecationIssue extends Issue {
  #issueDetails: Protocol.Audits.DeprecationIssueDetails;

  constructor(issueDetails: Protocol.Audits.DeprecationIssueDetails, issuesModel: SDK.IssuesModel.IssuesModel) {
    let typeCode = String(issueDetails.type);
    // TODO(crbug.com/1264960): Remove legacy type when issues are translated.
    if (issueDetails.type === Protocol.Audits.DeprecationIssueType.Untranslated) {
      typeCode = String(issueDetails.deprecationType);
    }
    const issueCode = [
      Protocol.Audits.InspectorIssueCode.DeprecationIssue,
      typeCode,
    ].join('::');
    super({code: issueCode, umaCode: 'DeprecationIssue'}, issuesModel);
    this.#issueDetails = issueDetails;
  }

  getCategory(): IssueCategory {
    return IssueCategory.Other;
  }

  details(): Protocol.Audits.DeprecationIssueDetails {
    return this.#issueDetails;
  }

  getDescription(): MarkdownIssueDescription {
    let messageFunction = (): string => '';
    let feature = 0;
    let milestone = 0;
    // Keep case statements alphabetized per DeprecationIssueType.
    switch (this.#issueDetails.type) {
      case Protocol.Audits.DeprecationIssueType.AuthorizationCoveredByWildcard:
        messageFunction = i18nLazyString(UIStrings.authorizationCoveredByWildcard);
        milestone = 97;
        break;
      case Protocol.Audits.DeprecationIssueType.CookieWithTruncatingChar:
        messageFunction = i18nLazyString(UIStrings.cookieWithTruncatingChar);
        milestone = 103;
        break;
      case Protocol.Audits.DeprecationIssueType.CrossOriginAccessBasedOnDocumentDomain:
        messageFunction = i18nLazyString(UIStrings.crossOriginAccessBasedOnDocumentDomain);
        milestone = 106;
        break;
      case Protocol.Audits.DeprecationIssueType.CrossOriginWindowAlert:
        messageFunction = i18nLazyString(UIStrings.crossOriginWindowAlert);
        break;
      case Protocol.Audits.DeprecationIssueType.CrossOriginWindowConfirm:
        messageFunction = i18nLazyString(UIStrings.crossOriginWindowConfirm);
        break;
      case Protocol.Audits.DeprecationIssueType.DeprecationExample:
        messageFunction = i18nLazyString(UIStrings.deprecationExample);
        feature = 5684289032159232;
        milestone = 100;
        break;
      // TODO(crbug.com/1264960): Remove legacy type when issues are translated.
      case Protocol.Audits.DeprecationIssueType.Untranslated:
        messageFunction = (): string => this.#issueDetails.message ?? '';
        break;
      case Protocol.Audits.DeprecationIssueType.V8SharedArrayBufferConstructedInExtensionWithoutIsolation:
        messageFunction = i18nLazyString(UIStrings.v8SharedArrayBufferConstructedInExtensionWithoutIsolation);
        milestone = 96;
        break;
      case Protocol.Audits.DeprecationIssueType.WebCodecsVideoFrameDefaultTimestamp:
        messageFunction = i18nLazyString(UIStrings.webCodecsVideoFrameDefaultTimestamp);
        feature = 5667793157488640;
        milestone = 99;
        break;
      case Protocol.Audits.DeprecationIssueType.XHRJSONEncodingDetection:
        messageFunction = i18nLazyString(UIStrings.xhrJSONEncodingDetection);
        milestone = 93;
        break;
      case Protocol.Audits.DeprecationIssueType.XMLHttpRequestSynchronousInNonWorkerOutsideBeforeUnload:
        messageFunction = i18nLazyString(UIStrings.xmlHttpRequestSynchronousInNonWorkerOutsideBeforeUnload);
        break;
    }
    const links = [];
    if (feature !== 0) {
      links.push({
        link: `https://chromestatus.com/feature/${feature}`,
        linkTitle: i18nLazyString(UIStrings.feature),
      });
    }
    if (milestone !== 0) {
      links.push({
        link: 'https://chromiumdash.appspot.com/schedule',
        linkTitle: i18nLazyString(UIStrings.milestone, {milestone}),
      });
    }
    return resolveLazyDescription({
      file: 'deprecation.md',
      substitutions: new Map([
        ['PLACEHOLDER_title', i18nLazyString(UIStrings.title)],
        ['PLACEHOLDER_message', messageFunction],
      ]),
      links,
    });
  }

  sources(): Iterable<Protocol.Audits.SourceCodeLocation> {
    if (this.#issueDetails.sourceCodeLocation) {
      return [this.#issueDetails.sourceCodeLocation];
    }
    return [];
  }

  primaryKey(): string {
    return JSON.stringify(this.#issueDetails);
  }

  getKind(): IssueKind {
    return IssueKind.BreakingChange;
  }

  static fromInspectorIssue(issuesModel: SDK.IssuesModel.IssuesModel, inspectorIssue: Protocol.Audits.InspectorIssue):
      DeprecationIssue[] {
    const details = inspectorIssue.details.deprecationIssueDetails;
    if (!details) {
      console.warn('Deprecation issue without details received.');
      return [];
    }
    if (details.type !== Protocol.Audits.DeprecationIssueType.Untranslated &&
        (details.deprecationType || details.message)) {
      console.warn('Translated deprecation issue with malformed details received.');
      return [];
    }
    if (details.type === Protocol.Audits.DeprecationIssueType.Untranslated &&
        (!details.deprecationType || !details.message)) {
      console.warn('Untranslated deprecation issue with malformed details received.');
      return [];
    }
    return [new DeprecationIssue(details, issuesModel)];
  }
}
