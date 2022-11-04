// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as UI from '../../ui/legacy/legacy.js';

import type * as ConsoleCounters from './console_counters.js';

function loadConsoleCountersModule(): Promise<typeof ConsoleCounters> {
  return import('./console_counters.js');
}

UI.Toolbar.registerToolbarItem({
  async loadItem() {
    const ConsoleCounters = await loadConsoleCountersModule();
    return ConsoleCounters.WarningErrorCounter.WarningErrorCounter.instance();
  },
  order: 1,
  location: UI.Toolbar.ToolbarItemLocation.MAIN_TOOLBAR_RIGHT,
  showLabel: undefined,
  condition: undefined,
  separator: undefined,
  actionId: undefined,
});
