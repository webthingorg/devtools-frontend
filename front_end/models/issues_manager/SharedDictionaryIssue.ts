// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../core/i18n/i18n.js';
import type * as SDK from '../../core/sdk/sdk.js';
import * as Protocol from '../../generated/protocol.js';

import {Issue, IssueCategory, IssueKind} from './Issue.js';
import {
  type LazyMarkdownIssueDescription,
  type MarkdownIssueDescription,
  resolveLazyDescription,
} from './MarkdownIssueDescription.js';

const UIStrings = {
  /**
   *@description Title for Compression Dictionary Transport specification url link
   */
  compressionDictionaryTransport: 'Compression Dictionary Transport',
};
const str_ = i18n.i18n.registerUIStrings('models/issues_manager/SharedDictionaryIssue.ts', UIStrings);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);

export const enum IssueCode {
  InsufficientResources = 'SharedDictionaryIssue::InsufficientResources',
  ShuttingDown = 'SharedDictionaryIssue::ShuttingDown',
  FeatureDisabled = 'SharedDictionaryIssue::FeatureDisabled',
  NonSecureContext = 'SharedDictionaryIssue::NonSecureContext',
  UnsupportedCrossOriginRedirectedNoCorsRequest =
      'SharedDictionaryIssue::UnsupportedCrossOriginRedirectedNoCorsRequest',
  UnsupportedNavigationRequest = 'SharedDictionaryIssue::UnsupportedNavigationRequest',
  InvalidStructuredHeader = 'SharedDictionaryIssue::InvalidStructuredHeader',
  MatchFieldIsNotAString = 'SharedDictionaryIssue::MatchFieldIsNotAString',
  MatchDestFieldIsNotAList = 'SharedDictionaryIssue::MatchDestFieldIsNotAList',
  MatchDestFieldListItemIsNotAString = 'SharedDictionaryIssue::MatchDestFieldListItemIsNotAString',
  TypeFieldIsNotAToken = 'SharedDictionaryIssue::TypeFieldIsNotAToken',
  IdFieldIsNotAString = 'SharedDictionaryIssue::IdFieldIsNotAString',
  IdFieldTooLong = 'SharedDictionaryIssue::IdFieldTooLong',
  NoMatchField = 'SharedDictionaryIssue::NoMatchField',
  ExpiredResponse = 'SharedDictionaryIssue::ExpiredResponse',
  UnsupportedType = 'SharedDictionaryIssue::UnsupportedType',
  DisallowedBySettings = 'SharedDictionaryIssue::DisallowedBySettings',
  InvalidMatchField = 'SharedDictionaryIssue::InvalidMatchField',
  ErrorWhileWriting = 'SharedDictionaryIssue::ErrorWhileWriting',
  Unknown = 'SharedDictionaryIssue::Unknown',
}

function getIssueCode(details: Protocol.Audits.SharedDictionaryIssueDetails): IssueCode {
  switch (details.sharedDictionaryError) {
    case Protocol.Audits.SharedDictionaryError.InsufficientResources:
      return IssueCode.InsufficientResources;
    case Protocol.Audits.SharedDictionaryError.ShuttingDown:
      return IssueCode.ShuttingDown;
    case Protocol.Audits.SharedDictionaryError.FeatureDisabled:
      return IssueCode.FeatureDisabled;
    case Protocol.Audits.SharedDictionaryError.NonSecureContext:
      return IssueCode.NonSecureContext;
    case Protocol.Audits.SharedDictionaryError.UnsupportedCrossOriginRedirectedNoCorsRequest:
      return IssueCode.UnsupportedCrossOriginRedirectedNoCorsRequest;
    case Protocol.Audits.SharedDictionaryError.UnsupportedNavigationRequest:
      return IssueCode.UnsupportedNavigationRequest;
    case Protocol.Audits.SharedDictionaryError.InvalidStructuredHeader:
      return IssueCode.InvalidStructuredHeader;
    case Protocol.Audits.SharedDictionaryError.MatchFieldIsNotAString:
      return IssueCode.MatchFieldIsNotAString;
    case Protocol.Audits.SharedDictionaryError.MatchDestFieldIsNotAList:
      return IssueCode.MatchDestFieldIsNotAList;
    case Protocol.Audits.SharedDictionaryError.MatchDestFieldListItemIsNotAString:
      return IssueCode.MatchDestFieldListItemIsNotAString;
    case Protocol.Audits.SharedDictionaryError.TypeFieldIsNotAToken:
      return IssueCode.TypeFieldIsNotAToken;
    case Protocol.Audits.SharedDictionaryError.IdFieldIsNotAString:
      return IssueCode.IdFieldIsNotAString;
    case Protocol.Audits.SharedDictionaryError.IdFieldTooLong:
      return IssueCode.IdFieldTooLong;
    case Protocol.Audits.SharedDictionaryError.NoMatchField:
      return IssueCode.NoMatchField;
    case Protocol.Audits.SharedDictionaryError.ExpiredResponse:
      return IssueCode.ExpiredResponse;
    case Protocol.Audits.SharedDictionaryError.UnsupportedType:
      return IssueCode.UnsupportedType;
    case Protocol.Audits.SharedDictionaryError.DisallowedBySettings:
      return IssueCode.DisallowedBySettings;
    case Protocol.Audits.SharedDictionaryError.InvalidMatchField:
      return IssueCode.InvalidMatchField;
    case Protocol.Audits.SharedDictionaryError.ErrorWhileWriting:
      return IssueCode.ErrorWhileWriting;
    default:
      return IssueCode.Unknown;
  }
}

