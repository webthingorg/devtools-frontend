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
export class ServiceWorkerUpdateCycleHelper {
  /**
   * @param {SDK.ServiceWorkerManager.ServiceWorkerRegistration} registration
   * @return {!Map.<string, Array {!ServiceWorkerUpdateRange>}}
   */
  static calculateServiceWorkerUpdateRanges(registration) {
    /**
     * @param {Array {!ServiceWorkerUpdateRange}} ranges
     * @param {number} id
     * @param {string} name
     * @param {number} start
     * @param {number} end
     */
    function addRange(ranges, id, name, start, end) {
      if (start < Number.MAX_VALUE && start <= end) {
        ranges.push({id: id, name: name, start: start, end: end});
      }
    }

    /**
     * Add ranges representing Install, Wait or Activation
     * @param {Array {!ServiceWorkerUpdateRange}} ranges
     * @param {number} id
     * @param {number} startInstallTime
     * @param {number} endInstallTime
     * @param {number} startActivateTime
     * @param {number} endActivateTime
     */
    function addNormalizedRanges(ranges, id, startInstallTime, endInstallTime, startActivateTime, endActivateTime) {
      // order of adding ranges matters
      if (startInstallTime !== 0 && endInstallTime !== 0) {
        addRange(ranges, id, ServiceWorkerUpdateNames.Install, startInstallTime, endInstallTime);
        if (startActivateTime === 0) {
          addRange(ranges, id, ServiceWorkerUpdateNames.Wait, endInstallTime, Date.now());
        } else {
          addRange(ranges, id, ServiceWorkerUpdateNames.Wait, endInstallTime, startActivateTime);
        }
      }
      if (startActivateTime !== 0 && endActivateTime !== 0) {
        addRange(ranges, id, ServiceWorkerUpdateNames.Activate, startActivateTime, endActivateTime);
      }
    }

    /**
     * @param {!SDK.ServiceWorkerManager.ServiceWorkerVersion} version
     * @returns {!Array <!ServiceWorkerUpdateRange>}
     */
    function addRangeForVersion(version) {
      let state = version.currentState;
      let endActivateTime = 0;
      let beginActivateTime = 0;
      let endInstallTime = 0;
      let beginInstallTime = 0;
      if (state.status === Protocol.ServiceWorker.ServiceWorkerVersionStatus.New) {
        return [];
      }

      while (state) {
        // find the earliest timestamp of different stage on record.
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
      const ranges = [];
      addNormalizedRanges(ranges, version.id, beginInstallTime, endInstallTime, beginActivateTime, endActivateTime);
      return ranges;
    }

    const result = new Map();
    const versions = registration.versionsByMode();
    const active = versions.get(SDK.ServiceWorkerManager.ServiceWorkerVersion.Modes.Active);
    if (active) {
      const ranges = addRangeForVersion(active);
      if (ranges.length > 0) {
        result.set(active.id, ranges);
      }
    }

    const waiting = versions.get(SDK.ServiceWorkerManager.ServiceWorkerVersion.Modes.Waiting);
    if (waiting) {
      const ranges = addRangeForVersion(waiting);
      if (ranges.length > 0) {
        result.set(waiting.id, ranges);
      }
    }

    const installing = versions.get(SDK.ServiceWorkerManager.ServiceWorkerVersion.Modes.Installing);
    if (installing) {
      const ranges = addRangeForVersion(installing);
      if (ranges.length > 0) {
        result.set(installing.id, ranges);
      }
    }

    const redundant = versions.get(SDK.ServiceWorkerManager.ServiceWorkerVersion.Modes.Redundant);
    if (redundant) {
      const ranges = addRangeForVersion(redundant);
      if (ranges.length > 0) {
        result.set(redundant.id, ranges);
      }
    }

    return result;
  }

  /**
   * @param {SDK.ServiceWorkerManager.ServiceWorkerRegistration} registration
   * @return {!Element}
   */
  static createTimingTable(registration) {
    const tableElement = document.createElement('table');
    tableElement.classList.add('service-worker-update-timing-table');
    UI.Utils.appendStyle(tableElement, 'resources/serviceWorkerUpdateCycleView.css');
    const timeRanges = this.calculateServiceWorkerUpdateRanges(registration);
    this._updateTimingTable(tableElement, timeRanges);
    return tableElement;
  }

  /**
   * @param {!Element} tableElement
   */
  static _createTimingTableHead(tableElement) {
    const serverHeader = tableElement.createChild('tr', 'service-worker-update-timing-table-header');
    UI.UIUtils.createTextChild(serverHeader.createChild('td'), Common.UIString.UIString('Version'));
    UI.UIUtils.createTextChild(serverHeader.createChild('td'), Common.UIString.UIString('Update Activity'));
    UI.UIUtils.createTextChild(serverHeader.createChild('td'), Common.UIString.UIString('Timeline'));
  }

  /**
   * @param {!Element} tableElement
   */
  static _removeRows(tableElement) {
    const rows = tableElement.getElementsByTagName('tr');
    while (rows[0]) {
      rows[0].parentNode.removeChild(rows[0]);
    }
  }

  /**
   * @param {!Element} tableElement
   * @param {!Map<string, Array<!ServiceWorkerUpdateRange>} timeRanges
   */
  static _updateTimingTable(tableElement, timeRanges) {
    function allStartTime(timeRanges) {
      let result = [];
      for (const arr of timeRanges.values()) {
        result = result.concat(arr.map(r => r.start));
      }

      return result;
    }

    function allEndTime(timeRanges) {
      let result = [];
      for (const arr of timeRanges.values()) {
        result = result.concat(arr.map(r => r.end));
      }

      return result;
    }

    this._removeRows(tableElement);
    this._createTimingTableHead(tableElement);
    const startTimes = allStartTime(timeRanges);
    if (startTimes.length === 0) {
      return;
    }

    const endTimes = allEndTime(timeRanges);
    const startTime = startTimes.reduce((a, b) => Math.min(a, b));
    const endTime = endTimes.reduce((a, b) => Math.max(a, b));
    const scale = 100 / (endTime - startTime);

    for (const id of timeRanges.keys()) {
      const ranges = timeRanges.get(id);
      for (let i = 0; i < ranges.length; ++i) {
        const range = ranges[i];
        const rangeName = range.name;

        const left = (scale * (range.start - startTime));
        const right = (scale * (endTime - range.end));

        const tr = tableElement.createChild('tr');
        const timingBarVersionElement = tr.createChild('td');
        UI.UIUtils.createTextChild(timingBarVersionElement, '#' + id);
        timingBarVersionElement.classList.add('service-worker-update-timing-bar-clickable');
        timingBarVersionElement.setAttribute('tabindex', 0);
        const timingBarTitleElement = tr.createChild('td');
        UI.UIUtils.createTextChild(timingBarTitleElement, rangeName);
        timingBarTitleElement.setAttribute('role', 'switch');
        UI.ARIAUtils.setChecked(timingBarTitleElement, false);
        this._constructUpdateDetails(tableElement, tr, range);
        const barContainer = tr.createChild('td').createChild('div', 'service-worker-update-timing-row');
        const bar = barContainer.createChild('span', 'service-worker-update-timing-bar ' + rangeName.toLowerCase());

        bar.style.left = left + '%';
        bar.style.right = right + '%';
        bar.textContent = '\u200B';  // Important for 0-time items to have 0 width.

        // const label = tr.createChild('td').createChild('div', 'service-worker-update-timing-bar-title');
        // label.textContent = Number.millisToString(duration);
      }
    }
  }

  static _constructUpdateDetails(tableElement, tr, range) {
    const detailsElement = tableElement.createChild('tr', 'service-worker-update-timing-bar-details');
    detailsElement.classList.add('service-worker-update-timing-bar-details-collapsed');

    self.onInvokeElement(tr, event => this._onToggleUpdateDetails(detailsElement, event));

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
  }

  static _onToggleUpdateDetails(detailsRow, event) {
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
   * @param {!Element} tableElement
   * @param {!Array {!SDK.ServiceWorkerManager.ServiceWorkerRegistration}} registration
   */
  static refresh(tableElement, registration) {
    const timeRanges = this.calculateServiceWorkerUpdateRanges(registration);
    this._updateTimingTable(tableElement, timeRanges);
  }
}

/** @enum {string} */
export const ServiceWorkerUpdateNames = {
  Install: 'Install',
  Wait: 'Wait',
  Activate: 'Activate'
};

/** @typedef {{id: string, name: !ServiceWorkerUpdateNames, start: number, end: number}} */
export let ServiceWorkerUpdateRange;
