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
export class ServiceWorkerUpdateCycleView {
  /**
   * @param {!SDK.ServiceWorkerManager.ServiceWorkerManager} manager
   */
  constructor(manager) {
    this._manager = manager;
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
        addRange(ServiceWorkerUpdateNames.Install, startInstallTime, endInstallTime);
      }
      if (startActivateTime !== 0 && endActivateTime !== 0) {
        addRange(ServiceWorkerUpdateNames.Activate, startActivateTime, endActivateTime);
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
    tableElement.classList.add('service-worker-update-timing-table');
    UI.Utils.appendStyle(tableElement, 'resources/serviceWorkerUpdateCycleView.css');
    const timeRanges = this.calculateServiceWorkerUpdateRanges();
    this._updateTimingTable(tableElement, timeRanges);
    return tableElement;
  }

  /**
   * @param {!Element} tableElement
   */
  _createTimingTableHead(tableElement) {
    const serverHeader = tableElement.createChild('tr', 'service-worker-update-timing-table-header');
    UI.UIUtils.createTextChild(serverHeader.createChild('td'), Common.UIString.UIString('Update Activity'));
    UI.UIUtils.createTextChild(serverHeader.createChild('td'), Common.UIString.UIString('Timeline'));
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

      const tr = tableElement.createChild('tr');
      const timingBarTitleElement = tr.createChild('td');
      if (rangeName === ServiceWorkerUpdateNames.Install || rangeName === ServiceWorkerUpdateNames.Activate) {
        UI.UIUtils.createTextChild(timingBarTitleElement, rangeName);

        timingBarTitleElement.classList.add('service-worker-update-timing-bar-clickable');
        timingBarTitleElement.setAttribute('tabindex', 0);
        timingBarTitleElement.setAttribute('role', 'switch');
        UI.ARIAUtils.setChecked(timingBarTitleElement, false);
        this._constructUpdateDetails(tableElement, tr, range);
      }

      const barContainer = tr.createChild('td').createChild('div', 'service-worker-update-timing-row');
      const bar = barContainer.createChild('span', 'service-worker-update-timing-bar ' + rangeName.toLowerCase());

      if (rangeName === ServiceWorkerUpdateNames.Install || rangeName === ServiceWorkerUpdateNames.Activate) {
        bar.style.left = left + '%';
        bar.style.right = right + '%';
        bar.textContent = '\u200B';  // Important for 0-time items to have 0 width.
      }

      const label = tr.createChild('td').createChild('div', 'service-worker-update-timing-bar-title');
      label.textContent = Number.millisToString(duration);
    }
  }

  _constructUpdateDetails(tableElement, tr, range) {
    function findCacheEntry(caches, entry) {
      return caches.find(e => e.cacheName === entry.cacheName && e.requestURL === entry.requestURL);
    }

    function changedCacheEntries(cacheEntriesStart, cacheEntriesEnd) {
      const entriesAddedOrUpdated = [];
      cacheEntriesEnd.forEach(e => {
        const entry = findCacheEntry(cacheEntriesStart, e);
        if (!entry) {
          entriesAddedOrUpdated.push({cacheName: e.cacheName, requestURL: e.requestURL, operation: 'added'});
        }
      });

      const entriesDeleted = cacheEntriesStart.filter(e => !findCacheEntry(cacheEntriesEnd, e)).map(e => {
        return {cacheName: e.cacheName, requestURL: e.requestURL, operation: 'deleted'};
      });

      return entriesAddedOrUpdated.concat(entriesDeleted);
    }

    const detailsElement = tableElement.createChild('tr', 'service-worker-update-timing-bar-details');
    detailsElement.classList.add('service-worker-update-timing-bar-details-collapsed');

    self.onInvokeElement(tr, this._onToggleUpdateDetails.bind(this, detailsElement));

    const detailsView = new UI.TreeOutline.TreeOutlineInShadow();
    detailsElement.appendChild(detailsView.element);

    const startTimeItem = document.createElementWithClass('div', 'service-worker-update-details-treeitem');
    const startTime = (new Date(range.start)).toISOString();
    startTimeItem.textContent = ls`Start time: ${startTime}`;

    const startTimeTreeElement = new UI.TreeOutline.TreeElement(startTimeItem);
    detailsView.appendChild(startTimeTreeElement);

    const endTimeItem = document.createElementWithClass('div', 'service-worker-update-details-treeitem');
    const endTime = (new Date(range.end)).toISOString();
    endTimeItem.textContent = ls`End time: ${endTime}`;

    const endTimeTreeElement = new UI.TreeOutline.TreeElement(endTimeItem);
    detailsView.appendChild(endTimeTreeElement);

    if (range.name === ServiceWorkerUpdateNames.Install) {
      if (this._version.cacheEntriesInitial && this._version.cacheEntriesInstallation) {
        const changedCacheEntriesElement =
            document.createElementWithClass('div', 'service-worker-update-details-treeitem');
        let entriesChanged =
            changedCacheEntries(this._version.cacheEntriesInitial, this._version.cacheEntriesInstallation, true);
        if (entriesChanged.length > 0) {
          this._createCacheEntryTable(changedCacheEntriesElement, entriesChanged);
        }
        const changedCacheEntriesTreeElement = new UI.TreeOutline.TreeElement(changedCacheEntriesElement);
        detailsView.appendChild(changedCacheEntriesTreeElement);
      }
    }

    if (range.name === ServiceWorkerUpdateNames.Activate) {
      if (this._version.cacheEntriesInstallation && this._version._cacheEntriesActivation) {
        const changedCacheEntriesElement =
            document.createElementWithClass('div', 'service-worker-update-details-treeitem');
        let entriesChanged =
            changedCacheEntries(this._version.cacheEntriesInstallation, this._version.cacheEntriesActivation, false);
        if (entriesChanged.length > 0) {
          this._createCacheEntryTable(changedCacheEntriesElement, entriesChanged);
        }
        const changedCacheEntriesTreeElement = new UI.TreeOutline.TreeElement(changedCacheEntriesElement);
        detailsView.appendChild(changedCacheEntriesTreeElement);
      }
    }
  }

  _createCacheEntryTable(parent, cacheEntries) {
    const table = parent.createChild('table');
    const dataGridHeader = table.createChild('thead');
    const tableHeaderRow = dataGridHeader.createChild('tr');
    const cacheName = tableHeaderRow.createChild('td');
    cacheName.createChild('span').textContent = ls`Cache Name`;
    const cacheEntry = tableHeaderRow.createChild('td');
    cacheEntry.createChild('span').textContent = ls`Cache Entry`;
    const cacheOp = tableHeaderRow.createChild('td');
    cacheOp.createChild('span').textContent = ls`Operation`;

    for (let entry of cacheEntries) {
      const tr = table.createChild('tr');
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

    if (event.target.classList.contains('service-worker-update-timing-bar-clickable')) {
      detailsRow.classList.toggle('service-worker-update-timing-bar-details-collapsed');
      detailsRow.classList.toggle('service-worker-update-timing-bar-details-expanded');

      const expanded = event.target.getAttribute('aria-checked') === 'true';
      UI.ARIAUtils.setChecked(event.target, !expanded);
    }
  }

  /**
   * @param {!SDK.ServiceWorkerManager.ServiceWorkerVersion} version
   */
  refresh(version) {
    this._version = version;
    const timeRanges = this.calculateServiceWorkerUpdateRanges();
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
