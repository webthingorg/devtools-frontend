// Base script used with Rollup to bundle the necessary CodeMirror
// components.
//
// Note that this file is also used as a TypeScript source to bundle
// the .d.ts files.

export {closeBrackets, closeBracketsKeymap} from "@codemirror/closebrackets"
export { indentWithTab,standardKeymap} from "@codemirror/commands"
export {lineNumbers} from "@codemirror/gutter"
export { HighlightStyle,Tag, tags, TagStyle} from "@codemirror/highlight"
export {history, historyKeymap, redo, redoSelection, undo, undoSelection} from "@codemirror/history"
export {css} from "@codemirror/lang-css"
export {html} from "@codemirror/lang-html"
export {javascript} from "@codemirror/lang-javascript"
export {indentOnInput, indentUnit} from "@codemirror/language"
export {bracketMatching} from "@codemirror/matchbrackets"
export {Range, RangeSet} from "@codemirror/rangeset"
export { Annotation, AnnotationType,
  Compartment, EditorSelection,
  EditorState, EditorStateConfig, Extension, Facet, Prec
, SelectionRange,
  StateEffect, StateEffectType, StateField, Transaction, TransactionSpec} from "@codemirror/state"
export { Line,Text, TextIterator} from "@codemirror/text"
export { Command,
  Decoration, drawSelection,
  EditorView, highlightSpecialChars, KeyBinding, keymap, MatchDecorator, scrollPastEnd, ViewPlugin, ViewUpdate, WidgetType,
} from "@codemirror/view"             

