// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../core/common/common.js';
import * as i18n from '../../../core/i18n/i18n.js';
import * as CM from '../../../third_party/codemirror.next/codemirror.next.js';

import {editorTheme, editorThemeDark, highlightStyle} from './theme.js';

const UIStrings = {
  /**
  *@description Label text for the editor
  */
  codeEditor: 'Code editor',
};
const str_ = i18n.i18n.registerUIStrings('ui/components/text_editor/config.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

const empty: CM.Extension = [];

export const dynamicSetting = CM.Facet.define<DynamicSetting<unknown>>();

// The code below is used to wire up dynamic settings to editors. When
// you include one of these objects in an editor configuration, the
// TextEditor class will take care of listening to changes in the
// setting, and updating the configuration as appropriate.

export class DynamicSetting<T> {
  compartment = new CM.Compartment();
  extension: CM.Extension;

  constructor(
      readonly settingName: string,
      private readonly get: (value: T, state: CM.EditorState) => CM.Extension,
  ) {
    this.extension = [this.compartment.of(empty), dynamicSetting.of(this as DynamicSetting<unknown>)];
  }

  sync(state: CM.EditorState, value: T): CM.StateEffect<unknown>|null {
    const cur = this.compartment.get(state);
    const needed = this.get(value, state);
    return cur === needed ? null : this.compartment.reconfigure(needed);
  }

  static bool(name: string, enabled: CM.Extension, disabled: CM.Extension = empty): DynamicSetting<boolean> {
    return new DynamicSetting<boolean>(name, val => val ? enabled : disabled);
  }
}

export const tabMovesFocus = DynamicSetting.bool('textEditorTabMovesFocus', CM.keymap.of([CM.indentWithTab]));

// export const autocompletion = DynamicSetting.bool('textEditorAutocompletion', FIXME);

export const bracketMatching = DynamicSetting.bool('textEditorBracketMatching', CM.bracketMatching());

// export const autocompletion = DynamicSetting.bool('textEditorCodeFolding', FIXME);

const LinesToScanForIndentationGuessing = 1000;

function guessIndent(doc: CM.Text): string {
  const values: {[indent: string]: number} = Object.create(null);
  let scanned = 0;
  for (let cur = doc.iterLines(1, Math.min(doc.lines + 1, LinesToScanForIndentationGuessing)); !cur.next().done;) {
    let space = (/^\s*/.exec(cur.value) as string[])[0];
    if (space.length === cur.value.length || !space.length) {
      continue;
    }
    if (space[0] === '\t') {
      space = '\t';
    } else if (/[^ ]/.test(space)) {
      continue;
    }
    scanned++;
    values[space] = (values[space] || 0) + 1;
  }
  const minOccurrence = scanned * 0.05;
  const sorted = Object.entries(values).filter(e => e[1] > minOccurrence).sort((a, b) => a[1] - b[1]);
  return sorted.length ? sorted[0][0] : Common.Settings.Settings.instance().moduleSetting('textEditorIndent').get();
}

const cachedIndentUnit: {[indent: string]: CM.Extension} = Object.create(null);

function getIndentUnit(indent: string): CM.Extension {
  let value = cachedIndentUnit[indent];
  if (!value) {
    value = cachedIndentUnit[indent] = CM.indentUnit.of(indent);
  }
  return value;
}

export const autoDetectIndent = new DynamicSetting<boolean>('textEditorAutoDetectIndent', (on, state) => {
  return on ? CM.Prec.override(getIndentUnit(guessIndent(state.doc))) : empty;
});

function matcher(decorator: CM.MatchDecorator): CM.Extension {
  return CM.ViewPlugin.define(
      view => ({
        decorations: decorator.createDeco(view),
        update(u): void {
          this.decorations = decorator.updateDeco(u, this.decorations);
        },
      }),
      {
        decorations: v => v.decorations,
      });
}

const showAllWhitespace = matcher(new CM.MatchDecorator({
  regexp: /\s+/g,
  decoration: CM.Decoration.mark({class: 'cm-whitespace'}),
  boundary: /\S/,
}));

const showTrailingWhitespace = matcher(new CM.MatchDecorator({
  regexp: /\s+$/g,
  decoration: CM.Decoration.mark({class: 'cm-trailing-whitespace'}),
  boundary: /\S/,
}));

export const showWhitespace = new DynamicSetting<string>('showWhitespacesInEditor', value => {
  if (value === 'all') {
    return showAllWhitespace;
  }
  if (value === 'trailing') {
    return showTrailingWhitespace;
  }
  return empty;
});

// export const inlineVariableValues = DynamicSetting.bool('inlineVariableValues', FIXME);

export const allowScrollPastEof = DynamicSetting.bool('allowScrollPastEof', CM.scrollPastEnd());

export const indentUnit = new DynamicSetting<string>('textEditorIndent', getIndentUnit);

export const domWordWrap = DynamicSetting.bool('domWordWrap', CM.EditorView.lineWrapping);

function themeIsDark(): boolean {
  const setting = Common.Settings.Settings.instance().moduleSetting('uiTheme').get();
  return setting === 'systemPreferred' ? window.matchMedia('(prefers-color-scheme: dark)').matches : setting === 'dark';
}

function detectLineSeparator(text: string): CM.Extension {
  if (/\r\n/.test(text) && !/(^|[^\r])\n/.test(text)) {
    return CM.EditorState.lineSeparator.of('\r\n');
  }
  return [];
}

const baseKeymap = CM.keymap.of([
  ...CM.closeBracketsKeymap,
  ...CM.standardKeymap,
  ...CM.historyKeymap,
  {key: 'Ctrl-m', run: CM.cursorMatchingBracket, shift: CM.selectMatchingBracket},
  {key: 'Mod-/', run: CM.toggleComment},
  {key: 'Mod-d', run: CM.selectNextOccurrence},
  {key: 'Alt-ArrowLeft', mac: 'Ctrl-ArrowLeft', run: CM.cursorSubwordBackward, shift: CM.selectSubwordBackward},
  {key: 'Alt-ArrowRight', mac: 'Ctrl-ArrowRight', run: CM.cursorSubwordForward, shift: CM.selectSubwordForward},
]);

export function baseConfiguration(text: string): CM.Extension {
  return [
    themeIsDark() ? editorThemeDark : [],
    editorTheme,
    CM.highlightSpecialChars(),
    CM.history(),
    CM.drawSelection(),
    CM.EditorState.allowMultipleSelections.of(true),
    CM.indentOnInput(),
    highlightStyle,
    CM.closeBrackets(),
    baseKeymap,
    tabMovesFocus,
    bracketMatching,
    indentUnit,
    CM.Prec.fallback(CM.EditorView.contentAttributes.of({label: i18nString(UIStrings.codeEditor)})),
    detectLineSeparator(text),
  ];
}
