// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TraceModel from '../../models/trace/trace.js';

self.onmessage = async function(event: MessageEvent): Promise<void> {
  const model = new TraceModel.TraceModel.Model();
  const traceEvents = event.data.data as unknown as readonly TraceModel.Types.TraceEvents.TraceEventData[];
  console.log('traceEvents', traceEvents);

  await model.parse(traceEvents);
  const data = model.traceParsedData(0);
  console.log('final data', data);
};

self.postMessage('workerReady');
