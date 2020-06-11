// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as UI from '../ui/ui.js';

/**
 * @implements {UI.View.View}
 */
export class SidebarPanel extends UI.View.SimpleView {
  /**
   *
   * @param {string} title
   * @param {string} viewId
   */
  constructor(title, viewId) {
    super(title);

    this._title = title;
    this._viewId = viewId;

    this._treeControl = new UI.TreeOutline.TreeOutlineInShadow();
    this._treeControl.element.classList.add('network-console-sidebar');
    this._treeControl.registerRequiredCSS('network_console/networkConsoleSidebar.css');
    this._treeControl.setShowSelectionOnKeyboardFocus(/* show: */ true, /* preventTabOrder: */ false);

    this.element.appendChild(this._treeControl.element);
    this.element.addEventListener('contextmenu', e => this._onContextMenu(e));
    this._fileSelectorElement = UI.UIUtils.createFileSelectorElement(async file => {
      const name = file.name;
      const contents = await file.text();
      this.importFile(name, contents);
    });
  }

  /**
   * @override
   * @return {string}
   */
  viewId() {
    return this._viewId;
  }

  /**
   * @override
   * @return {string}
   */
  title() {
    return this._title;
  }

  /**
   * @override
   * @return {boolean}
   */
  isTransient() {
    return false;
  }

  /**
   * @return {boolean}
   */
  isCloseable() {
    return false;
  }

  /**
   * @return {!Promise<!Array<!UI.Toolbar.ToolbarItem>>}
   */
  async toolbarItems() {
    const results = [];
    const importButton = new UI.Toolbar.ToolbarButton(Common.UIString.UIString('Import'), 'mediumicon-file-sync');
    importButton._glyphElement.style.backgroundColor = 'transparent';
    importButton.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, _e => {
      this.promptForFile();
    });
    results.push(importButton);
    return results;
  }

  /**
   * @return {!Promise<!UI.Widget.Widget>}
   */
  async widget() {
    return this;
  }

  /**
   * @return {!Promise<void>}
   */
  async disposeView() {
  }

  /**
   * @return {!UI.TreeOutline.TreeOutlineInShadow}
   */
  treeControl() {
    return this._treeControl;
  }

  /**
   *
   * @param {string} name
   * @param {string} contents
   * @return {!Promise<void>}
   */
  async importFile(name, contents) {
    throw new Error('Not implemented.');
  }

  promptForFile() {
    this._fileSelectorElement.click();
  }

  /**
   *
   * @param {!Event} e
   */
  _onContextMenu(e) {
    const element = this._treeControl.treeElementFromEvent(e);
    if (element) {
      const contextMenu = new UI.ContextMenu.ContextMenu(e);
      (/** @type {!ElementWithContextMenu} */ (element)).appendApplicableItems(contextMenu);
      contextMenu.show();
    }
  }
}
