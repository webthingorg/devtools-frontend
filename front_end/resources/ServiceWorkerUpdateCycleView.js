/*
 * Copyright (C) 2010 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

// @ts-nocheck
// TODO(crbug.com/1011811): Enable TypeScript compiler checks

import * as Common from '../common/common.js';
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

/**
 * @unrestricted
 */
export class ServiceWorkerUpdateCycleView extends UI.Widget.VBox {
  /**
   * @param {!SDK.ServiceWorkerManager.ServiceWorkerManager} manager
   */
  constructor(manager) {
    super();
    this._manager = manager;
    this.element.classList.add('resource-service-worker-update-view');
    this._tableElement = this._createTimingTable();
  }

  tableElement() {
    return this._tableElement;
  }

  /**
   * @param {!ServiceWorkerUpdateNames} name
   * @return {string}
   */
  static _timeRangeTitle(name) {
    // may have multiple rows of installing
    switch (name) {
      case ServiceWorkerUpdateNames.Install:
        return Common.UIString.UIString('Install');
      case ServiceWorkerUpdateNames.Activate:
        return Common.UIString.UIString('Activate');
      default:
        return Common.UIString.UIString(name);
    }
  }

  /**
   * @param {number=} navigationStart
   * @return {!Array.<!ServiceWorkerUpdateRange>}
   */
  static calculateServiceWorkerUpdateRanges(navigationStart) {
    const result = [];
    /**
     * @param {string} name
     * @param {number} start
     * @param {number} end
     */
    function addRange(name, start, end) {
      if (start < Number.MAX_VALUE && start <= end) {
        result.push({name: name, start: start, end: end});
      }
    }

    addRange('install', 10, 20);
    addRange('activate', 50, 70);
    return result;
  }

