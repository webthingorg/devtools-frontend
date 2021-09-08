// Base script used with Rollup to bundle the necessary CodeMirror
// components.
//
// Note that this file is also used as a TypeScript source to bundle
// the .d.ts files.

export {
  autocompletion, completeAnyWord, Completion, CompletionContext,
  CompletionResult, CompletionSource, ifNotIn
} from "@codemirror/autocomplete"
export {closeBrackets, closeBracketsKeymap} from "@codemirror/closebrackets"
export {
  cursorMatchingBracket, cursorSubwordBackward, cursorSubwordForward,
  indentWithTab, selectMatchingBracket, selectSubwordBackward, selectSubwordForward,
  standardKeymap
} from "@codemirror/commands"
export {toggleComment} from "@codemirror/comment"
export {codeFolding, foldGutter, foldKeymap} from "@codemirror/fold"
export {lineNumbers} from "@codemirror/gutter"
export {HighlightStyle, Tag, tags, TagStyle} from "@codemirror/highlight"
export {history, historyKeymap, redo, redoSelection, undo, undoSelection} from "@codemirror/history"
export {css} from "@codemirror/lang-css"
export {html} from "@codemirror/lang-html"
export {javascriptLanguage} from "@codemirror/lang-javascript"
export {indentOnInput, indentUnit, syntaxTree} from "@codemirror/language"
export {bracketMatching} from "@codemirror/matchbrackets"
export {Range, RangeSet} from "@codemirror/rangeset"
export {selectNextOccurrence} from "@codemirror/search"
export {
  Annotation, AnnotationType, Compartment, EditorSelection,
  EditorState, EditorStateConfig, Extension, Facet, Prec, SelectionRange,
  StateEffect, StateEffectType, StateField, Transaction, TransactionSpec
} from "@codemirror/state"
export {Line, Text, TextIterator} from "@codemirror/text"
export {showTooltip, Tooltip, tooltips, TooltipView} from "@codemirror/tooltip"
export {
  Command, Decoration, drawSelection, EditorView,
  highlightSpecialChars, KeyBinding, keymap, MatchDecorator, placeholder,
  scrollPastEnd, ViewPlugin, ViewUpdate, WidgetType,
} from "@codemirror/view"
export {
  NodeProp, NodeSet, NodeType, Parser, SyntaxNode, Tree, TreeCursor
} from "@lezer/common"
