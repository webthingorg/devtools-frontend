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
   * @param {!SDK.ServiceWorkerManager.ServiceWorkerRegistration} registration
   */
  constructor(manager, registration) {
    super();
    this._manager = manager;
    this._registration = registration;
    this.element.classList.add('resource-service-worker-update-view');
    this._tableElement = this._createTimingTable();
  }

  tableElement() {
    return this._tableElement;
  }

  /**
   * @param {!SDK.ServiceWorkerManager.ServiceWorkerRegistration} registration
   */
  _updateRegistration(registration) {
    this._registration = registration;
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
     * @param {!SDK.ServiceWorkerManager.ServiceWorkerRegistration} registration
     * @return {?SDK.ServiceWorkerManager.ServiceWorkerVersion}
     */
    function getMostAdvancedVersionInfo(registration) {
      const versions = registration.versionsByMode();
      var version = versions.get(SDK.ServiceWorkerManager.ServiceWorkerVersion.Modes.Active);
      if (!version) {
        version = versions.get(SDK.ServiceWorkerManager.ServiceWorkerVersion.Modes.Installing);
      }
      if (!version) {
        version = versions.get(SDK.ServiceWorkerManager.ServiceWorkerVersion.Modes.Waiting);
      }
      return version;
    }

    /**
     * Add ranges representing Install and Activate, if such phases exist. Further add an 'Ellipsis'
     * phase if the duration between Install and Activate is too long.
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
        var adjustedStartActivateTime = startActivateTime;
        var adjustedEndActivateTime = endActivateTime;
        if (result.length === 1) {
          const interlude = startActivateTime - endInstallTime;
          const maxInterlude = 10 * Math.max(endInstallTime - startInstallTime, endActivateTime - startActivateTime);
          if (interlude > maxInterlude) {
            adjustedStartActivateTime = endInstallTime + maxInterlude;
            adjustedEndActivateTime = adjustedStartActivateTime + (endActivateTime - startActivateTime);
            addRange('Ellipsis', endInstallTime, startActivateTime);
          }
        }
        addRange('Activate', adjustedStartActivateTime, adjustedEndActivateTime);
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

    // Find the version info of this service worker
    const mostAdvancedVersion = getMostAdvancedVersionInfo(this._registration);

    // calculate and the ranges for install, activate and time in between
    if (mostAdvancedVersion) {
      addRangeForVersion(mostAdvancedVersion);
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
    if (!timeRanges || timeRanges.length === 0) {
      return tableElement;
    }
    this._updateTimingTable(tableElement, timeRanges);
    return tableElement;
  }

  /**
   * @param {!Element} tableElement
   */
  _createTimingTableHead(tableElement) {
    var colgroups = tableElement.getElementsByTagName('colgroup');
    if (colgroups.length > 0) {
      return;
    }
    const colgroup = tableElement.createChild('colgroup');
    colgroup.createChild('col', 'labels');
    colgroup.createChild('col', 'bars');
    colgroup.createChild('col', 'duration');

    const timeHeader = tableElement.createChild('thead', 'network-timing-start');
    const tableHeaderRow = timeHeader.createChild('tr');
    const activityHeaderCell = tableHeaderRow.createChild('th');
    activityHeaderCell.createChild('span').textContent = ls`Label`;
    activityHeaderCell.scope = 'col';
    const waterfallHeaderCell = tableHeaderRow.createChild('th');
    waterfallHeaderCell.createChild('span').textContent = ls`Waterfall`;
    waterfallHeaderCell.scope = 'col';
    const durationHeaderCell = tableHeaderRow.createChild('th');
    durationHeaderCell.createChild('span').textContent = ls`Duration`;
    durationHeaderCell.scope = 'col';
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
      } else {
        bar.textContent = '...';
      }

      const label = tr.createChild('td').createChild('div', 'network-timing-bar-title');
      label.textContent = Number.millisToString(duration);
    }
  }

  _constructUpdateDetails(tableElement, tr, range) {
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
   * @param {!SDK.ServiceWorkerManager.ServiceWorkerRegistration} registration
   */
  refresh(registration) {
    this._updateRegistration(registration);
    const timeRanges = this.calculateServiceWorkerUpdateRanges();
    this._updateTimingTable(this.tableElement(), timeRanges);
  }
}

/** @enum {string} */
export const ServiceWorkerUpdateNames = {
  Install: 'install',
  Activate: 'activate'
};

/** @typedef {{name: !ServiceWorkerUpdateNames, start: number, end: number}} */
export let ServiceWorkerUpdateRange;
