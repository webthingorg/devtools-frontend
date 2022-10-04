// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as SDK from '../../../core/sdk/sdk.js';
import * as Protocol from '../../../generated/protocol.js';
import * as Platform from '../../../core/platform/platform.js';
import * as i18n from '../../../core/i18n/i18n.js';
import * as IssuesManager from '../../../models/issues_manager/issues_manager.js';
import * as Host from '../../../core/host/host.js';

const UIStrings = {
  /**
  *@description Explanation text for which cross-origin policy to set.
  */
  chooseThisOptionIfTheResourceAnd:
      'Choose this option if the resource and the document are served from the same site.',
  /**
  *@description Explanation text for which cross-origin policy to set.
  */
  onlyChooseThisOptionIfAn:
      'Only choose this option if an arbitrary website including this resource does not impose a security risk.',
  /**
  *@description Message in the Headers View of the Network panel when a cross-origin opener policy blocked loading a sandbox iframe.
  */
  thisDocumentWasBlockedFrom:
      'This document was blocked from loading in an `iframe` with a `sandbox` attribute because this document specified a cross-origin opener policy.',
  /**
  *@description Message in the Headers View of the Network panel when a cross-origin embedder policy header needs to be set.
  */
  toEmbedThisFrameInYourDocument:
      'To embed this frame in your document, the response needs to enable the cross-origin embedder policy by specifying the following response header:',
  /**
  *@description Message in the Headers View of the Network panel when a cross-origin resource policy header needs to be set.
  */
  toUseThisResourceFromADifferent:
      'To use this resource from a different origin, the server needs to specify a cross-origin resource policy in the response headers:',
  /**
  *@description Message in the Headers View of the Network panel when the cross-origin resource policy header is too strict.
  */
  toUseThisResourceFromADifferentOrigin:
      'To use this resource from a different origin, the server may relax the cross-origin resource policy response header:',
  /**
  *@description Message in the Headers View of the Network panel when the cross-origin resource policy header is too strict.
  */
  toUseThisResourceFromADifferentSite:
      'To use this resource from a different site, the server may relax the cross-origin resource policy response header:',
};

const str_ = i18n.i18n.registerUIStrings('panels/network/components/HeaderOverridesManager.ts', UIStrings);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);

export class HeaderOverridesManager {
  static generateHeaderDescriptors(request: Readonly<SDK.NetworkRequest.NetworkRequest>): HeaderDescriptor[] {
    let headers: HeaderDescriptor[] =
        request.sortedResponseHeaders.map(header => ({
                                            name: Platform.StringUtilities.toLowerCaseString(header.name),
                                            value: header.value,
                                            originalValue: header.value,
                                          }));

    HeaderOverridesManager.#markOverrides(headers, request);

    function maybeGetHeaderWithIssue(): HeaderDescriptor|null {
      if (!request.wasBlocked()) {
        return null;
      }
      const headerWithIssue = BlockedReasonDetails.get((request.blockedReason() as Protocol.Network.BlockedReason));
      if (!headerWithIssue) {
        return null;
      }
      if (IssuesManager.RelatedIssue.hasIssueOfCategory(
              request, IssuesManager.Issue.IssueCategory.CrossOriginEmbedderPolicy)) {
        const followLink = (): void => {
          Host.userMetrics.issuesPanelOpenedFrom(Host.UserMetrics.IssueOpener.LearnMoreLinkCOEP);
          if (request) {
            void IssuesManager.RelatedIssue.reveal(
                request, IssuesManager.Issue.IssueCategory.CrossOriginEmbedderPolicy);
          }
        };
        if (headerWithIssue.blockedDetails) {
          headerWithIssue.blockedDetails.reveal = followLink;
        }
      }
      return headerWithIssue;
    }

    function mergeHeadersWithIssueHeader(
        headers: HeaderDescriptor[], headerWithIssue: HeaderDescriptor): HeaderDescriptor[] {
      let i = 0;
      const result: HeaderDescriptor[] = [];
      while (i < headers.length && headers[i].name < headerWithIssue.name) {
        result.push({...headers[i++], headerNotSet: false});
      }
      if (i >= headers.length || headers[i].name > headerWithIssue.name) {
        result.push({...headerWithIssue, headerNotSet: true});
      } else {
        result.push({...headerWithIssue, ...headers[i++], headerNotSet: false});
      }
      while (i < headers.length) {
        result.push({...headers[i++], headerNotSet: false});
      }
      return result;
    }

    const headerWithIssue = maybeGetHeaderWithIssue();
    if (headerWithIssue) {
      headers = mergeHeadersWithIssueHeader(headers, headerWithIssue);
    }

    const blockedResponseCookies = request.blockedResponseCookies();
    const blockedCookieLineToReasons = new Map<string, Protocol.Network.SetCookieBlockedReason[]>(
        blockedResponseCookies?.map(c => [c.cookieLine, c.blockedReasons]));
    for (const header of headers) {
      if (header.name === 'set-cookie' && header.value) {
        const matchingBlockedReasons = blockedCookieLineToReasons.get(header.value);
        if (matchingBlockedReasons) {
          header.setCookieBlockedReasons = matchingBlockedReasons;
        }
      }
    }

    return headers;
  }

