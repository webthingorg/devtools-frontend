// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as QuickOpen from '../quick_open/quick_open.js';
import {NetworkConsoleSidebar} from './network-console-sidebar.js';  // eslint-disable-line no-unused-vars
import {NetworkConsoleView} from './network-console-view.js';

export class AttachToOpenAPIQuickOpen extends QuickOpen.FilteredListWidget.Provider {
  /**
   * @override
   * @param {?number} _itemIndex
   * @param {string} promptValue
   */
  selectItem(_itemIndex, promptValue) {
    const sidebar = this._currentNetworkConsoleSidebar();
    if (!sidebar) {
      return;
    }

    sidebar.connectToOpenApi(promptValue);
  }

  /**
   * @override
   * @param {string} _query
   * @return {string}
   */
  notFoundText(_query) {
    return ls`Enter the URL of a Swagger or OpenAPI document to load.`;
  }

  /**
   * @return {!NetworkConsoleSidebar|null}
   */
  _currentNetworkConsoleSidebar() {
    const ncView = /** @type {!NetworkConsoleView} */ (self.runtime.sharedInstance(NetworkConsoleView));
    if (!ncView) {
      return null;
    }

    return ncView.sidebar();
  }
}
