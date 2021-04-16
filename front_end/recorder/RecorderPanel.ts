// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../core/i18n/i18n.js';
import * as SDK from '../core/sdk/sdk.js';
import * as UI from '../ui/legacy/legacy.js';

import {RecordingSession, RecordingUpdatedEvent} from './RecordingSession.js';
import {RecordingView} from './RecordingView.js';

const UIStrings = {};
const str_ = i18n.i18n.registerUIStrings('recorder/RecorderPanel.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
let recorderPanelInstance: RecorderPanel;

export class RecorderPanel extends UI.Panel.PanelWithSidebar {
  session: RecordingSession;

  constructor() {
    super('recorder');
    this.registerRequiredCSS('recorder/recorderPanel.css', {enableLegacyPatching: false});

    const mainContainer = new UI.Widget.VBox();
    this.splitWidget().setMainWidget(mainContainer);

    const sidebar = new UI.Widget.VBox();
    sidebar.show(this.panelSidebarElement());


    const toolbar = new UI.Toolbar.Toolbar('recorder-toolbar');

    const target = SDK.SDKModel.TargetManager.instance().mainTarget() as SDK.SDKModel.Target;
    this.session = new RecordingSession(target);
    this.session.start();

    const test = document.createElement('devtools-recording-view') as RecordingView;

    this.session.addEventListener('recording-updated', (e: any) => {
      test.data = {
        recording: e.data.recording,
        isRecording: true,
      };
      test.scrollToBottom();
    });

    mainContainer.element.appendChild(toolbar.element);
    mainContainer.element.appendChild(test);
  }

  static instance(opts: {
    forceNew: boolean|null,
  } = {forceNew: null}): RecorderPanel {
    const {forceNew} = opts;
    if (!recorderPanelInstance || forceNew) {
      recorderPanelInstance = new RecorderPanel();
    }

    return recorderPanelInstance;
  }
}
