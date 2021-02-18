// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as FrontendHelpers from '../../../test/unittests/front_end/helpers/EnvironmentHelpers.js';
import * as Resources from '../../resources/resources.js';

await FrontendHelpers.initializeGlobalVars();

const component = new Resources.FrameDetailsView.FrameDetailsReportView();

document.getElementById('container')?.appendChild(component);
