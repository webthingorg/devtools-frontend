// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type {RecorderExtensionEndpoint} from './RecorderExtensionEndpoint.js';

let instance: RecorderPluginManager|null = null;

export class RecorderPluginManager {
  #plugins: RecorderExtensionEndpoint[] = [];

  static instance(): RecorderPluginManager {
    if (!instance) {
      instance = new RecorderPluginManager();
    }
    return instance;
  }

  addPlugin(plugin: RecorderExtensionEndpoint): void {
    this.#plugins.push(plugin);
  }

  removePlugin(plugin: RecorderExtensionEndpoint): void {
    this.#plugins = this.#plugins.filter(p => p !== plugin);
  }

  plugins(): RecorderExtensionEndpoint[] {
    return this.#plugins;
  }
}
