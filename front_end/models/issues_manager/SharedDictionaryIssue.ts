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
  UseErrorFailedToLoadDictionary = 'SharedDictionaryIssue::UseErrorFailedToLoadDictionary',
  UseErrorUnexpectedContentDictionaryHeader = 'SharedDictionaryIssue::UseErrorUnexpectedContentDictionaryHeader',
  UseErrorUnsupportedCrossOriginNoCorsRequest = 'SharedDictionaryIssue::UseErrorUnsupportedCrossOriginNoCorsRequest',
  UseErrorMachingDictionaryFoundButNotUsed = 'SharedDictionaryIssue::UseErrorMachingDictionaryFoundButNotUsed',
  WriteErrorInsufficientResources = 'SharedDictionaryIssue::WriteErrorInsufficientResources',
  WriteErrorShuttingDown = 'SharedDictionaryIssue::WriteErrorShuttingDown',
  WriteErrorFeatureDisabled = 'SharedDictionaryIssue::WriteErrorFeatureDisabled',
  WriteErrorNonSecureContext = 'SharedDictionaryIssue::WriteErrorNonSecureContext',
  WriteErrorUnsupportedCrossOriginNoCorsRequest =
      'SharedDictionaryIssue::WriteErrorUnsupportedCrossOriginNoCorsRequest',
  WriteErrorUnsupportedNavigationRequest = 'SharedDictionaryIssue::WriteErrorUnsupportedNavigationRequest',
  WriteErrorInvalidStructuredHeader = 'SharedDictionaryIssue::WriteErrorInvalidStructuredHeader',
  WriteErrorMatchFieldIsNotAString = 'SharedDictionaryIssue::WriteErrorMatchFieldIsNotAString',
  WriteErrorMatchDestFieldIsNotAList = 'SharedDictionaryIssue::WriteErrorMatchDestFieldIsNotAList',
  WriteErrorMatchDestFieldListItemIsNotAString = 'SharedDictionaryIssue::WriteErrorMatchDestFieldListItemIsNotAString',
  WriteErrorTypeFieldIsNotAToken = 'SharedDictionaryIssue::WriteErrorTypeFieldIsNotAToken',
  WriteErrorIdFieldIsNotAString = 'SharedDictionaryIssue::WriteErrorIdFieldIsNotAString',
  WriteErrorIdFieldTooLong = 'SharedDictionaryIssue::WriteErrorIdFieldTooLong',
  WriteErrorNoMatchField = 'SharedDictionaryIssue::WriteErrorNoMatchField',
  WriteErrorExpiredResponse = 'SharedDictionaryIssue::WriteErrorExpiredResponse',
  WriteErrorUnsupportedType = 'SharedDictionaryIssue::WriteErrorUnsupportedType',
  WriteErrorDisallowedBySettings = 'SharedDictionaryIssue::WriteErrorDisallowedBySettings',
  WriteErrorInvalidMatchField = 'SharedDictionaryIssue::WriteErrorInvalidMatchField',
  WriteErrorRequestAborted = 'SharedDictionaryIssue::WriteErrorRequestAborted',
  Unknown = 'SharedDictionaryIssue::WriteErrorUnknown',
}

