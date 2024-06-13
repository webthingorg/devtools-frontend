// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import type * as Host from '../../core/host/host.js';
import type * as PerfUI from '../legacy/components/perf_ui/perf_ui.js';

export type Loggable = Element|Host.InspectorFrontendHostAPI.ContextMenuDescriptor|
                       Host.InspectorFrontendHostAPI.ContextMenuDescriptor[]|PerfUI.FlameChart.Group|{};
