// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as PerfUI from '../../../legacy/components/perf_ui/perf_ui.js';

const breadcrumbsUI = new PerfUI.BreadcrumbsUI.BreadcrumbsUI();
document.getElementById('container')?.appendChild(breadcrumbsUI);

breadcrumbsUI.data = {

};
