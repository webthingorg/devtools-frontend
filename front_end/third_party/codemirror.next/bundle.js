// Base script used with Rollup to bundle the necessary CodeMirror
// components.
//
// Note that this file is also used as a TypeScript source to bundle
// the .d.ts files.

import * as closebrackets from "@codemirror/closebrackets"
import * as commands from "@codemirror/commands"
import * as gutter from "@codemirror/gutter"
import * as highlight from "@codemirror/highlight"
import * as history from "@codemirror/history"
import * as langCss from "@codemirror/lang-css"
import * as langHtml from "@codemirror/lang-html"
import * as langJavascript from "@codemirror/lang-javascript"
import * as language from "@codemirror/language"
import * as matchbrackets from "@codemirror/matchbrackets"
import * as state from "@codemirror/state"
import * as view from "@codemirror/view"

export {
  closebrackets,
  commands,
  gutter,
  highlight,
  history,
  langCss,
  langHtml,
  langJavascript,
  language,
  matchbrackets,
  state,
  view
}

