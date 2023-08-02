// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Protocol from '../../../../generated/protocol.js';
import * as CodeMirror from '../../../../third_party/codemirror.next/codemirror.next.js';
import * as CodeHighlighter from '../../../../ui/components/code_highlighter/code_highlighter.js';
import * as ComponentHelpers from '../../../../ui/components/helpers/helpers.js';
import * as LegacyWrapper from '../../../../ui/components/legacy_wrapper/legacy_wrapper.js';
import * as Coordinator from '../../../../ui/components/render_coordinator/render_coordinator.js';
import * as ReportView from '../../../../ui/components/report_view/report_view.js';
import * as TextEditor from '../../../../ui/components/text_editor/text_editor.js';
import * as LitHtml from '../../../../ui/lit-html/lit-html.js';

import type * as UI from '../../../../ui/legacy/legacy.js';

import preloadingDetailsReportViewStyles from './preloadingDetailsReportView.css.js';

type RuleSet = Protocol.Preload.RuleSet;

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();
const codeMirrorJsonType = await CodeHighlighter.CodeHighlighter.languageFromMIME('application/json');

export type RuleSetDetailsReportViewData = RuleSet|null;

export class RuleSetDetailsReportView extends LegacyWrapper.LegacyWrapper.WrappableComponent<UI.Widget.VBox> {
  static readonly litTagName = LitHtml.literal`devtools-resources-rulesets-details-report-view`;

  readonly #shadow = this.attachShadow({mode: 'open'});
  #data: RuleSetDetailsReportViewData = null;

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [preloadingDetailsReportViewStyles];
  }

  set data(data: RuleSetDetailsReportViewData) {
    this.#data = data;
    void this.#render();
  }

  async #render(): Promise<void> {
    await coordinator.write('RuleSetDetailsReportView render', () => {
      if (this.#data === null) {
        LitHtml.render(LitHtml.nothing, this.#shadow, {host: this});
        return;
      }

      // Disabled until https://crbug.com/1079231 is fixed.
      // clang-format off
      LitHtml.render(LitHtml.html`
        <${ReportView.ReportView.Report.litTagName}>
          ${this.#source(this.#data.sourceText)}
        </${ReportView.ReportView.Report.litTagName}>
      `, this.#shadow, {host: this});
      // clang-format on
    });
  }

  #source(sourceText: string): LitHtml.LitTemplate {
    let sourceJson;
    try {
      sourceJson = JSON.parse(sourceText);
    } catch (_) {
    }

    if (sourceJson === undefined) {
      // Disabled until https://crbug.com/1079231 is fixed.
      // clang-format off
      return LitHtml.html`
          <${ReportView.ReportView.ReportValue.litTagName}>
            <div class="text-ellipsis" title="">
              ${sourceText}
            </div>
          </${ReportView.ReportView.ReportValue.litTagName}>
      `;
      // clang-format on
    }

    const json = JSON.stringify(sourceJson, null, 4);
    const textEditorInternal = new TextEditor.TextEditor.TextEditor(CodeMirror.EditorState.create({
      doc: json,
      extensions: [
        CodeMirror.EditorState.readOnly.of(true),
        CodeMirror.lineNumbers(),
        codeMirrorJsonType as CodeMirror.Extension,
        CodeMirror.highlightSpecialChars(),
        CodeMirror.highlightSelectionMatches(),
        CodeMirror.indentOnInput(),
        CodeMirror.syntaxHighlighting(CodeHighlighter.CodeHighlighter.highlightStyle),
        TextEditor.Config.theme(),
      ],
    }));
    textEditorInternal.style.flexGrow = '1';

    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
      return LitHtml.html`
          <${ReportView.ReportView.ReportValue.litTagName}>
          ${textEditorInternal}
          </${ReportView.ReportView.ReportValue.litTagName}>
      `;
    // clang-format on
  }
}

ComponentHelpers.CustomElements.defineComponent(
    'devtools-resources-rulesets-details-report-view', RuleSetDetailsReportView);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-resources-rulesets-details-report-view': RuleSetDetailsReportView;
  }
}
