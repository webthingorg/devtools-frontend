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

import {assert} from 'front_end/third_party/puppeteer/package/lib/esm/puppeteer/common/assert.js';
import * as Common from '../common/common.js';
import * as DataGrid from '../data_grid/data_grid.js';
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
   * @param {!SDK.ServiceWorkerManager.ServiceWorkerVersion} version
   */
  _updateVersion(version) {
    this._version = version;
  }

  /**
   * @param {!ServiceWorkerUpdateNames} name
   * @return {string}
   */
  static _timeRangeTitle(name) {
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
  calculateServiceWorkerUpdateRanges(navigationStart) {
    const result = [];
    /**
     * @param {string} name
     * @param {number} start
     * @param {number} end
     */
    function addRange(name, start, end) {
      console.log('Add range: ' + name + ' ')
      if (start < Number.MAX_VALUE && start <= end) {
        result.push({name: name, start: start, end: end});
      }
    }

    /**
     * Add ranges representing Install, Wait or Activation
     * @param {number} startInstallTime
     * @param {number} endInstallTime
     * @param {number} startActivateTime
     * @param {number} endActivateTime
     */
    function addNormalizedRanges(startInstallTime, endInstallTime, startActivateTime, endActivateTime) {
      // order of adding ranges matters
      if (startInstallTime !== 0 && endInstallTime !== 0) {
        addRange('Install', startInstallTime, endInstallTime);
      }
      if (startActivateTime !== 0 && endActivateTime !== 0) {
        addRange('Activate', startActivateTime, endActivateTime);
      }
    }

    /**
     * @param {!SDK.ServiceWorkerManager.ServiceWorkerVersion} version
     */
    function addRangeForVersion(version) {
      var state = version.currentState;
      var endActivateTime = 0;
      var beginActivateTime = 0;
      var endInstallTime = 0;
      var beginInstallTime = 0;
      if (state.status === Protocol.ServiceWorker.ServiceWorkerVersionStatus.New)
        return;

      while (state) {
        if (state.status === Protocol.ServiceWorker.ServiceWorkerVersionStatus.Activated) {
          endActivateTime = state.timestamp;
        } else if (state.status === Protocol.ServiceWorker.ServiceWorkerVersionStatus.Activating) {
          beginActivateTime = state.timestamp;
        } else if (state.status === Protocol.ServiceWorker.ServiceWorkerVersionStatus.Installed) {
          endInstallTime = state.timestamp;
        } else if (state.status === Protocol.ServiceWorker.ServiceWorkerVersionStatus.Installing) {
          beginInstallTime = state.timestamp;
        }
        state = state.previousState;
      }
      addNormalizedRanges(beginInstallTime, endInstallTime, beginActivateTime, endActivateTime);
    }

    if (this._version) {
      addRangeForVersion(this._version);
    }
    return result;
  }

  /**
   * @return {!Element}
   */
  _createTimingTable() {
    const tableElement = document.createElement('table');
    tableElement.classList.add('network-timing-table');
    UI.Utils.appendStyle(tableElement, 'network/networkTimingTable.css');
    const timeRanges = this.calculateServiceWorkerUpdateRanges();
    this._updateTimingTable(tableElement, timeRanges);
    return tableElement;
  }

  /**
   * @param {!Element} tableElement
   */
  _createTimingTableHead(tableElement) {
    const timeHeader = tableElement.createChild('thead', 'network-timing-start');
    const tableHeaderRow = timeHeader.createChild('tr', 'network-timing-tr');
    const activityHeaderCell = tableHeaderRow.createChild('th');
    activityHeaderCell.createChild('span').textContent = ls`Update Activity`;
    activityHeaderCell.scope = 'col';
    const waterfallHeaderCell = tableHeaderRow.createChild('th');
    waterfallHeaderCell.createChild('span').textContent = ls`Timeline`;
    waterfallHeaderCell.scope = 'col';
  }

  /**
   * @param {!Element} tableElement
   */
  _removeRows(tableElement) {
    let rows = tableElement.getElementsByTagName('tr');
    while (rows[0]) {
      rows[0].parentNode.removeChild(rows[0]);
    }
  }

  /**
   * @param {!Element} tableElement
   * @param {!Array.<!ServiceWorkerUpdateRange>} timeRanges
   */
  _updateTimingTable(tableElement, timeRanges) {
    this._removeRows(tableElement);
    if (timeRanges.length == 0) {
      return;
    }

    this._createTimingTableHead(tableElement);

    const startTime = timeRanges.map(r => r.start).reduce((a, b) => Math.min(a, b));
    const endTime = timeRanges.map(r => r.end).reduce((a, b) => Math.max(a, b));
    const scale = 100 / (endTime - startTime);

    for (let i = 0; i < timeRanges.length; ++i) {
      const range = timeRanges[i];
      const rangeName = range.name;

      const left = (scale * (range.start - startTime));
      const right = (scale * (endTime - range.end));
      const duration = range.end - range.start;

      const tr = tableElement.createChild('tr', 'network-timing-tr');
      const timingBarTitleElement = tr.createChild('td');
      if (rangeName === 'Install' || rangeName === 'Activate') {
        UI.UIUtils.createTextChild(timingBarTitleElement, rangeName);

        timingBarTitleElement.classList.add('network-fetch-timing-bar-clickable');
        timingBarTitleElement.setAttribute('tabindex', 0);
        timingBarTitleElement.setAttribute('role', 'switch');
        UI.ARIAUtils.setChecked(timingBarTitleElement, false);
        this._constructUpdateDetails(tableElement, tr, range);
      }

      const barContainer = tr.createChild('td').createChild('div', 'network-timing-row');
      const bar = barContainer.createChild('span', 'network-timing-bar ' + rangeName.toLowerCase());

      if (rangeName === 'Install' || rangeName === 'Activate') {
        bar.style.left = left + '%';
        bar.style.right = right + '%';
        bar.textContent = '\u200B';  // Important for 0-time items to have 0 width.
      }

      const label = tr.createChild('td').createChild('div', 'network-timing-bar-title');
      label.textContent = Number.millisToString(duration);
    }
  }

  _constructUpdateDetails(tableElement, tr, range) {
    function findCacheEntry(caches, entry) {
      return caches.find(e => e.cacheName === entry.cacheName && e.requestURL === entry.requestURL);
    }

    function changedCacheEntries(cacheEntriesStart, cacheEntriesEnd) {
      const entriesAddedOrUpdated = [];
      console.log('cache at the end size:' + cacheEntriesEnd.length);
      cacheEntriesEnd.forEach(e => console.log('     ' + e.cacheName + ' ' + e.requestURL + ' ' + e.responseTime));
      console.log('cache at the start size:' + cacheEntriesStart.length);
      cacheEntriesStart.forEach(e => console.log('     ' + e.cacheName + ' ' + e.requestURL + ' ' + e.responseTime));

      cacheEntriesEnd.forEach(e => {
        const entry = findCacheEntry(cacheEntriesStart, e);
        if (!entry) {
          entriesAddedOrUpdated.push({cacheName: e.cacheName, requestURL: e.requestURL, operation: 'added'});
        }
      });

      const entriesDeleted = cacheEntriesStart.filter(e => !findCacheEntry(cacheEntriesEnd, e)).map(e => {
        return {cacheName: e.cacheName, requestURL: e.requestURL, operation: 'deleted'};
      });
      if (entriesDeleted && entriesDeleted.length) {
        console.warn('interesting deletion...');
      }
      return entriesAddedOrUpdated.concat(entriesDeleted);
    }

    const detailsElement = tableElement.createChild('tr', 'network-fetch-timing-bar-details');
    detailsElement.classList.add('network-fetch-timing-bar-details-collapsed');

    self.onInvokeElement(tr, this._onToggleUpdateDetails.bind(this, detailsElement));

    const detailsView = new UI.TreeOutline.TreeOutlineInShadow();
    detailsElement.appendChild(detailsView.element);

    const startTimeItem = document.createElementWithClass('div', 'network-fetch-details-treeitem');
    const startTime = new Date(range.start);
    startTimeItem.textContent = ls`Start time: ${startTime}`;

    const startTimeTreeElement = new UI.TreeOutline.TreeElement(startTimeItem);
    detailsView.appendChild(startTimeTreeElement);

    const endTimeItem = document.createElementWithClass('div', 'network-fetch-details-treeitem');
    const endTime = new Date(range.end);
    endTimeItem.textContent = ls`End time: ${endTime}`;

    const endTimeTreeElement = new UI.TreeOutline.TreeElement(endTimeItem);
    detailsView.appendChild(endTimeTreeElement);

    console.log('producing cache change info for phase ' + range.name + ' of version' + this._version.id);
    if (range.name === 'Install') {
      if (this._version._queryingCacheForInstallation &&
          this._version._queryingCacheForInstallation.values().some(e => e)) {
        return;
      }

      if (this._version.cacheEntriesInitial && this._version.cacheEntriesInstallation) {
        const changedCacheEntriesElement = document.createElementWithClass('div', 'network-fetch-details-treeitem');
        let entriesChanged =
            changedCacheEntries(this._version.cacheEntriesInitial, this._version.cacheEntriesInstallation, true);
        if (entriesChanged.length > 0) {
          this._createDataGrid(changedCacheEntriesElement, entriesChanged);
        }
        const changedCacheEntriesTreeElement = new UI.TreeOutline.TreeElement(changedCacheEntriesElement);
        detailsView.appendChild(changedCacheEntriesTreeElement);
      } else {
        console.log('no cache for install phase of version ' + this._version.id);
      }
    }

    if (range.name === 'Activate') {
      if (this._version._queryingCacheForInstallation &&
          this.version._queryingCacheForInstallation.values().some(e => e)) {
        return;
      }
      if (this._version._queryingCacheForActivation && this.version._queryingCacheForActivation.values().some(e => e)) {
        return;
      }
      if (this._version.cacheEntriesInstallation && this._version._cacheEntriesActivation) {
        const changedCacheEntriesElement = document.createElementWithClass('div', 'network-fetch-details-treeitem');
        let entriesChanged =
            changedCacheEntries(this._version.cacheEntriesInstallation, this._version.cacheEntriesActivation, false);
        if (entriesChanged.length > 0) {
          this._createDataGrid(changedCacheEntriesElement, entriesChanged);
        }
        const changedCacheEntriesTreeElement = new UI.TreeOutline.TreeElement(changedCacheEntriesElement);
        detailsView.appendChild(changedCacheEntriesTreeElement);
      }
    }
  }

  _createDataGrid(parent, cacheEntries) {
    const table = parent.createChild('table');
    const dataGridHeader = table.createChild('thead');
    const tableHeaderRow = dataGridHeader.createChild('tr', 'network-timing-tr');
    const entryHeaderCell = tableHeaderRow.createChild('th');
    entryHeaderCell.createChild('span').textContent = ls`Cache Name`;
    entryHeaderCell.scope = 'col';
    entryHeaderCell.createChild('span').textContent = ls`Cache Entry`;
    entryHeaderCell.scope = 'col';
    const opHeaderCell = tableHeaderRow.createChild('th');
    opHeaderCell.createChild('span').textContent = ls`Operation`;
    opHeaderCell.scope = 'col';

    for (let entry of cacheEntries) {
      const tr = table.createChild('tr', 'network-timing-tr');
      let td = tr.createChild('td');
      td.textContent = entry.cacheName;
      td = tr.createChild('td');
      td.textContent = entry.requestURL;
      td = tr.createChild('td');
      td.textContent = entry.operation;
    }
  }

  _onToggleUpdateDetails(detailsRow, event) {
    if (!event.target) {
      return;
    }

    if (event.target.classList.contains('network-fetch-timing-bar-clickable')) {
      detailsRow.classList.toggle('network-fetch-timing-bar-details-collapsed');
      detailsRow.classList.toggle('network-fetch-timing-bar-details-expanded');

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
    this.refresh();
  }

  /**
   * @override
   */
  willHide() {
  }

  /**
   * @param {!SDK.ServiceWorkerManager.ServiceWorkerVersion} version
   */
  refresh(version) {
    this._updateVersion(version);
    const timeRanges = this.calculateServiceWorkerUpdateRanges();
    console.log('================ hahaha');
    this._updateTimingTable(this.tableElement(), timeRanges);
  }
}

/** @enum {string} */
export const ServiceWorkerUpdateNames = {
  Install: 'Install',
  Activate: 'Activate'
};

/** @typedef {{name: !ServiceWorkerUpdateNames, start: number, end: number}} */
export let ServiceWorkerUpdateRange;
