// Copyright (c) 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// @ts-nocheck
// TODO(crbug.com/1011811): Enable TypeScript compiler checks
import * as Network from '../network/network.js';
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

let serviceWorkerNetworkInstance;

export class ServiceWorkerNetworkView extends UI.Widget.VBox {
  constructor() {
    super(true, true);
    this.registerRequiredCSS('resources/ServiceWorkerNetworkView.css');

    this._networkLog = SDK.NetworkLog.NetworkLog.instance();
    this._calculator = new Network.NetworkTimeCalculator.NetworkTimeCalculator(true);
    this._detailsVisible = false;
    this._addEventListners();

    const headerDiv = this.contentElement.createChild('header');
    headerDiv.textContent = 'Service worker network test';

    this._lastRequestElement = this.contentElement.createChild('section');

    const requests = this._networkLog.requests();

    // TODO investigate whether network requests can be filtered for multiple service workers.
    this._render(requests);
  }

  static instance({forceNew} = {forceNew: false}) {
    if (!serviceWorkerNetworkInstance || forceNew) {
      serviceWorkerNetworkInstance = new ServiceWorkerNetworkView();
    }

    return serviceWorkerNetworkInstance;
  }

  _addEventListners() {
    // @TODO Also remove event listner
    this._networkLog.addEventListener(SDK.NetworkLog.Events.RequestUpdated, this._onRequestUpdated, this);
  }

  _onRequestUpdated(event) {
    const serviceWorkerRequests =
        Array.from(this._networkLog._requestsSet).filter(request => request._fetchedViaServiceWorker);
    this._render(serviceWorkerRequests);
  }

  _render(requests) {
    const lastRequest = requests[requests.length - 1];
    if (lastRequest) {
      while (this._lastRequestElement.firstChild) {
        this._lastRequestElement.removeChild(this._lastRequestElement.firstChild);
      }
      const networkLogElement = this._createTimingView(lastRequest, this._calculator);
      this._lastRequestElement.appendChild(networkLogElement);
      if (this._detailsVisible) {
        const detailsRow = this._constructFetchDetailsView(lastRequest);
        this._lastRequestElement.appendChild(detailsRow);
      }
    }
  }

  _createTimingView(request, calculator) {
    const tableElement = document.createElement('table');
    tableElement.classList.add('network-timing-table', 'service-worker-table');
    UI.Utils.appendStyle(tableElement, 'network/networkTimingTable.css');

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
          serviceworkerHeader = createHeader(ls`Service Worker`);
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
      label.textContent = Number.secondsToString(duration, true);

      if (range.name === Network.RequestTimingView.RequestTimeRangeNames.ServiceWorkerRespondWith) {
        timingBarTitleEement.classList.add('network-fetch-timing-bar-clickable');
        tableElement.createChild('tr', 'network-fetch-timing-bar-details');

        timingBarTitleEement.setAttribute('tabindex', 0);
        timingBarTitleEement.setAttribute('role', 'switch');
        UI.ARIAUtils.setChecked(timingBarTitleEement, false);
        timingBarTitleEement.addEventListener('click', this.showDetailsClick);
      }
    }

    return tableElement;

    /**
     * @param {string} title
     * @return {!Element}
     */
    function createHeader(title) {
      const dataHeader = tableElement.createChild('tr', 'network-timing-table-header');
      const headerCell = dataHeader.createChild('td');
      headerCell.createTextChild(title);
      UI.ARIAUtils.markAsHeading(headerCell, 2);
      dataHeader.createChild('td').createTextChild('');
      dataHeader.createChild('td').createTextChild(ls`DURATION`);
      return dataHeader;
    }
  }

  _constructFetchDetailsView(request) {
    const rootElement = this.contentElement.createChild('article');
    rootElement.classList.add('table-details');
    const detailsView = new UI.TreeOutline.TreeOutlineInShadow();
    rootElement.appendChild(detailsView.element);

    const origRequest = SDK.NetworkLog.NetworkLog.instance().originalRequestForURL(request.url());
    if (origRequest) {
      const requestObject = SDK.RemoteObject.RemoteObject.fromLocalObject(origRequest);
      const requestTreeElement = new ObjectUI.ObjectPropertiesSection.RootElement(requestObject);
      requestTreeElement.title = ls`Original Request`;
      detailsView.appendChild(requestTreeElement);
    }

    const response = SDK.NetworkLog.NetworkLog.instance().originalResponseForURL(request.url());
    if (response) {
      const responseObject = SDK.RemoteObject.RemoteObject.fromLocalObject(response);
      const responseTreeElement = new ObjectUI.ObjectPropertiesSection.RootElement(responseObject);
      responseTreeElement.title = ls`Response Received`;
      detailsView.appendChild(responseTreeElement);
    }

    const serviceWorkerResponseSource = document.createElementWithClass('div', 'network-fetch-details-treeitem');
    let swResponseSourceString = ls`Unknown`;
    const swResponseSource = request.serviceWorkerResponseSource();
    if (swResponseSource) {
      swResponseSourceString = this._getLocalizedResponseSourceForCode(swResponseSource);
    }
    serviceWorkerResponseSource.textContent = ls`Source of response: ${swResponseSourceString}`;

    const responseSourceTreeElement = new UI.TreeOutline.TreeElement(serviceWorkerResponseSource);
    detailsView.appendChild(responseSourceTreeElement);

    const cacheNameElement = document.createElementWithClass('div', 'network-fetch-details-treeitem');
    const responseCacheStorageName = request.getResponseCacheStorageCacheName();
    if (responseCacheStorageName) {
      cacheNameElement.textContent = ls`Cache storage cache name: ${responseCacheStorageName}`;
    } else {
      cacheNameElement.textContent = ls`Cache storage cache name: Unknown`;
    }

    const cacheNameTreeElement = new UI.TreeOutline.TreeElement(cacheNameElement);
    detailsView.appendChild(cacheNameTreeElement);

    const retrievalTime = request.getResponseRetrievalTime();
    if (retrievalTime) {
      const responseTimeElement = document.createElementWithClass('div', 'network-fetch-details-treeitem');
      responseTimeElement.textContent = ls`Retrieval Time: ${retrievalTime}`;
      const responseTimeTreeElement = new UI.TreeOutline.TreeElement(responseTimeElement);
      detailsView.appendChild(responseTimeTreeElement);
    }
    return rootElement;
  }

  _getLocalizedResponseSourceForCode(swResponseSource) {
    switch (swResponseSource) {
      case Protocol.Network.ServiceWorkerResponseSource.CacheStorage:
        return ls`ServiceWorker cache storage`;
      case Protocol.Network.ServiceWorkerResponseSource.HttpCache:
        return ls`From HTTP cache`;
      case Protocol.Network.ServiceWorkerResponseSource.Network:
        return ls`Network fetch`;
      default:
        return ls`Fallback code`;
    }
  }

  showDetailsClick = () => {
    this._detailsVisible = !this._detailsVisible;
    this._onRequestUpdated();
  }

  async showPanel(registration, manager) {
    self.UI.inspectorView.showPanel('resources.service-worker-network');
  }
}
