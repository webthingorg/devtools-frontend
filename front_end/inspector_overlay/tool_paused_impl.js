// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// @ts-nocheck
// TODO(crbug.com/1011811): Enable TypeScript compiler checks

export function drawPausedInDebuggerMessage(message) {
  document.getElementById('paused-in-debugger').textContent = message;
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('resume-button').addEventListener('click', () => InspectorOverlayHost.send('resume'));
  document.getElementById('step-over-button').addEventListener('click', () => InspectorOverlayHost.send('stepOver'));
});

document.addEventListener('keydown', event => {
  if (event.key === 'F8' || eventHasCtrlOrMeta(event) && event.keyCode === 220 /* backslash */) {
    InspectorOverlayHost.send('resume');
  } else if (event.key === 'F10' || eventHasCtrlOrMeta(event) && event.keyCode === 222 /* single quote */) {
    InspectorOverlayHost.send('stepOver');
  }
});
