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
    /** @type {?number} */
    this._eventDispatchTimer = null;
    /** @type {!Array<!Input.InputModel.EventData>}*/
    this._dispatchEventDataList = [];
    /** @type {?function()} */
    this._finishCallback = null;

    this._reset();
  }

  _reset() {
    /** @type {?number} */
    this._lastEventTime = null;
    /** @type {boolean} */
    this._replayPaused = false;
    /** @type {number} */
    this._dispatchingIndex = 0;
    clearTimeout(this._eventDispatchTimer);
  }

  /**
   * @param {!SDK.TracingModel} tracingModel
   */
  setEvents(tracingModel) {
    for (const process of tracingModel.sortedProcesses()) {
      for (const thread of process.sortedThreads()) {
        if (thread.name() === 'CrRendererMain') {
          this._processThreadEvents(tracingModel, thread);
        }
      }
    }
  }

  /**
   * @param {?function()} finishCallback
   */
  startReplay(finishCallback) {
    this._reset();
    this._finishCallback = finishCallback;
    if (this._dispatchEventDataList.length) {
      this._dispatchNextEvent();
    } else {
      this._replayStopped();
    }
  }

  pause() {
    clearTimeout(this._eventDispatchTimer);
    if (this._dispatchingIndex >= this._dispatchEventDataList.length) {
      this._replayStopped();
    } else {
      this._replayPaused = true;
    }
  }

  resume() {
    this._replayPaused = false;
    if (this._dispatchingIndex < this._dispatchEventDataList.length) {
      this._dispatchNextEvent();
    }
  }

  /**
   * @param {!SDK.TracingModel} tracingModel
   * @param {!SDK.TracingModel.Thread} thread
   */
  _processThreadEvents(tracingModel, thread) {
    this._dispatchEventDataList = [];
    for (const event of thread.events()) {
      if (event.name === 'EventDispatch' && this._isValidInputEvent(event.args.data)) {
        this._dispatchEventDataList.push(event.args.data);
      }
    }
  }


  /**
   * @param {!Input.InputModel.EventData} eventData
   * @return {boolean}
   */
  _isValidInputEvent(eventData) {
    return this._isMouseEvent(/** @type {!Input.InputModel.MouseEventData} */ (eventData)) ||
        this._isKeyboardEvent(/** @type {!Input.InputModel.KeyboardEventData} */ (eventData));
  }

  /**
   * @param {!Input.InputModel.MouseEventData} eventData
   * @return {boolean}
   */
  _isMouseEvent(eventData) {
    if (!(eventData.type in InputModel.MouseEventTypes)) {
      return false;
    }
    if (!eventData.x || !eventData.y) {
      return false;
    }
    return true;
  }

  /**
   * @param {!Input.InputModel.KeyboardEventData} eventData
   * @return {boolean}
   */
  _isKeyboardEvent(eventData) {
    if (!(eventData.type in InputModel.KeyboardEventTypes)) {
      return false;
    }
    if (eventData.type === 'keypress') {
      const text = String.fromCharCode(eventData.charCode);
      if (!text) {
        return false;
      }
    } else {
      if (!eventData.keyCode) {
        return false;
      }
    }
    return true;
  }


  _dispatchNextEvent() {
    const eventData = this._dispatchEventDataList[this._dispatchingIndex];
    this._lastEventTime = eventData.timestamp;
    if (eventData.type in InputModel.MouseEventTypes) {
      this._dispatchMouseEvent(/** @type {!Input.InputModel.MouseEventData} */ (eventData));
    } else if (eventData.type in InputModel.KeyboardEventTypes) {
      this._dispatchKeyEvent(/** @type {!Input.InputModel.KeyboardEventData} */ (eventData));
    }

    ++this._dispatchingIndex;
    if (this._dispatchingIndex < this._dispatchEventDataList.length) {
      const waitTime = (this._dispatchEventDataList[this._dispatchingIndex].timestamp - this._lastEventTime) / 1000;
      this._eventDispatchTimer = setTimeout(this._dispatchNextEvent.bind(this), waitTime);
    } else {
      this._replayStopped();
    }
  }

  /**
   * @param {!Input.InputModel.MouseEventData} eventData
   */
  async _dispatchMouseEvent(eventData) {
    const buttons = {0: 'left', 1: 'middle', 2: 'right', 3: 'back', 4: 'forward'};
    const params = {
      type: InputModel.MouseEventTypes[eventData.type],
      x: eventData.x,
      y: eventData.y,
      modifiers: eventData.modifiers,
      button: ((eventData.type === 'mousedown' || eventData.type === 'mouseup') ? buttons[eventData.button] : 'none'),
      buttons: eventData.buttons,
      clickCount: eventData.clickCount,
      deltaX: eventData.deltaX,
      deltaY: eventData.deltaY
    };
    await this._inputAgent.invoke_dispatchMouseEvent(params);
  }

  /**
   * @param {!Input.InputModel.KeyboardEventData } eventData
   */
  async _dispatchKeyEvent(eventData) {
    const text = eventData.type === 'keypress' ? String.fromCharCode(eventData.charCode) : undefined;
    const params = {
      type: InputModel.KeyboardEventTypes[eventData.type],
      modifiers: eventData.modifiers,
      text: text,
      unmodifiedText: text ? text.toLowerCase() : undefined,
      code: eventData.code,
      key: eventData.key,
      windowsVirtualKeyCode: eventData.keyCode,
      nativeVirtualKeyCode: eventData.keyCode,
    };
    await this._inputAgent.invoke_dispatchKeyEvent(params);
  }

  _replayStopped() {
    clearTimeout(this._eventDispatchTimer);
    this._reset();
    this._finishCallback();
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

SDK.SDKModel.register(InputModel, SDK.Target.Capability.Input, false);

/* Legacy exported object */
self.Input = self.Input || {};
/* Legacy exported object */
Input = Input || {};

/** @constructor */
Input.InputModel = InputModel;

/** @typedef {{type: string, modifiers: number, timestamp: number}} */
Input.InputModel.EventData;
/** @typedef {{x: number, y: number, button: number, buttons: number, clickCount: number, deltaX: number, deltaY: number}} */
Input.InputModel.MouseEventData;
/** @typedef {{keyCode: number, charCode: number, code: string, key: string}} */
Input.InputModel.KeyboardEventData;
