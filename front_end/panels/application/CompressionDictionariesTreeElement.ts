// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../core/i18n/i18n.js';
import type * as Platform from '../../core/platform/platform.js';
import * as SDK from '../../core/sdk/sdk.js';
import type * as Protocol from '../../generated/protocol.js';
import * as IconButton from '../../ui/components/icon_button/icon_button.js';
import * as LegacyWrapper from '../../ui/components/legacy_wrapper/legacy_wrapper.js';
import * as UI from '../../ui/legacy/legacy.js';

import {ApplicationPanelTreeElement, ExpandableApplicationPanelTreeElement} from './ApplicationPanelTreeElement.js';
import {
  CompressionDictionariesModel,
  Events as CompressionDictionariesModelEvents
} from './CompressionDictionariesModel.js';
import {CompressionDictionariesView} from './CompressionDictionariesView.js';
import {type ResourcesPanel} from './ResourcesPanel.js';


const UIStrings = {
  /**
   *@description Label for an item in the Application Panel Sidebar of the Application panel
   * Compression Dictionaries allow developers to manage registered compression dictionaries.
   */
  compressionDictionaries: 'Compression dictionaries',
};

const str_ = i18n.i18n.registerUIStrings('panels/application/CompressionDictionariesTreeElement.ts', UIStrings);
export const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class ComressionDictionariesTreeElement extends ApplicationPanelTreeElement {
  readonly #model: CompressionDictionariesModel;
  readonly #view: LegacyWrapper.LegacyWrapper.LegacyWrapper<UI.Widget.Widget, CompressionDictionariesView>;


  constructor(
      resourcesPanel: ResourcesPanel, model: CompressionDictionariesModel,
      info: Protocol.Network.CompressionDictionaryStorageInfo) {
    super(resourcesPanel, info.frameOrigin, false);
    this.#model = model;
    this.#view = LegacyWrapper.LegacyWrapper.legacyWrapper(
        UI.Widget.Widget, new CompressionDictionariesView(), 'compression-dictionaries-grid');
    this.updateInfo(info);
  }

  static createElement(
      resourcesPanel: ResourcesPanel, model: CompressionDictionariesModel,
      info: Protocol.Network.CompressionDictionaryStorageInfo): ComressionDictionariesTreeElement {
    const treeElement = new ComressionDictionariesTreeElement(resourcesPanel, model, info);
    // treeElement.view = await SharedStorageItemsView.createView(sharedStorage);
    return treeElement;
  }

  override get itemURL(): Platform.DevToolsPath.UrlString {
    return 'compression-dictionary://' as Platform.DevToolsPath.UrlString;
  }

  override onselect(selectedByUser: boolean|undefined): boolean {
    super.onselect(selectedByUser);
    this.resourcesPanel.showView(this.#view);
    return false;
  }

  updateInfo(info: Protocol.Network.CompressionDictionaryStorageInfo): void {
    this.#view.getComponent().data = info;
  }
}


export class ComressionDictionariesTreeParentElement extends ExpandableApplicationPanelTreeElement {
  #model: CompressionDictionariesModel|null;
  readonly #treeElements: Map<string, ComressionDictionariesTreeElement>;
  constructor(storagePanel: ResourcesPanel) {
    super(storagePanel, i18nString(UIStrings.compressionDictionaries), 'compression-dictionaries');
    this.#model = null;
    this.#treeElements = new Map();
    const icon = IconButton.Icon.create('database');
    this.setLeadingIcons([icon]);
    this.setLink('https://github.com/WICG/compression-dictionary-transport' as Platform.DevToolsPath.UrlString);
  }

  override get itemURL(): Platform.DevToolsPath.UrlString {
    return 'category://' + this.categoryName as Platform.DevToolsPath.UrlString;
  }

  initialize(target?: SDK.Target.Target): void {
    const model = target?.model(CompressionDictionariesModel);
    if (this.#model == model) {
      return;
    }
    if (this.#model) {
      this.#model.disable();
      this.#model.removeEventListener(
          CompressionDictionariesModelEvents.CompressionDictionaryStorageChanged,
          this.#compressionDictionaryStorageChanged, this)
    }
    if (model) {
      this.#model = model;
      this.#model.enable();
      this.#model.addEventListener(
          CompressionDictionariesModelEvents.CompressionDictionaryStorageChanged,
          this.#compressionDictionaryStorageChanged, this)
    } else {
      this.#model = null;
    }
    this.refreshTree();
  }

  #compressionDictionaryStorageChanged(): void {
    console.log('#compressionDictionaryStorageChanged');
    this.refreshTree();
  }

  refreshTree(): void {
    const storages: Map<string, Protocol.Network.CompressionDictionaryStorageInfo> =
        this.#model ? this.#model.storages : new Map();
    for (const [key, treeElement] of this.#treeElements) {
      const info = storages.get(key);
      if (info == undefined) {
        this.removeChild(treeElement);
        this.#treeElements.delete(key);
      } else {
        treeElement.updateInfo(info);
      }
    }
    if (!this.#model) {
      return;
    }
    for (const [key, info] of storages) {
      if (!this.#treeElements.has(key)) {
        const element = ComressionDictionariesTreeElement.createElement(this.resourcesPanel, this.#model, info);
        this.#treeElements.set(key, element);
        this.appendChild(element);
      }
    }
  }
}
