// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';

import {type SourceMapServerExtensionEndpoint} from './SourceMapServerExtensionEndpoint.js';

let instance: SourceMapServerPluginManager|null = null;

export class SourceMapServerPluginManager extends Common.ObjectWrapper.ObjectWrapper<EventTypes> {
  #plugins: Set<SourceMapServerExtensionEndpoint> = new Set();

  static instance(): SourceMapServerPluginManager {
    if (!instance) {
      instance = new SourceMapServerPluginManager();
    }
    return instance;
  }

  addPlugin(plugin: SourceMapServerExtensionEndpoint): void {
    this.#plugins.add(plugin);
    this.dispatchEventToListeners(Events.PluginAdded, plugin);
  }

  removePlugin(plugin: SourceMapServerExtensionEndpoint): void {
    this.#plugins.delete(plugin);
    this.dispatchEventToListeners(Events.PluginRemoved, plugin);
  }

  plugins(): SourceMapServerExtensionEndpoint[] {
    return Array.from(this.#plugins.values());
  }
}

export const enum Events {
  PluginAdded = 'pluginAdded',
  PluginRemoved = 'pluginRemoved',
}

export type EventTypes = {
  [Events.PluginAdded]: SourceMapServerExtensionEndpoint,
  [Events.PluginRemoved]: SourceMapServerExtensionEndpoint,
};
