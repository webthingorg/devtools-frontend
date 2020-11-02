// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../sdk/sdk.js';
import * as puppeteer from '../third_party/puppeteer/puppeteer.js';
import * as UI from '../ui/ui.js';
import * as Workspace from '../workspace/workspace.js';  // eslint-disable-line no-unused-vars

/**
 * @enum {symbol}
 */
const RecorderState = {
  Recording: Symbol('Recording'),
  Running: Symbol('Running'),
  Idle: Symbol('Idle'),
};

class Transport {
  /**
   *
   * @param {!SDK.Connections.ParallelConnection} connection
   */
  constructor(connection) {
    this._connection = connection;
    this._knownIds = new Set();
    this._knownTargets = new Set();
  }

  /**
   *
   * @param {string} string
   */
  send(string) {
    const message = JSON.parse(string);
    this._knownIds.add(message.id);
    this._connection.sendRawMessage(string);
  }

  close() {
    this._connection.disconnect();
  }

  /**
   * @param {function(string):void} cb
   */
  set onmessage(cb) {
    this._connection.setOnMessage(message => {
      const data = /** @type {{id: number, method: string, params: *, sessionId: (string|undefined)}} */ (message);
      if (data.id && !this._knownIds.has(data.id)) {
        return;
      }
      this._knownIds.delete(data.id);

      if (data.method === 'Target.targetCreated') {
        this._knownTargets.add(data.params.targetInfo.targetId);
      } else if (data.method === 'Target.targetInfoChanged') {
        if (!this._knownTargets.has(data.params.targetId)) {
          // This target is not known to puppeteer - skip passing information
          return;
        }
      } else if (data.method === 'Target.targetDestroyed') {
        if (!this._knownTargets.has(data.params.targetId)) {
          // This target is not known to puppeteer - skip passing information
          return;
        }
        this._knownTargets.delete(data.params.targetId);
      }
      if (!data.sessionId) {
        return;
      }
      if (data.sessionId === this._connection.sessionId()) {
        delete data.sessionId;
      }
      cb(JSON.stringify(data));
    });
  }

  /**
   * @param {function():void} cb
   */
  set onclose(cb) {
    const prev = this._connection.getOnDisconnectHandler();
    this._connection.setOnDisconnect(reason => {
      if (prev) {
        prev(reason);
      }
      cb();
    });
  }
}

class Step {
  /**
   *
   * @param {string} action
   */
  constructor(action) {
    this.action = action;
  }

  /**
   * @override
   */
  toJSON() {
    return {
      action: this.action,
    };
  }
}

class ClickStep extends Step {
  /**
   *
   * @param {string} selector
   */
  constructor(selector) {
    super('click');
    this.selector = selector;
  }

  /**
   * @override
   */
  toJSON() {
    return {
      ...super.toJSON(),
      selector: this.selector,
    };
  }
}

class NavigationStep extends Step {
  /**
   *
   * @param {string} url
   */
  constructor(url) {
    super('navigate');
    this.url = url;
  }

  /**
   * @override
   */
  toJSON() {
    return {
      ...super.toJSON(),
      url: this.url,
    };
  }
}

/**
 * @implements {ProtocolProxyApi.DebuggerDispatcher}
 */
export class RecorderModel extends SDK.SDKModel.SDKModel {
  /**
  * @param {!SDK.SDKModel.Target} target
  */
  constructor(target) {
    super(target);
    /** @type  {?Workspace.UISourceCode.UISourceCode} */
    this._currentUiSourceCode = null;
    this._debuggerAgent = target.debuggerAgent();
    this._domDebuggerAgent = target.domdebuggerAgent();
    this._runtimeAgent = target.runtimeAgent();
    this._accessibilityAgent = target.accessibilityAgent();
    target.registerDebuggerDispatcher(this);

    /** @type {!UI.Action.Action}*/
    this._toggleRecordAction = /** @type {!UI.Action.Action}*/ (
        UI.ActionRegistry.ActionRegistry.instance().action('recorder.toggle-recording'));
    /** @type {!UI.Action.Action}*/
    this._runAction =
        /** @type {!UI.Action.Action}*/ (UI.ActionRegistry.ActionRegistry.instance().action('recorder.run'));

    this._state = RecorderState.Idle;
  }

