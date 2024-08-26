// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';
import type * as Protocol from '../../generated/protocol.js';

export type Change = {
  selector: string,
  styles: string,
};

export const AI_ASSISTANT_CSS_CLASS_NAME = 'ai-assistant-change';

/**
 * Keeps track of changes done by Freestyler. Currently, it is primarily
 * for stylesheet generation based on all changes.
 */
export class ChangeManager {
  #changes: Array<Change> = [];

  readonly #stylesheetMutex = new Common.Mutex.Mutex();
  #cssModelToStylesheetId = new Map<SDK.CSSModel.CSSModel, Map<Protocol.Page.FrameId, Protocol.CSS.StyleSheetId>>();
  #stylesheetChanges = new Map<Protocol.CSS.StyleSheetId, Change[]>();

  async #getStylesheet(cssModel: SDK.CSSModel.CSSModel, frameId: Protocol.Page.FrameId):
      Promise<Protocol.CSS.StyleSheetId> {
    return await this.#stylesheetMutex.run(async () => {
      let frameToStylesheet = this.#cssModelToStylesheetId.get(cssModel);
      if (!frameToStylesheet) {
        frameToStylesheet = new Map();
        this.#cssModelToStylesheetId.set(cssModel, frameToStylesheet);
        cssModel.addEventListener(
            SDK.CSSModel.Events.ModelDisposed, this.#onCssModelDisposed.bind(this, cssModel), this);
      }
      let stylesheetId = frameToStylesheet.get(frameId);
      if (!stylesheetId) {
        const styleSheetHeader = await cssModel.createInspectorStylesheet(frameId);
        if (!styleSheetHeader) {
          throw new Error('inspector-stylesheet is not found');
        }
        stylesheetId = styleSheetHeader.id;
      }
      return stylesheetId;
    });
  }

  async #onCssModelDisposed(cssModel: SDK.CSSModel.CSSModel): Promise<void> {
    return await this.#stylesheetMutex.run(async () => {
      const stylesheetIds = Array.from(this.#cssModelToStylesheetId.get(cssModel)?.values() ?? []);
      // Empty stylesheets.
      await Promise.allSettled(stylesheetIds.map(async id => {
        await cssModel.setStyleSheetText(id, '', true);
        this.#stylesheetChanges.delete(id);
      }));
      this.#cssModelToStylesheetId.delete(cssModel);
    });
  }

  async clear(): Promise<void> {
    const models = Array.from(this.#cssModelToStylesheetId.keys());
    await Promise.allSettled(models.map(async model => {
      await this.#onCssModelDisposed(model);
    }));
    this.#cssModelToStylesheetId.clear();
    this.#stylesheetChanges.clear();
  }

  async addChange(cssModel: SDK.CSSModel.CSSModel, frameId: Protocol.Page.FrameId, change: Change): Promise<void> {
    this.#changes.push(change);
    const stylesheetId = await this.#getStylesheet(cssModel, frameId);
    const changes = this.#stylesheetChanges.get(stylesheetId) || [];
    changes.push(change);
    await cssModel.setStyleSheetText(stylesheetId, this.buildChanges(changes), true);
    this.#stylesheetChanges.set(stylesheetId, changes);
  }

  buildChanges(changes: Array<Change>): string {
    return `.${AI_ASSISTANT_CSS_CLASS_NAME} {
${
        changes
            .map(change => {
              return `  ${change.selector}& {
    ${change.styles}
  }`;
            })
            .join('\n')}
}`;
  }
}
