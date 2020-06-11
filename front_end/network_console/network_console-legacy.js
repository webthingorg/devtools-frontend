// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as NetworkConsoleModule from './network_console.js';

self.NetworkConsole = self.NetworkConsole || {};
NetworkConsole = NetworkConsole || {};

/**
 * @constructor;
 */
NetworkConsole.NetworkConsoleView = NetworkConsoleModule.NetworkConsoleView.NetworkConsoleView;

/**
 * @constructor
 */
NetworkConsole.NetworkContextMenuProvider = NetworkConsoleModule.NetworkConsoleView.NetworkContextMenuProvider;

/**
 * @constructor
 */
NetworkConsole.AttachToOpenAPIQuickOpen = NetworkConsoleModule.AttachToOpenAPIQuickOpen.AttachToOpenAPIQuickOpen;

/**
 * @constructor
 */
NetworkConsole.ActionDelegate = NetworkConsoleModule.NetworkConsoleView.ActionDelegate;

/**
 * @constructor
 */
NetworkConsole.CollectionsStorage = NetworkConsoleModule.CollectionsStorage.CollectionsStorage;

/**
 * @constructor
 */
NetworkConsole.SidebarPanel = NetworkConsoleModule.SidebarPanel.SidebarPanel;

/**
 * @constructor
 */
NetworkConsole.CollectionsPane = NetworkConsoleModule.CollectionsPane.CollectionsPane;

/**
 * @constructor
 */
NetworkConsole.CollectionsTreeElement = NetworkConsoleModule.NetworkConsoleSidebar.CollectionsTreeElement;
/**
 * @constructor
 */
NetworkConsole.EnvironmentRootElement = NetworkConsoleModule.NetworkConsoleSidebar.EnvironmentRootElement;
/**
 * @constructor
 */
NetworkConsole.EnvironmentElement = NetworkConsoleModule.NetworkConsoleSidebar.EnvironmentElement;

/**
 * @constructor
 */
NetworkConsole.TabbedPaneWithSharedView = NetworkConsoleModule.TabbedPaneWithSharedView.TabbedPaneWithSharedView;
