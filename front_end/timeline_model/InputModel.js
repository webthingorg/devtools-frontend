// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export default class InputModel extends SDK.SDKModel {
  /**
   * @param {!SDK.Target} target
   */
  constructor(target) {
    super(target);

    this._inputAgent = target.inputAgent();
  }

  /**
   * @param {!SDK.TracingModel.Event.args.data} data
   */
  dispatchMouseEvent(data) {
    const buttons = {0: 'left', 1: 'middle', 2: 'right'};
    const types =
        {'mousedown': 'mousePressed', 'mouseup': 'mouseReleased', 'mousemove': 'mouseMoved', 'wheel': 'mouseWheel'};
    if (!(data.type in types)) {
      return;
    }
    if (!data.x || !data.y) {
      return;
    }

    const params = {
      type: types[data.type],
      x: data.x,
      y: data.y,
      modifiers: data.modifiers,
      button: ((data.type === 'mousedown' || data.type === 'mouseup') ? buttons[data.button] : 'none'),
      buttons: data.buttons,
      clickCount: data.clickCount,
      deltaX: data.deltaX,
      deltaY: data.deltaY
    };
    this._inputAgent.invoke_dispatchMouseEvent(params);
  }

  /**
   * @param {!SDK.TracingModel.Event.args.data} data
   */
  dispatchKeyEvent(data) {
    const types = {
      'keydown': 'keyDown',
      'keyup': 'keyUp',
      'keypress': 'char',
    };
    if (!(data.type in types)) {
      return;
    }
    const text = data.type === 'keypress' ? String.fromCharCode(data.charCode) : undefined;
    const params = {
      type: types[data.type],
      modifiers: data.modifiers,
      text: text,
      unmodifiedText: text ? text.toLowerCase() : undefined,
      code: data.code,
      key: data.key,
      windowsVirtualKeyCode: data.keyCode,
      nativeVirtualKeyCode: data.keyCode,
    };
    this._inputAgent.invoke_dispatchKeyEvent(params);
  }
}

/* Legacy exported object */
self.TimelineModel = self.TimelineModel || {};
/* Legacy exported object */
TimelineModel = TimelineModel || {};
/** @constructor */
TimelineModel.InputModel = InputModel;

SDK.SDKModel.register(TimelineModel.InputModel, SDK.Target.Capability.Input, false);
