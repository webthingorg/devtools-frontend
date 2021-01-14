// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {ls} from '../platform/platform.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';

// eslint-disable-next-line rulesdir/es_modules_import
import type * as Help from './help.js';

let loadedHelpModule: (typeof Help|undefined);

async function loadHelpModule(): Promise<typeof Help> {
  if (!loadedHelpModule) {
    // Side-effect import resources in module.json
    await Root.Runtime.Runtime.instance().loadModulePromise('help');
    loadedHelpModule = await import('./help.js');
  }
  return loadedHelpModule;
}

UI.ViewManager.registerViewExtension({
  location: UI.ViewManager.ViewLocationValues.DRAWER_VIEW,
  id: 'release-note',
  title: ls`What's New`,
  commandPrompt: 'Show What\'s New',
  persistence: UI.ViewManager.ViewPersistence.CLOSEABLE,
  order: 1,
  async loadView() {
    const Help = await loadHelpModule();
    return Help.ReleaseNoteView.ReleaseNoteView.instance();
  },
});
