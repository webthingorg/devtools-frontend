// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../core/common/common.js';

import {umaNameHash} from './Md5.js';

const UMA_FLUSH_INTERNAL = 3000;

const umaFlushThrottler = new Common.Throttler.Throttler(UMA_FLUSH_INTERNAL);

let startTime: number = 0;

export function startLogging(): void {
  startTime = Date.now() / 1000;
}

interface ChromeUserMetricsExtension {
  user_action_event?: {name_hash: bigint, time_sec: number}[];
  histogram_event?: {
    name_hash: bigint,
    bucket: {
      min?: number,
      max?: number,
      count?: number,
    }[],
  }[];
}

const umaLogs: ChromeUserMetricsExtension[] = [];
let pendingEntry: ChromeUserMetricsExtension = {};

export function reportUserAction(name: string): void {
  pendingEntry.user_action_event = pendingEntry.user_action_event || [];
  pendingEntry.user_action_event.push(
      {name_hash: umaNameHash(name), time_sec: Math.round(Date.now() / 1000 - startTime)});
  umaFlushThrottler.schedule(flushUma);
  // console.error('reportUserAction', name);
}

export function reportSparseHistogram(name: string, value: number): void {
  pendingEntry.histogram_event = pendingEntry.histogram_event || [];
  const name_hash = umaNameHash(name);
  let histogram_event = pendingEntry.histogram_event.find(e => e.name_hash === name_hash);
  if (!histogram_event) {
    histogram_event = {name_hash, bucket: []};
    pendingEntry.histogram_event.push(histogram_event);
  }
  let bucket = histogram_event.bucket.find(b => b.min === value || b.max === value + 1);
  if (!bucket) {
    bucket = {};
    if (Math.random() < 0.5) {
      bucket.min = value;
    } else {
      bucket.max = value + 1;
    }
    histogram_event.bucket.push(bucket);
  } else {
    bucket.count = bucket.count || 1;
    ++bucket.count;
  }
  umaFlushThrottler.schedule(flushUma);
  // console.error('reportSparseHistogram', name, value);
}

// @ts-ignore
window.dumpUmaLogs = function() {
  console.error(umaLogs
                    .map(
                        l => 'SELECT CAST(\'' +
                            JSON.stringify(l, (key, value) => typeof value === 'bigint' ? value.toString() : value)
                                .replace(/"name_hash":"([0-9]+)",/g, '"name_hash":$1,')
                                .replace(/"([^"]+)":/g, '$1:')
                                .slice(1, -1) +
                            '\'AS googleclient_chrome_uma.ChromeUserMetricsExtension) AS ChromeUserMetricsExtension')
                    .join(' UNION ALL '));
};

async function flushUma() {
  umaLogs.push(pendingEntry);
  pendingEntry = {};
}
