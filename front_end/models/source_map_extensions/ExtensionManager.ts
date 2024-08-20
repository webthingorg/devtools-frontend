// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {type Chrome} from '../../../extension-api/ExtensionAPI.js';
import * as Common from '../../core/common/common.js';
import {FunctionNameGuesserPluginManager} from '../extensions/extensions.js';

let instance: ExtensionManager|null = null;

export interface ExtensionPlugin {
  getName(): string;
  getCapabilities(): string[];
  getFunctionRanges(fileName: string, sourceContent: string): Promise<Chrome.DevTools.FunctionDescriptor[]>;
}

export class ExtensionManager extends Common.ObjectWrapper.ObjectWrapper<EventTypes> {
  static instance(): ExtensionManager {
    if (!instance) {
      instance = new ExtensionManager();
    }
    return instance;
  }

  constructor() {
    super();
    this.attach();
  }

  attach(): void {
    const pluginManager = FunctionNameGuesserPluginManager.FunctionNameGuesserPluginManager.instance();
    pluginManager.addEventListener(FunctionNameGuesserPluginManager.Events.PluginAdded, this.handlePlugin);
    pluginManager.addEventListener(FunctionNameGuesserPluginManager.Events.PluginRemoved, this.handlePlugin);
  }

  detach(): void {
    const pluginManager = FunctionNameGuesserPluginManager.FunctionNameGuesserPluginManager.instance();
    pluginManager.removeEventListener(FunctionNameGuesserPluginManager.Events.PluginAdded, this.handlePlugin);
    pluginManager.removeEventListener(FunctionNameGuesserPluginManager.Events.PluginRemoved, this.handlePlugin);
  }

  handlePlugin(): void {
    this.dispatchEventToListeners(Events.ExtensionsUpdated, this.extensions());
  }

  extensions(): ExtensionPlugin[] {
    return FunctionNameGuesserPluginManager.FunctionNameGuesserPluginManager.instance().plugins();
  }

  findFunctionParserExtensionsForFile(sourceUrl: string): ExtensionPlugin[] {
    const byCapabilities = (extension: ExtensionPlugin): boolean => {
      const supportedTypes = extension.getCapabilities();  // e.g. .js, .jsx etc
      for (const fileType of supportedTypes) {
        if (fileType && sourceUrl?.endsWith(fileType)) {
          return true;
        }
      }
      return false;
    };
    return this.extensions().filter(byCapabilities);
  }
}

export const enum Events {
  ExtensionsUpdated = 'extensionsUpdated',
}

export type EventTypes = {
  [Events.ExtensionsUpdated]: ExtensionPlugin[],
};