  /**
   *
   * @param {!RecorderState} newState
   */
  async updateState(newState) {
    this._state = newState;
    this._toggleRecordAction.setToggled(this._state === RecorderState.Recording);
    this._toggleRecordAction.setEnabled(this._state !== RecorderState.Running);
    this._runAction.setEnabled(this._state !== RecorderState.Recording);
  }

  /**
   * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
   */
  async toggleRecording(uiSourceCode) {
    if (this._state === RecorderState.Idle) {
      await this.updateState(RecorderState.Recording);
      await this.startRecording(uiSourceCode);
    } else if (this._state === RecorderState.Recording) {
      await this.updateState(RecorderState.Idle);
      await this.stopRecording();
    }
  }

  /**
   * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
   */
  async startRecording(uiSourceCode) {
    this._currentUiSourceCode = uiSourceCode;

    await this._debuggerAgent.invoke_enable({});
    await this._domDebuggerAgent.invoke_setEventListenerBreakpoint({eventName: 'click'});

    const mainTarget = SDK.SDKModel.TargetManager.instance().mainTarget();
    if (!mainTarget) {
      throw new Error('Could not find main target');
    }
    const resourceTreeModel = mainTarget.model(SDK.ResourceTreeModel.ResourceTreeModel);
    if (!resourceTreeModel) {
      throw new Error('Could not find resource tree model');
    }

    const mainFrame = resourceTreeModel.mainFrame;

    if (!mainFrame) {
      throw new Error('Could not find main frame');
    }
    this.appendStepToScript(new NavigationStep(mainFrame.url));
  }

  async stopRecording() {
    // Nothing yet.
  }

  async getPuppeteerConnectionToCurrentPage() {
    const mainTarget = SDK.SDKModel.TargetManager.instance().mainTarget();
    if (!mainTarget) {
      throw new Error('Could not find main target');
    }
    const childTargetManager = mainTarget.model(SDK.ChildTargetManager.ChildTargetManager);
    if (!childTargetManager) {
      throw new Error('Could not get childTargetManager');
    }
    // Pass an empty message handler because it will be overwritten by puppeteer anyways.
    const rawConnection = /** @type {!SDK.Connections.ParallelConnection} */ (
        await childTargetManager.createParallelConnection(() => {}));

    const transport = new Transport(rawConnection);

    // url is an empty string in this case parallel to:
    // https://github.com/puppeteer/puppeteer/blob/f63a123ecef86693e6457b07437a96f108f3e3c5/src/common/BrowserConnector.ts#L72
    const connection = new puppeteer.Connection('', transport);
    const browser = await puppeteer.Browser.create(connection, [], false);

    // @ts-ignore
    const resourceTreeModel = mainTarget.model(SDK.ResourceTreeModel.ResourceTreeModel);
    if (!resourceTreeModel) {
      throw new Error('Could not get resource tree model');
    }
    const mainFrame = resourceTreeModel.mainFrame;

    if (!mainFrame) {
      throw new Error('Could not find main frame');
    }
    const page = await browser.pages().then(pages => pages.find(p => p.mainFrame()._id === mainFrame.id) || null);

    return {page, connection: rawConnection};
  }


  /**
   *
   * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
   */
  async runRecording(uiSourceCode) {
    if (!uiSourceCode.url().startsWith('recording://')) {
      return;
    }


    const script = JSON.parse(uiSourceCode.content());

    this.updateState(RecorderState.Running);
    await SDK.SDKModel.TargetManager.instance().suspendAllTargets();
    const {page, connection} = await this.getPuppeteerConnectionToCurrentPage();
    if (!page) {
      this.updateState(RecorderState.Idle);
      throw new Error('Could not find current page');
    }

    try {
      page.setDefaultTimeout(5000);
      for (const step of script.steps) {
        switch (step.action) {
          case 'navigate': {
            await page.goto(step.url);
            break;
          }
          case 'click': {
            await page.click(step.selector);
            break;
          }
          default:
            throw new Error('Unknown action: ' + step.action);
        }
      }
    } catch (err) {
      console.error('ERROR', err);
    } finally {
      await connection.disconnect();
      await SDK.SDKModel.TargetManager.instance().resumeAllTargets();
      this.updateState(RecorderState.Idle);
    }
  }

