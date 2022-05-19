// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {ExtensionServer} from './ExtensionServer.js';

export class ExtensionTraceNotifications {
  static #lastSessionId = 0;
  static #isRecording = false;

  start(): void {
    if (ExtensionTraceNotifications.#isRecording) {
      throw new Error('Tracing is already started');
    }
    ExtensionTraceNotifications.#isRecording = true;
    const sessionId = String(++ExtensionTraceNotifications.#lastSessionId);
    ExtensionServer.instance().notifyTraceRecordingStarted(sessionId);
  }

  stop(): void {
    if (!ExtensionTraceNotifications.#isRecording) {
      throw new Error('Tracing is not started');
    }
    ExtensionTraceNotifications.#isRecording = false;
    const sessionId = String(ExtensionTraceNotifications.#lastSessionId);
    ExtensionServer.instance().notifyTraceRecordingStopped(sessionId);
  }
}