  static #markOverrides(headers: HeaderDescriptor[], request: Readonly<SDK.NetworkRequest.NetworkRequest>): void {
    if (request.originalResponseHeaders.length === 0) {
      return;
    }

    // To compare original headers and actual headers we use a map from header
    // name to an array of header values. This allows us to handle the cases
    // in which we have multiple headers with the same name (and corresponding
    // header values which may or may not occur multiple times as well). We are
    // not using MultiMaps, because a Set would not able to distinguish between
    // header values [a, a, b] and [a, b, b].
    const originalHeaders = new Map<Platform.StringUtilities.LowerCaseString, string[]>();
    for (const header of request?.originalResponseHeaders || []) {
      const headerName = Platform.StringUtilities.toLowerCaseString(header.name);
      const headerValues = originalHeaders.get(headerName);
      if (headerValues) {
        headerValues.push(header.value);
      } else {
        originalHeaders.set(headerName, [header.value]);
      }
    }

    const actualHeaders = new Map<Platform.StringUtilities.LowerCaseString, string[]>();
    for (const header of headers) {
      const headerName = Platform.StringUtilities.toLowerCaseString(header.name);
      const headerValues = actualHeaders.get(headerName);
      if (headerValues) {
        headerValues.push(header.value || '');
      } else {
        actualHeaders.set(headerName, [header.value || '']);
      }
    }

    const isDifferent =
        (headerName: Platform.StringUtilities.LowerCaseString,
         actualHeaders: Map<Platform.StringUtilities.LowerCaseString, string[]>,
         originalHeaders: Map<Platform.StringUtilities.LowerCaseString, string[]>): boolean => {
          const actual = actualHeaders.get(headerName);
          const original = originalHeaders.get(headerName);
          if (!actual || !original || actual.length !== original.length) {
            return true;
          }
          actual.sort();
          original.sort();
          for (let i = 0; i < actual.length; i++) {
            if (actual[i] !== original[i]) {
              return true;
            }
          }
          return false;
        };

    for (const headerName of actualHeaders.keys()) {
      // If the array of actual headers and the array of original headers do not
      // exactly match, mark all headers with 'headerName' as being overridden.
      if (isDifferent(headerName, actualHeaders, originalHeaders)) {
        headers.filter(header => header.name === headerName).forEach(header => {
          header.isOverride = true;
        });
      }
    }
  }
}

export interface BlockedDetailsDescriptor {
  explanation: () => string;
  examples: Array<{
    codeSnippet: string,
    comment?: () => string,
  }>;
  link: {
    url: string,
  }|null;
  reveal?: () => void;
}