  /**
   * @return {!Element}
   */
  _createTimingTable() {
    const tableElement = document.createElement('table');
    tableElement.classList.add('service-worker-update-cycle-table');
    UI.Utils.appendStyle(tableElement, 'network/networkTimingTable.css');
    const colgroup = tableElement.createChild('colgroup');
    colgroup.createChild('col', 'labels');
    colgroup.createChild('col', 'bars');
    colgroup.createChild('col', 'duration');

    const timeRanges = ServiceWorkerUpdateCycleView.calculateServiceWorkerUpdateRanges();
    const startTime = timeRanges.map(r => r.start).reduce((a, b) => Math.min(a, b));
    const endTime = timeRanges.map(r => r.end).reduce((a, b) => Math.max(a, b));
    const scale = 100 / (endTime - startTime);

    const startTimeHeader = tableElement.createChild('thead', 'service-worker-update-cycle-start');
    const tableHeaderRow = startTimeHeader.createChild('tr');
    const activityHeaderCell = tableHeaderRow.createChild('th');
    activityHeaderCell.createChild('span').textContent = ls`Label`;
    activityHeaderCell.scope = 'col';
    const waterfallHeaderCell = tableHeaderRow.createChild('th');
    waterfallHeaderCell.createChild('span').textContent = ls`Waterfall`;
    waterfallHeaderCell.scope = 'col';
    const durationHeaderCell = tableHeaderRow.createChild('th');
    durationHeaderCell.createChild('span').textContent = ls`Duration`;
    durationHeaderCell.scope = 'col';

    const colors = new Map();
    colors.set('dot', 'lightblue');
    colors.set('activate', '#AA0000');
    colors.set('install', '#ff9800');

    let right;
    for (let i = 0; i < timeRanges.length; ++i) {
      const range = timeRanges[i];
      const rangeName = range.name;

      const left = (scale * (range.start - startTime));
      right = (scale * (endTime - range.end));
      const duration = range.end - range.start;

      const tr = tableElement.createChild('tr', 'service-worker-update-row');
      const timingBarTitleElement = tr.createChild('td');
      if (rangeName === 'install' || rangeName === 'activate') {
        const detailsTr = tableElement.createChild('tr', 'service-worker-update-timing-details-collapsed');

        timingBarTitleElement.createTextChild(rangeName);

        timingBarTitleElement.classList.add('service-worker-timing-bar-clickable');
        timingBarTitleElement.setAttribute('tabindex', 0);
        timingBarTitleElement.setAttribute('role', 'switch');
        UI.ARIAUtils.setChecked(timingBarTitleElement, false);
        self.onInvokeElement(timingBarTitleElement, this._onToggleEventDetails.bind(this, detailsTr));

        _constructUpdateDetailsView(detailsTr);
      }

      const row = tr.createChild('td').createChild('div');
      row.style.position = 'relative';
      row.style.height = '15px';
      const bar = row.createChild('span', 'service-worker-update-timing-bar-' + rangeName);

      bar.style.backgroundColor = colors.get(rangeName);
      bar.style.position = 'absolute';
      bar.style.display = 'block';
      bar.style.top = '15%';
      bar.style.left = left + '%';
      bar.style.right = right + '%';
      bar.style.height = '5px';
      bar.textContent = '\u200B';  // Important for 0-time items to have 0 width.

      const label = tr.createChild('td').createChild('div', 'service-worker-update-timing-bar-title');
      label.textContent = Number.secondsToString(duration, true);
    }

    return tableElement;

    function _constructUpdateDetailsView(tr) {
      const detailsView = new UI.TreeOutline.TreeOutlineInShadow();
      tr.appendChild(detailsView.element);

      const updateSource = document.createElementWithClass('div', 'service-worker-update-details-treeitem');
      updateSource.textContent = '<Execution Time>';
      const responseSourceTreeElement = new UI.TreeOutline.TreeElement(updateSource);
      const exeTimeLine1 = document.createElementWithClass('div', 'service-worker-update-details-treeitem');
      const exeTimeLine1Leaf = new UI.TreeOutline.TreeElement(exeTimeLine1);
      responseSourceTreeElement.appendChild(exeTimeLine1Leaf);
      exeTimeLine1.textContent = 'Event Handler: 0000 ms';
      const exeTimeLine2 = document.createElementWithClass('div', 'service-worker-update-details-treeitem');
      const exeTimeLine2Leaf = new UI.TreeOutline.TreeElement(exeTimeLine2);
      responseSourceTreeElement.appendChild(exeTimeLine2Leaf);
      exeTimeLine2.textContent = 'Life time duaration: 0000 ms (or still running)';
      detailsView.appendChild(responseSourceTreeElement);

      const promiseLine = document.createElementWithClass('div', 'service-worker-update-details-treeitem');
      promiseLine.textContent = 'Promise';
      const button = promiseLine.createChild('button', 'service-worker-client-focus-link');
      button.classList.add('link');
      button.textContent = '(Source)';
      button.tabIndex = 0;
      const promiseTreeElement = new UI.TreeOutline.TreeElement(promiseLine);
      const emptyLine = document.createElementWithClass('div', 'service-worker-update-details-treeitem');
      const emptyLineLeaf = new UI.TreeOutline.TreeElement(emptyLine);
      promiseTreeElement.appendChild(emptyLineLeaf);
      detailsView.appendChild(promiseTreeElement);

      const addedEntriesLine = document.createElementWithClass('div', 'service-worker-update-details-treeitem');
      addedEntriesLine.textContent = 'Cache Entries Added';
      const deletedEntriesLine = document.createElementWithClass('div', 'service-worker-update-details-treeitem');
      deletedEntriesLine.textContent = 'Cache Entries Removed';
      const cacheOperationLine = document.createElementWithClass('div', 'service-worker-update-details-treeitem');
      cacheOperationLine.textContent = '<Cache Operation>';
      const addedEntriesLineBranch = new UI.TreeOutline.TreeElement(addedEntriesLine);
      const addedEntriesLeaf = new UI.TreeOutline.TreeElement();
      addedEntriesLineBranch.appendChild(addedEntriesLeaf);
      const deletedEntriesLineBranch = new UI.TreeOutline.TreeElement(deletedEntriesLine);
      const deletedEntriesLeaf = new UI.TreeOutline.TreeElement();
      deletedEntriesLineBranch.appendChild(deletedEntriesLeaf);
      const cacheEntriesTreeElement = new UI.TreeOutline.TreeElement(cacheOperationLine);
      cacheEntriesTreeElement.appendChild(addedEntriesLineBranch);
      cacheEntriesTreeElement.appendChild(deletedEntriesLineBranch);

      detailsView.appendChild(cacheEntriesTreeElement);
    }
  }

  _onToggleEventDetails(detailsRow, event) {
    if (!event.target) {
      return;
    }

    if (event.target.classList.contains('service-worker-timing-bar-clickable')) {
      detailsRow.classList.toggle('service-worker-update-timing-details-collapsed');
      detailsRow.classList.toggle('service-worker-update-timing-details-expanded');

      const expanded = event.target.getAttribute('aria-checked') === 'true';
      UI.ARIAUtils.setChecked(event.target, !expanded);
    }
  }

  /**
   *
   * @param {!Element} fetchDetailsElement
   * @param {!Event} event
   */
  _onToggleFetchDetails(fetchDetailsElement, event) {
    if (!event.target) {
      return;
    }

    if (event.target.classList.contains('network-fetch-timing-bar-clickable')) {
      const expanded = event.target.getAttribute('aria-checked') === 'true';
      event.target.setAttribute('aria-checked', !expanded);

      fetchDetailsElement.classList.toggle('network-fetch-timing-bar-details-collapsed');
      fetchDetailsElement.classList.toggle('network-fetch-timing-bar-details-expanded');
    }
  }

  /**
   * @override
   */
  wasShown() {
    this._refresh();
  }

  /**
   * @override
   */
  willHide() {
  }

  _refresh() {
    if (this._tableElement) {
      this._tableElement.remove();
    }

    this._tableElement = this._createTimingTable();
    this.element.appendChild(this._tableElement);
  }
}

/** @enum {string} */
export const ServiceWorkerUpdateNames = {
  Install: 'install',
  Activate: 'activate'
};

/** @typedef {{name: !ServiceWorkerUpdateNames, start: number, end: number}} */
export let ServiceWorkerUpdateRange;
