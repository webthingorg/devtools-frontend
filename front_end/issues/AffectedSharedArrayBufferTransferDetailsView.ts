// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Components from '../components/components.js';
import * as SDK from '../sdk/sdk.js';

import {AffectedResourcesView} from './AffectedResourcesView.js';
import {AggregatedIssue} from './IssueAggregator.js';
import {IssueView} from './IssuesPane.js';

export class AffectedSharedArrayBufferTransferDetailsView extends AffectedResourcesView {
  private issue: AggregatedIssue;

  constructor(parentView: IssueView, issue: AggregatedIssue) {
    super(parentView, {singular: ls`directive`, plural: ls`directives`});
    this.issue = issue;
  }

  private appendSourceCodeColumnTitle(header: HTMLElement): void {
    const sourceCodeLink = document.createElement('td');
    sourceCodeLink.classList.add('affected-resource-header');
    sourceCodeLink.textContent = ls`Source Location`;
    header.appendChild(sourceCodeLink);
  }

  private appendStatusColumnTitle(header: HTMLElement): void {
    const status = document.createElement('td');
    status.classList.add('affected-resource-header');
    status.textContent = ls`Status`;
    header.appendChild(status);
  }

  private appendStatus(element: HTMLElement, isWarning: boolean): void {
    const status = document.createElement('td');
    if (isWarning) {
      status.classList.add('affected-resource-report-only-status');
      status.textContent = ls`warning`;
    } else {
      status.classList.add('affected-resource-blocked-status');
      status.textContent = ls`blocked`;
    }
    element.appendChild(status);
  }

  private appendSourceLocation(element: HTMLElement, sourceLocation: Protocol.Audits.SourceCodeLocation|undefined):
      void {
    const sourceCodeLocation = document.createElement('td');
    sourceCodeLocation.classList.add('affected-source-location');
    if (sourceLocation) {
      const maxLengthForDisplayedURLs = 40;  // Same as console messages.
      // TODO(crbug.com/1108503): Add some mechanism to be able to add telemetry to this element.
      const linkifier = new Components.Linkifier.Linkifier(maxLengthForDisplayedURLs);
      const sourceAnchor = linkifier.linkifyScriptLocation(
          /* target */ null,
          /* scriptId */ null, sourceLocation.url, sourceLocation.lineNumber);
      sourceCodeLocation.appendChild(sourceAnchor);
    }
    element.appendChild(sourceCodeLocation);
  }

  private appendDetails(sabIssues: Iterable<SDK.SharedArrayBufferTransferIssue.SharedArrayBufferTransferIssue>): void {
    const header = document.createElement('tr');
    this.appendSourceCodeColumnTitle(header);
    this.appendStatusColumnTitle(header);

    this.affectedResources.appendChild(header);
    let count = 0;
    for (const sabIssue of sabIssues) {
      count++;
      this.appendDetail(sabIssue);
    }
    this.updateAffectedResourceCount(count);
  }

  private appendDetail(sabIssue: SDK.SharedArrayBufferTransferIssue.SharedArrayBufferTransferIssue): void {
    const element = document.createElement('tr');
    element.classList.add('affected-resource-directive');

    const sabIssueDetails = sabIssue.details();
    this.appendSourceLocation(element, sabIssueDetails.sourceCodeLocation);
    this.appendStatus(element, sabIssueDetails.isWarning);

    this.affectedResources.appendChild(element);
  }

  update(): void {
    this.clear();
    this.appendDetails(this.issue.sharedArrayBufferTransfersIssues());
  }
}
