// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {ls} from '../platform/platform.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';

import type * as Profiler from '../profiler/profiler.js';

// eslint-disable-next-line rulesdir/es_modules_import
import type * as Timeline from './timeline.js';

let loadedTimelineModule: (typeof Timeline|undefined);

let loadedProfilerModule: (typeof Profiler|undefined);

async function loadTimelineModule(): Promise<typeof Timeline> {
  if (!loadedTimelineModule) {
    // Side-effect import resources in module.json
    await Root.Runtime.Runtime.instance().loadModulePromise('timeline');
    loadedTimelineModule = await import('./timeline.js');
  }
  return loadedTimelineModule;
}

async function loadProfilerModule(): Promise<typeof Profiler> {
  if (!loadedProfilerModule) {
    // Side-effect import resources in module.json
    await Root.Runtime.Runtime.instance().loadModulePromise('profiler');
    loadedProfilerModule = await import('../profiler/profiler.js');
  }
  return loadedProfilerModule;
}

UI.ViewManager.registerViewExtension({
  location: UI.ViewManager.ViewLocationValues.PANEL,
  id: 'timeline',
  title: ls`Performance`,
  commandPrompt: 'Show Performance',
  order: 50,
  async loadView() {
    const Timeline = await loadTimelineModule();
    return Timeline.TimelinePanel.TimelinePanel.instance();
  },
});

UI.ViewManager.registerViewExtension({
  location: UI.ViewManager.ViewLocationValues.PANEL,
  id: 'js_profiler',
  title: ls`JavaScript Profiler`,
  commandPrompt: 'Show JavaScript Profiler',
  persistence: UI.ViewManager.ViewPersistence.CLOSEABLE,
  order: 65,
  async loadView() {
    const Profiler = await loadProfilerModule();
    return Profiler.ProfilesPanel.JSProfilerPanel.instance();
  },
});
