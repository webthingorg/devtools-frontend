// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';

const CRUX_API_KEY = 'AIzaSyB2zMQxOXvWsM1Fpu8-bRy3zr_0HF_gjYU';
const ENDPOINT = `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${CRUX_API_KEY}`;

export type MetricNames = 'cumulative_layout_shift'|'first_contentful_paint'|'first_input_delay'|
    'interaction_to_next_paint'|'largest_contentful_paint'|'experimental_time_to_first_byte';
export type FormFactor = 'DESKTOP'|'PHONE'|'TABLET';
export type DeviceScope = FormFactor|'ALL';
export type PageScope = 'url'|'origin';
export type ConnectionType = 'offline'|'slow-2G'|'2G'|'3G'|'4G';

interface CrUXRequest {
  effectiveConnectionType?: ConnectionType;
  formFactor?: FormFactor;
  metrics?: Array<MetricNames>;
  origin?: string;
  url?: string;
}

export interface MetricResponse {
  histogram: Array<{start: number, end?: number, density?: number}>;
  percentiles: {p75: number};
}

interface CollectionDate {
  year: number;
  month: number;
  day: number;
}

interface Record {
  key: Omit<CrUXRequest, 'metrics'>;
  metrics: {[K in MetricNames]?: MetricResponse;};
  collectionPeriod: {
    firstDate: CollectionDate,
    lastDate: CollectionDate,
  };
}

export interface CrUXResponse {
  record: Record;
  urlNormalizationDetails?: {
    originalUrl: string,
    normalizedUrl: string,
  };
}

export type PageResult = {
  [K in`${PageScope}-${DeviceScope}`]: CrUXResponse|null;
};

let cruxManagerInstance: CrUXManager;

const deviceScopeList: DeviceScope[] = ['ALL', 'DESKTOP', 'PHONE', 'TABLET'];
const pageScopeList: PageScope[] = ['origin', 'url'];
const metrics: MetricNames[] = ['largest_contentful_paint', 'cumulative_layout_shift', 'interaction_to_next_paint'];

export class CrUXManager extends Common.ObjectWrapper.ObjectWrapper<EventTypes> {
  #originCache = new Map<string, CrUXResponse|null>();
  #urlCache = new Map<string, CrUXResponse|null>();
  #mainDocumentUrl?: string;
  #automaticFieldSetting = Common.Settings.Settings.instance().createSetting('automatic-field-data', false);

  private constructor() {
    super();

    this.#automaticFieldSetting.setTitle('Automatic field data');

    SDK.TargetManager.TargetManager.instance().addModelListener(
        SDK.ResourceTreeModel.ResourceTreeModel, SDK.ResourceTreeModel.Events.FrameNavigated, this.#onFrameNavigated,
        this);
  }

  static instance(opts: {forceNew: boolean|null} = {forceNew: null}): CrUXManager {
    const {forceNew} = opts;
    if (!cruxManagerInstance || forceNew) {
      cruxManagerInstance = new CrUXManager();
    }

    return cruxManagerInstance;
  }

  getAutomaticSetting(): Common.Settings.Setting<boolean> {
    return this.#automaticFieldSetting;
  }

  async getFieldDataForPage(pageUrl: string): Promise<PageResult> {
    const pageResult: PageResult = {
      'origin-ALL': null,
      'origin-DESKTOP': null,
      'origin-PHONE': null,
      'origin-TABLET': null,
      'url-ALL': null,
      'url-DESKTOP': null,
      'url-PHONE': null,
      'url-TABLET': null,
    };

    try {
      const normalizedUrl = this.#normalizeUrl(pageUrl);
      const promises: Promise<void>[] = [];

      for (const pageScope of pageScopeList) {
        for (const deviceScope of deviceScopeList) {
          const promise = this.#getScopedData(normalizedUrl, pageScope, deviceScope).then(response => {
            pageResult[`${pageScope}-${deviceScope}`] = response;
          });
          promises.push(promise);
        }
      }

