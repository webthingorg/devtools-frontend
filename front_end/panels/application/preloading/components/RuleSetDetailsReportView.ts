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
import * as IconButton from '../../../../ui/components/icon_button/icon_button.js';
import {assertNotNullOrUndefined} from '../../../../core/platform/platform.js';

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
  #prerenderedUrl: String|null = null;

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [preloadingDetailsReportViewStyles];
  }

  set data(data: RuleSetDetailsReportViewData) {
    this.#data = data;
    void this.#render();
  }

  set prerenderedUrl(prerenderedUrl: String|null) {
    this.#prerenderedUrl = prerenderedUrl;
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
        <div class="content">
          <div class="gray-panel" id="prerendered-url">${this.#prerenderedUrl}</div>
          ${this.#maybeError()}
          <slot></slot>
        </div>
        <div class="text-ellipsis" title="">
        ${this.#source(this.#data.sourceText)}
        </div>
      `, this.#shadow, {host: this});
      // clang-format on
    });
  }

  // TODO(https://crbug.com/1425354): Support i18n.
  #maybeError(): LitHtml.LitTemplate {
    assertNotNullOrUndefined(this.#data);

    if (this.#data.errorMessage === undefined) {
      return LitHtml.nothing;
    }

    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    const icon = new IconButton.Icon.Icon();
    icon.data = {iconName: 'cross-circle-filled', color: 'var(--icon-error)', width: '14px', height: '14px'};
    return LitHtml.html`
      <${ReportView.ReportView.Report.litTagName}>
        <div class="gray-panel" id="error-message">
        ${icon}
        ${this.#data.errorMessage}
        </div>
      </${ReportView.ReportView.Report.litTagName}>
    `;
    // clang-format on
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
      const textEditorInternal = new TextEditor.TextEditor.TextEditor(CodeMirror.EditorState.create({
        doc: sourceText,
        extensions: [
          CodeMirror.EditorState.readOnly.of(true),
          CodeMirror.lineNumbers(),
          CodeMirror.highlightSpecialChars(),
          CodeMirror.highlightSelectionMatches(),
          CodeMirror.indentOnInput(),
          CodeMirror.syntaxHighlighting(CodeHighlighter.CodeHighlighter.highlightStyle),
          TextEditor.Config.theme(),
        ],
      }));
      return LitHtml.html`
          <${ReportView.ReportView.ReportValue.litTagName}>
            ${textEditorInternal}
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
