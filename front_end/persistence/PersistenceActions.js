// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as Host from '../host/host.js';
import * as TextUtils from '../text_utils/text_utils.js';  // eslint-disable-line no-unused-vars
import * as UI from '../ui/ui.js';  // eslint-disable-line no-unused-vars
import * as Workspace from '../workspace/workspace.js';

import {NetworkPersistenceManager} from './NetworkPersistenceManager.js';
import {PersistenceImpl} from './PersistenceImpl.js';

/**
 * @implements {UI.ContextMenu.Provider}
 * @unrestricted
 */
export class ContextMenuProvider {
  /**
   * @override
   * @param {!Event} event
   * @param {!UI.ContextMenu.ContextMenu} contextMenu
   * @param {!Object} target
   */
  appendApplicableItems(event, contextMenu, target) {
    const contentProvider = /** @type {!TextUtils.ContentProvider.ContentProvider} */ (target);

    async function saveAs() {
      if (contentProvider instanceof Workspace.UISourceCode.UISourceCode) {
        /** @type {!Workspace.UISourceCode.UISourceCode} */ (contentProvider).commitWorkingCopy();
      }
      let content = (await contentProvider.requestContent()).content || '';
      if (await contentProvider.contentEncoded()) {
        content = window.atob(content);
      }
      const url = contentProvider.contentURL();
      Workspace.FileManager.FileManager.instance().save(url, /** @type {string} */ (content), true);
      Workspace.FileManager.FileManager.instance().close(url);
    }

    async function saveImage() {
      const content = (await contentProvider.requestContent()).content;
      const pageImage = new Image();
      pageImage.src = 'data:image/png;base64,' + content;
      pageImage.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = pageImage.naturalWidth;
        canvas.height = pageImage.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not get 2d context from canvas.');
        }
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(pageImage, 0, 0);
        // @ts-ignore
        const fileName = contentProvider.displayName;
        const link = document.createElement('a');
        link.download = fileName;
        canvas.toBlob(blob => {
          link.href = URL.createObjectURL(blob);
          link.click();
        });
      };
    }

    if (contentProvider.contentType().isDocumentOrScriptOrStyleSheet()) {
      contextMenu.saveSection().appendItem(Common.UIString.UIString('Save as...'), saveAs);
      // @ts-ignore
    } else if (contentProvider.contentType().isImage() && contentProvider._content) {
      contextMenu.saveSection().appendItem(Common.UIString.UIString('Save image'), saveImage);
    }

    // Retrieve uiSourceCode by URL to pick network resources everywhere.
    const uiSourceCode = Workspace.Workspace.WorkspaceImpl.instance().uiSourceCodeForURL(contentProvider.contentURL());
    if (uiSourceCode && NetworkPersistenceManager.instance().canSaveUISourceCodeForOverrides(uiSourceCode)) {
      contextMenu.saveSection().appendItem(Common.UIString.UIString('Save for overrides'), () => {
        uiSourceCode.commitWorkingCopy();
        NetworkPersistenceManager.instance().saveUISourceCodeForOverrides(
            /** @type {!Workspace.UISourceCode.UISourceCode} */ (uiSourceCode));
        Common.Revealer.reveal(uiSourceCode);
      });
    }

    const binding = uiSourceCode && PersistenceImpl.instance().binding(uiSourceCode);
    const fileURL = binding ? binding.fileSystem.contentURL() : contentProvider.contentURL();
    if (fileURL.startsWith('file://')) {
      const path = Common.ParsedURL.ParsedURL.urlToPlatformPath(fileURL, Host.Platform.isWin());
      contextMenu.revealSection().appendItem(
          Common.UIString.UIString('Open in containing folder'),
          () => Host.InspectorFrontendHost.InspectorFrontendHostInstance.showItemInFolder(path));
    }
  }
}
