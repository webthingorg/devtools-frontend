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

interface CrUXRecord {
  key: Omit<CrUXRequest, 'metrics'>;
  metrics: {[K in MetricNames]?: MetricResponse;};
  collectionPeriod: {
    firstDate: CollectionDate,
    lastDate: CollectionDate,
  };
}

export interface CrUXResponse {
  record: CrUXRecord;
  urlNormalizationDetails?: {
    originalUrl: string,
    normalizedUrl: string,
  };
}

export type CrUXPageResult = {
  [K in`url-${DeviceScope}`]: CrUXResponse|null;
}&{
  [K in`origin-${DeviceScope}`]: CrUXResponse|null;
};

let cruxManagerInstance: CrUXManager;

const deviceScopeList: Array<DeviceScope> = ['ALL', 'DESKTOP', 'PHONE', 'TABLET'];
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

  async getFieldDataForPage(pageUrl: string): Promise<CrUXPageResult> {
    const pageResult: CrUXPageResult = {
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
      const {url, origin} = this.#normalizeUrl(pageUrl);
      const promises: Promise<void>[] = [];

      for (const deviceScope of deviceScopeList) {
        const urlPromise = this.#getURLData(url, deviceScope).then(response => {
          pageResult[`url-${deviceScope}`] = response;
        });
        const originPromise = this.#getOriginData(origin, deviceScope).then(response => {
          pageResult[`origin-${deviceScope}`] = response;
        });
        promises.push(urlPromise, originPromise);
      }

      await Promise.all(promises);
    } catch (err) {
      console.error(err);
    } finally {
      return pageResult;
    }
  }

  async getFieldDataForCurrentPage(): Promise<CrUXPageResult> {
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

    this.dispatchEventToListeners(Events.FieldDataChanged, undefined);

    const pageResult = await this.getFieldDataForCurrentPage();

    this.dispatchEventToListeners(Events.FieldDataChanged, pageResult);
  }

  #normalizeUrl(inputUrl: string): {url: string, origin: string} {
    const parsedUrl = new URL(inputUrl);
    return {
      url: parsedUrl.href,
      origin: parsedUrl.origin,
    };
  }

  async #getURLData(url: string, deviceScope: DeviceScope): Promise<CrUXResponse|null> {
    const cacheKey = `${url}-${deviceScope}`;
    const cachedResponse = this.#urlCache.get(cacheKey);
    if (cachedResponse !== undefined) {
      return cachedResponse;
    }

    const formFactor = deviceScope === 'ALL' ? undefined : deviceScope;
    const result = await this.#makeRequest({url, metrics, formFactor});
    if (result !== undefined) {
      this.#urlCache.set(cacheKey, result);
    }
    return result || null;
  }

  async #getOriginData(origin: string, deviceScope: DeviceScope): Promise<CrUXResponse|null> {
    const cacheKey = `${origin}-${deviceScope}`;
    const cachedResponse = this.#originCache.get(cacheKey);
    if (cachedResponse !== undefined) {
      return cachedResponse;
    }

    const formFactor = deviceScope === 'ALL' ? undefined : deviceScope;
    const result = await this.#makeRequest({origin, metrics, formFactor});
    if (result !== undefined) {
      this.#originCache.set(cacheKey, result);
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
  [Events.FieldDataChanged]: CrUXPageResult|undefined,
};
