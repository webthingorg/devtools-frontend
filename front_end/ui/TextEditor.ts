// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable rulesdir/no_underscored_properties */

import * as Common from '../common/common.js';
import * as TextUtils from '../text_utils/text_utils.js'; // eslint-disable-line no-unused-vars

import { AnchorBehavior } from './GlassPane.js'; // eslint-disable-line no-unused-vars
import { Suggestions } from './SuggestBox.js'; // eslint-disable-line no-unused-vars
import { Widget } from './Widget.js'; // eslint-disable-line no-unused-vars

/**
 * @interface
 */
export interface TextEditorFactory {
  createEditor(options: Options): TextEditor;
}

/**
 * @interface
 */
export interface TextEditor extends Common.EventTarget.EventTarget {
  widget(): Widget;

  fullRange(): TextUtils.TextRange.TextRange;

  selection(): TextUtils.TextRange.TextRange;

  setSelection(selection: TextUtils.TextRange.TextRange): void;

  text(textRange?: TextUtils.TextRange.TextRange): string;

  textWithCurrentSuggestion(): string;

  setText(text: string): void;

  line(lineNumber: number): string;

  newlineAndIndent(): void;

  addKeyDownHandler(handler: (arg0: KeyboardEvent) => void): void;

  configureAutocomplete(config: AutocompleteConfig | null): void;

  clearAutocomplete(): void;

  visualCoordinates(lineNumber: number, columnNumber: number): {
    x: number;
    y: number;
  };

  tokenAtTextPosition(lineNumber: number, columnNumber: number): {
    startColumn: number;
    endColumn: number;
    type: string;
  } | null;

  setPlaceholder(placeholder: string): void;
}

export const enum Events {
  CursorChanged = 'CursorChanged',
  TextChanged = 'TextChanged',
  SuggestionChanged = 'SuggestionChanged'
}
;
export interface Options {
  bracketMatchingSetting?: Common.Settings.Setting<any>;
  devtoolsAccessibleName?: string;
  lineNumbers: boolean;
  lineWrapping: boolean;
  mimeType?: string;
  autoHeight?: boolean;
  padBottom?: boolean;
  maxHighlightLength?: number;
  placeholder?: string;
  lineWiseCopyCut?: boolean;
  inputStyle?: string;
}
export interface AutocompleteConfig {
  substituteRangeCallback?: ((arg0: number, arg1: number) => TextUtils.TextRange.TextRange | null);
  tooltipCallback?: ((arg0: number, arg1: number) => Promise<Element | null>);
  suggestionsCallback?: ((arg0: TextUtils.TextRange.TextRange, arg1: TextUtils.TextRange.TextRange, arg2?: boolean | undefined) => Promise<import("/usr/local/google/home/janscheffler/dev/devtools/devtools-frontend/front_end/ui/SuggestBox").Suggestion[]> | null);
  isWordChar?: ((arg0: string) => boolean);
  anchorBehavior?: symbol;
}
