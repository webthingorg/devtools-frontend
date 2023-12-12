// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';
import * as VisualLogging from '../../../../../front_end/ui/visual_logging/visual_logging-testing.js';
import {stabilizeState} from '../../helpers/VisualLoggingHelpers.js';

const {assert} = chai;

describe('LoggingState', () => {
  let parent: Element;
  let element: Element;

  beforeEach(() => {
    parent = document.createElement('div');
    element = document.createElement('div');
  });

  it('getOrCreateLoggingState creates state entry on demand', () => {
    VisualLogging.LoggingState.getOrCreateLoggingState(parent, {ve: 1});
    const state = VisualLogging.LoggingState.getOrCreateLoggingState(element, {ve: 1, context: '42'}, parent);
    assert.deepEqual(stabilizeState(state), {
      impressionLogged: false,
      config: {ve: 1, context: '42'},
      veid: 0,
      processed: false,
      context: state.context,
      parent: {
        impressionLogged: false,
        config: {ve: 1},
        veid: 1,
        processed: false,
        context: state.parent?.context as VisualLogging.LoggingState.ContextProvider,
        parent: null,
      },
    });
  });

  it('getOrCreateLoggingState and getLoggingState return the same object for the same element', () => {
    const state = VisualLogging.LoggingState.getOrCreateLoggingState(element, {ve: 1, context: '42'}, parent);
    assert.strictEqual(
        state, VisualLogging.LoggingState.getOrCreateLoggingState(element, {ve: 1, context: '42'}, parent));
    assert.strictEqual(state, VisualLogging.LoggingState.getLoggingState(element));
  });

  it('getLoggingState returns null for unknown element', () => {
    assert.isNull(VisualLogging.LoggingState.getLoggingState(element));
  });

  it('hashes a string context', async () => {
    const state = VisualLogging.LoggingState.getOrCreateLoggingState(element, {ve: 1, context: 'foobar'});
    assertNotNullOrUndefined(state);
    const context = await state.context(element);
    assert.strictEqual(4191634312, context);
  });

  it('uses a custom context provider', async () => {
    const provider = sinon.stub();
    provider.returns(123);
    VisualLogging.LoggingState.registerContextProvider('custom', provider);
    const state = VisualLogging.LoggingState.getOrCreateLoggingState(element, {ve: 1, context: 'custom'});
    assertNotNullOrUndefined(state);
    const context = await state.context(element);
    assert.isTrue(provider.calledOnceWith(element));
    assert.strictEqual(123, context);
  });

  it('uses a custom parent provider', async () => {
    const provider = sinon.stub();
    const customParent = document.createElement('div');
    VisualLogging.LoggingState.getOrCreateLoggingState(customParent, {ve: 1, context: '123'});
    provider.returns(customParent);
    VisualLogging.LoggingState.registerParentProvider('custom', provider);
    const state = VisualLogging.LoggingState.getOrCreateLoggingState(element, {ve: 1, parent: 'custom'});
    assertNotNullOrUndefined(state);
    assert.isTrue(provider.calledOnceWith(element));
    assert.strictEqual(123, await state.parent?.context(element));
  });
});
