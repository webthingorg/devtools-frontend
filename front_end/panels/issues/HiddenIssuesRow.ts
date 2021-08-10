// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as Adorners from '../../ui/components/adorners/adorners.js';
import * as UI from '../../ui/legacy/legacy.js';

const UIStrings = {
  /**
  * @description Title for the hidden issues row
  */
  hiddenIssues: 'Hidden issues',
};

const str_ = i18n.i18n.registerUIStrings('panels/issues/HiddenIssuesRow.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class HiddenIssuesRow extends UI.TreeOutline.TreeElement {
  private numHiddenAggregatedIssues: HTMLElement;
  private throttle: Common.Throttler.Throttler;

  constructor() {
    super(undefined, true);
    this.numHiddenAggregatedIssues = document.createElement('span');
    this.throttle = new Common.Throttler.Throttler(250);
    this.toggleOnClick = true;
    this.listItemElement.classList.add('hidden-issues-row-header');
    this.childrenListElement.classList.add('hidden-issues-row-body');
    this.appendHeader();
  }

  private appendHeader(): void {
    const countAdorner = new Adorners.Adorner.Adorner();
    countAdorner.data = {
      name: 'countWrapper',
      content: this.numHiddenAggregatedIssues,
    };
    countAdorner.classList.add('aggregated-issues-count');
    this.numHiddenAggregatedIssues.textContent = '0';
    const header = document.createElement('div');
    const title = document.createElement('div');
    header.classList.add('header');
    title.classList.add('title');
    title.textContent = i18nString(UIStrings.hiddenIssues);
    header.appendChild(countAdorner);
    header.appendChild(title);
    this.listItemElement.appendChild(header);
  }

  private updateHiddenIssuesRow(count: number): void {
    this.numHiddenAggregatedIssues.textContent = `${count}`;
  }

  update(count: number): void {
    this.throttle.schedule(async () => this.updateHiddenIssuesRow(count));
  }
}
