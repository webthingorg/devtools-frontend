// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as ComponentHelpers from '../component_helpers/component_helpers.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';

const {render, html} = LitHtml;
const getStyleSheets = ComponentHelpers.GetStylesheet.getStyleSheets;

export interface PropertyGroup {
  group: string;
  properties: HTMLElement[];
}

export class ComputedStyleGroupLists extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private propertyGroups: ReadonlyArray<PropertyGroup> = [];
  private expandedGroups: Set<string> = new Set();

  constructor() {
    super();
    this.shadow.adoptedStyleSheets = [
      ...getStyleSheets('ui/inspectorCommon.css', {patchThemeSupport: true}),
      ...getStyleSheets('ui/inspectorSyntaxHighlight.css', {patchThemeSupport: true}),
    ];
  }

  set data(data: {propertyGroups: PropertyGroup[]}) {
    this.propertyGroups = data.propertyGroups;
    this.render();
  }

  private onSummaryClick(group: string, event: Event) {
    event.preventDefault();
    if (this.expandedGroups.has(group)) {
      this.expandedGroups.delete(group);
    } else {
      this.expandedGroups.add(group);
    }
    this.render();
  }

  private render() {
    const groupTemplates = [];
    for (const {group, properties} of this.propertyGroups) {
      if (properties.length === 0) {
        continue;
      }
      const onSummaryClick = this.onSummaryClick.bind(this, group);

      // Disabled until https://crbug.com/1079231 is fixed.
      // clang-format off
      groupTemplates.push(html`
      <details ?open=${this.expandedGroups.has(group)}>
        <summary @click=${onSummaryClick}>
          ${group}
        </summary>
        <ol>
          ${this.expandedGroups.has(group) ?
              properties.map(property => html`<li>${property}</li>`) :
              null}
        </ol>
      </details>
      `);
    }

    render(html`
      <style>
        .group-lists {
          --side-distance: 16px;
        }

        ol {
          list-style-type: none;
          padding: 0;
          margin: 0;
        }

        details {
          position: relative;
        }

        summary {
          padding-left: var(--side-distance);
          margin-bottom: 5px;
          cursor: pointer;
          color: var(--group-title-color, #5f6368);
          font-weight: 400;
        }

        summary::-webkit-details-marker {
          position: absolute;
          top: 2.5px;
          left: 4px;
        }

        details:not(:last-child)::after {
          content: "";
          display: block;
          height: 1px;
          background-color: var(--divider-color);
          margin: 1em var(--side-distance);
        }
      </style>

      <div class="group-lists">
        ${groupTemplates}
      </div>
    `, this.shadow, {
      eventContext: this,
    });
    // clang-format on
  }
}

customElements.define('devtools-computed-style-group-lists', ComputedStyleGroupLists);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-computed-style-group-lists': ComputedStyleGroupLists;
  }
}
