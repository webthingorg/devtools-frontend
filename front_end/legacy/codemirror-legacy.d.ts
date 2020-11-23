// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as CodeMirrorModule from 'codemirror';

declare global {
  var CodeMirror: typeof CodeMirrorModule;

  namespace CodeMirror {
    // These are commands we add to CodeMirror.commands, which is allowed
    // although makes TS very upset unless we define them here.
    interface CommandActions {
      smartNewlineAndIndent(cm: Editor): void;
      sourcesDismiss(cm: Editor): Object|undefined;
      autocomplete(cm: Editor): void;
      undoLastSelection(cm: Editor): void;
      selectNextOccurrence(cm: Editor): void;
      moveCamelLeft(cm: Editor): void;
      selectCamelLeft(cm: Editor): void;
      moveCamelRight(cm: Editor): void;
      selectCamelRight(cm: Editor): void;
      UserIndent(cm: Editor): void;
      indentLessOrPass(cm: Editor): void;
      gotoMatchingBracket(cm: Editor): void;
      undoAndReveal(cm: Editor): void;
      redoAndReveal(cm: Editor): void;
      dismiss(cm: Editor): Object|undefined;
      goSmartPageUp(cm: Editor): void;
      goSmartPageDown(cm: Editor): void;
    }

    // This is actually in CodeMirror but the types aren't up to date.
    interface Doc extends CodeMirrorModule.Doc {
      replaceSelections(replacements: Array<string>, select?: string): void;
      findMatchingBracket(where: CodeMirrorModule.Position): {to: CodeMirrorModule.Position, match: boolean}|null;
    }

    interface Editor extends CodeMirrorModule.Editor, Doc {
      doc: Doc;
    }

    interface LineHandle extends CodeMirrorModule.LineHandle {}
    interface StringStream extends CodeMirrorModule.StringStream {}
    interface TextMarker extends CodeMirrorModule.TextMarker {}
    interface Position extends CodeMirrorModule.Position {}
    interface KeyMap extends CodeMirrorModule.KeyMap {}
    interface Pass {}
    interface Pos {
      ch: number;
      line: number;
      sticky?: string;
    }
  }
}


export {}