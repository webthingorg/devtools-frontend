// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Workspace from '../../models/workspace/workspace.js';
import type * as CodeMirror from '../../third_party/codemirror.next/codemirror.next.js';
import * as SourceFrame from '../../ui/legacy/components/source_frame/source_frame.js';
import type * as UI from '../../ui/legacy/legacy.js';

export class Plugin {
  constructor(
      protected readonly uiSourceCode: Workspace.UISourceCode.UISourceCode,
      transformer?: SourceFrame.SourceFrame.Transformer) {
  }

  static accepts(_uiSourceCode: Workspace.UISourceCode.UISourceCode): boolean {
    return false;
  }

  wasShown(): void {
  }

  willHide(): void {
  }

  async rightToolbarItems(): Promise<UI.Toolbar.ToolbarItem[]> {
    return [];
  }

  /**
   *
   * TODO(szuend): It is OK to asyncify this function (similar to {rightToolbarItems}),
   *               but it is currently not strictly necessary.
   */
  leftToolbarItems(): UI.Toolbar.ToolbarItem[] {
    return [];
  }

  populateLineGutterContextMenu(_contextMenu: UI.ContextMenu.ContextMenu, _lineNumber: number): void {
  }

  populateTextAreaContextMenu(_contextMenu: UI.ContextMenu.ContextMenu, _lineNumber: number, _columnNumber: number):
      void {
  }

  decorationChanged(type: SourceFrame.SourceFrame.DecoratorType, editor: CodeMirror.EditorView): void {
  }

  editorExtension(): CodeMirror.Extension|null {
    return null;
  }

  editorCreated(editor: CodeMirror.EditorView): void {
  }

  dispose(): void {
  }
}
