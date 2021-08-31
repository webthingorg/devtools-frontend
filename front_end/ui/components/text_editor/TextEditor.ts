// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../core/common/common.js';
import * as CodeMirror from '../../../third_party/codemirror.next/codemirror.next.js';
import * as LitHtml from '../../lit-html/lit-html.js';
import * as ComponentHelpers from '../helpers/helpers.js';

import {dynamicSetting} from './config.js';

declare global {
  interface HTMLElementTagNameMap {
    'devtools-text-editor': TextEditor;
  }
}

export class TextEditor extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-text-editor`;

  private readonly shadow = this.attachShadow({mode: 'open'});
  private activeEditor: CodeMirror.EditorView|undefined = undefined;
  private activeSettingListeners: [Common.Settings.Setting<unknown>, (event: {data: unknown}) => void][] = [];
  private pendingState: CodeMirror.EditorState|undefined;

  constructor(pendingState?: CodeMirror.EditorState) {
    super();
    this.pendingState = pendingState;
  }

  private createEditor(): CodeMirror.EditorView {
    this.activeEditor = new CodeMirror.EditorView({
      state: this.updateDynamicSettings(this.state),
      parent: this.shadow,
      root: this.shadow,
    });
    return this.activeEditor;
  }

  get editor(): CodeMirror.EditorView {
    return this.activeEditor || this.createEditor();
  }

  get state(): CodeMirror.EditorState {
    if (this.activeEditor) {
      return this.activeEditor.state;
    }
    if (!this.pendingState) {
      this.pendingState = CodeMirror.EditorState.create({});
    }
    return this.pendingState;
  }

  set state(state: CodeMirror.EditorState) {
    if (this.activeEditor) {
      this.activeEditor.setState(state);
    } else {
      this.pendingState = state;
    }
  }

  connectedCallback(): void {
    if (!this.activeEditor) {
      this.createEditor();
    }
    this.registerSettingHandlers();
  }

  disconnectedCallback(): void {
    if (this.activeEditor) {
      this.pendingState = this.activeEditor.state;
      this.activeEditor.destroy();
      this.activeEditor = undefined;
    }
    for (;;) {
      const listener = this.activeSettingListeners.pop();
      if (!listener) {
        break;
      }
      listener[0].removeChangeListener(listener[1]);
    }
  }

  private updateDynamicSettings(state: CodeMirror.EditorState): CodeMirror.EditorState {
    const settings = Common.Settings.Settings.instance();
    const changes = [];
    for (const opt of state.facet(dynamicSetting)) {
      const mustUpdate = opt.sync(state, settings.moduleSetting(opt.settingName).get());
      if (mustUpdate) {
        changes.push(mustUpdate);
      }
    }
    return changes.length ? state.update({effects: changes}).state : state;
  }

  private registerSettingHandlers(): void {
    const settings = Common.Settings.Settings.instance();
    for (const opt of this.state.facet(dynamicSetting)) {
      const handler = ({data}: {data: unknown}): void => {
        const change = opt.sync(this.state, data);
        if (change && this.activeEditor) {
          this.activeEditor.dispatch({effects: change});
        }
      };
      const setting = settings.moduleSetting(opt.settingName);
      setting.addChangeListener(handler);
      this.activeSettingListeners.push([setting, handler]);
    }
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-text-editor', TextEditor);
