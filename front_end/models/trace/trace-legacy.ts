// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// @ts-nocheck

import * as TraceModule from './trace.js';

self.Trace = self.Trace || {};
Trace = Trace || {};

/** @constructor */
Trace.TracingManager = TraceModule.TracingManager.TracingManager;

/** @constructor */
Trace.TracingModel = TraceModule.Legacy.TracingModel;

/** @constructor */
Trace.TracingModel.Event = TraceModule.Legacy.Event;

Trace.TracingModel.LegacyTopLevelEventCategory = TraceModule.Legacy.LegacyTopLevelEventCategory;
Trace.TracingModel.DevToolsMetadataEventCategory = TraceModule.Legacy.DevToolsMetadataEventCategory;
