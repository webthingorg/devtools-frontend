// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../front_end/common/common.js';
import * as SDK from '../../front_end/sdk/sdk.js';

let sourceUrlInstance: SourceURLResolver;

/** */
export class SourceURLResolver {
  private scriptIdToUpdateFunction:
      Map<{scriptId: string, model: SDK.RuntimeModel.RuntimeModel}, Array<(x: string) => void>>;
  /**
   * @private
   * @param {!SDK.DebuggerModel.DebuggerModel} debuggerModel
   */
  constructor() {
    SDK.SDKModel.TargetManager.instance().addModelListener(
        SDK.DebuggerModel.DebuggerModel, SDK.DebuggerModel.Events.ParsedScriptSource, this.onScriptParse, this);

    /** @type {!Map<string, !Array<!function>>} */
    this.scriptIdToUpdateFunction = new Map();
  }

  static instance() {
    if (sourceUrlInstance) {
      return sourceUrlInstance;
    }
    return new SourceURLResolver();
  }

  registerItem(model: SDK.RuntimeModel.RuntimeModel, scriptId: string, callback: (x: string) => void) {
    let functions = this.scriptIdToUpdateFunction.get({scriptId, model});
    if (!functions) {
      functions = [];
    }
    functions.push(callback);
  }

  async onScriptParse(event: Common.EventTarget.EventTargetEvent) {
    const script = (event.data) as SDK.Script.Script;
    if (!script.sourceURL) {
      return;
    }
    const scriptId = script.scriptId;
    const model = script.debuggerModel.runtimeModel();
    const key = {scriptId, model};
    const functions = this.scriptIdToUpdateFunction.get(key);
    if (!functions) {
      return;
    }

    functions.map(f => f(script.sourceURL));
    this.scriptIdToUpdateFunction.delete(key);
  }
}
