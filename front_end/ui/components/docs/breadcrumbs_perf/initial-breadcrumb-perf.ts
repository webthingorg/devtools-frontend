// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Trace from '../../../../../front_end/models/trace/trace.js';
import * as Types from '../../../../../front_end/models/trace/types/types.js';
import * as Timeline from '../../../../../front_end/panels/timeline/timeline.js';
import * as TimelineComponents from '../../../../../front_end/panels/timeline/components/components.js';

const breadcrumbsUI = new TimelineComponents.BreadcrumbsUI.BreadcrumbsUI;
document.getElementById('container')?.appendChild(breadcrumbsUI);

const traceWindow: Trace.Types.Timing.TraceWindow = {
  min: Types.Timing.MicroSeconds(3),
  max: Types.Timing.MicroSeconds(9),
  range: Types.Timing.MicroSeconds(6),
};

const breadcrumb: Timeline.Breadcrumbs.Breadcrumb = {
  window: traceWindow,
  child: null,
};

breadcrumbsUI.data = {
  breadcrumb: breadcrumb,
};
