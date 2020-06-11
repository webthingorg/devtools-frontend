// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as UI from '../ui/ui.js';

import {CollectionsStorage} from './collections-storage.js';
import {NetworkConsoleSidebar} from './network-console-sidebar.js';  // eslint-disable-line no-unused-vars
import {NetworkConsoleView} from './network-console-view.js';
import {SidebarPanel} from './sidebar-panel.js';

export class CollectionsPane extends SidebarPanel {
  /**
   *
   * @param {!NetworkConsoleSidebar} sidebar
   */
  constructor(sidebar) {
    super(ls`Collections`, 'network-console/collections');
    this._sidebar = sidebar;
    this._fileSelectorElement = UI.UIUtils.createFileSelectorElement(async file => {
      const name = file.name;
      const contents = await file.text();
      sidebar.importFile(name, contents, {type: 'collection'});
    });
  }

  /**
   *
   * @param {string} url
   * @param {!NCShared.ICollectionRootReader} reader
   */
  appendReader(url, reader) {
    const collection = new CollectionsTreeElement(this._sidebar, url, reader);
    this.treeControl().appendChild(collection);
  }

  /**
   *
   * @param {string} name
   * @param {string} contents
   * @returns {!Promise<void>}
   */
  async importFile(name, contents) {
    await this._sidebar.importFile(name, contents, {type: 'collection'});
  }
}

export class CollectionsTreeElement extends UI.TreeOutline.TreeElement {
  /**
   * @param {!NetworkConsoleSidebar} sidebar
   * @param {string} id
   * @param {!NCShared.ICollectionItemBase} entry
   */
  constructor(sidebar, id, entry) {
    const title = entry.name;
    const expandable = entry.type !== 'entry';

    super(title, expandable);
    this._sidebar = sidebar;
    this.selectable = true;

    this.id = id;
    this._entry = entry;

    if (expandable) {
      const parent = /** @type {!NCShared.ICollectionFolderReader} */ (entry);
      parent.children.forEach((child, index) => {
        const id = this.id + '/' + index;
        this.appendChild(new CollectionsTreeElement(sidebar, id, child));
      });

      if (entry.type === 'root') {
        this.expand();
      }
    } else {
      const reqEntry = /** @type {!NCShared.ICollectionEntryReader} */ (entry);
      const icon = UI.Icon.Icon.create(undefined, 'nc-request-icon ' + reqEntry.request.verb.toLowerCase());
      this.setLeadingIcons([icon]);
    }
  }

  /**
   * @override
   * @return {boolean}
   */
  onenter() {
    if (this._entry.type === 'entry') {
      this._onActivateEntry();
      return true;
    }

    return super.onenter();
  }

  /**
   * @override
   * @param {!Event} e
   */
  ondblclick(e) {
    if (this._entry.type === 'entry') {
      this._onActivateEntry();
      return true;
    }

    return super.ondblclick(e);
  }

  _onActivateEntry() {
    const view = self.UI.context.flavor(NetworkConsoleView);
    const reqEntry = /** @type {!NCShared.ICollectionEntryReader} */ (this._entry);
    view.switchToOrLoadRequest(this.id, reqEntry.request, undefined, undefined);
  }

  /**
   *
   * @param {!UI.ContextMenu.ContextMenu} contextMenu
   */
  appendApplicableItems(contextMenu) {
    if (this._entry.type === 'folder' || this._entry.type === 'root') {
      contextMenu.editSection().appendItem(ls`Edit Collection Authorization settings`, () => this._editAuthorization());
    }

    // TODO: https://github.com/microsoft/edge-devtools-network-console/issues/7
    // if (this._entry.type === 'root') {
    //   const exportMenu = contextMenu.editSection().appendSubMenuItem(ls`Export`);
    //   exportMenu.defaultSection().appendItem(ls`Network Console`, () => this._exportAs('nc-native'));
    //   exportMenu.defaultSection().appendItem(ls`Postman`, () => this._exportAs('postman-2.1'));
    // }

    if (this._entry.type === 'root') {
      contextMenu.defaultSection().appendItem(ls`Delete`, () => this._deleteThis());
    }
  }

  /**
   * @param {'nc-native' | 'postman-2.1'} format
   */
  _exportAs(format) {
    // TODO: https://github.com/microsoft/edge-devtools-network-console/issues/7
  }

  /**
   * Deletes the current entry. Presently only works for top-level collections.
   */
  _deleteThis() {
    // TODO: Delete from the collection and update the storage
    // https://github.com/microsoft/edge-devtools-network-console/issues/7
    if (this._entry.type === 'root') {
      this.parent.removeChild(this);
      CollectionsStorage.instance().deleteFile(this.id);
    }
  }

  _editAuthorization() {
    if (this._entry.type === 'entry') {
      return;
    }

    const folder = /** @type {!NCShared.ICollectionRootReader | !NCShared.ICollectionFolderReader} */ (this._entry);

    console.assert(!!folder.authorization);
    const paths = [this._entry.name];
    let current = /** @type {?CollectionsTreeElement} */ (this.parent);
    while (current && current._entry) {
      paths.unshift(current._entry.name);
      current = current.parent;
    }
    this._sidebar.networkConsoleView().editCollectionAuthorization(this.id, paths, folder.authorization);
  }
}
