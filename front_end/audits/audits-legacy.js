// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as AuditsModule from './audits.js';

self.Audits = self.Audits || {};
Audits = Audits || {};

/**
 * @constructor
 */
Audits.AuditsPanel = AuditsModule.AuditsPanel.AuditsPanel;

/**
 * @constructor
 */
Audits.ReportSelector = AuditsModule.AuditsReportSelector.ReportSelector;

/**
* @constructor
*/
Audits.StatusView = AuditsModule.AuditsStatusView.StatusView;
