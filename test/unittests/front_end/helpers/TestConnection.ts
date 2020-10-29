// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../../front_end/common/common.js';
import {ProtocolMapping} from '../../../../front_end/generated/protocol-mapping.js';
import * as ProtocolClient from '../../../../front_end/protocol_client/protocol_client.js';
import * as Root from '../../../../front_end/root/root.js';
import * as SDK from '../../../../front_end/sdk/sdk.js';

type ProtocolCommand = keyof ProtocolMapping.Commands;
type MessageCallback = (val: string|Object) => void;

let targetManager: SDK.SDKModel.TargetManager;
export function createTarget({id = 'test', name = 'test', type = SDK.SDKModel.Type.Node} = {}) {
  if (!targetManager) {
    throw new Error('Please call enable before creating a target');
  }
  return targetManager.createTarget(id, name, type, null);
}

const responseMap = new Map<ProtocolCommand, Function>();
export function setResponseHandler(command: ProtocolCommand, handler: Function) {
  if (responseMap.get(command)) {
    throw new Error(`Response handler already set for ${command}`);
  }

  responseMap.set(command, handler);
}

export function getResponseHandler(method: ProtocolCommand) {
  return responseMap.get(method);
}

export function clearResponseHandler(method: ProtocolCommand) {
  responseMap.delete(method);
}

export function enable({reset = true} = {}) {
  if (reset) {
    responseMap.clear();
  }

  // The DevTools frontend code expects certain things to be in place
  // before it can run. This function will ensure those things are
  // minimally there.
  initializeGlobalVars();

  let messageCallback: MessageCallback;
  ProtocolClient.InspectorBackend.Connection.setFactory(() => {
    return {
      setOnMessage(callback: MessageCallback) {
        messageCallback = callback;
      },

      sendRawMessage(message: string) {
        const outgoingMessage = JSON.parse(message);
        const handler = responseMap.get(outgoingMessage.method);
        if (!handler) {
          return;
        }

        const result = handler.call(undefined);
        messageCallback.call(undefined, {id: outgoingMessage.id, method: outgoingMessage.method, result});
      },

      async disconnect() {
        // Included only to meet interface requirements.
      },

      _onMessage() {
        // Included only to meet interface requirements.
      },

      setOnDisconnect() {
        // Included only to meet interface requirements.
      },
    };
  });
}

function initializeGlobalVars() {
  // SDK.ResourceTree model has to exist to avoid a circular dependency, thus it
  // needs to be placed on the global if it is not already there.
  const globalObject = (globalThis as unknown as {SDK: {ResourceTreeModel: SDK.ResourceTreeModel.ResourceTreeModel}});
  globalObject.SDK = globalObject.SDK || {};
  globalObject.SDK.ResourceTreeModel = globalObject.SDK.ResourceTreeModel || SDK.ResourceTreeModel.ResourceTreeModel;

  // Create the target manager.
  targetManager = SDK.SDKModel.TargetManager.instance({forceNew: true});

  // Create the appropriate settings needed to boot.
  const settingValues = [
    {
      'category': 'Console',
      'settingName': 'customFormatters',
      'defaultValue': 'false',
    },
    {
      'category': 'Debugger',
      'settingName': 'pauseOnCaughtException',
      'defaultValue': 'false',
    },
    {
      'category': 'Debugger',
      'settingName': 'pauseOnExceptionEnabled',
      'defaultValue': 'false',
    },
    {
      'category': 'Debugger',
      'settingName': 'disableAsyncStackTraces',
      'defaultValue': 'false',
    },
    {
      'category': 'Debugger',
      'settingName': 'breakpointsActive',
      'defaultValue': 'true',
    },
    {
      'category': 'Sources',
      'settingName': 'jsSourceMapsEnabled',
      'defaultValue': 'true',
    },
  ];

  const extensions: Root.Runtime.RuntimeExtensionDescriptor[] = settingValues.map(setting => {
    return {...setting, type: 'setting', settingType: 'boolean'} as Root.Runtime.RuntimeExtensionDescriptor;
  });

  // Instantiate the runtime.
  Root.Runtime.Runtime.instance({
    forceNew: true,
    moduleDescriptors: [{
      name: 'Test',
      extensions,
      dependencies: [],
      modules: [],
      scripts: [],
      resources: [],
      condition: '',
      experiment: '',
    }],
  });

  // Instantiate the storage.
  const storageVals = new Map<string, string>();
  const storage = new Common.Settings.SettingsStorage(
      {}, (key, value) => storageVals.set(key, value), key => storageVals.delete(key), () => storageVals.clear(),
      'test');
  Common.Settings.Settings.instance({forceNew: true, globalStorage: storage, localStorage: storage});
}
