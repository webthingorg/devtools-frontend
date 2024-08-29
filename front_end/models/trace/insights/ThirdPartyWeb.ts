// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as ThirdPartyWeb from '../../../third_party/third-party-web/third-party-web.js';
import * as Helpers from '../helpers/helpers.js';
import type * as Types from '../types/types.js';

import {type InsightResult, type NavigationInsightContext, type RequiredData} from './types.js';

export function deps(): ['Meta', 'NetworkRequests'] {
  return ['Meta', 'NetworkRequests'];
}

type IEntity = typeof ThirdPartyWeb.ThirdPartyWeb.entities[number];

/**
 * Returns the origin portion of a Chrome extension URL.
 */
function getChromeExtensionOrigin(url: URL): string {
  return url.protocol + '//' + url.host;
}

function makeUpChromeExtensionEntity(entityCache: Map<string, IEntity>, url: string, extensionName?: string): IEntity {
  const parsedUrl = new URL(url);
  const origin = getChromeExtensionOrigin(parsedUrl);
  const host = new URL(origin).host;
  const name = extensionName || host;

  const cachedEntity = entityCache.get(origin);
  if (cachedEntity) {
    return cachedEntity;
  }

  const chromeExtensionEntity = {
    name,
    company: name,
    category: 'Chrome Extension',
    homepage: 'https://chromewebstore.google.com/detail/' + host,
    categories: [],
    domains: [],
    averageExecutionTime: 0,
    totalExecutionTime: 0,
    totalOccurrences: 0,
  };

  entityCache.set(origin, chromeExtensionEntity);
  return chromeExtensionEntity;
}

function makeUpEntity(entityCache: Map<string, IEntity>, url: string): IEntity|undefined {
  // Make up an entity only for valid http/https URLs.
  if (!url.startsWith('http')) {
    return;
  }

  const parsedUrl = new URL(url);
  if (parsedUrl.protocol === 'chrome-extension:') {
    return makeUpChromeExtensionEntity(entityCache, url);
  }

  // NOTE: Lighthouse uses a tld database to determine the root domain, but here
  // we are using third party web's database. Doesn't really work for the case of classifying
  // domains 3pweb doesn't know about, so it will just give us a guess.
  const rootDomain = ThirdPartyWeb.ThirdPartyWeb.getRootDomain(url);
  if (!rootDomain) {
    return;
  }

  if (entityCache.has(rootDomain)) {
    return entityCache.get(rootDomain);
  }

  const unrecognizedEntity = {
    name: rootDomain,
    company: rootDomain,
    category: '',
    categories: [],
    domains: [rootDomain],
    averageExecutionTime: 0,
    totalExecutionTime: 0,
    totalOccurrences: 0,
    isUnrecognized: true,
  };
  entityCache.set(rootDomain, unrecognizedEntity);
  return unrecognizedEntity;
}

export type ThirdPartyWebInsightResult = InsightResult<{
  entityByRequest: Map<Types.TraceEvents.SyntheticNetworkRequest, IEntity>,
}>;

export function generateInsight(
    traceParsedData: RequiredData<typeof deps>, context: NavigationInsightContext): ThirdPartyWebInsightResult {
  const networkRequests = [];
  for (const req of traceParsedData.NetworkRequests.byTime) {
    if (req.args.data.frame !== context.frameId) {
      continue;
    }

    const navigation =
        Helpers.Trace.getNavigationForTraceEvent(req, context.frameId, traceParsedData.Meta.navigationsByFrameId);
    if (navigation?.args.data?.navigationId !== context.navigationId) {
      continue;
    }

    networkRequests.push(req);
  }

  const entityByRequest = new Map<Types.TraceEvents.SyntheticNetworkRequest, IEntity>();
  const madeUpEntityCache = new Map<string, IEntity>();
  for (const request of networkRequests) {
    const url = request.args.data.url;
    const entity = ThirdPartyWeb.ThirdPartyWeb.getEntity(url) ?? makeUpEntity(madeUpEntityCache, url);
    if (entity) {
      entityByRequest.set(request, entity);
    }
  }

  return {
    entityByRequest,
  };
}
