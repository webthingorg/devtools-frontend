// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {ls} from '../platform/platform.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';

// eslint-disable-next-line rulesdir/es_modules_import
import type * as Elements from './elements.js';

let loadedElementsModule: (typeof Elements|undefined);

async function loadElementsModule() {
  if (!loadedElementsModule) {
    // Side-effect import resources in module.json
    await Root.Runtime.Runtime.instance().loadModulePromise('elements');
    loadedElementsModule = loadedElementsModule || await import('./elements.js');
  }
  return loadedElementsModule;
}

UI.ViewManager.registerViewExtension({
  location: UI.ViewManager.ViewLocationValues.PANEL,
  id: 'elements',
  title: ls`Elements`,
  order: 10,
  persistence: UI.ViewManager.ViewPersistence.PERMANENT,
  hasToolbar: false,
  async loadView() {
    const Elements = await loadElementsModule();
    return Elements.ElementsPanel.ElementsPanel.instance();
  },
  experiment: undefined,
  condition: undefined,
  settings: undefined,
  tags: undefined,
});

UI.ViewManager.registerViewExtension({
  location: UI.ViewManager.ViewLocationValues.ELEMENTS_SIDEBAR,
  id: 'elements.eventListeners',
  title: ls`Event Listeners`,
  order: 5,
  hasToolbar: true,
  persistence: UI.ViewManager.ViewPersistence.PERMANENT,
  async loadView() {
    const Elements = await loadElementsModule();
    return Elements.EventListenersWidget.EventListenersWidget.instance();
  },
  settings: undefined,
  experiment: undefined,
  condition: undefined,
  tags: undefined,
});

UI.ViewManager.registerViewExtension({
  location: UI.ViewManager.ViewLocationValues.ELEMENTS_SIDEBAR,
  id: 'elements.domProperties',
  title: ls`Properties`,
  order: 7,
  persistence: UI.ViewManager.ViewPersistence.PERMANENT,
  async loadView() {
    const Elements = await loadElementsModule();
    return Elements.PropertiesWidget.PropertiesWidget.instance();
  },
  settings: undefined,
  condition: undefined,
  tags: undefined,
  hasToolbar: undefined,
  experiment: undefined,
});

UI.ViewManager.registerViewExtension({
  experiment: Root.Runtime.ExperimentName.CAPTURE_NODE_CREATION_STACKS,
  location: UI.ViewManager.ViewLocationValues.ELEMENTS_SIDEBAR,
  id: 'elements.domCreation',
  title: ls`Stack Trace`,
  order: 10,
  persistence: UI.ViewManager.ViewPersistence.PERMANENT,
  async loadView() {
    const Elements = await loadElementsModule();
    return Elements.NodeStackTraceWidget.NodeStackTraceWidget.instance();
  },
  condition: undefined,
  settings: undefined,
  tags: undefined,
  hasToolbar: undefined,
});

UI.ViewManager.registerViewExtension({
  experiment: Root.Runtime.ExperimentName.CSS_GRID_FEATURES,
  location: UI.ViewManager.ViewLocationValues.ELEMENTS_SIDEBAR,
  id: 'elements.layout',
  title: ls`Layout`,
  order: 4,
  persistence: UI.ViewManager.ViewPersistence.PERMANENT,
  async loadView() {
    const Elements = await loadElementsModule();
    return Elements.LayoutSidebarPane.LayoutSidebarPane.instance();
  },
  condition: undefined,
  settings: undefined,
  tags: undefined,
  hasToolbar: undefined,
});

UI.ActionRegistration.registerActionExtension({
  actionId: 'elements.hide-element',
  category: UI.ActionRegistration.ActionCategory.ELEMENTS,
  title: ls`Hide element`,
  async loadActionDelegate() {
    const Elements = await loadElementsModule();
    return Elements.ElementsPanel.ElementsActionDelegate.instance();
  },
  contextTypes() {
    if (loadedElementsModule) {
      return [loadedElementsModule.ElementsPanel.ElementsPanel];
    }
    return [];
  },
  bindings: [
    {
      shortcut: 'H',
      platform: undefined,
      keybindSets: undefined,
    },
  ],
  iconClass: undefined,
  toggleWithRedColor: undefined,
  toggledIconClass: undefined,
  tags: undefined,
  toggleable: undefined,
  options: undefined,
  experiment: undefined,
  condition: undefined,
});

