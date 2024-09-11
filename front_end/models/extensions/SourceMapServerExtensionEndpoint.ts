// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {PrivateAPI} from './ExtensionAPI.js';
import {ExtensionEndpoint} from './ExtensionEndpoint.js';
import {SourceMapServerPluginManager} from './SourceMapServerPluginManager.js';

export class SourceMapServerExtensionEndpoint extends ExtensionEndpoint {
  name: string;

  constructor(name: string, port: MessagePort) {
    super(port);
    this.name = name;
  }

  protected override handleEvent({event}: {event: string}): void {
    switch (event) {
      case PrivateAPI.SourceMapServerExtensionPluginEvents.UnregisteredSourceMapServerExtensionPlugin: {
        this.disconnect();
        SourceMapServerPluginManager.instance().removePlugin(this);
        break;
      }
      default:
        throw new Error(`Unrecognized Source map server extension endpoint event: ${event}`);
    }
  }
}
