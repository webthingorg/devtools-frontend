// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {ls} from '../platform/platform.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';

// eslint-disable-next-line rulesdir/es_modules_import
import type * as Lighthouse from './lighthouse.js';

let loadedLighthouseModule: (typeof Lighthouse|undefined);

async function loadLighthouseModule(): Promise<typeof Lighthouse> {
  if (!loadedLighthouseModule) {
    // Side-effect import resources in module.json
    await Root.Runtime.Runtime.instance().loadModulePromise('lighthouse');
    loadedLighthouseModule = await import('./lighthouse.js');
  }
  return loadedLighthouseModule;
}

UI.ViewManager.registerViewExtension({
  location: UI.ViewManager.ViewLocationValues.PANEL,
  id: 'lighthouse',
  title: ls`Lighthouse`,
  commandPrompt: 'Show Lighthouse',
  order: 90,
  async loadView() {
    const Lighthouse = await loadLighthouseModule();
    return Lighthouse.LighthousePanel.LighthousePanel.instance();
  },
  tags: [ls`lighthouse`, ls`pwa`],
});
