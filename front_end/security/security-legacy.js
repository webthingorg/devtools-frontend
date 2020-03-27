// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SecurityModule from './security.js';

self.Security = self.Security || {};
Security = Security || {};

/**
 * @constructor
 */
Security.SecurityModel = SecurityModule.SecurityModel.SecurityModel;

/** @enum {symbol} */
Security.SecurityModel.Events = SecurityModule.SecurityModel.Events;

/**
 * @constructor
 */
Security.PageVisibleSecurityState = SecurityModule.SecurityModel.PageVisibleSecurityState;

/**
 * @constructor
 */
Security.SecurityPanel = SecurityModule.SecurityPanel.SecurityPanel;

/**
 * @constructor
 */
Security.SecurityPanelSidebarTree = SecurityModule.SecurityPanel.SecurityPanelSidebarTree;

/** @enum {symbol} */
Security.SecurityPanelSidebarTree.OriginGroup = SecurityModule.SecurityPanel.OriginGroup;
