// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';

async function loadElementsModule() {
  // Side-effect import resources in module.json
  await Root.Runtime.Runtime.instance().loadModulePromise('elements');

  return import('./elements.js');
}

UI.ViewManager.registerViewPanel({
  title: 'Elements',
  persistence: UI.ViewManager.ViewPersistence.PERMANENT,
  id: 'elements',
  hasToolbar: false,
  async loadView() {
    const Elements = await loadElementsModule();
    return Elements.ElementsPanel.ElementsPanel.instance();
  },
  location: UI.ViewManager.ViewLocationValues.PANEL,
  order: 10,
});
