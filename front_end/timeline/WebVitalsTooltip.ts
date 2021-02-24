// Copyright (c) 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../third_party/lit-html/lit-html.js';

declare global {
  interface HTMLElementTagNameMap {
    'devtools-timeline-webvitals-tooltip': WebVitalsTooltip;
  }
}

export interface WebVitalsTooltipData {
  content: LitHtml.TemplateResult|null;
}


export class WebVitalsTooltip extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private content: LitHtml.TemplateResult|null = null;

  set data(data: WebVitalsTooltipData) {
    this.content = data.content;
    this.render();
  }

  connectedCallback(): void {
    this.render();
  }


  private render(): void {
    // clang-format off
    LitHtml.render(LitHtml.html`
    <style>
        .tooltip {
          padding: 6px 8px;
          border-radius: 3px;
          box-shadow: 0 0 5px rgb(0 0 0 / 60%);
          background: #fff;
        }

        .table {
          border-collapse: collapse;
          min-width: 200px;
        }

        .table td {
          padding: 4px;
        }

        .table td:nth-child(1) {
          width: 0%;
        }

        .table td:nth-child(2) {
          width: auto;
        }

        .table td:nth-child(3) {
          text-align: right;
          color: #dadce0;
        }

        .title {
          font-weight: bold;
        }

        .small {
          font-weight: normal;
          color: #dadce0;
        }

        .good {
          display: block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #0cce6b;
        }

        .medium {
          display: block;
          width: 12px;
          height: 12px;
          background: #ffa400;
        }

        .bad {
          display: block;
          border: 1px solid transparent;
          border-width: 0 6px 12px 6px;
          border-bottom-color: #ff4e42;
          width: 0;
        }
      </style>
      <div class="tooltip">
        ${this.content}
      </div>
    `, this.shadow);
    // clang-format off
  }
}

customElements.define('devtools-timeline-webvitals-tooltip', WebVitalsTooltip);
