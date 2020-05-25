// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../../sdk/sdk.js';
import {DebuggerLanguagePlugin, DebuggerLanguagePluginError, RawLocation, RawModule, SourceLocation, Variable, VariableValue} from '../DebuggerLanguagePlugins.js';  // eslint-disable-line no-unused-vars


/**
 * @typedef {{
 *            sources:!Array<string>
 *          }}
 */
let AddRawModuleResponse;  // eslint-disable-line no-unused-vars
/**
 * @typedef {{
 *            rawLocation:!Array<!RawLocation>
 *          }}
 */
let SourceLocationToRawLocationResponse;  // eslint-disable-line no-unused-vars
/**
 * @typedef {{
 *            sourceLocation:!Array<!SourceLocation>
 *          }}
 */
let RawLocationToSourceLocationResponse;  // eslint-disable-line no-unused-vars
/**
 * @typedef {{
 *            variable:!Array<!Variable>
 *          }}
 */
let ListVariablesInScopeResponse;  // eslint-disable-line no-unused-vars
/**
 * @typedef {{
 *            value:!RawModule
 *          }}
 */
let EvaluateVariableResponse;  // eslint-disable-line no-unused-vars

/**
 * @implements {DebuggerLanguagePlugin}
 */
export class CXXDWARFWasmPlugin {
  constructor() {
    this._worker = null;
  }

  async _loadWorker() {
    if (!this._worker) {
      this._worker = await new Promise(fulfill => {
        const worker = new Worker('./bindings/language_plugins/CXXDWARFWasmWorker.js');
        worker.onmessage = event => {
          console.assert(event.data === 'workerReady');
          worker.onmessage = null;
          fulfill(worker);
        };
      });
    }
    return this._worker;
  }


  /**
   * @param {string} method
   * @param {!Object} parameters
   * @return {!Promise<!AddRawModuleResponse|!SourceLocationToRawLocationResponse|!RawLocationToSourceLocationResponse|!ListVariablesInScopeResponse|!EvaluateVariableResponse>}
   */
  async _sendRPC(method, parameters) {
    const worker = await this._loadWorker();
    console.error(`Sending method ${method}`);
    const response = new Promise((resolve, reject) => {
      worker.onmessage = e => {
        console.error(`Result: ${JSON.stringify(e.data)}`);
        resolve(e.data);
      };
    });
    worker.postMessage({method, parameters});
    return await response;
  }

  /**
   * @override
   * @param {!SDK.Script.Script} script
   * @return {boolean} True if this plugin should handle this script
   */
  handleScript(script) {
    return script.isWasm() &&                       // Only handle wasm scripts
        !script.sourceURL.startsWith('wasm://') &&  // Only handle scripts with valid response URL
        (script.sourceMapURL === 'wasm://dwarf' ||  // Only handle scripts with either embedded dwarf ...
         !script.sourceMapURL);                     // ... or no source map at all (look up symbols out of band).
  }

  /** Notify the plugin about a new script
   * @override
   * @param {string} rawModuleId
   * @param {string} symbols
   * @param {!RawModule} rawModule
   * @return {!Promise<!Array<string>>}
   * @throws {DebuggerLanguagePluginError}
  */
  async addRawModule(rawModuleId, symbols, rawModule) {
    return (await this._sendRPC(
                'addRawModule',
                {rawModuleId: rawModuleId, symbols: symbols, rawModule: await getProtocolModule(rawModule)}))
        .sources;

    async function getProtocolModule(rawModule) {
      if (!rawModule.code) {
        const sourceMapURL = rawModule.url;
        const arrayBuffer = await self.runtime.loadBinaryResourcePromise(sourceMapURL, true);

        console.error(arrayBuffer);
        return {code: arrayBuffer};
      }

      return {code: rawModule.code};
    }
  }

  /** Find locations in raw modules from a location in a source file
   * @override
   * @param {!SourceLocation} sourceLocation
   * @return {!Promise<!Array<!RawLocation>>}
   * @throws {DebuggerLanguagePluginError}
  */
  async sourceLocationToRawLocation(sourceLocation) {
    return [];
    // return (await _sendRPC('sourceLocationToRawLocation', sourceLocation)).rawLocation;
  }

  /** Find locations in source files from a location in a raw module
   * @override
   * @param {!RawLocation} rawLocation
   * @return {!Promise<!Array<!SourceLocation>>}
   * @throws {DebuggerLanguagePluginError}
  */
  async rawLocationToSourceLocation(rawLocation) {
    return [];  // (await _sendRPC('rawLocationToSourceLocation', rawLocation)).sourceLocation;
  }

  /** List all variables in lexical scope at a given location in a raw module
   * @override
   * @param {!RawLocation} rawLocation
   * @return {!Promise<!Array<!Variable>>}
   * @throws {DebuggerLanguagePluginError}
  */
  async listVariablesInScope(rawLocation) {
    return [];  // (await _sendRPC('listVariablesInScope', rawLocation)).variable;
  }

  /** Evaluate the content of a variable in a given lexical scope
   * @override
   * @param {string} name
   * @param {!RawLocation} location
   * @return {!Promise<?RawModule>}
   * @throws {DebuggerLanguagePluginError}
  */
  async evaluateVariable(name, location) {
    return [];  // (await _sendRPC('evaluateVariable', {name: name, location: location})).value;
  }

  /**
   * @override
   */
  dispose() {
    if (this._worker) {
      this._worker.terminate();
    }
  }

  /** Get the representation when value contains a string
   * @param {!VariableValue} value
   */
  _reprString(value) {
    return value.value;
  }

  /** Get the representation when value contains a number
   * @param {!VariableValue} value
   */
  _reprNumber(value) {
    return Number(value.value);
  }

  /** Get the representation when value is a compound value
   * @param {!VariableValue} value
   */
  _reprCompound(value) {
    const result = {};
    for (const property of value.value) {
      result[property.name] = this._repr(property);
    }
    return result;
  }

  /** Get the representation when value contains an array of values
   * @param {!VariableValue} value
   */
  _reprArray(value) {
    if (value.value.length > 0 && value.value[0].name && value.value[0].name.endsWith(']')) {
      return value.value.map(v => this._repr(v));
    }
    return this._reprCompound(value);
  }

  /** Get the representation for a variable value
   * @param {!VariableValue} value
   */
  _repr(value) {
    if (Array.isArray(value.value)) {
      return this._reprArray(value);
    }
    console.error(`repr for ${value.type}`);
    switch (value.type) {
      case 'int':
        return this._reprNumber(value);
    }
    return this._reprString(value);
  }

  /** Produce a language specific representation of a variable value
   * @override
   * @param {!VariableValue} value
   * @return {!Promise<!SDK.RemoteObject.RemoteObject>}
   */
  async getRepresentation(value) {
    return new SDK.RemoteObject.LocalObject(this._repr(value));
  }
}
