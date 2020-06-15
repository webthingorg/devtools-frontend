// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

class Plugin {
  constructor() {
    this._nextRequestId = 0;
    this._callbacks = new Map();
    this._port = null;
    this._connect();
  }

  _connect() {
    this._port = chrome.runtime.connect({name: 'SymbolServer'});
    this._port.onDisconnect.addListener(() => {
      console.error('Disconnected');
      const error = chrome.runtime.lastError;
      if (error) {
        throw error;
      }
      this._connect();
    });
    this._port.onMessage.addListener(this._onMessage.bind(this));
  }

  _onMessage(message) {
    if (!this._callbacks.has(message.requestId)) {
      throw `No pending request ${message.requestId}`;
    }
    const callback = this._callbacks.get(message.requestId);
    this._callbacks.delete(message.requestId);
    callback(message.value);
  }

  _call(method, parameters) {
    return new Promise(resolve => {
      const requestId = this._nextRequestId++;
      this._callbacks.set(requestId, resolve);
      const request = {method, requestId, parameters};
      this._port.postMessage(request);
    });
  }

  id() {
    return 'TestPlugin';
  }

  handleScript(scriptId, isWasm, sourceURL, sourceMapURL, debugSymbols) {
    return this._call('handleScript', {scriptId, isWasm, sourceURL, sourceMapURL, debugSymbols});
  }

  addRawModule(rawModuleId, symbols, rawModule) {
    return this._call('addRawModule', {rawModuleId, symbols, rawModule});
  }

  sourceLocationToRawLocation(sourceLocation) {
    return this._call('sourceLocationToRawLocation', {sourceLocation});
  }

  rawLocationToSourceLocation(rawLocation) {
    return this._call('rawLocationToSourceLocation', {rawLocation});
  }

  listVariablesInScope(rawLocation) {
    return this._call('listVariablesInScope', {rawLocation});
  }

  evaluateVariable(name, location) {
    return this._call('evaluateVariable', {name, location});
  }
}

chrome.experimental.devtools.languageServices.registerLanguagePluginExtension(new Plugin());
