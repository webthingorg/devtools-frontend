// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';

import {type FunctionNameGuesserExtensionEndpoint} from './FunctionNameGuesserExtensionEndpoint.js';

let instance: FunctionNameGuesserPluginManager|null = null;

export class FunctionNameGuesserPluginManager extends Common.ObjectWrapper.ObjectWrapper<EventTypes> {
  #plugins: Set<FunctionNameGuesserExtensionEndpoint> = new Set();

  static instance(): FunctionNameGuesserPluginManager {
    if (!instance) {
      instance = new FunctionNameGuesserPluginManager();
    }
    return instance;
  }

  addPlugin(plugin: FunctionNameGuesserExtensionEndpoint): void {
    this.#plugins.add(plugin);
    this.dispatchEventToListeners(Events.PluginAdded, plugin);
  }

  removePlugin(plugin: FunctionNameGuesserExtensionEndpoint): void {
    this.#plugins.delete(plugin);
    this.dispatchEventToListeners(Events.PluginRemoved, plugin);
  }

  plugins(): FunctionNameGuesserExtensionEndpoint[] {
    return Array.from(this.#plugins.values());
  }
}

export const enum Events {
  PluginAdded = 'pluginAdded',
  PluginRemoved = 'pluginRemoved',
}

export type EventTypes = {
  [Events.PluginAdded]: FunctionNameGuesserExtensionEndpoint,
  [Events.PluginRemoved]: FunctionNameGuesserExtensionEndpoint,
};
