// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';
import {spy} from 'sinon';

import {getBrowserAndPages, resetPages, waitFor} from '../../shared/helper.js';

describe('Keyboard shortcut telemetry', async () => {
  beforeEach(async () => {
    await resetPages();
  });

  it('should log enumerated shortcuts when fired', async () => {
    const {frontend} = getBrowserAndPages();
    const recordHistogramSpy = spy();
    await frontend.exposeFunction('recordEnumeratedHistogramForTest', recordHistogramSpy);
    await frontend.evaluate('InspectorFrontendHost.recordEnumeratedHistogram = recordEnumeratedHistogramForTest');

    frontend.keyboard.press('F1');
    await waitFor('.settings-window-main');

    assert.isTrue(recordHistogramSpy.calledWith('DevTools.KeyboardShortcutFired', 22));
  });
});
