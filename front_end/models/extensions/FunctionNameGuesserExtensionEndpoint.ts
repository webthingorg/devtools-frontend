// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import {type Chrome} from '../../../extension-api/ExtensionAPI.js';

import {PrivateAPI} from './ExtensionAPI.js';
import {ExtensionEndpoint} from './ExtensionEndpoint.js';
import {FunctionNameGuesserPluginManager} from './FunctionNameGuesserPluginManager.js';

export class FunctionNameGuesserExtensionEndpoint extends ExtensionEndpoint {
  private readonly name: string;
  private readonly capabilities: string[];

  constructor(name: string, port: MessagePort, capabilities: string[]) {
    super(port);
    this.name = name;
    this.capabilities = capabilities;
  }

  getName(): string {
    return this.name;
  }

  getCapabilities(): string[] {
    return this.capabilities;
  }

  protected override handleEvent({event}: {event: string}): void {
    switch (event) {
      case PrivateAPI.FunctionNameGuesserExtensionPluginEvents.UnregisterFunctionNameGuesserExtensionPlugin: {
        this.disconnect();
        FunctionNameGuesserPluginManager.instance().removePlugin(this);
        break;
      }
      default:
        throw new Error(`Unrecognized FunctionName guesser extension endpoint event: ${event}`);
    }
  }

  getFunctionRanges(
      fileName: string, sourceContent: string, sourceMap: Chrome.DevTools.SourceMapEntry,
      unminificationMode?: Chrome.DevTools.UnminificationMode): Promise<Chrome.DevTools.FunctionDescriptor[]> {
    return this.sendRequest(
        PrivateAPI.FunctionNameGuesserExtensionPluginCommands.GetFunctionRanges,
        {fileName, sourceContent, sourceMap, unminificationMode});
  }
}
