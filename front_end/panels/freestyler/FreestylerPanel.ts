// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../../core/i18n/i18n.js';
import * as UI from '../../ui/legacy/legacy.js';

import {FreestylerChatUi} from './components/FreestylerChatUi.js';
import freestylerPanelStyles from './freestylerPanel.css.js';

const UIStrings = {
  /**
   *@description Freestyler UI text for clearing messages.
   */
  clearMessages: 'Clear messages',
  /**
   *@description Freestyler UI text for creating a new chat messages.
   */
  createChat: 'Create chat',
  /**
   *@description Freestyler UI text for sending feedback.
   */
  sendFeedback: 'Send feedback',
};
const str_ = i18n.i18n.registerUIStrings('panels/freestyler/FreestylerPanel.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

type ViewInput = {};

type ViewOutput = {
  chatUi: FreestylerChatUi,
};

type View = (input: ViewInput, output: ViewOutput, target: HTMLElement) => void;
function defaultView(input: ViewInput, output: ViewOutput, target: HTMLElement): void {
  const toolbarContainer = target.createChild('div', 'freestyler-toolbar-container');
  const leftToolbar = new UI.Toolbar.Toolbar('', toolbarContainer);
  const rightToolbar = new UI.Toolbar.Toolbar('freestyler-right-toolbar', toolbarContainer);

  const addButton = new UI.Toolbar.ToolbarButton(i18nString(UIStrings.createChat), 'plus', undefined, 'freestyler.add');
  const clearButton =
      new UI.Toolbar.ToolbarButton(i18nString(UIStrings.clearMessages), 'clear', undefined, 'freestyler.clear');
  leftToolbar.appendToolbarItem(addButton);
  leftToolbar.appendSeparator();
  leftToolbar.appendToolbarItem(clearButton);

  rightToolbar.appendSeparator();
  const feedbackButton =
      new UI.Toolbar.ToolbarButton(i18nString(UIStrings.sendFeedback), 'bug', undefined, 'freestyler.feedback');
  const helpButton =
      new UI.Toolbar.ToolbarButton(i18nString(UIStrings.sendFeedback), 'help', undefined, 'freestyler.help');
  rightToolbar.appendToolbarItem(feedbackButton);
  rightToolbar.appendToolbarItem(helpButton);

  const contentContainer = target.createChild('div', 'freestyler-chat-ui-container');
  const freestylerChatUi = new FreestylerChatUi();
  contentContainer.appendChild(freestylerChatUi);
}

let freestylerPanelInstance: FreestylerPanel;
export class FreestylerPanel extends UI.Panel.Panel {
  chatUi!: FreestylerChatUi;
  private constructor(private view: View = defaultView) {
    super('freestyler');

    this.view(this, this, this.contentElement);
  }

  static instance(opts: {
    forceNew: boolean|null,
  }|undefined = {forceNew: null}): FreestylerPanel {
    const {forceNew} = opts;
    if (!freestylerPanelInstance || forceNew) {
      freestylerPanelInstance = new FreestylerPanel();
    }

    return freestylerPanelInstance;
  }

  override wasShown(): void {
    this.registerCSSFiles([freestylerPanelStyles]);
  }
}