function getIssueCode(details: Protocol.Audits.SharedDictionaryIssueDetails): IssueCode {
  switch (details.sharedDictionaryError) {
    case Protocol.Audits.SharedDictionaryError.UseErrorFailedToLoadDictionary:
      return IssueCode.UseErrorFailedToLoadDictionary;
    case Protocol.Audits.SharedDictionaryError.UseErrorUnexpectedContentDictionaryHeader:
      return IssueCode.UseErrorUnexpectedContentDictionaryHeader;
    case Protocol.Audits.SharedDictionaryError.UseErrorUnsupportedCrossOriginNoCorsRequest:
      return IssueCode.UseErrorUnsupportedCrossOriginNoCorsRequest;
    case Protocol.Audits.SharedDictionaryError.UseErrorMachingDictionaryFoundButNotUsed:
      return IssueCode.UseErrorMachingDictionaryFoundButNotUsed;
    case Protocol.Audits.SharedDictionaryError.WriteErrorInsufficientResources:
      return IssueCode.WriteErrorInsufficientResources;
    case Protocol.Audits.SharedDictionaryError.WriteErrorShuttingDown:
      return IssueCode.WriteErrorShuttingDown;
    case Protocol.Audits.SharedDictionaryError.WriteErrorFeatureDisabled:
      return IssueCode.WriteErrorFeatureDisabled;
    case Protocol.Audits.SharedDictionaryError.WriteErrorNonSecureContext:
      return IssueCode.WriteErrorNonSecureContext;
    case Protocol.Audits.SharedDictionaryError.WriteErrorUnsupportedCrossOriginNoCorsRequest:
      return IssueCode.WriteErrorUnsupportedCrossOriginNoCorsRequest;
    case Protocol.Audits.SharedDictionaryError.WriteErrorUnsupportedNavigationRequest:
      return IssueCode.WriteErrorUnsupportedNavigationRequest;
    case Protocol.Audits.SharedDictionaryError.WriteErrorInvalidStructuredHeader:
      return IssueCode.WriteErrorInvalidStructuredHeader;
    case Protocol.Audits.SharedDictionaryError.WriteErrorMatchFieldIsNotAString:
      return IssueCode.WriteErrorMatchFieldIsNotAString;
    case Protocol.Audits.SharedDictionaryError.WriteErrorMatchDestFieldIsNotAList:
      return IssueCode.WriteErrorMatchDestFieldIsNotAList;
    case Protocol.Audits.SharedDictionaryError.WriteErrorMatchDestFieldListItemIsNotAString:
      return IssueCode.WriteErrorMatchDestFieldListItemIsNotAString;
    case Protocol.Audits.SharedDictionaryError.WriteErrorTypeFieldIsNotAToken:
      return IssueCode.WriteErrorTypeFieldIsNotAToken;
    case Protocol.Audits.SharedDictionaryError.WriteErrorIdFieldIsNotAString:
      return IssueCode.WriteErrorIdFieldIsNotAString;
    case Protocol.Audits.SharedDictionaryError.WriteErrorIdFieldTooLong:
      return IssueCode.WriteErrorIdFieldTooLong;
    case Protocol.Audits.SharedDictionaryError.WriteErrorNoMatchField:
      return IssueCode.WriteErrorNoMatchField;
    case Protocol.Audits.SharedDictionaryError.WriteErrorExpiredResponse:
      return IssueCode.WriteErrorExpiredResponse;
    case Protocol.Audits.SharedDictionaryError.WriteErrorUnsupportedType:
      return IssueCode.WriteErrorUnsupportedType;
    case Protocol.Audits.SharedDictionaryError.WriteErrorDisallowedBySettings:
      return IssueCode.WriteErrorDisallowedBySettings;
    case Protocol.Audits.SharedDictionaryError.WriteErrorInvalidMatchField:
      return IssueCode.WriteErrorInvalidMatchField;
    case Protocol.Audits.SharedDictionaryError.WriteErrorRequestAborted:
      return IssueCode.WriteErrorRequestAborted;
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
    Protocol.Audits.SharedDictionaryError.UseErrorFailedToLoadDictionary,
    {
      file: 'sharedDictionaryUseErrorFailedToLoadDictionary.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.UseErrorUnexpectedContentDictionaryHeader,
    {
      file: 'sharedDictionaryUseErrorUnexpectedContentDictionaryHeader.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.UseErrorUnsupportedCrossOriginNoCorsRequest,
    {
      file: 'sharedDictionaryUseErrorUnsupportedCrossOriginNoCorsRequest.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.UseErrorMachingDictionaryFoundButNotUsed,
    {
      file: 'sharedDictionaryUseErrorMachingDictionaryFoundButNotUsed.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorInsufficientResources,
    {
      file: 'sharedDictionaryWriteErrorInsufficientResources.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorShuttingDown,
    {
      file: 'sharedDictionaryWriteErrorShuttingDown.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorFeatureDisabled,
    {
      file: 'sharedDictionaryWriteErrorFeatureDisabled.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorNonSecureContext,
    {
      file: 'sharedDictionaryWriteErrorNonSecureContext.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorUnsupportedCrossOriginNoCorsRequest,
    {
      file: 'sharedDictionaryWriteErrorUnsupportedCrossOriginNoCorsRequest.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorUnsupportedNavigationRequest,
    {
      file: 'sharedDictionaryWriteErrorUnsupportedNavigationRequest.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorInvalidStructuredHeader,
    {
      file: 'sharedDictionaryWriteErrorInvalidStructuredHeader.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorMatchFieldIsNotAString,
    {
      file: 'sharedDictionaryWriteErrorMatchFieldIsNotAString.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorMatchDestFieldIsNotAList,
    {
      file: 'sharedDictionaryWriteErrorMatchDestFieldIsNotAList.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorMatchDestFieldListItemIsNotAString,
    {
      file: 'sharedDictionaryWriteErrorMatchDestFieldListItemIsNotAString.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorTypeFieldIsNotAToken,
    {
      file: 'sharedDictionaryWriteErrorTypeFieldIsNotAToken.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorIdFieldIsNotAString,
    {
      file: 'sharedDictionaryWriteErrorIdFieldIsNotAString.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorIdFieldTooLong,
    {
      file: 'sharedDictionaryWriteErrorIdFieldTooLong.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorNoMatchField,
    {
      file: 'sharedDictionaryWriteErrorNoMatchField.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorExpiredResponse,
    {
      file: 'sharedDictionaryWriteErrorExpiredResponse.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorUnsupportedType,
    {
      file: 'sharedDictionaryWriteErrorUnsupportedType.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorDisallowedBySettings,
    {
      file: 'sharedDictionaryWriteErrorDisallowedBySettings.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorInvalidMatchField,
    {
      file: 'sharedDictionaryWriteErrorInvalidMatchField.md',
      links: specLinks,
    },
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorRequestAborted,
    {
      file: 'sharedDictionaryWriteErrorRequestAborted.md',
      links: specLinks,
    },
  ],
]);
