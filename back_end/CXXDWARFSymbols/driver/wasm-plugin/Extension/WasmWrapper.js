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

function nestNamespaces(variables) {
  let result = [];
  let namespaces = new Map();

  function findOrAddNamespace(scope, namespace) {
    if (!namespaces.has(scope)) {
      namespaces.set(scope, new Map());
    }
    let namespacesForScope = namespaces.get(scope);
    if (namespacesForScope.has(namespace)) {
      return namespacesForScope.get(namespace);
    } else {
      let namespaceVar = {scope, name: namespace, type: 'namespace', nestedVariables: []};
      namespacesForScope.set(namespace, namespaceVar);
      let parentNamespaceEnd = namespace.lastIndexOf('::');
      if (parentNamespaceEnd > 0) {
        findOrAddNamespace(scope, namespace.slice(0, parentNamespaceEnd)).nestedVariables.push(namespaceVar);
      } else {
        result.push(namespaceVar);
      }
      return namespaceVar;
    }
  }

  for (let variable of variables) {
    let namespaceEnd = variable.name.lastIndexOf('::');
    if (namespaceEnd > 0) {
      findOrAddNamespace(variable.scope, variable.name.slice(0, namespaceEnd)).nestedVariables.push(variable);
    } else {
      result.push(variable);
    }
  }

  return result;
}

async function callMethod(method, parameters) {
  if (!Plugin) {
    console.error(`Tried to call ${method} but the module isn't loaded yet`);
    return null;
  }
  switch (method) {
    case 'handleScript': {
      const {scriptId, isWasm, sourceURL, sourceMapURL, debugSymbols} = parameters;
      return isWasm &&                         // Only handle wasm scripts
          !sourceURL.startsWith('wasm://') &&  // Only handle scripts with valid response URL
          (sourceMapURL === 'wasm://dwarf' ||  // Only handle scripts with either embedded dwarf ...
           !sourceMapURL);                     // ... or no source map at all (look up symbols out of band).
    }
    case 'addRawModule': {
      const {rawModuleId, symbols, rawModule} = parameters;

      const protocolModule = await getProtocolModule(rawModule);

      const fileName = '/module.wasm';  // FIXME
      const data = new Uint8Array(protocolModule);
      await FS.writeFile(fileName, data);

      const apiModule = new Module.RawModule();
      apiModule.url = fileName;

      const sourcesVector = Plugin.AddRawModule(rawModuleId, symbols || '', apiModule);
      const sources = [];
      for (let i = 0; i < sourcesVector.value.size(); ++i) {
        sources.push(sourcesVector.value.get(i));
      }

      return sources;


      async function getProtocolModule(rawModule) {
        if (!rawModule.code) {
          const sourceMapURL = rawModule.url;
          const response = await fetch(sourceMapURL);

          return response.arrayBuffer();
        }

        return rawModule.code;
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
        return [];
      }
      const locations = [];
      for (let i = 0; i < rawLocations.value.size(); ++i) {
        locations.push(
            {rawModuleId: rawLocations.value.get(i).raw_module_id, codeOffset: rawLocations.value.get(i).code_offset});
      }
      return locations;
    }
    case 'rawLocationToSourceLocation': {
      const {rawLocation} = parameters;
      const apiRawLocation = new Module.RawLocation();
      apiRawLocation.raw_module_id = rawLocation.rawModuleId;
      apiRawLocation.code_offset = rawLocation.codeOffset;
      const sourceLocations = Plugin.RawLocationToSourceLocation(apiRawLocation);
      if (sourceLocations.error.code !== Module.ErrorCode.SUCCESS) {
        console.error(`Symbol server error ${stringify(sourceLocations.error.code)}: ${sourceLocations.error.message}`);
        return [];
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
      return locations;
    }
    case 'listVariablesInScope': {
      const {rawLocation} = parameters;
      const apiRawLocation = new Module.RawLocation();
      apiRawLocation.raw_module_id = rawLocation.rawModuleId;
      apiRawLocation.code_offset = rawLocation.codeOffset;
      const variables = Plugin.ListVariablesInScope(apiRawLocation);
      if (variables.error.code !== Module.ErrorCode.SUCCESS) {
        console.error(`Symbol server error ${stringify(variables.error.code)}: ${variables.error.message}`);
        return [];
      }
      const apiVariables = [];
      for (let i = 0; i < variables.value.size(); ++i) {
        apiVariables.push({
          scope: stringify(variables.value.get(i).scope),
          name: variables.value.get(i).name,
          type: variables.value.get(i).type
        });
      }
      return nestNamespaces(apiVariables);
    }
    case 'evaluateVariable': {
      const {name, location} = parameters;
      const apiRawLocation = new Module.RawLocation();
      apiRawLocation.raw_module_id = location.rawModuleId;
      apiRawLocation.code_offset = location.codeOffset;
      const evaluator = Plugin.EvaluateVariable(name, apiRawLocation);
      if (evaluator.error.code !== Module.ErrorCode.SUCCESS) {
        console.error(`Symbol server error ${stringify(evaluator.error.code)}: ${evaluator.error.message}`);
        return [];
      }
      return {code: evaluator.value.code};
    }
  }

  throw `Unknown method ${method}`;
}

if (typeof chrome !== 'undefined') {
  chrome.runtime.onConnect.addListener(function(port) {
    if (port.name !== 'SymbolServer') {
      return;
    }
    port.onMessage.addListener(function(args) {
      const {method, requestId, parameters} = args;
      callMethod(method, parameters)
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
