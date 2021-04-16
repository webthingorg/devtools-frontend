// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {SinonSpy} from 'sinon';

const {assert} = chai;

import {createTarget} from '../helpers/EnvironmentHelpers.js';
import {ProtocolCommand, clearAllMockConnectionResponseHandlers, describeWithMockConnection, setMockConnectionResponseHandler} from '../helpers/MockConnection.js';
import * as Recorder from '../../../../front_end/recorder/recorder.js';
import type * as SDKModule from '../../../../front_end/core/sdk/sdk.js';

function mock(command: ProtocolCommand, cb?: any) {
  const handler = sinon.spy(cb ? cb : () => ({}));
  setMockConnectionResponseHandler(command, handler);
  return handler;
}

describeWithMockConnection('Recorder', () => {
  describe('RecordingSession', () => {
    beforeEach(() => {
      clearAllMockConnectionResponseHandlers();
    });

    it('should do something', () => {
      const target = createTarget();
      const session = new Recorder.RecordingSession.RecordingSession(target);

      assert.isTrue(Boolean(session));
    });

    it('should add a script that will be evaluated on new documents', async () => {
      const target = createTarget();
      const session = new Recorder.RecordingSession.RecordingSession(target);

      mock('Page.reload');
      const addScriptToEvaluateOnNewDocument =
          mock('Page.addScriptToEvaluateOnNewDocument', () => ({identifier: 'testidentifier'}));
      await session.start();
      assert.strictEqual(addScriptToEvaluateOnNewDocument.callCount, 1);
    });

    it('should reload the current page', async () => {
      const target = createTarget();
      const session = new Recorder.RecordingSession.RecordingSession(target);

      const reload = mock('Page.reload');
      mock('Page.addScriptToEvaluateOnNewDocument', () => ({identifier: 'testidentifier'}));
      await session.start();
      assert.strictEqual(reload.callCount, 1);
    });
  });
});
