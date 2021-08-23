// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as CM from '../../../third_party/codemirror.next/codemirror.next.js';

export const editorTheme = CM.EditorView.theme({
  '.cm-editor': {
    '--override-search-highlight-border-color': 'rgb(128 128 128)',
    lineHeight: '1.2em',
    color: 'color: var(--color-text-primary)',
  },

  '.cm-cursor': {
    borderLeft: '1px solid var(--color-background-inverted)',
  },

  '&.cm-readonly .cm-cursor': {
    display: 'none',
  },

  '.cm-cursor-secondary': {
    '--override-auto-gen-codemirrordivcodemirrorsecondarycursor-borderleft': '#c0c0c0',
    borderLeft: '1px solid var(--override-auto-gen-codemirrordivcodemirrorsecondarycursor-borderleft)',
  },

  '.cm-gutters': {
    borderRight: '1px solid var(--color-details-hairline)',
    whiteSpace: 'nowrap',
    backgroundColor: 'var(--color-background)',
  },

  '.cm-lineNumbers .cm-gutterElement': {
    '--override-auto-gen-codemirrorlinenumber-color': 'hsl(0deg 0% 46%)',
    color: 'var(--override-auto-gen-codemirrorlinenumber-color)',
    padding: '0 3px 0 9px',
  },

  '&:focus-within .cm-matchingBracket': {
    '--override-auto-gen-divcodemirrorfocuswithinspancodemirrormatchingbracket-borderbottom': 'rgb(0 0 0 / 50%)',
    '--override-auto-gen-divcodemirrorfocuswithinspancodemirrormatchingbracket-backgroundcolor': 'rgb(0 0 0 / 7%)',
    backgroundColor: 'var(--override-auto-gen-divcodemirrorfocuswithinspancodemirrormatchingbracket-backgroundcolor)',
    borderBottom:
        '1px solid var(--override-auto-gen-divcodemirrorfocuswithinspancodemirrormatchingbracket-borderbottom)',
  },

  '&:focus-within .cm-nonmatchingBracket': {
    '--override-auto-gen-divcodemirrorfocuswithinspancodemirrornonmatchingbracket-borderbottom': 'rgb(255 0 0 / 50%)',
    '--override-auto-gen-divcodemirrorfocuswithinspancodemirrornonmatchingbracket-backgroundcolor': 'rgb(255 0 0 / 7%)',
    backgroundColor:
        'var(--override-auto-gen-divcodemirrorfocuswithinspancodemirrornonmatchingbracket-backgroundcolor)',
    borderBottom:
        '1px solid var(--override-auto-gen-divcodemirrorfocuswithinspancodemirrornonmatchingbracket-borderbottom)',
  },

  '.cm-whitespace::before': {
    '--override-auto-gen-cmwhitespacebefore-color': 'rgb(175 175 175)',
    position: 'absolute',
    pointerEvents: 'none',
    color: 'var(--override-auto-gen-cmwhitespacebefore-color)',
  },

  '.cm-placeholder': {
    color: 'var(--color-text-secondary)',
  },
});

export const editorThemeDark = CM.EditorView.theme(
    {
      '.cm-lineNumbers .cm-gutterElement': {
        '--override-auto-gen-codemirrorlinenumber-color': 'rgb(138 138 138)',
      },

      '.cm-cursor-secondary': {
        '--override-auto-gen-codemirrordivcodemirrorsecondarycursor-borderleft': 'rgb(63 63 63)',
      },

      '&:focus-within .cm-matchingBracket': {
        '--override-auto-gen-divcodemirrorfocuswithinspancodemirrormatchingbracket-borderbottom': 'rgb(217 217 217)',
        '--override-auto-gen-divcodemirrorfocuswithinspancodemirrormatchingbracket-backgroundcolor': 'initial',
      },

      '&:focus-within .cm-nonmatchingBracket': {
        '--override-auto-gen-divcodemirrorfocuswithinspancodemirrornonmatchingbracket-borderbottom': 'rgb(255 26 26)',
        '--override-auto-gen-divcodemirrorfocuswithinspancodemirrornonmatchingbracket-backgroundcolor': 'initial',
      },

      '.cm-whitespace::before': {
        '--override-auto-gen-cmwhitespacebefore-color': 'rgb(80 80 80)',
      },
    },
    {dark: true});

const t = CM.tags;

export const highlightStyle = CM.HighlightStyle.define([
  {tag: [t.processingInstruction, t.string, t.regexp, t.character], color: 'var(--color-syntax-1)'},
  {tag: [t.propertyName, t.macroName, t.labelName, t.typeName, t.className], color: 'var(--color-syntax-2)'},
  {tag: t.heading, fontWeight: 'bold', color: 'var(--color-syntax-2)'},
  {tag: t.definition(t.name), color: 'var(--color-syntax-3)'},
  {tag: t.link, color: 'var(--color-syntax-3)', textDecoration: 'underline'},
  {tag: [t.number, t.bool, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: 'var(--color-syntax-4)'},
  {tag: [t.literal], color: 'var(--color-syntax-5)'},
  {tag: t.keyword, color: 'var(--color-syntax-6)'},
  {tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.link, t.special(t.string)], color: 'var(--color-syntax-7)'},
  {tag: [t.meta, t.comment], color: 'var(--color-syntax-8)'},
  {tag: t.strong, fontWeight: 'bold'},
  {tag: t.emphasis, fontStyle: 'italic'},
  {tag: t.strikethrough, textDecoration: 'line-through'},
  {tag: t.invalid, color: 'var(--color-error-text)'},
]);
