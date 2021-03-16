// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Components from '../components/components.js';
import * as i18n from '../i18n/i18n.js';
import * as SDK from '../sdk/sdk.js';  // eslint-disable-line no-unused-vars
import * as LitHtml from '../third_party/lit-html/lit-html.js';
import * as UIComponents from '../ui/components/components.js';

const UIStrings = {
  /**
  *@description Error message stating that something went wrong when tring to render stack trace
  */
  cannotRenderStackTrace: 'Cannot not render stack trace',
  /**
  *@description A link to show more frames in the stack trace if more are available. Never 0.
  */
  showSMoreFrames: '{n, plural, =1 {Show # more frame} other {Show # more frames}}',
};
const str_ = i18n.i18n.registerUIStrings('resources/StackTrace.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export interface StackTraceData {
  frame: SDK.ResourceTreeModel.ResourceTreeFrame;
}

export class StackTrace extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private readonly linkifier = new Components.Linkifier.Linkifier();
  private stackTraceRows: (Components.JSPresentationUtils.StackTraceRegularRow|
                           Components.JSPresentationUtils.StackTraceAsyncRow)[] = [];
  private expandableRows: LitHtml.TemplateResult[] = [];
  private showHidden = false;

  set data(data: StackTraceData) {
    const frame = data.frame;
    if (frame && frame._creationStackTrace) {
      this.stackTraceRows = Components.JSPresentationUtils.buildStackTraceRows(
          frame._creationStackTrace, frame.resourceTreeModel().target(), this.linkifier, true,
          this.onStackTraceRowsUpdated.bind(this));
    }
    this.createRowTemplates();
  }

  private onStackTraceRowsUpdated(stackTraceRows: (Components.JSPresentationUtils.StackTraceRegularRow|
                                                   Components.JSPresentationUtils.StackTraceAsyncRow)[]): void {
    this.stackTraceRows = stackTraceRows;
    this.createRowTemplates();
  }

  private onShowAllClick(): void {
    this.showHidden = true;
    this.createRowTemplates();
  }

  private createRowTemplates(): void {
    this.expandableRows = [];
    let hiddenCallFramesCount = 0;
    for (const item of this.stackTraceRows) {
      if (this.showHidden || (!item.ignoreListHide && !item.rowCountHide)) {
        if ('functionName' in item) {
          this.expandableRows.push(LitHtml.html`
            <div class="stack-trace-row">
              <div class="stack-trace-function-name text-ellipsis" title="${item.functionName}">
                ${item.functionName}
              </div>
              <div class="stack-trace-source-location">
                ${item.link ? LitHtml.html`<div class="text-ellipsis">@\xA0${item.link}</div>` : LitHtml.nothing}
              </div>
            </div>
          `);
        }
        if ('asyncDescription' in item) {
          this.expandableRows.push(LitHtml.html`
            <div>${item.asyncDescription}</div>
          `);
        }
      }
      if (!this.showHidden && 'functionName' in item && (item.ignoreListHide || item.rowCountHide)) {
        hiddenCallFramesCount++;
      }
    }
    if (hiddenCallFramesCount) {
      // Disabled until https://crbug.com/1079231 is fixed.
      // clang-format off
      this.expandableRows.push(LitHtml.html`
        <button class="link" @click=${(): void => this.onShowAllClick()}>
          ${i18nString(UIStrings.showSMoreFrames, {n: hiddenCallFramesCount})}
        </button>
      `);
      // clang-format on
    }
    if (this.expandableRows[0]) {
      const styles = LitHtml.html`
        <style>
          .stack-trace-row {
            display: flex;
          }

          .stack-trace-function-name {
            width: 100px;
          }

          .stack-trace-source-location {
            display: flex;
            overflow: hidden;
          }

          .text-ellipsis {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .ignore-list-link {
            opacity: 60%;
          }

          .link {
            color: var(--color-link);
            text-decoration: underline;
            cursor: pointer;
            padding: 2px 0; /* adjust focus ring size */
          }

          button.link {
            border: none;
            background: none;
            font-family: inherit;
            font-size: inherit;
          }
        </style>
      `;
      this.expandableRows[0] = LitHtml.html`${styles}${this.expandableRows[0]}`;
    }
    this.render();
  }

  private render(): void {
    if (!this.stackTraceRows.length) {
      // Disabled until https://crbug.com/1079231 is fixed.
      // clang-format off
      LitHtml.render(
        LitHtml.html`
          <span>${i18nString(UIStrings.cannotRenderStackTrace)}</span>
        `,
        this.shadow);
      return;
    }
    LitHtml.render(
      LitHtml.html`
        <devtools-expandable-list .data=${{
          rows: this.expandableRows,
        } as UIComponents.ExpandableList.ExpandableListData}>
        </devtools-expandable-list>
      `,
      this.shadow);
    // clang-format on
  }
}

customElements.define('devtools-resources-stack-trace', StackTrace);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-resources-stack-trace': StackTrace;
  }
}