export interface HeaderDescriptor {
  name: Platform.StringUtilities.LowerCaseString;
  value: string|null;
  originalValue?: string;
  headerValueIncorrect?: boolean;
  blockedDetails?: BlockedDetailsDescriptor;
  headerNotSet?: boolean;
  setCookieBlockedReasons?: Protocol.Network.SetCookieBlockedReason[];
  highlight?: boolean;
  isOverride?: boolean;
  valueEditable?: boolean;
  nameEditable?: boolean;
}

const BlockedReasonDetails = new Map<Protocol.Network.BlockedReason, HeaderDescriptor>([
  [
    Protocol.Network.BlockedReason.CoepFrameResourceNeedsCoepHeader,
    {
      name: Platform.StringUtilities.toLowerCaseString('cross-origin-embedder-policy'),
      value: null,
      blockedDetails: {
        explanation: i18nLazyString(UIStrings.toEmbedThisFrameInYourDocument),
        examples: [{codeSnippet: 'Cross-Origin-Embedder-Policy: require-corp', comment: undefined}],
        link: {url: 'https://web.dev/coop-coep/'},
      },
    },
  ],
  [
    Protocol.Network.BlockedReason.CorpNotSameOriginAfterDefaultedToSameOriginByCoep,
    {
      name: Platform.StringUtilities.toLowerCaseString('cross-origin-resource-policy'),
      value: null,
      blockedDetails: {
        explanation: i18nLazyString(UIStrings.toUseThisResourceFromADifferent),
        examples: [
          {
            codeSnippet: 'Cross-Origin-Resource-Policy: same-site',
            comment: i18nLazyString(UIStrings.chooseThisOptionIfTheResourceAnd),
          },
          {
            codeSnippet: 'Cross-Origin-Resource-Policy: cross-origin',
            comment: i18nLazyString(UIStrings.onlyChooseThisOptionIfAn),
          },
        ],
        link: {url: 'https://web.dev/coop-coep/'},
      },
    },
  ],
  [
    Protocol.Network.BlockedReason.CoopSandboxedIframeCannotNavigateToCoopPage,
    {
      name: Platform.StringUtilities.toLowerCaseString('cross-origin-opener-policy'),
      value: null,
      headerValueIncorrect: false,
      blockedDetails: {
        explanation: i18nLazyString(UIStrings.thisDocumentWasBlockedFrom),
        examples: [],
        link: {url: 'https://web.dev/coop-coep/'},
      },
    },
  ],
  [
    Protocol.Network.BlockedReason.CorpNotSameSite,
    {
      name: Platform.StringUtilities.toLowerCaseString('cross-origin-resource-policy'),
      value: null,
      headerValueIncorrect: true,
      blockedDetails: {
        explanation: i18nLazyString(UIStrings.toUseThisResourceFromADifferentSite),
        examples: [
          {
            codeSnippet: 'Cross-Origin-Resource-Policy: cross-origin',
            comment: i18nLazyString(UIStrings.onlyChooseThisOptionIfAn),
          },
        ],
        link: null,
      },
    },
  ],
  [
    Protocol.Network.BlockedReason.CorpNotSameOrigin,
    {
      name: Platform.StringUtilities.toLowerCaseString('cross-origin-resource-policy'),
      value: null,
      headerValueIncorrect: true,
      blockedDetails: {
        explanation: i18nLazyString(UIStrings.toUseThisResourceFromADifferentOrigin),
        examples: [
          {
            codeSnippet: 'Cross-Origin-Resource-Policy: same-site',
            comment: i18nLazyString(UIStrings.chooseThisOptionIfTheResourceAnd),
          },
          {
            codeSnippet: 'Cross-Origin-Resource-Policy: cross-origin',
            comment: i18nLazyString(UIStrings.onlyChooseThisOptionIfAn),
          },
        ],
        link: null,
      },
    },
  ],
]);
