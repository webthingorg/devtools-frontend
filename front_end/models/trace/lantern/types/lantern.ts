// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Protocol from '../../../../generated/protocol.js';

export type TraceEvent = {
  name: string,
  cat: string,
  args: {
    name?: string,
    fileName?: string,
    snapshot?: string,
    sync_id?: string,
    beginData?: {
      frame?: string,
      startLine?: number,
      url?: string,
    },
    data?: {
      frame?: string,
      readyState?: number,
      stackTrace?: {
        url: string,
      }[],
      url?: string,
    },
  },
  pid: number,
  tid: number,
  /** Timestamp of the event in microseconds. */
  ts: number,
  dur: number,
};
export type Trace = {
  traceEvents: TraceEvent[],
};
export type ResourcePriority = ('VeryLow'|'Low'|'Medium'|'High'|'VeryHigh');
export type ResourceType =
    ('Document'|'Stylesheet'|'Image'|'Media'|'Font'|'Script'|'TextTrack'|'XHR'|'Fetch'|'Prefetch'|'EventSource'|
     'WebSocket'|'Manifest'|'SignedExchange'|'Ping'|'CSPViolationReport'|'Preflight'|'Other');
type InitiatorType = ('parser'|'script'|'preload'|'SignedExchange'|'preflight'|'other');
export type ResourceTiming = Protocol.Network.ResourceTiming;
type CallStack = {
  callFrames: Array<{
    scriptId: string,
    url: string,
    lineNumber: number,
    columnNumber: number,
    functionName: string,
  }>,
  parent?: CallStack,
};

export type ParsedURL = {
  /**
   * Equivalent to a `new URL(url).protocol` BUT w/o the trailing colon (:)
   */
  scheme: string,
  /**
   * Equivalent to a `new URL(url).hostname`
   */
  host: string,
  securityOrigin: string,
};

export type NetworkRequest<T = any> = {
  requestId: string,
  connectionId: number,
  connectionReused: boolean,
  url: string,
  protocol: string,
  parsedURL: ParsedURL,
  documentURL: string,
  /** When the renderer process initially discovers a network request, in milliseconds. */
  rendererStartTime: number,
  /**
   * When the network service is about to handle a request, ie. just before going to the
   * HTTP cache or going to the network for DNS/connection setup, in milliseconds.
   */
  networkRequestTime: number,
  /**
   * When the last byte of the response headers is received, in milliseconds.
   * Equal to networkRequestTime if no data is recieved over the
   * network (ex: cached requests or data urls).
   */
  responseHeadersEndTime: number,
  /** When the last byte of the response body is received, in milliseconds. */
  networkEndTime: number,
  transferSize: number,
  resourceSize: number,
  fromDiskCache: boolean,
  fromMemoryCache: boolean,
  isLinkPreload: boolean,
  finished: boolean,
  failed: boolean,
  statusCode: number,
  /** The network request that redirected to this one */
  redirectSource: NetworkRequest<T>|undefined,
  /** The network request that this one redirected to */
  redirectDestination: NetworkRequest<T>|undefined,
  // TODO: can't use Protocol.Network.Initiator because of type mismatch in Lighthouse initiator.
  initiator: {
    type: InitiatorType,
    url?: string,
    stack?: CallStack,
  },
  initiatorRequest: NetworkRequest<T>|undefined,
  /** The chain of network requests that redirected to this one */
  redirects: NetworkRequest[]|undefined,
  timing: Protocol.Network.ResourceTiming|undefined,
  resourceType: ResourceType|undefined,
  mimeType: string,
  priority: ResourcePriority,
  frameId: string|undefined,
  fromWorker: boolean,
  /**
   * Optional value for how long the server took to respond to this request.
   * When not provided, the server response time is derived from the timing object.
   */
  serverResponseTime?: number,
  /**
   * Implementation-specific canoncial data structure that this Lantern NetworkRequest
   * was derived from.
   * Users of Lantern create a NetworkRequest matching this interface,
   * but can store the source-of-truth for their network model in this property.
   * This is then accessible as a read-only property on NetworkNode.
   */
  rawRequest?: T,
};