      await Promise.all(promises);
    } catch (err) {
      console.error(err);
    } finally {
      return pageResult;
    }
  }

  /**
   * In general, this function should use the main document URL
   * (i.e. the URL after all redirects but before SPA navigations)
   *
   * However, we can't detect the main document URL of the current page if it's
   * navigation occurred before DevTools was first opened. This function will fall
   * back to the currently inspected URL (i.e. what is displayed in the omnibox) if
   * the main document URL cannot be found.
   */
  async getFieldDataForCurrentPage(): Promise<PageResult> {
    const pageUrl = this.#mainDocumentUrl || await this.#getInspectedURL();
    return this.getFieldDataForPage(pageUrl);
  }

  async #getInspectedURL(): Promise<string> {
    const targetManager = SDK.TargetManager.TargetManager.instance();
    let inspectedURL = targetManager.inspectedURL();
    if (!inspectedURL) {
      inspectedURL = await new Promise(resolve => {
        function handler(event: {data: SDK.Target.Target}): void {
          const newInspectedURL = event.data.inspectedURL();
          if (newInspectedURL) {
            resolve(newInspectedURL);
            targetManager.removeEventListener(SDK.TargetManager.Events.InspectedURLChanged, handler);
          }
        }
        targetManager.addEventListener(SDK.TargetManager.Events.InspectedURLChanged, handler);
      });
    }
    return inspectedURL;
  }

  async #onFrameNavigated(event: {data: SDK.ResourceTreeModel.ResourceTreeFrame}): Promise<void> {
    if (!event.data.isPrimaryFrame()) {
      return;
    }

    this.#mainDocumentUrl = event.data.url;

    if (!this.#automaticFieldSetting.get()) {
      return;
    }

    // Fetching field data for the next page can take time. To avoid showing field data that is
    // irrelevant to the new page, clear the current set of field data until the new set is ready.
    this.dispatchEventToListeners(Events.FieldDataChanged, undefined);

    const pageResult = await this.getFieldDataForCurrentPage();

    this.dispatchEventToListeners(Events.FieldDataChanged, pageResult);
  }

  #normalizeUrl(inputUrl: string): URL {
    const normalizedUrl = new URL(inputUrl);
    normalizedUrl.hash = '';
    normalizedUrl.search = '';
    return normalizedUrl;
  }

  async #getScopedData(normalizedUrl: URL, pageScope: PageScope, deviceScope: DeviceScope): Promise<CrUXResponse|null> {
    const {origin, href: url} = normalizedUrl;

    const cache = pageScope === 'origin' ? this.#originCache : this.#urlCache;
    const cacheKey = pageScope === 'origin' ? `${origin}-${deviceScope}` : `${url}-${deviceScope}`;
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse !== undefined) {
      return cachedResponse;
    }

    const formFactor = deviceScope === 'ALL' ? undefined : deviceScope;
    const result = pageScope === 'origin' ? await this.#makeRequest({origin, metrics, formFactor}) :
                                            await this.#makeRequest({url, metrics, formFactor});

    // `undefined` indicates an error, we should not cache these responses.
    // `null` indicates that CrUX explicitly returned no data, we should cache these responses.
    if (result !== undefined) {
      cache.set(cacheKey, result);
    }

    return result || null;
  }

  /**
   * Sends raw JSON data to the CrUX endpoint and returns the JSON response.
   * `null` and `undefined` should be handled differently here. `null` means CrUX returned with no data and `undefined`
   * means some other error occurred such that a final CrUX response could not be created.
   *
   * In the case of `undefined` we should not cache the result.
   */
  async #makeRequest(request: CrUXRequest): Promise<CrUXResponse|null|undefined> {
    try {
      const body = JSON.stringify(request);
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        body,
      });

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }
}

export const enum Events {
  FieldDataChanged = 'field-data-changed',
}

type EventTypes = {
  [Events.FieldDataChanged]: PageResult|undefined,
};
