// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Important: This code does not actually run any tests but is used to verify
//            that the type magic of `EventTarget` behaves as expected w.r.t
//            to the TypeScript compiler.

import * as Common from '../../../../../front_end/core/common/common.js';

const enum Events {
  VoidEvent,
  NumberEvent,
  KeyValueEvent,
}

type TestEvents = {
  [Events.VoidEvent]: void,
  [Events.NumberEvent]: number,
  [Events.KeyValueEvent]: {key: string, value: number},
};

class EventEmitter extends Common.ObjectWrapper.ObjectWrapper<TestEvents> {
  testValidArgumentTypes() {
    this.dispatchEventToListeners(Events.VoidEvent, undefined);
    this.dispatchEventToListeners(Events.NumberEvent, 5.0);
    this.dispatchEventToListeners(Events.KeyValueEvent, {key: 'key', value: 42});
  }

  testInvalidArgumentTypes() {
    // @ts-expect-error
    this.dispatchEventToListeners(Events.VoidEvent, 'void');

    // @ts-expect-error
    this.dispatchEventToListeners(Events.NumberEvent, 'expected number');

    // @ts-expect-error
    this.dispatchEventToListeners(Events.KeyValueEvent, {key: 'key', foo: 'foo'});
  }
}

function genericListener<T>(): (arg: Common.EventTarget.EventTargetEvent<T>) => void {
  return (arg: Common.EventTarget.EventTargetEvent<T>) => {};
}

const emitter = new EventEmitter();

(function testInvalidListeners() {
  // @ts-expect-error
  emitter.addEventListener(Events.VoidEvent, genericListener<number>());

  // @ts-expect-error
  emitter.addEventListener(Events.NumberEvent, genericListener<void>());

  // @ts-expect-error
  emitter.addEventListener(Events.KeyValueEvent, genericListener<{foo: string}>());
})();

(function testValidListeners() {
  emitter.addEventListener(Events.VoidEvent, genericListener<void>());
  emitter.addEventListener(Events.NumberEvent, genericListener<number>());
  emitter.addEventListener(Events.KeyValueEvent, genericListener<{key: string, value: number}>());
});
