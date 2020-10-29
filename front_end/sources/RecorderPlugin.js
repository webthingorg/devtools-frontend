// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as Host from '../host/host.js';
import * as Recorder from '../recorder/recorder.js';
import * as Snippets from '../snippets/snippets.js';
import * as SourceFrame from '../source_frame/source_frame.js';  // eslint-disable-line no-unused-vars
import * as UI from '../ui/ui.js';
import * as Workspace from '../workspace/workspace.js';  // eslint-disable-line no-unused-vars

import {Plugin} from './Plugin.js';

export class RecorderPlugin extends Plugin {
  /**
   * @param {!SourceFrame.SourcesTextEditor.SourcesTextEditor} textEditor
   * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
   */
  constructor(textEditor, uiSourceCode) {
    super();
    this._textEditor = textEditor;
    this._uiSourceCode = uiSourceCode;
  }

  /**
   * @override
   * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
   * @return {boolean}
   */
  static accepts(uiSourceCode) {
    return Recorder.RecordingFileSystem.isRecordingUISourceCode(uiSourceCode);
  }

  /**
   * @override
   * @return {!Promise<!Array<!UI.Toolbar.ToolbarItem>>}
   */
  async rightToolbarItems() {
    const runSnippet = UI.Toolbar.Toolbar.createActionButtonForId('recorder.run');
    runSnippet.setText(
        Host.Platform.isMac() ? Common.UIString.UIString('\u2318+Enter') : Common.UIString.UIString('Ctrl+Enter'));

    return [runSnippet];
  }

  /**
   * @override
   * @return {!Array<!UI.Toolbar.ToolbarItem>}
   */
  leftToolbarItems() {
    const runSnippet = UI.Toolbar.Toolbar.createActionButtonForId('recorder.toggle-recording');
    runSnippet.setText(Common.UIString.UIString('Record'));

    return [runSnippet];
  }
}
