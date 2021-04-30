// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import type * as IssuesManagerModule from '../../../../../front_end/models/issues_manager/issues_manager.js';

import {describeWithEnvironment} from '../../helpers/EnvironmentHelpers.js';
import {MockIssuesModel} from './MockIssuesModel.js';

describeWithEnvironment('AttributionReportingIssue', () => {
  const mockModel = new MockIssuesModel([]) as unknown as SDK.IssuesModel.IssuesModel;
  let IssuesManager: typeof IssuesManagerModule;
  before(async () => {
    IssuesManager = await import('../../../../../front_end/models/issues_manager/issues_manager.js');
  });

  it('creates different frontend issues for the same InvalidAttributionData protocol issue', () => {
    const invalidDataIssue =
        createARProtocolIssue(Protocol.Audits.AttributionReportingIssueType.InvalidAttributionData, 'NotANumber');
    const missingDataIssue =
        createARProtocolIssue(Protocol.Audits.AttributionReportingIssueType.InvalidAttributionData);

    const invalidDataFrontendIssue =
        IssuesManager.AttributionReportingIssue.AttributionReportingIssue.fromInspectorIssue(
            mockModel, invalidDataIssue);
    const missingDataFrontendIssue =
        IssuesManager.AttributionReportingIssue.AttributionReportingIssue.fromInspectorIssue(
            mockModel, missingDataIssue);

    assert.notStrictEqual(invalidDataFrontendIssue[0].code(), missingDataFrontendIssue[0].code());
  });

  it('creates different frontend issues for the same AttributionSourceUntrustworthyOrigin protocol issue', () => {
    const issueWithFrame = createARProtocolIssue(
        Protocol.Audits.AttributionReportingIssueType.AttributionSourceUntrustworthyOrigin, undefined, 'frameId1');
    const issueWithoutFrame =
        createARProtocolIssue(Protocol.Audits.AttributionReportingIssueType.AttributionSourceUntrustworthyOrigin);

    const frontendIssueWithFrame =
        IssuesManager.AttributionReportingIssue.AttributionReportingIssue.fromInspectorIssue(mockModel, issueWithFrame);
    const frontendIssueWithoutFrame =
        IssuesManager.AttributionReportingIssue.AttributionReportingIssue.fromInspectorIssue(
            mockModel, issueWithoutFrame);

    assert.notStrictEqual(frontendIssueWithFrame[0].code(), frontendIssueWithoutFrame[0].code());
  });

  it('creates different frontend issues for the same AttributionUntrustworthyOrigin protocol issue', () => {
    const issueWithFrame = createARProtocolIssue(
        Protocol.Audits.AttributionReportingIssueType.AttributionUntrustworthyOrigin, undefined, 'frameId1');
    const issueWithoutFrame =
        createARProtocolIssue(Protocol.Audits.AttributionReportingIssueType.AttributionUntrustworthyOrigin);

    const frontendIssueWithFrame =
        IssuesManager.AttributionReportingIssue.AttributionReportingIssue.fromInspectorIssue(mockModel, issueWithFrame);
    const frontendIssueWithoutFrame =
        IssuesManager.AttributionReportingIssue.AttributionReportingIssue.fromInspectorIssue(
            mockModel, issueWithoutFrame);

    assert.notStrictEqual(frontendIssueWithFrame[0].code(), frontendIssueWithoutFrame[0].code());
  });
});

function createARProtocolIssue(
    type: Protocol.Audits.AttributionReportingIssueType, invalidParameter?: string,
    frameId?: string): Protocol.Audits.InspectorIssueDetails {
  const attributionReportingIssueDetails: Protocol.Audits.AttributionReportingIssueDetails = {
    violationType: type,
  };

  if (invalidParameter) {
    attributionReportingIssueDetails.invalidParameter = invalidParameter;
  }

  if (frameId) {
    attributionReportingIssueDetails.frame = {frameId};
  }

  return {attributionReportingIssueDetails};
}
