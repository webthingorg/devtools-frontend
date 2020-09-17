// Copyright (c) 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Network from '../network/network.js';
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

export class ServiceWorkerNetworkView extends UI.Widget.VBox {
  constructor() {
    super(true, true);
    this.registerRequiredCSS('network/networkTimingTable.css');
    this.registerRequiredCSS('resources/ServiceWorkerNetworkView.css');

    this._networkLog = SDK.NetworkLog.NetworkLog.instance();
    this._calculator = new Network.NetworkTimeCalculator.NetworkTimeCalculator(true);
    this._detailsVisible = false;
    /** @type {?SDK.ServiceWorkerManager.ServiceWorkerRegistration} */
    this._registration = null;

    this._networkContainer = this.contentElement.createChild('section', 'main-container');
  }

  /**
   * @param {!SDK.ServiceWorkerManager.ServiceWorkerRegistration} registration
   */
  async showPanel(registration) {
    await UI.InspectorView.InspectorView.instance().showPanel('resources.service-worker-network');
    this._registration = registration;
    this._onRequestUpdated();
  }

  /**
   * @override
   */
  willHide() {
    this._removeEventListeners();
    this._detailsVisible = false;
  }

  /**
   * @override
   */
  wasShown() {
    this._addDefaultMessage();
    this._addEventListners();
  }

  /**
   * @param {boolean} [serviceWorkerSelected=false]
   */
  _addDefaultMessage(serviceWorkerSelected) {
    this._cleanNetworkContainer();
    const messageContainer = this._networkContainer.createChild('div', 'message-container');
    messageContainer.textContent = ls`Intercepted network requests by service worker will be displayed here.`;
  }

  _addEventListners() {
    this._networkLog.addEventListener(SDK.NetworkLog.Events.RequestUpdated, this._onRequestUpdated, this);
  }

  _removeEventListeners() {
    this._networkLog.removeEventListener(SDK.NetworkLog.Events.RequestUpdated, this._onRequestUpdated, this);
  }

  _onRequestUpdated() {
    const serviceWorkerRequests =
        Array.from(this._networkLog.requests()).filter(request => request._fetchedViaServiceWorker);
    this._render(serviceWorkerRequests);
  }

  _cleanNetworkContainer() {
    while (this._networkContainer.firstChild) {
      this._networkContainer.removeChild(this._networkContainer.firstChild);
    }
  }

  /**
   * @param {Array<SDK.NetworkRequest.NetworkRequest>} requests
   */
  _render(requests) {
    const lastRequest = requests[requests.length - 1];
    if (lastRequest) {
      this._cleanNetworkContainer();

      const tableElement = this._networkContainer.createChild('table', 'service-worker-table network-timing-table');
      const requestRows = new ServiceWorkerNetworkRequest(lastRequest, this._calculator).getRequestRows();
      tableElement.appendChild(requestRows);
    }
  }
}

class ServiceWorkerNetworkRequest {
  /**
   * @param {SDK.NetworkRequest.NetworkRequest} request
   * @param {Network.NetworkTimeCalculator.NetworkTimeCalculator} calculator
   */
  constructor(request, calculator) {
    this._detailsVisible = false;
    this._requestBodyElement = this._createTimingRows(request, calculator);
    const detailsContainer = this._requestBodyElement.querySelector('tr.network-fetch-timing-bar-details');
    detailsContainer?.classList.add('hide-container');
  }

  getRequestRows() {
    return this._requestBodyElement;
  }

  _showDetailsClick() {
    this._detailsVisible = !this._detailsVisible;
    this._appendDetailsRow();
  }

  _appendDetailsRow() {
    const detailsContainer = this._requestBodyElement.querySelector('tr.network-fetch-timing-bar-details');
    const timingBarTitleEement = this._requestBodyElement.querySelector('td.network-fetch-timing-bar-clickable');
    if (timingBarTitleEement && detailsContainer) {
      if (this._detailsVisible) {
        detailsContainer.classList.remove('hide-container');
        UI.ARIAUtils.setChecked(timingBarTitleEement, true);
      } else {
        detailsContainer.classList.add('hide-container');
        UI.ARIAUtils.setChecked(timingBarTitleEement, false);
      }
    }
  }

  /**
   * @param {SDK.NetworkRequest.NetworkRequest} request
   * @param {Network.NetworkTimeCalculator.NetworkTimeCalculator} calculator
   */
  _createTimingRows(request, calculator) {
    const tableElement = document.createElement('tbody');
    const timeRanges =
        Network.RequestTimingView.RequestTimingView.calculateRequestTimeRanges(request, calculator.minimumBoundary())
            .filter(timeRange => Network.RequestTimingView.ServiceWorkerRangeNames.has(timeRange.name));
    const startTime = Math.min(...timeRanges.map(r => r.start));
    const endTime = Math.max(...timeRanges.map(r => r.end));
    const scale = 100 / (endTime - startTime);

    let serviceworkerHeader;

    let right;
    for (let i = 0; i < timeRanges.length; ++i) {
      const range = timeRanges[i];
      const rangeName = range.name;
      if (Network.RequestTimingView.ServiceWorkerRangeNames.has(rangeName)) {
        if (!serviceworkerHeader) {
          serviceworkerHeader = this._createHeader(tableElement, request.displayName);
        }
      }

      const left = (scale * (range.start - startTime));
      right = (scale * (endTime - range.end));
      const duration = range.end - range.start;

      const tr = tableElement.createChild('tr');
      const timingBarTitleEement = tr.createChild('td');
      timingBarTitleEement.createTextChild(Network.RequestTimingView.RequestTimingView._timeRangeTitle(rangeName));

      const row = tr.createChild('td').createChild('div', 'network-timing-row');
      const bar = row.createChild('span', 'network-timing-bar ' + rangeName);
      bar.style.left = left + '%';
      bar.style.right = right + '%';
      bar.textContent = '\u200B';  // Important for 0-time items to have 0 width.
      UI.ARIAUtils.setAccessibleName(row, ls`Started at ${calculator.formatValue(range.start, 2)}`);
      const label = tr.createChild('td').createChild('div', 'network-timing-bar-title');
      // @ts-ignore
      label.textContent = Number.secondsToString(duration, true);

      if (range.name === Network.RequestTimingView.RequestTimeRangeNames.ServiceWorkerRespondWith) {
        timingBarTitleEement.classList.add('network-fetch-timing-bar-clickable');
        const tableDetailsRow = tableElement.createChild('tr', 'network-fetch-timing-bar-details');
        const detailsView = Network.RequestTimingView.RequestTimingView.constructServiceWorkerFetchDetails(request);
        tableDetailsRow.appendChild(detailsView.element);

        // @ts-ignore
        timingBarTitleEement.setAttribute('tabindex', 0);
        timingBarTitleEement.setAttribute('role', 'switch');
        UI.ARIAUtils.setChecked(timingBarTitleEement, false);
        timingBarTitleEement.addEventListener('click', this._showDetailsClick.bind(this));
      }
    }

    return tableElement;
  }

  /**
   * @param {HTMLTableSectionElement} tableElement
   * @param {string} title
   * @return {!Element}
   */
  _createHeader(tableElement, title) {
    const dataHeader = tableElement.createChild('tr', 'network-timing-table-header');
    const headerCell = dataHeader.createChild('td', 'title-cell');
    headerCell.createTextChild(title);
    UI.ARIAUtils.markAsHeading(headerCell, 2);
    dataHeader.createChild('td').createTextChild('');
    dataHeader.createChild('td').createTextChild(ls`DURATION`);
    return dataHeader;
  }
}