  /**
   *
   * @param {!Step} step
   */
  appendStepToScript(step) {
    if (!this._currentUiSourceCode) {
      return;
    }


    const script = JSON.parse(this._currentUiSourceCode.content());
    script.steps.push(step.toJSON());

    this._currentUiSourceCode.setContent(JSON.stringify(script, null, ' '), false);
  }

  /**
   *
   * @param {!Array.<!Protocol.Runtime.PropertyDescriptor>} localFrame
   */
  async handleClickEvent(localFrame) {
    const targetId = await this._findTargetId(localFrame, [
      'MouseEvent',
      'PointerEvent',
    ]);

    if (!targetId) {
      return;
    }

    const selector = await this._getSelector(targetId);
    if (!selector) {
      throw new Error('Could not find selector');
    }
    this.appendStepToScript(new ClickStep(selector));
    this._resume();
  }

  async _resume() {
    await this._debuggerAgent.invoke_setSkipAllPauses({skip: true});
    await this._debuggerAgent.invoke_resume({terminateOnResume: false});
    await this._debuggerAgent.invoke_setSkipAllPauses({skip: false});
  }

  async _skip() {
    await this._debuggerAgent.invoke_resume({terminateOnResume: false});
  }

  /**
   *
   * @param {!Array.<!Protocol.Runtime.PropertyDescriptor>} localFrame
   * @param {!Array<string>} interestingClassNames
   * @returns {!Promise<?Protocol.Runtime.RemoteObjectId>}
   */
  async _findTargetId(localFrame, interestingClassNames) {
    const event = localFrame.find(
        prop => !!(prop && prop.value && prop.value.className && interestingClassNames.includes(prop.value.className)));

    if (!event || !event.value || !event.value.objectId) {
      return null;
    }

    const eventProperties = await this._runtimeAgent.invoke_getProperties({
      objectId: event.value.objectId,
    });

    if (!eventProperties) {
      return null;
    }

    const target = eventProperties.result.find(prop => prop.name === 'target');

    if (!target || !target.value) {
      return null;
    }

    return target.value.objectId || null;
  }

  /**
   *
   * @param {!Protocol.Runtime.RemoteObjectId} objectId
   */
  async _getSelector(objectId) {
    const ariaSelector = await this._getAriaSelector(objectId);
    return ariaSelector;
  }

  /**
   *
   * @param {!Protocol.Runtime.RemoteObjectId} objectId
   */
  async _getAriaSelector(objectId) {
    const {nodes} = await this._accessibilityAgent.invoke_queryAXTree({objectId});
    const axNode = nodes.find(n => !n.ignored);
    if (!axNode || !axNode.name || !axNode.role) {
      return null;
    }
    const name = axNode.name.value;
    const role = axNode.role.value;

    return `aria/${name}[role="${role}"]`;
  }

  /**
   * @override
   */
  breakpointResolved() {
  }

  /**
   * @override
   * @param {!Protocol.Debugger.PausedEvent} params
   */
  paused(params) {
    const eventName = params.data.eventName;
    const localFrame = params.callFrames[0].scopeChain[0];

    if (!localFrame.object.objectId) {
      return;
    }
    this._runtimeAgent.invoke_getProperties({objectId: localFrame.object.objectId}).then(async ({result}) => {
      if (eventName === 'listener:click') {
        await this.handleClickEvent(result);
      }
    });
  }

  /**
   * @override
   */
  resumed() {
  }

  /**
   * @override
   */
  scriptFailedToParse() {
  }

  /**
   * @override
   */
  scriptParsed() {
  }
}

SDK.SDKModel.SDKModel.register(RecorderModel, SDK.SDKModel.Capability.None, false);
