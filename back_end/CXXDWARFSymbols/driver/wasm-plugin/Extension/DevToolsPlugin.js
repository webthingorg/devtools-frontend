// console.log('Loaded content script');
// var port = chrome.runtime.connect({name: "knockknock"});
// port.onMessage.addListener(function(msg) {
//   console.log(`Received ${msg.question}`);
//     if (msg.question == "Who's there?")
//         port.postMessage({answer: "Madame"});
//     else if (msg.question == "Madame who?")
//         port.postMessage({answer: "Madame... Bovary"});
// });
// port.postMessage({joke: "Knock knock"});

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
    //console.error(`Received message ${JSON.stringify(message)}`);
    const callback = this._callbacks.get(message.requestId);
    this._callbacks.delete(message.requestId);
    callback(message.value);
  }

  _call(method, parameters) {
    return new Promise(resolve => {
      const requestId = this._nextRequestId++;
      this._callbacks.set(requestId, resolve);
      const request = {method, requestId, parameters};
      //console.error(`Sending postMessage(${JSON.stringify(request)})`);
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

chrome.devtools.panels.sources.registerLanguagePluginExtension(new Plugin());
