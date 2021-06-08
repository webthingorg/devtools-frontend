// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable rulesdir/no_underscored_properties */

import * as TextUtils from '../../models/text_utils/text_utils.js';
import type * as Protocol from '../../generated/protocol.js';

import type {CSSModel, Edit} from './CSSModel.js';
import {CSSLocation} from './CSSModel.js';                         // eslint-disable-line no-unused-vars
import type {CSSStyleSheetHeader} from './CSSStyleSheetHeader.js'; // eslint-disable-line no-unused-vars

export class CSSContainerQuery {
  static parsePayload(cssModel: CSSModel, payload: Protocol.CSS.CSSContainerQuery): CSSContainerQuery {
    return new CSSContainerQuery(cssModel, payload);
  }

  static parseContainerQueriesPayload(cssModel: CSSModel, payload: Protocol.CSS.CSSContainerQuery[]):
      CSSContainerQuery[] {
    return payload.map(cq => CSSContainerQuery.parsePayload(cssModel, cq));
  }

  text = '';
  range?: TextUtils.TextRange.TextRange|null;
  styleSheetId?: string;
  private cssModel: CSSModel;

  constructor(cssModel: CSSModel, payload: Protocol.CSS.CSSContainerQuery) {
    this.cssModel = cssModel;
    this.reinitialize(payload);
  }

  private reinitialize(payload: Protocol.CSS.CSSContainerQuery): void {
    this.text = payload.text;
    this.range = payload.range ? TextUtils.TextRange.TextRange.fromObject(payload.range) : null;
    this.styleSheetId = payload.styleSheetId;
  }

  rebase(edit: Edit): void {
    if (this.styleSheetId !== edit.styleSheetId || !this.range) {
      return;
    }
    if (edit.oldRange.equal(this.range)) {
      this.reinitialize((edit.payload as Protocol.CSS.CSSContainerQuery));
    } else {
      this.range = this.range.rebaseAfterTextEdit(edit.oldRange, edit.newRange);
    }
  }

  equal(other: CSSContainerQuery): boolean {
    if (!this.styleSheetId || !this.range || !other.range) {
      return false;
    }
    return this.styleSheetId === other.styleSheetId && this.range.equal(other.range);
  }

  active(): boolean {
    return true;
  }

  lineNumberInSource(): number|undefined {
    if (!this.range) {
      return undefined;
    }
    return this.header()?.lineNumberInSource(this.range.startLine);
  }

  columnNumberInSource(): number|undefined {
    if (!this.range) {
      return undefined;
    }
    return this.header()?.columnNumberInSource(this.range.startLine, this.range.startColumn);
  }

  header(): CSSStyleSheetHeader|null {
    return this.styleSheetId ? this.cssModel.styleSheetHeaderForId(this.styleSheetId) : null;
  }

  rawLocation(): CSSLocation|null {
    const header = this.header();
    if (!header || this.lineNumberInSource() === undefined) {
      return null;
    }
    const lineNumber = Number(this.lineNumberInSource());
    return new CSSLocation(header, lineNumber, this.columnNumberInSource());
  }
}

export const Source = {
  LINKED_SHEET: 'linkedSheet',
  INLINE_SHEET: 'inlineSheet',
  MEDIA_RULE: 'mediaRule',
  IMPORT_RULE: 'importRule',
};
