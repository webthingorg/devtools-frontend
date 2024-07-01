// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TraceEngine from '../../../models/trace/trace.js';
import * as ModificationsManager from '../../../services/modifications_manager/modifications_manager.js';
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import sidebarAnnotationsTabStyles from './sidebarAnnotationsTab.css.js';

export class SidebarAnnotationsTab extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-performance-sidebar-annotations`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  readonly #boundRender = this.#render.bind(this);

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [sidebarAnnotationsTabStyles];
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
  }

  rerenderContent(): void {
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
  }

  renderLabel(entryName: string, label: String): LitHtml.LitTemplate {
    return LitHtml.html`
      <div class="label-annotation">
        <div class="entry-name">
          ${entryName}
        </div>  
        <div class="label">
         ${label}
        </div>
      </div>
    `;
  }

  #render(): void {
    const annotations = ModificationsManager.ModificationsManager.ModificationsManager.activeManager()?.getOverlays();

    // clang-format off
        LitHtml.render(
            LitHtml.html`
            <span class="annotations">
              ${annotations?.map(annotation => this.renderLabel((TraceEngine.Types.TraceEvents.isProfileCall(annotation.entry)) ? annotation.entry.callFrame.functionName : annotation.entry.name, annotation.label))}
            </span>`,
            this.#shadow, {host: this});
    // clang-format on
  }
}

customElements.define('devtools-performance-sidebar-annotations', SidebarAnnotationsTab);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-performance-sidebar-annotations': SidebarAnnotationsTab;
  }
}
