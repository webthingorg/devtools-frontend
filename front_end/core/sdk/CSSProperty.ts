// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TextUtils from '../../models/text_utils/text_utils.js';
import type * as Common from '../common/common.js';
import * as HostModule from '../host/host.js';
import * as Platform from '../platform/platform.js';
import type * as Protocol from '../../generated/protocol.js';

import type {Edit} from './CSSModel.js';
import type {CSSStyleDeclaration} from './CSSStyleDeclaration.js';

export class CSSProperty {
  ownerStyle: CSSStyleDeclaration;
  index: number;
  name: string;
  value: string;
  important: boolean;
  disabled: boolean;
  parsedOk: boolean;
  implicit: boolean;
  text: string|null|undefined;
  range: TextUtils.TextRange.TextRange|null;
  #active: boolean;
  #nameRangeInternal: TextUtils.TextRange.TextRange|null;
  #valueRangeInternal: TextUtils.TextRange.TextRange|null;
  #invalidString?: Common.UIString.LocalizedString;

  constructor(
      ownerStyle: CSSStyleDeclaration, index: number, name: string, value: string, important: boolean,
      disabled: boolean, parsedOk: boolean, implicit: boolean, text?: string|null, range?: Protocol.CSS.SourceRange) {
    this.ownerStyle = ownerStyle;
    this.index = index;
    this.name = name;
    this.value = value;
    this.important = important;
    this.disabled = disabled;
    this.parsedOk = parsedOk;
    this.implicit = implicit;  // A longhand, implicitly set by missing values of shorthand.
    this.text = text;
    this.range = range ? TextUtils.TextRange.TextRange.fromObject(range) : null;
    this.#active = true;
    this.#nameRangeInternal = null;
    this.#valueRangeInternal = null;
  }

  static parsePayload(ownerStyle: CSSStyleDeclaration, index: number, payload: Protocol.CSS.CSSProperty): CSSProperty {
    // The following default field values are used in the payload:
    // important: false
    // parsedOk: true
    // implicit: false
    // disabled: false
    const result = new CSSProperty(
        ownerStyle, index, payload.name, payload.value, payload.important || false, payload.disabled || false,
        ('parsedOk' in payload) ? Boolean(payload.parsedOk) : true, Boolean(payload.implicit), payload.text,
        payload.range);
    return result;
  }

  private ensureRanges(): void {
    if (this.#nameRangeInternal && this.#valueRangeInternal) {
      return;
    }
    const range = this.range;
    const text = this.text ? new TextUtils.Text.Text(this.text) : null;
    if (!range || !text) {
      return;
    }

    const nameIndex = text.value().indexOf(this.name);
    const valueIndex = text.value().lastIndexOf(this.value);
    if (nameIndex === -1 || valueIndex === -1 || nameIndex > valueIndex) {
      return;
    }

    const nameSourceRange = new TextUtils.TextRange.SourceRange(nameIndex, this.name.length);
    const valueSourceRange = new TextUtils.TextRange.SourceRange(valueIndex, this.value.length);

    this.#nameRangeInternal = rebase(text.toTextRange(nameSourceRange), range.startLine, range.startColumn);
    this.#valueRangeInternal = rebase(text.toTextRange(valueSourceRange), range.startLine, range.startColumn);

    function rebase(oneLineRange: TextUtils.TextRange.TextRange, lineOffset: number, columnOffset: number):
        TextUtils.TextRange.TextRange {
      if (oneLineRange.startLine === 0) {
        oneLineRange.startColumn += columnOffset;
        oneLineRange.endColumn += columnOffset;
      }
      oneLineRange.startLine += lineOffset;
      oneLineRange.endLine += lineOffset;
      return oneLineRange;
    }
  }

  nameRange(): TextUtils.TextRange.TextRange|null {
    this.ensureRanges();
    return this.#nameRangeInternal;
  }

  valueRange(): TextUtils.TextRange.TextRange|null {
    this.ensureRanges();
    return this.#valueRangeInternal;
  }

