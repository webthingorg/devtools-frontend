// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../platform/platform.js';
import {ls} from '../platform/platform.js';
import * as SDK from '../sdk/sdk.js';

import {AffectedElementsView} from './AffectedElementsView.js';
import {AggregatedIssue} from './IssueAggregator.js';
import {IssueView} from './IssuesPane.js';

export class AffectedElementsWithLowContrastView extends AffectedElementsView {
  private aggregateIssue: AggregatedIssue;
  private running_update: Promise<void> = Promise.resolve();

  constructor(parent: IssueView, issue: AggregatedIssue) {
    super(parent, issue);
    this.aggregateIssue = issue;
  }

  update(): void {
    this.running_update = this.running_update.then(this.doUpdate.bind(this));
  }

  private async doUpdate(): Promise<void> {
    this.clear();
    await this.appendLowContrastElements(this.aggregateIssue.lowContrastIssues());
  }

  private appendColumn(row: Element, value: string): void {
    const cell = document.createElement('td');
    cell.textContent = value;
    row.appendChild(cell);
  }

  private async appendLowContrastElement(issue: SDK.LowTextContrastIssue.LowTextContrastIssue): Promise<void> {
    const row = document.createElement('tr');
    row.classList.add('affected-resource-low-contrast');

    const details = issue.details();
    const elements = Array.from(issue.elements());

    row.appendChild(await this.renderElementCell(elements[0]));
    this.appendColumn(row, String(Platform.NumberUtilities.floor(details.contrastRatio)));
    this.appendColumn(row, String(details.thresholdAA));
    this.appendColumn(row, String(details.thresholdAAA));
    this.appendColumn(row, details.fontSize);
    this.appendColumn(row, details.fontWeight);

    this.affectedResources.appendChild(row);
  }

  private async appendLowContrastElements(issues: Iterable<SDK.LowTextContrastIssue.LowTextContrastIssue>):
      Promise<void> {
    const header = document.createElement('tr');
    this.appendColumnTitle(header, ls`Element`);
    this.appendColumnTitle(header, ls`Contrast ratio`);
    this.appendColumnTitle(header, ls`Minimum AA ratio`);
    this.appendColumnTitle(header, ls`Minimum AAA ratio`);
    this.appendColumnTitle(header, ls`Text size`);
    this.appendColumnTitle(header, ls`Text weight`);

    this.affectedResources.appendChild(header);
    let count = 0;
    for (const lowContrastIssue of issues) {
      count++;
      await this.appendLowContrastElement(lowContrastIssue);
    }
    this.updateAffectedResourceCount(count);
  }
}
