// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Protocol from '../../../../generated/protocol.js';
import * as CodeMirror from '../../../../third_party/codemirror.next/codemirror.next.js';
import * as CodeHighlighter from '../../../../ui/components/code_highlighter/code_highlighter.js';
import * as ComponentHelpers from '../../../../ui/components/helpers/helpers.js';
import * as LegacyWrapper from '../../../../ui/components/legacy_wrapper/legacy_wrapper.js';
import * as Coordinator from '../../../../ui/components/render_coordinator/render_coordinator.js';
import * as TextEditor from '../../../../ui/components/text_editor/text_editor.js';
import * as LitHtml from '../../../../ui/lit-html/lit-html.js';
import * as IconButton from '../../../../ui/components/icon_button/icon_button.js';
import {assertNotNullOrUndefined} from '../../../../core/platform/platform.js';
import * as SDK from '../../../../core/sdk/sdk.js';

import type * as UI from '../../../../ui/legacy/legacy.js';

import preloadingDetailsReportViewStyles from './preloadingDetailsReportView.css.js';

type RuleSet = Protocol.Preload.RuleSet;

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();
const codeMirrorJsonType = await CodeHighlighter.CodeHighlighter.languageFromMIME('application/json');

export type RuleSetDetailsViewData = RuleSet|null;

export class RuleSetDetailsView extends LegacyWrapper.LegacyWrapper.WrappableComponent<UI.Widget.VBox> {
  readonly #shadow = this.attachShadow({mode: 'open'});
  #data: RuleSetDetailsViewData = null;
  #ruleSetUrl: string|null = null;
  #editorState?: CodeMirror.EditorState;

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [preloadingDetailsReportViewStyles];
  }

  set data(data: RuleSetDetailsViewData) {
    this.#data = data;

    if (data && data.url !== undefined) {
      this.#ruleSetUrl = data?.url;
    } else {
      this.#ruleSetUrl = SDK.TargetManager.TargetManager.instance().inspectedURL();
    }

    void this.#render();
  }

  async #render(): Promise<void> {
    await coordinator.write('RuleSetDetailsView render', () => {
      if (this.#data === null) {
        LitHtml.render(LitHtml.nothing, this.#shadow, {host: this});
        return;
      }

      // Disabled until https://crbug.com/1079231 is fixed.
      // clang-format off
      LitHtml.render(LitHtml.html`
        <div class="content">
          <div class="ruleset-header" id="ruleset-url">${this.#ruleSetUrl}</div>
          ${this.#maybeError()}
        </div>
        <div class="text-ellipsis">
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
    return LitHtml.html`
      <div class="ruleset-header">
      <${IconButton.Icon.Icon.litTagName}
        .data=${{
          iconName: 'cross-circle-filled',
          color: 'var(--color-error)',
          width: '16px',
          height: '16px',
        } as IconButton.Icon.IconData}
        style=${LitHtml.Directives.styleMap({
          'vertical-align': 'sub',
        })}
      >
      </${IconButton.Icon.Icon.litTagName}>
      <span id="error-message-text">${this.#data.errorMessage}</span>
      </div>
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
      this.#editorState = CodeMirror.EditorState.create({
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
      });
    }

    this.#editorState = CodeMirror.EditorState.create({
      doc: sourceText,
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
    });

    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    // TODO(https://crbug.com/1425354): Add Raw button.
      return LitHtml.html`
        <${TextEditor.TextEditor.TextEditor.litTagName} .style.flexGrow = '1' .state=${
          this.#editorState
        }></${TextEditor.TextEditor.TextEditor.litTagName}>
      `;
    // clang-format on
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-resources-rulesets-details-view', RuleSetDetailsView);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-resources-rulesets-details-view': RuleSetDetailsView;
  }
}
