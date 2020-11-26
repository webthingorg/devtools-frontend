// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../../third_party/lit-html/lit-html.js';

export class Report extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});

  connectedCallback() {
    this.render();
  }

  private render() {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    LitHtml.render(LitHtml.html`
      <style>
        :host {
          background-color: #f9f9f9;
        }

        .content {
          background-color: white;
          overflow: auto;
        }
      </style>

      <div class="content">
        <slot></slot>
      </div>
    `, this.shadow);
    // clang-format on
  }
}

export class ReportSection extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private sectionTitle: string = '';

  set data({sectionTitle}: {sectionTitle: string}) {
    this.sectionTitle = sectionTitle;
    this.render();
  }

  private render() {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    LitHtml.render(LitHtml.html`
      <style>
        :host {
          background-color: #f9f9f9;
        }

        .section {
          display: flex;
          padding: 12px;
          border-bottom: 1px solid rgb(230 230 230);
          flex-direction: column;
        }

        .header {
          margin-left: 18px;
          display: flex;
          flex-direction: row;
          align-items: center;
          flex: auto;
          text-overflow: ellipsis;
          overflow: hidden;
          font-weight: bold;
          color: #555;
        }
      </style>
      <div class="section">
        <div class="header">${this.sectionTitle}</div>
        <dl><slot></slot></dl>
      </div>
    `, this.shadow);
    // clang-format on
  }
}

export class ReportRow extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});

  connectedCallback() {
    this.render();
  }

  private render() {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    LitHtml.render(LitHtml.html`
      <style>
        :host {
          display: flex;
          line-height: 28px;
          margin: 8px 0px 0px 0px;
        }

        .name {
          color: #888;
          flex: 0 0 var(--name-column-width, 128px);
          padding: 0 6px;
          text-align: right;
          white-space: pre;
        }

        .value {
          flex: auto;
          padding: 0 6px;
          white-space: pre;
        }
      </style>
      <dt class="name"><slot name="name"></slot></dt>
      <dd class="value"><slot name="value"></slot></dd>
    `, this.shadow);
    // clang-format on
  }
}

export interface RenderSimpleRowOptions {
  name: string;
  value: string;
  renderValueAsCodeSpan?: boolean;
}

export function renderSimpleRow(options: RenderSimpleRowOptions) {
  const valueClasses = LitHtml.Directives.classMap({'source-code': !!options.renderValueAsCodeSpan});
  return LitHtml.html`
    <style>
      .source-code {
        font-family: monospace;
      }
    </style>
    <devtools-report-row>
      <span slot="name">${options.name}</span>
      <span slot="value" class="${valueClasses}">${options.value}</span>
    </devtools-report-row>`;
}

customElements.define('devtools-report', Report);
customElements.define('devtools-report-section', ReportSection);
customElements.define('devtools-report-row', ReportRow);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-report': Report;
    'devtools-report-section': ReportSection;
    'devtools-report-row': ReportRow;
  }
}
