// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as CM from '../../../third_party/codemirror.next/codemirror.next.js';

export const editorTheme = CM.EditorView.theme({
  '.cm-editor': {
    lineHeight: '1.2em',
    color: 'color: var(--color-text-primary)',
  },

  '.cm-scroller': {
    fontFamily: 'var(--source-code-font-family)',
    fontSize: 'var(--source-code-font-size)',
  },

  '.cm-panels, .cm-tooltip': {
    backgroundColor: 'var(--color-background-elevation-1)',
  },

  '.cm-selectionMatch': {
    backgroundColor: '--color-selection-highlight',
  },

  '.cm-cursor': {
    borderLeft: '1px solid var(--color-background-inverted)',
  },

  '&.cm-readonly .cm-cursor': {
    display: 'none',
  },

  '.cm-cursor-secondary': {
    '--secondary-cursor-color': '#c0c0c0',
    borderLeft: '1px solid var(--secondary-cursor-color)',
  },

  '.cm-gutters': {
    borderRight: '1px solid var(--color-details-hairline)',
    whiteSpace: 'nowrap',
    backgroundColor: 'var(--color-background)',
  },

  '.cm-lineNumbers .cm-gutterElement': {
    '--line-number-color': 'hsl(0deg 0% 46%)',
    color: 'var(--line-number-color)',
    padding: '0 3px 0 9px',
  },

  '&:focus-within .cm-matchingBracket': {
    '--matching-bracket-underline': 'rgb(0 0 0 / 50%)',
    '--matching-bracket-background': 'rgb(0 0 0 / 7%)',
    backgroundColor: 'var(--matching-bracket-background)',
    borderBottom: '1px solid var(--matching-bracket-underline)',
  },

  '&:focus-within .cm-nonmatchingBracket': {
    '--nonmatching-bracket-underline': 'rgb(255 0 0 / 50%)',
    '--nonmatching-bracket-background': 'rgb(255 0 0 / 7%)',
    backgroundColor: 'var(--nonmatching-bracket-background)',
    borderBottom: '1px solid var(--nonmatching-bracket-underline)',
  },

  '.cm-whitespace::before': {
    '--whitespace-marker-color': 'rgb(175 175 175)',
    position: 'absolute',
    pointerEvents: 'none',
    color: 'var(--whitespace-marker-color)',
  },

  '.cm-placeholder': {
    color: 'var(--color-text-secondary)',
  },
});

export const editorThemeDark = CM.EditorView.theme(
    {
      '.cm-lineNumbers .cm-gutterElement': {
        '--line-number-color': 'rgb(138 138 138)',
      },

      '.cm-cursor-secondary': {
        '--secondary-cursor-color': 'rgb(63 63 63)',
      },

      '&:focus-within .cm-matchingBracket': {
        '--matching-bracket-underline': 'rgb(217 217 217)',
        '--matching-bracket-background': 'initial',
      },

      '&:focus-within .cm-nonmatchingBracket': {
        '--nonmatching-bracket-underline': 'rgb(255 26 26)',
        '--nonmatching-bracket-background': 'initial',
      },

      '.cm-whitespace::before': {
        '--whitespace-marker-color': 'rgb(80 80 80)',
      },

      '.cm-selectionBackground, .cm-content ::selection': {
        background: '#454545',
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