export class SharedDictionaryIssue extends Issue {
  readonly #issueDetails: Protocol.Audits.SharedDictionaryIssueDetails;

  constructor(issueDetails: Protocol.Audits.SharedDictionaryIssueDetails, issuesModel: SDK.IssuesModel.IssuesModel) {
    super(
        {
          code: getIssueCode(issueDetails),
          umaCode: [
            Protocol.Audits.InspectorIssueCode.SharedDictionaryIssue,
            issueDetails.sharedDictionaryError,
          ].join('::'),
        },
        issuesModel);
    this.#issueDetails = issueDetails;
  }

  override requests(): Iterable<Protocol.Audits.AffectedRequest> {
    if (this.#issueDetails.request) {
      return [this.#issueDetails.request];
    }
    return [];
  }

  getCategory(): IssueCategory {
    return IssueCategory.Other;
  }

  details(): Protocol.Audits.SharedDictionaryIssueDetails {
    return this.#issueDetails;
  }

  getDescription(): MarkdownIssueDescription|null {
    const description = issueDescriptions.get(this.#issueDetails.sharedDictionaryError);
    if (!description) {
      return null;
    }
    return resolveLazyDescription(description);
  }

  primaryKey(): string {
    return JSON.stringify(this.#issueDetails);
  }

  getKind(): IssueKind {
    return IssueKind.PageError;
  }

  static fromInspectorIssue(issuesModel: SDK.IssuesModel.IssuesModel, inspectorIssue: Protocol.Audits.InspectorIssue):
      SharedDictionaryIssue[] {
    const details = inspectorIssue.details.sharedDictionaryIssueDetails;
    if (!details) {
      console.warn('Shared Dictionary issue without details received.');
      return [];
    }
    return [new SharedDictionaryIssue(details, issuesModel)];
  }
}
const specLinks = [{
  link: 'https://datatracker.ietf.org/doc/draft-ietf-httpbis-compression-dictionary/',
  linkTitle: i18nLazyString(UIStrings.compressionDictionaryTransport),
}];

const issueDescriptions: Map<Protocol.Audits.SharedDictionaryError, LazyMarkdownIssueDescription> = new Map([
  [
    Protocol.Audits.SharedDictionaryError.InsufficientResources,
    {
      file: 'sharedDictionaryInsufficientResources.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.ShuttingDown,
    {
      file: 'sharedDictionaryShuttingDown.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.FeatureDisabled,
    {
      file: 'sharedDictionaryFeatureDisabled.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.NonSecureContext,
    {
      file: 'sharedDictionaryNonSecureContext.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.UnsupportedCrossOriginRedirectedNoCorsRequest,
    {
      file: 'sharedDictionaryUnsupportedCrossOriginRedirectedNoCorsRequest.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.UnsupportedNavigationRequest,
    {
      file: 'sharedDictionaryUnsupportedNavigationRequest.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.InvalidStructuredHeader,
    {
      file: 'sharedDictionaryInvalidStructuredHeader.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.MatchFieldIsNotAString,
    {
      file: 'sharedDictionaryMatchFieldIsNotAString.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.MatchDestFieldIsNotAList,
    {
      file: 'sharedDictionaryMatchDestFieldIsNotAList.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.MatchDestFieldListItemIsNotAString,
    {
      file: 'sharedDictionaryMatchDestFieldListItemIsNotAString.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.TypeFieldIsNotAToken,
    {
      file: 'sharedDictionaryTypeFieldIsNotAToken.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.IdFieldIsNotAString,
    {
      file: 'sharedDictionaryIdFieldIsNotAString.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.IdFieldTooLong,
    {
      file: 'sharedDictionaryIdFieldTooLong.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.NoMatchField,
    {
      file: 'sharedDictionaryNoMatchField.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.ExpiredResponse,
    {
      file: 'sharedDictionaryExpiredResponse.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.UnsupportedType,
    {
      file: 'sharedDictionaryUnsupportedType.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.DisallowedBySettings,
    {
      file: 'sharedDictionaryDisallowedBySettings.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.InvalidMatchField,
    {
      file: 'sharedDictionaryInvalidMatchField.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.ErrorWhileWriting,
    {
      file: 'sharedDictionaryErrorWhileWriting.md',
      links: specLinks,
    },
  ],
]);
