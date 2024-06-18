// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../core/i18n/i18n.js';
import type * as Platform from '../../core/platform/platform.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as IconButton from '../../ui/components/icon_button/icon_button.js';

import {ExpandableApplicationPanelTreeElement} from './ApplicationPanelTreeElement.js';
import {type ResourcesPanel} from './ResourcesPanel.js';

interface OriginInfo {
  topFrameSecurityOrigin: string;
  frameSecurityOrigin: string;
}

function getOriginInfo(frame: SDK.ResourceTreeModel.ResourceTreeFrame): OriginInfo|null {
  const frameSecurityOriginn = frame.securityOrigin;
  if (frameSecurityOriginn === null) {
    return null;
  }
  let topFrameSecurityOrigin: string|null = null;
  let ancestor: SDK.ResourceTreeModel.ResourceTreeFrame|null = frame;
  while (ancestor) {
    topFrameSecurityOrigin = ancestor.securityOrigin;
    ancestor = ancestor.parentFrame();
  }
  if (topFrameSecurityOrigin === null) {
    return null;
  }
  return {
    topFrameSecurityOrigin: topFrameSecurityOrigin,
    frameSecurityOrigin: frameSecurityOriginn,
  };
}

const UIStrings = {
  /**
   *@description Label for an item in the Application Panel Sidebar of the Application panel
   * Compression Dictionaries allow developers to manage registered compression dictionaries.
   */
  compressionDictionaries: 'Compression dictionaries',
};

const str_ = i18n.i18n.registerUIStrings('panels/application/CompressionDictionariesTreeElement.ts', UIStrings);
export const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class ComressionDictionariesTreeParentElement extends ExpandableApplicationPanelTreeElement {
  constructor(storagePanel: ResourcesPanel) {
    super(storagePanel, i18nString(UIStrings.compressionDictionaries), 'compression-dictionaries');
    const icon = IconButton.Icon.create('database');
    this.setLeadingIcons([icon]);
    this.setLink('https://github.com/WICG/compression-dictionary-transport' as Platform.DevToolsPath.UrlString);
  }

  override get itemURL(): Platform.DevToolsPath.UrlString {
    return 'category://' + this.categoryName as Platform.DevToolsPath.UrlString;
  }

  initialize(): void {
    const origins = new Map<string, OriginInfo>();
    const frameManager = SDK.FrameManager.FrameManager.instance();
    const frames = frameManager.getAllFrames();
    for (const frame of frames) {
      const originInfo = getOriginInfo(frame);
      if (originInfo) {
        origins.set(originInfo.frameSecurityOrigin + '\0' + originInfo.topFrameSecurityOrigin, originInfo);
      }
    }
    const frameOriginArray = Array.from(origins.values());
    console.log(frameOriginArray);
  }
}
