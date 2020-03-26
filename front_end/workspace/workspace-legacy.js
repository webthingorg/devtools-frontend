// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as WorkspaceModule from './workspace.js';

self.Workspace = self.Workspace || {};
Workspace = Workspace || {};

/** @constructor */
Workspace.UISourceCode = WorkspaceModule.UISourceCode.UISourceCode;

/** @constructor */
Workspace.UILocation = WorkspaceModule.UISourceCode.UILocation;

/**
 * @type {?WorkspaceModule.FileManager.FileManager}
 */
self.Workspace.fileManager;

/**
 * @type {!WorkspaceModule.Workspace.WorkspaceImpl}
 */
self.Workspace.workspace;
