// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TraceEngine from '../../../models/trace/trace.js';
import { ModificationsManager } from '../../../services/modifications_manager/modifications_manager.js';
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as IconButton from '../../../ui/components/icon_button/icon_button.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import sidebarAnnotationsTabStyles from './sidebarAnnotationsTab.css.js';

export class SidebarAnnotationsTab extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-performance-sidebar-annotations`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  readonly #boundRender = this.#render.bind(this);
  #overlayAnnotations: TraceEngine.Types.File.OverlayAnnotation[] = [];

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [sidebarAnnotationsTabStyles];
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
  }

  updateAnnotationOverlays(updatedOverlays: TraceEngine.Types.File.OverlayAnnotation[]): void {
    this.#overlayAnnotations = updatedOverlays;
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
  }

  renderEntryLabel(overlay: TraceEngine.Types.File.OverlayAnnotation): LitHtml.LitTemplate {
    const entryName = TraceEngine.Types.TraceEvents.isProfileCall(overlay.entry) ?
        overlay.entry.callFrame.functionName :
        overlay.entry.name;

    return LitHtml.html`
      <div class="annotation-wrap">
        <div>
          <span class="entry-name">
            ${entryName}
          </span>
          <div class="label">
          ${overlay.label}
          </div>
        </div>
        <${IconButton.Icon.Icon.litTagName} class="bin-icon" .data=${{
            iconName: 'bin',
            color: 'var(--icon-default)',
            width: '20px',
            height: '20px',
          } as IconButton.Icon.IconData} @click=${() => {
            console.log("hi");
            ModificationsManager.ModificationsManager.activeManager()?.modifyAnnotationOverlay(overlay, "Remove");
          }}>
      </div>
    `;
  }

  #render(): void {
    // clang-format off
      LitHtml.render(
        LitHtml.html`
        <span class="annotations">
          ${this.#overlayAnnotations?.map(annotation => this.renderEntryLabel(annotation))}
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