UI.ActionRegistration.registerActionExtension({
  actionId: 'elements.edit-as-html',
  category: UI.ActionRegistration.ActionCategory.ELEMENTS,
  title: ls`Edit as HTML`,
  async loadActionDelegate() {
    const Elements = await loadElementsModule();
    return Elements.ElementsPanel.ElementsActionDelegate.instance();
  },
  contextTypes() {
    if (loadedElementsModule) {
      return [loadedElementsModule.ElementsPanel.ElementsPanel];
    }
    return [];
  },
  bindings: [
    {
      shortcut: 'F2',
      platform: undefined,
      keybindSets: undefined,
    },
  ],
  iconClass: undefined,
  toggleWithRedColor: undefined,
  toggledIconClass: undefined,
  tags: undefined,
  toggleable: undefined,
  options: undefined,
  experiment: undefined,
  condition: undefined,
});

UI.ActionRegistration.registerActionExtension({
  actionId: 'elements.undo',
  category: UI.ActionRegistration.ActionCategory.ELEMENTS,
  title: ls`Undo`,
  async loadActionDelegate() {
    const Elements = await loadElementsModule();
    return Elements.ElementsPanel.ElementsActionDelegate.instance();
  },
  contextTypes() {
    if (loadedElementsModule) {
      return [loadedElementsModule.ElementsPanel.ElementsPanel];
    }
    return [];
  },
  bindings: [
    {
      shortcut: 'Ctrl+Z',
      platform: UI.ActionRegistration.Platform.WindowsLinux,
      keybindSets: undefined,
    },
    {
      shortcut: 'Meta+Z',
      platform: UI.ActionRegistration.Platform.Mac,
      keybindSets: undefined,
    },
  ],
  iconClass: undefined,
  toggleWithRedColor: undefined,
  toggledIconClass: undefined,
  tags: undefined,
  toggleable: undefined,
  options: undefined,
  experiment: undefined,
  condition: undefined,
});

UI.ActionRegistration.registerActionExtension({
  actionId: 'elements.redo',
  category: UI.ActionRegistration.ActionCategory.ELEMENTS,
  title: ls`Redo`,
  async loadActionDelegate() {
    const Elements = await loadElementsModule();
    return Elements.ElementsPanel.ElementsActionDelegate.instance();
  },
  contextTypes() {
    if (loadedElementsModule) {
      return [loadedElementsModule.ElementsPanel.ElementsPanel];
    }
    return [];
  },
  bindings: [
    {
      shortcut: 'Ctrl+Y',
      platform: UI.ActionRegistration.Platform.WindowsLinux,
      keybindSets: undefined,
    },
    {
      shortcut: 'Meta+Shift+Z',
      platform: UI.ActionRegistration.Platform.Mac,
      keybindSets: undefined,
    },
  ],
  iconClass: undefined,
  toggleWithRedColor: undefined,
  toggledIconClass: undefined,
  tags: undefined,
  toggleable: undefined,
  options: undefined,
  experiment: undefined,
  condition: undefined,
});

UI.ActionRegistration.registerActionExtension({
  actionId: 'elements.capture-area-screenshot',
  async loadActionDelegate() {
    const Elements = await loadElementsModule();
    return Elements.InspectElementModeController.ToggleSearchActionDelegate.instance();
  },
  condition: Root.Runtime.ConditionName.CAN_DOCK,
  title: ls`Capture area screenshot`,
  category: UI.ActionRegistration.ActionCategory.SCREENSHOT,
  bindings: undefined,
  iconClass: undefined,
  toggleWithRedColor: undefined,
  toggledIconClass: undefined,
  tags: undefined,
  toggleable: undefined,
  options: undefined,
  experiment: undefined,
  contextTypes: undefined,
});

UI.ActionRegistration.registerActionExtension({
  category: UI.ActionRegistration.ActionCategory.ELEMENTS,
  actionId: 'elements.toggle-element-search',
  toggleable: true,
  async loadActionDelegate() {
    const Elements = await loadElementsModule();
    return Elements.InspectElementModeController.ToggleSearchActionDelegate.instance();
  },
  title: ls`Select an element in the page to inspect it`,
  iconClass: UI.ActionRegistration.IconClass.LARGEICON_NODE_SEARCH,
  bindings: [
    {
      shortcut: 'Ctrl+Shift+C',
      platform: UI.ActionRegistration.Platform.WindowsLinux,
      keybindSets: undefined,
    },
    {
      shortcut: 'Meta+Shift+C',
      platform: UI.ActionRegistration.Platform.Mac,
      keybindSets: undefined,
    },
  ],
  toggleWithRedColor: undefined,
  toggledIconClass: undefined,
  tags: undefined,
  options: undefined,
  experiment: undefined,
  condition: undefined,
  contextTypes: undefined,
});
