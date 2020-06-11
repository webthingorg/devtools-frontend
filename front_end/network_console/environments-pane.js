// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as UI from '../ui/ui.js';

import {CollectionsStorage} from './collections-storage.js';
import {NetworkConsoleSidebar} from './network-console-sidebar.js';  // eslint-disable-line no-unused-vars
import {NetworkConsoleView} from './network-console-view.js';
import {SidebarPanel} from './sidebar-panel.js';

export class EnvironmentsPane extends SidebarPanel {
  /**
   *
   * @param {!NetworkConsoleSidebar} sidebar
   */
  constructor(sidebar) {
    super(ls`Environments`, 'network-console/environments');
    this._sidebar = sidebar;
    /**
     * @type {!EnvironmentElement|null}
     */
    this._activatedEnvironment = null;
  }

  /**
   * @param {string} url
   * @param {any} reader
   * @param {boolean=} activate
   */
  addFromReader(url, reader, activate = false) {
    const env = new EnvironmentRootElement(this, url, reader);
    this._treeControl.appendChild(env);
    if (activate) {
      env.activateFirstChild();
    }
  }

  /**
   * Imports an environment file.
   * @param {string} name
   * @param {string} contents
   * @returns {!Promise<void>}
   */
  async importFile(name, contents) {
    await this._sidebar.importFile(name, contents, {type: 'environments'});
  }

  /**
   * @param {!EnvironmentElement} environmentElement
   */
  activateEnvironment(environmentElement) {
    const id = environmentElement.id;
    const entry = environmentElement.entry();
    const view = self.UI.context.flavor(NetworkConsoleView);
    view.activateEnvironment(id, entry);
    CollectionsStorage.instance().setLastActivatedEnvironment(id);

    environmentElement.setChecked(true);
    if (this._activatedEnvironment) {
      this._activatedEnvironment.setChecked(false);
    }
    this._activatedEnvironment = environmentElement;
  }

  deactivateCurrentEnvironment() {
    if (this._activatedEnvironment) {
      this._activatedEnvironment.setChecked(false);
      this._activatedEnvironment = null;
    }

    CollectionsStorage.instance().setLastActivatedEnvironment('');
    const view = self.UI.context.flavor(NetworkConsoleView);
    view.clearActiveEnvironment();
  }

  /**
   * Performs a depth-first search to find a descendant element by its ID.
   * @param {string} id
   * @return {!EnvironmentElement|null}
   */
  findEnvironmentById(id) {
    let rootItem = /** @type {!EnvironmentRootElement|null} */ (this._treeControl.firstChild());
    while (rootItem) {
      for (const child of rootItem.children()) {
        const environmentItem = /** @type {!EnvironmentElement} */ (child);
        if (environmentItem.id === id) {
          return environmentItem;
        }
      }

      rootItem = rootItem.nextSibling;
    }

    return null;
  }

  /**
   * @return {!EnvironmentElement|null}
   */
  activeEnvironment() {
    return this._activatedEnvironment;
  }
}

export class EnvironmentRootElement extends UI.TreeOutline.TreeElement {
  /**
   * @param {!EnvironmentsPane} pane
   * @param {string} id
   * @param {!NCShared.IEnvironmentRoot} entry
   */
  constructor(pane, id, entry) {
    const title = entry.name;
    super(title, /* expandable */ true);

    this._pane = pane;
    this.id = id;
    this._entry = entry;
    this.selectable = true;

    entry.environments.forEach((child, index) => {
      const id = this.id + '/' + index;
      this.appendChild(new EnvironmentElement(this._pane, id, child));
    });

    this.expand();
  }

  activateFirstChild() {
    const firstChild = /** @type {?EnvironmentElement} */ (this.firstChild());
    if (firstChild) {
      firstChild.activate();
    }
  }

  /**
   *
   * @param {!UI.ContextMenu.ContextMenu} contextMenu
   */
  appendApplicableItems(contextMenu) {
    // TODO: https://github.com/microsoft/edge-devtools-network-console/issues/4
    // contextMenu.editSection().appendItem(ls`Add Environment`, () => this._addEnvironment());

    // TODO: https://github.com/microsoft/edge-devtools-network-console/issues/7
    // const exportMenu = contextMenu.editSection().appendSubMenuItem(ls`Export`);
    // exportMenu.defaultSection().appendItem(ls`Network Console`, () => this._exportAs('nc-native'));
    // const item = exportMenu.defaultSection().appendItem(ls`Postman`, () => this._exportAs('postman-2.1'));
    // Postman Environment file format does not support multiple environments per file
    // if (this.childCount() > 1) {
    //   item.setEnabled(false);
    // }

    contextMenu.defaultSection().appendItem(ls`Delete`, () => this._deleteThis());
  }

  _addEnvironment() {
  }

  /**
   *
   * @param {'nc-native' | 'postman-2.1'} format
   */
  _exportAs(format) {
  }

  _deleteThis() {
    // Check to see whether the active environment is in this env. collection
    const active = this._pane.activeEnvironment();
    if (active) {
      if (this.children().indexOf(active) > -1) {
        this._pane.deactivateCurrentEnvironment();
      }
    }

    CollectionsStorage.instance().deleteFile(this.id);
    this._pane.treeControl().removeChild(this);
  }
}

export class EnvironmentElement extends UI.TreeOutline.TreeElement {
  /**
   * @param {!EnvironmentsPane} pane
   * @param {string} id
   * @param {!NCShared.IEnvironment} entry
   */
  constructor(pane, id, entry) {
    const title = entry.name;
    super(title, /* expandable: */ false);

    this._pane = pane;
    this.id = id;
    this._entry = entry;
    this.selectable = true;
  }

  /**
   * @override
   * @return {boolean}
   */
  onenter() {
    this.activate();
    return true;
  }

  /**
   * @override
   * @return {boolean}
   */
  ondblclick() {
    this.activate();
    return true;
  }

  /**
   * @return {!NCShared.IEnvironment}
   */
  entry() {
    return this._entry;
  }

  activate() {
    this._pane.activateEnvironment(this);
  }

  /**
   * @param {boolean=} checked
   */
  setChecked(checked) {
    const icons = [];
    if (checked) {
      icons.push(UI.Icon.Icon.create('smallicon-checkmark'));
    }
    this.setLeadingIcons(icons);
  }

  /**
   *
   * @param {!UI.ContextMenu.ContextMenu} contextMenu
   */
  appendApplicableItems(contextMenu) {
    // TODO: https://github.com/microsoft/edge-devtools-network-console/issues/7
    // contextMenu.editSection().appendItem(ls`Edit Environment`, () => this._editThis());
    contextMenu.editSection().appendItem(ls`Activate`, () => this.activate());
    // TODO: https://github.com/microsoft/edge-devtools-network-console/issues/7
    // This is unsupported in v1 because it deletes a child of the environment file.
    // contextMenu.defaultSection().appendItem(ls`Delete`, () => this._deleteThis());
  }

  _editThis() {
    // TODO: https://github.com/microsoft/edge-devtools-network-console/issues/7
  }

  _deleteThis() {
    // TODO: https://github.com/microsoft/edge-devtools-network-console/issues/7
  }
}
