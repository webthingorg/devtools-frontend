// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {ls} from '../platform/platform.js';
import * as UI from '../ui/ui.js';

// eslint-disable-next-line rulesdir/es_modules_import
import type {DevicesView} from './DevicesView.js';

let loadedDevicesView: (typeof DevicesView|undefined);

async function loadDevicesModule(): Promise<typeof DevicesView> {
  if (!loadedDevicesView) {
    loadedDevicesView = (await import('./DevicesView.js')).DevicesView;
  }
  return loadedDevicesView;
}

UI.ViewManager.registerViewExtension({
  location: UI.ViewManager.ViewLocationValues.DRAWER_VIEW,
  id: 'remote-devices',
  commandPrompt: 'Show Remote devices',
  title: ls`Remote devices`,
  persistence: UI.ViewManager.ViewPersistence.CLOSEABLE,
  order: 50,
  async loadView() {
    const DevicesView = await loadDevicesModule();
    return DevicesView.instance();
  },
});
