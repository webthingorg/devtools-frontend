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

import * as Common from '../common/common.js';
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

export class ServiceWorkerUpdateCycleHelper {
  /**
   * @param {SDK.ServiceWorkerManager.ServiceWorkerRegistration} registration
   * @return {!Map.<string, Array <!ServiceWorkerUpdateRange>>}
   */
  calculateServiceWorkerUpdateRanges(registration) {
    /**
     * @param {Array <!ServiceWorkerUpdateRange>} ranges
     * @param {!ServiceWorkerUpdateRange} range
     */
    function addRange(ranges, range) {
      if (range.start < Number.MAX_VALUE && range.start <= range.end) {
        ranges.push(range);
      }
    }

    /**
     * Add ranges representing Install, Wait or Activate of a sw version represented by id
     * @param {Array <!ServiceWorkerUpdateRange>} ranges
     * @param {string} id
     * @param {number} startInstallTime
     * @param {number} endInstallTime
     * @param {number} startActivateTime
     * @param {number} endActivateTime
     */
    function addNormalizedRanges(ranges, id, startInstallTime, endInstallTime, startActivateTime, endActivateTime) {
      // order of adding ranges matters
      if (startInstallTime !== 0 && endInstallTime !== 0) {
        addRange(ranges, {id, phase: ServiceWorkerUpdateNames.Install, start: startInstallTime, end: endInstallTime});
        addRange(ranges, {
          id,
          phase: ServiceWorkerUpdateNames.Wait,
          start: endInstallTime,
          end: startActivateTime ? startActivateTime : Date.now()
        });
      }
      if (startActivateTime !== 0 && endActivateTime !== 0) {
        addRange(
            ranges, {id, phase: ServiceWorkerUpdateNames.Activate, start: startActivateTime, end: endActivateTime});
      }
    }

    /**
     * @param {!SDK.ServiceWorkerManager.ServiceWorkerVersion} version
     * @returns {!Array <!ServiceWorkerUpdateRange>}
     */
    function addRangeForVersion(version) {
      /** @type {?SDK.ServiceWorkerManager.ServiceWorkerVersionState} */
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
          endActivateTime = state.timestamp || 0;
        } else if (state.status === Protocol.ServiceWorker.ServiceWorkerVersionStatus.Activating) {
          beginActivateTime = state.timestamp || 0;
        } else if (state.status === Protocol.ServiceWorker.ServiceWorkerVersionStatus.Installed) {
          endInstallTime = state.timestamp || 0;
        } else if (state.status === Protocol.ServiceWorker.ServiceWorkerVersionStatus.Installing) {
          beginInstallTime = state.timestamp || 0;
        }
        state = state.previousState;
      }
      /** @type {Array <ServiceWorkerUpdateRange>} */
      const ranges = [];
      addNormalizedRanges(ranges, version.id, beginInstallTime, endInstallTime, beginActivateTime, endActivateTime);
      return ranges;
    }

    const result = new Map();
    const versions = registration.versionsByMode();
    for (const [modeKey, mode] of Object.entries(SDK.ServiceWorkerManager.ServiceWorkerVersion.Modes)) {
      const version = versions.get(mode);
      if (version) {
        const ranges = addRangeForVersion(version);
        if (ranges.length > 0) {
          result.set(version.id, ranges);
        }
      }
    }

    return result;
  }

  /**
   * @param {SDK.ServiceWorkerManager.ServiceWorkerRegistration} registration
   * @return {!Element}
   */
  createTimingTable(registration) {
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
  _createTimingTableHead(tableElement) {
    const serverHeader = tableElement.createChild('tr', 'service-worker-update-timing-table-header');
    UI.UIUtils.createTextChild(serverHeader.createChild('td'), ls`Version`);
    UI.UIUtils.createTextChild(serverHeader.createChild('td'), ls`Update Activity`);
    UI.UIUtils.createTextChild(serverHeader.createChild('td'), ls`Timeline`);
  }

  /**
   * @param {!Element} tableElement
   */
  _removeRows(tableElement) {
    const rows = tableElement.getElementsByTagName('tr');
    while (rows[0]) {
      if (rows[0].parentNode) {
        rows[0].parentNode.removeChild(rows[0]);
      }
    }
  }

  /**
   * @param {!Element} tableElement
   * @param {!Map<string, Array<!ServiceWorkerUpdateRange>>} timeRanges
   */
  _updateTimingTable(tableElement, timeRanges) {
    this._removeRows(tableElement);
    this._createTimingTableHead(tableElement);
    /** @type {!Array<ServiceWorkerUpdateRange>} */
    const timeRangeArray = Array.from(timeRanges.values()).reduce((a, b) => a.concat(b), []);
    if (timeRangeArray.length === 0) {
      return;
    }

    const startTimes = timeRangeArray.map(r => r.start);
    const endTimes = timeRangeArray.map(r => r.end);
    const startTime = startTimes.reduce((a, b) => Math.min(a, b));
    const endTime = endTimes.reduce((a, b) => Math.max(a, b));
    const scale = 100 / (endTime - startTime);

    for (const ranges of timeRanges.values()) {
      for (const range of ranges) {
        const phaseName = range.phase;

        const left = (scale * (range.start - startTime));
        const right = (scale * (endTime - range.end));

        const tr = tableElement.createChild('tr');
        const timingBarVersionElement = tr.createChild('td');
        UI.UIUtils.createTextChild(timingBarVersionElement, '#' + range.id);
        timingBarVersionElement.classList.add('service-worker-update-timing-bar-clickable');
        timingBarVersionElement.setAttribute('tabindex', '0');
        const timingBarTitleElement = tr.createChild('td');
        UI.UIUtils.createTextChild(timingBarTitleElement, phaseName);
        timingBarTitleElement.setAttribute('role', 'switch');
        UI.ARIAUtils.setChecked(timingBarTitleElement, false);
        this._constructUpdateDetails(tableElement, tr, range);
        const barContainer = tr.createChild('td').createChild('div', 'service-worker-update-timing-row');
        /** @type {!HTMLElement}*/
        const bar = /** @type {!HTMLElement}*/ (
            barContainer.createChild('span', 'service-worker-update-timing-bar ' + phaseName.toLowerCase()));

        bar.style.left = left + '%';
        bar.style.right = right + '%';
        bar.textContent = '\u200B';  // Important for 0-time items to have 0 width.
      }
    }
  }

  /**
   * Detailed information about an update phase. Currently starting and ending time.
   * @param {!Element} tableElement
   * @param {!Element} tr
   * @param {!ServiceWorkerUpdateRange} range
   */
  _constructUpdateDetails(tableElement, tr, range) {
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

  /**
   *
   * @param {Element} detailsRow
   * @param {Event} event
   */
  _onToggleUpdateDetails(detailsRow, event) {
    if (!event.target) {
      return;
    }
    /** @type {Element} */
    const target = /** @type {Element} */ (event.target);
    if (target.classList.contains('service-worker-update-timing-bar-clickable')) {
      detailsRow.classList.toggle('service-worker-update-timing-bar-details-collapsed');
      detailsRow.classList.toggle('service-worker-update-timing-bar-details-expanded');

      const expanded = target.getAttribute('aria-checked') === 'true';
      UI.ARIAUtils.setChecked(target, !expanded);
    }
  }

  /**
   * @param {!Element} tableElement
   * @param {!SDK.ServiceWorkerManager.ServiceWorkerRegistration} registration
   */
  refresh(tableElement, registration) {
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

/** @typedef {{id: string, phase: !ServiceWorkerUpdateNames, start: number, end: number}} */
// @ts-ignore typedef
export let ServiceWorkerUpdateRange;
