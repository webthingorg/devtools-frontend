// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {Overlay} from './common.js';

declare global {
  interface Window {
    InspectorOverlayHost: {send(data: string): void;}
  }
}

export class PausedOverlay extends Overlay {
  private container = document.createElement('div');

  setPlatform(platform: string) {
    super.setPlatform(platform);
    const document = this.getDocument();
    const controlsLine = document.createElement('div');
    controlsLine.classList.add('controls-line');

    const messageBox = document.createElement('div');
    messageBox.classList.add('message-box');
    const pausedInDebugger = document.createElement('div');
    pausedInDebugger.id = 'paused-in-debugger';
    this.container = pausedInDebugger;
    messageBox.append(pausedInDebugger);
    controlsLine.append(messageBox);

    const resumeButton = document.createElement('div');
    resumeButton.id = 'resume-button';
    resumeButton.title = 'Resume script execution (F8).';
    resumeButton.classList.add('button');
    const glyph = document.createElement('div');
    glyph.classList.add('glyph');
    resumeButton.append(glyph);
    controlsLine.append(resumeButton);

    const stepOverButton = document.createElement('div');
    stepOverButton.id = 'step-over-button';
    stepOverButton.title = 'Step over next function call (F10).';
    stepOverButton.classList.add('button');
    const glyph2 = document.createElement('div');
    glyph2.classList.add('glyph');
    stepOverButton.append(glyph2);
    controlsLine.append(stepOverButton);

    document.body.append(controlsLine);

    this.initListeners();

    resumeButton.addEventListener('click', () => this.getWindow().InspectorOverlayHost.send('resume'));
    stepOverButton.addEventListener('click', () => this.getWindow().InspectorOverlayHost.send('stepOver'));
  }

  drawPausedInDebuggerMessage(message: string) {
    this.container.textContent = message;
  }

  initListeners() {
    this.getDocument().addEventListener('keydown', event => {
      if (event.key === 'F8' || this.eventHasCtrlOrMeta(event) && event.keyCode === 220 /* backslash */) {
        this.getWindow().InspectorOverlayHost.send('resume');
      } else if (event.key === 'F10' || this.eventHasCtrlOrMeta(event) && event.keyCode === 222 /* single quote */) {
        this.getWindow().InspectorOverlayHost.send('stepOver');
      }
    });
  }
}
