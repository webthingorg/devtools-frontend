// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var Module = typeof Module !== 'undefined' ? Module : {};
var Plugin = null;

function stringify(errorCode) {
  switch (errorCode) {
    case Module.ErrorCode.SUCCESS:
      return 'success';
    case Module.ErrorCode.INTERNAL_ERROR:
      return 'internal_error';
    case Module.ErrorCode.NOT_FOUND:
      return 'not_found';
    case Module.Scope.GLOBAL:
      return 'GLOBAL';
    case Module.Scope.LOCAL:
      return 'LOCAL';
    case Module.Scope.PARAMETER:
      return 'PARAMETER';
  }
  return 'Unknown Error';
}


function callMethod(method, parameters) {
  if (!Plugin) {
    console.error(`Tried to call ${method} but the module isn't loaded yet`);
    return Promise.resolve(null);
  }
  switch (method) {
    case 'addRawModule': {
      const {rawModuleId, symbols, rawModule} = parameters;

      return getProtocolModule(rawModule).then(protocolModule => {
        const fileName = '/module.wasm';  // FIXME
        const data = new Uint8Array(protocolModule);
        FS.writeFile(fileName, data);
        const apiModule = new Module.RawModule();
        apiModule.url = fileName;

        const sourcesVector = Plugin.AddRawModule(rawModuleId, symbols || '', apiModule);
        const sources = [];
        for (let i = 0; i < sourcesVector.value.size(); ++i) {
          sources.push(sourcesVector.value.get(i));
        }

        return sources;
      });

      function getProtocolModule(rawModule) {
        if (!rawModule.code) {
          return fetch(rawModule.url).then(response => response.arrayBuffer());
        }
        return Promise.resolve(rawModule.code);
      }
    }
    case 'sourceLocationToRawLocation': {
      const {sourceLocation} = parameters;
      const apiSourceLocation = new Module.SourceLocation();
      apiSourceLocation.raw_module_id = sourceLocation.rawModuleId;
      apiSourceLocation.source_file = sourceLocation.sourceFile;
      apiSourceLocation.line_number = sourceLocation.lineNumber;
      apiSourceLocation.column_number = sourceLocation.columnNumber;
      const rawLocations = Plugin.SourceLocationToRawLocation(apiSourceLocation);
      if (rawLocations.error.code !== Module.ErrorCode.SUCCESS) {
        console.error(`Symbol server error ${stringify(rawLocations.error.code)}: ${rawLocations.error.message}`);
        return Promise.resolve([]);
      }
      const locations = [];
      for (let i = 0; i < rawLocations.value.size(); ++i) {
        locations.push(
            {rawModuleId: rawLocations.value.get(i).raw_module_id, codeOffset: rawLocations.value.get(i).code_offset});
      }
      return Promise.resolve(locations);
    }
    case 'rawLocationToSourceLocation': {
      const {rawLocation} = parameters;
      const apiRawLocation = new Module.RawLocation();
      apiRawLocation.raw_module_id = rawLocation.rawModuleId;
      apiRawLocation.code_offset = rawLocation.codeOffset;
      const sourceLocations = Plugin.RawLocationToSourceLocation(apiRawLocation);
      if (sourceLocations.error.code !== Module.ErrorCode.SUCCESS) {
        console.error(`Symbol server error ${stringify(sourceLocations.error.code)}: ${sourceLocations.error.message}`);
        return Promise.resolve([]);
      }
      const locations = [];
      for (let i = 0; i < sourceLocations.value.size(); ++i) {
        locations.push({
          rawModuleId: sourceLocations.value.get(i).raw_module_id,
          sourceFile: sourceLocations.value.get(i).source_file,
          lineNumber: sourceLocations.value.get(i).line_number,
          columnNumber: sourceLocations.value.get(i).column_number
        });
      }
      return Promise.resolve(locations);
    }
    case 'listVariablesInScope': {
      const {rawLocation} = parameters;
      const apiRawLocation = new Module.RawLocation();
      apiRawLocation.raw_module_id = rawLocation.rawModuleId;
      apiRawLocation.code_offset = rawLocation.codeOffset;
      const variables = Plugin.ListVariablesInScope(apiRawLocation);
      if (variables.error.code !== Module.ErrorCode.SUCCESS) {
        console.error(`Symbol server error ${stringify(variables.error.code)}: ${variables.error.message}`);
        return Promise.resolve([]);
      }
      const apiVariables = [];
      for (let i = 0; i < variables.value.size(); ++i) {
        apiVariables.push({
          scope: stringify(variables.value.get(i).scope),
          name: variables.value.get(i).name,
          type: variables.value.get(i).type
        });
      }
      return Promise.resolve(apiVariables);
    }
    case 'evaluateVariable': {
      const {name, location} = parameters;
      const apiRawLocation = new Module.RawLocation();
      apiRawLocation.raw_module_id = location.rawModuleId;
      apiRawLocation.code_offset = location.codeOffset;
      const evaluator = Plugin.EvaluateVariable(name, apiRawLocation);
      if (evaluator.error.code !== Module.ErrorCode.SUCCESS) {
        console.error(`Symbol server error ${stringify(evaluator.error.code)}: ${evaluator.error.message}`);
        return Promise.resolve([]);
      }
      return Promise.resolve({code: evaluator.value.code});
    }
  }

  return Promise.reject(new Error(`Unknown method ${method}`));
}

if (typeof chrome !== 'undefined') {
  chrome.runtime.onConnect.addListener(function(port) {
    if (port.name !== 'SymbolServer') {
      return;
    }
    port.onMessage.addListener(function(args) {
      const {method, requestId, parameters} = args;
      Promise.resolve(callMethod(method, parameters))
          .then(value => {
            const args = {requestId, value};
            port.postMessage(args);
          })
          .catch(error => {
            console.error(`Plugin failure: ${error} ${JSON.stringify(error)}`);
          });
    });
  });
}

const runtimeInitializedPromise = new Promise(resolved => {
  Module['onRuntimeInitialized'] = function() {
    Plugin = new Module.DWARFSymbolsPlugin();
    resolved(Module, Plugin);
  };
});
