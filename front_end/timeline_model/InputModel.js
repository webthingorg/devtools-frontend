// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export default class InputModel extends SDK.SDKModel {
  /**
   * @param {!SDK.Target} target
   */
  constructor(target) {
    super(target);

    this._startTime = undefined;
    this._inputAgent = target.inputAgent();
  }

  /**
   * @param {!Array<!SDK.TracingModel.Event>} syncEvents
   */
  async replayEvents(syncEvents) {
    for (const event of syncEvents) {
      if (event.name === TimelineModel.TimelineModel.RecordType.EventDispatch) {
        if (event.args.data.type in InputModel.MouseEventTypes) {
          await this._dispatchMouseEvent(event);
        } else if (event.args.data.type in InputModel.KeyboardEventTypes) {
          await this._dispatchKeyEvent(event);
        }
      }
    }
  }

  /**
   * @param {!SDK.TracingModel.Event} event
   */
  async _dispatchMouseEvent(event) {
    const waitTime = this._startTime ? (event.startTime - this._startTime) : 0;
    await sleep(waitTime);
    this._startTime = event.startTime;

    const data = event.args.data;
    if (!data.x || !data.y) {
      return;
    }
    const buttons = {0: 'left', 1: 'middle', 2: 'right'};

    const params = {
      type: InputModel.MouseEventTypes[data.type],
      x: data.x,
      y: data.y,
      modifiers: data.modifiers,
      button: ((data.type === 'mousedown' || data.type === 'mouseup') ? buttons[data.button] : 'none'),
      buttons: data.buttons,
      clickCount: data.clickCount,
      deltaX: data.deltaX,
      deltaY: data.deltaY
    };
    await this._inputAgent.invoke_dispatchMouseEvent(params);
  }

  /**
   * @param {!SDK.TracingModel.Event} event
   */
  async _dispatchKeyEvent(event) {
    const waitTime = this._startTime ? (event.startTime - this._startTime) : 0;
    await sleep(waitTime);
    this._startTime = event.startTime;

    const data = event.args.data;
    const text = data.type === 'keypress' ? String.fromCharCode(data.charCode) : undefined;
    const params = {
      type: InputModel.KeyboardEventTypes[data.type],
      modifiers: data.modifiers,
      text: text,
      unmodifiedText: text ? text.toLowerCase() : undefined,
      code: data.code,
      key: data.key,
      windowsVirtualKeyCode: data.keyCode,
      nativeVirtualKeyCode: data.keyCode,
    };
    await this._inputAgent.invoke_dispatchKeyEvent(params);
  }
}

InputModel.MouseEventTypes = {
  'mousedown': 'mousePressed',
  'mouseup': 'mouseReleased',
  'mousemove': 'mouseMoved',
  'wheel': 'mouseWheel'
};

InputModel.KeyboardEventTypes = {
  'keydown': 'keyDown',
  'keyup': 'keyUp',
  'keypress': 'char',
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
/* Legacy exported object */
self.TimelineModel = self.TimelineModel || {};
/* Legacy exported object */
TimelineModel = TimelineModel || {};
/** @constructor */
TimelineModel.InputModel = InputModel;

SDK.SDKModel.register(TimelineModel.InputModel, SDK.Target.Capability.Input, false);