  rebase(edit: Edit): void {
    if (this.ownerStyle.styleSheetId !== edit.styleSheetId) {
      return;
    }
    if (this.range) {
      this.range = this.range.rebaseAfterTextEdit(edit.oldRange, edit.newRange);
    }
  }

  setActive(active: boolean): void {
    this.#active = active;
  }

  get propertyText(): string|null {
    if (this.text !== undefined) {
      return this.text;
    }

    if (this.name === '') {
      return '';
    }
    return this.name + ': ' + this.value + (this.important ? ' !important' : '') + ';';
  }

  activeInStyle(): boolean {
    return this.#active;
  }

  trimmedValueWithoutImportant(): string {
    const important = '!important';
    return this.value.endsWith(important) ? this.value.slice(0, -important.length).trim() : this.value.trim();
  }

  async setText(propertyText: string, majorChange: boolean, overwrite?: boolean): Promise<boolean> {
    if (!this.ownerStyle) {
      return Promise.reject(new Error('No ownerStyle for property'));
    }

    if (!this.ownerStyle.styleSheetId) {
      return Promise.reject(new Error('No owner style id'));
    }

    if (!this.range || !this.ownerStyle.range) {
      return Promise.reject(new Error('Style not editable'));
    }

    if (majorChange) {
      HostModule.userMetrics.actionTaken(HostModule.UserMetrics.Action.StyleRuleEdited);
      if (this.name.startsWith('--')) {
        HostModule.userMetrics.actionTaken(HostModule.UserMetrics.Action.CustomPropertyEdited);
      }
    }

    if (overwrite && propertyText === this.propertyText) {
      this.ownerStyle.cssModel().domModel().markUndoableState(!majorChange);
      return Promise.resolve(true);
    }

    const range = this.range.relativeTo(this.ownerStyle.range.startLine, this.ownerStyle.range.startColumn);
    const text = new TextUtils.Text.Text(this.ownerStyle.cssText || '');
    const newStyleText = text.replaceRange(range, Platform.StringUtilities.sprintf(';%s;', propertyText));
    const removedDoubleSemicolons =
        newStyleText
            // Replace all multiple consecutive occurrences of any semicolon. Since having multiple consecutive occurrences
            // is the same as only 1 semicolon, we can remove this. The reason that we may introduce consecutive semicolons
            // is because we wrap the new property in semicolons (to ensure the replacement is legal CSS syntax).
            .replace(/;{2,}/g, ';')
            // In the event that we enable/disable a property and we add a semicolon in front of it, we would introduce multiple
            // semicolons, but this time separate by whitespace. Therefore, remove these and replace them with the first semicolon
            // and whitespace, but removing the last one.
            .replace(/;(\s+);/g, ';$1');
    return this.ownerStyle.setText(removedDoubleSemicolons, majorChange);
  }

  setValue(newValue: string, majorChange: boolean, overwrite: boolean, userCallback?: ((arg0: boolean) => void)): void {
    const text = this.name + ': ' + newValue + (this.important ? ' !important' : '') + ';';
    void this.setText(text, majorChange, overwrite).then(userCallback);
  }

  setDisabled(disabled: boolean): Promise<boolean> {
    if (!this.ownerStyle) {
      return Promise.resolve(false);
    }
    if (disabled === this.disabled) {
      return Promise.resolve(true);
    }
    if (!this.text) {
      return Promise.resolve(true);
    }
    const propertyText = this.text.trim();
    const text = disabled ? '/* ' + propertyText + ' */' : this.text.substring(2, propertyText.length - 2).trim();
    return this.setText(text, true, true);
  }

  /**
   * This stores the warning string when a CSS Property is improperly parsed.
   */
  setDisplayedStringForInvalidProperty(invalidString: Common.UIString.LocalizedString): void {
    this.#invalidString = invalidString;
  }

  /**
   * Retrieve the warning string for a screen reader to announce when editing the property.
   */
  getInvalidStringForInvalidProperty(): Common.UIString.LocalizedString|undefined {
    return this.#invalidString;
  }
}
