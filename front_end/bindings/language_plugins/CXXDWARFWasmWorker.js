// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const Module = {};
onmessage = e => postMessage({error: 'Worker still loading.'});

Module['onRuntimeInitialized'] = function() {
  console.error('Wasm Worker Initialized');

  const Plugin = new Module.DWARFSymbolsPlugin();
  postMessage('workerReady');
  onmessage = async function(e) {
    // FIXME check if initialized
    const {method, parameters} = e.data;
    console.error(`Calling method ${method}`);

    const {rawModuleId, symbols, rawModule} = parameters;
    // const moduleResponse = await fetch(rawModule.url, {mode: 'no-cors'});
    // const moduleContents = new Uint8Array(await moduleResponse.arrayBuffer());
    // console.log(moduleContents.length());
    const fileName = '/module.wasm';  // FIXME
    const data = new Uint8Array(rawModule.code);
    console.error(`Got ${data.length}B of data`);
    await FS.writeFile(fileName, data);
    console.error(`Writing temp module ${fileName}`);

    const apiModule = new Module.RawModule();
    apiModule.url = fileName;

    const sourcesVector = Plugin.AddRawModule(rawModuleId, symbols || '', apiModule);
    console.error(`Got result: ${sourcesVector.value.size()}`);
    const sources = [];
    for (let i = 0; i < sourcesVector.value.size(); ++i) {
      console.error('Got source: ' + sourcesVector.value.get(i));
      sources.push(sourcesVector.value.get(i));
    }

    postMessage({sources: sources});
  };
};


importScripts('./DWARFSymbolsPlugin.js');
