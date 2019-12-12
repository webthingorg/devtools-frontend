// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

Timeline.InputModel = class extends SDK.SDKModel {
  /**
   * @param {!SDK.Target} target
   */
  constructor(target) {
    super(target);
    this._inputAgent = target.inputAgent();
    /** @type {?number} */
    this._eventDispatchTimer = null;
    /** @type {?function()} */
    this._finishCallback = null;
    this._reset();
  }

  _reset() {
    /** @type {?number} */
    this._lastEventTime = null;
    /** @type {boolean} */
    this._replayPaused = false;
    /** @type {!Array<!SDK.TracingModel.Event>}*/
    this._dispatchEventList = [];
    clearTimeout(this._eventDispatchTimer);
  }

  /**
   * @param {!Array<!TimelineModel.TimelineModel.Track>} timelineTracks
   * @param {?function()}  finishCallback
   */
  startReplay(timelineTracks, finishCallback) {
    if (!this._replayPaused) {
      this._reset();
      this._createDispatchEventListFromTracks(timelineTracks);
    }
    this._replayPaused = false;
    this._finishCallback = finishCallback;
    if (this._dispatchEventList.length) {
      this._dispatchNextEvent();
    } else {
      this._replayStopped();
    }
  }

  pause() {
    clearTimeout(this._eventDispatchTimer);
    if (!this._dispatchEventList.length) {
      this._replayStopped();
    } else {
      this._replayPaused = true;
    }
  }

  _dispatchNextEvent() {
    const event = this._dispatchEventList.shift();
    this._lastEventTime = event.args.data.timestamp;
    if (event.args.data.type in Timeline.InputModel.MouseEventTypes) {
      this._dispatchMouseEvent(event);
    } else if (event.args.data.type in Timeline.InputModel.KeyboardEventTypes) {
      this._dispatchKeyEvent(event);
    }

    if (this._dispatchEventList.length) {
      const waitTime = (this._dispatchEventList[0].args.data.timestamp - this._lastEventTime) / 1000;
      this._eventDispatchTimer = setTimeout(this._dispatchNextEvent.bind(this), waitTime);
    } else {
      this._replayStopped();
    }
  }

  _replayStopped() {
    clearTimeout(this._eventDispatchTimer);
    this._finishCallback();
    this._reset();
  }

  _createDispatchEventListFromTracks(tracks) {
    this._dispatchEventList = [];
    for (const track of tracks) {
      if (track.type === TimelineModel.TimelineModel.TrackType.MainThread) {
        for (const event of track.syncEvents()) {
          if (event.name === TimelineModel.TimelineModel.RecordType.EventDispatch &&
              (event.args.data.type in Timeline.InputModel.MouseEventTypes ||
               event.args.data.type in Timeline.InputModel.KeyboardEventTypes)) {
            this._dispatchEventList.push(event);
          }
        }
      }
    }
  }

  /**
   * @param {!SDK.TracingModel.Event} event
   */
  async _dispatchMouseEvent(event) {
    const data = event.args.data;
    if (!data.x || !data.y) {
      return;
    }

    const buttons = {0: 'left', 1: 'middle', 2: 'right', 3: 'back', 4: 'forward'};
    const params = {
      type: Timeline.InputModel.MouseEventTypes[data.type],
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
    const data = event.args.data;
    const text = data.type === 'keypress' ? String.fromCharCode(data.charCode) : undefined;
    if (!text) {
      return;
    }


    const params = {
      type: Timeline.InputModel.KeyboardEventTypes[data.type],
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
};

Timeline.InputModel.MouseEventTypes = {
  'mousedown': 'mousePressed',
  'mouseup': 'mouseReleased',
  'mousemove': 'mouseMoved',
  'wheel': 'mouseWheel'
};

Timeline.InputModel.KeyboardEventTypes = {
  'keydown': 'keyDown',
  'keyup': 'keyUp',
  'keypress': 'char',
};


SDK.SDKModel.register(Timeline.InputModel, SDK.Target.Capability.Input, false);
