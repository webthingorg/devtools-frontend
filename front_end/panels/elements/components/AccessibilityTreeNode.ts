// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../../core/i18n/i18n.js';
import * as Platform from '../../../core/platform/platform.js';

import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as Coordinator from '../../../ui/components/render_coordinator/render_coordinator.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';


const UIStrings = {
  /**
  *@description Ignored node element text content in Accessibility Tree View of the Elements panel
  */
  ignored: 'Ignored',
};
const str_ = i18n.i18n.registerUIStrings('panels/elements/components/AccessibilityTreeNode.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

// TODO(jobay) move this to Platform.StringUtilities if still needed.
// This function is a variant of setTextContentTruncatedIfNeeded found in DOMExtension.
function truncateTextIfNeeded(text: string): string {
  const maxTextContentLength = 10000;

  if (text.length > maxTextContentLength) {
    return Platform.StringUtilities.trimMiddle(text, maxTextContentLength);
  }
  return text;
}


export interface AccessibilityTreeNodeData {
  ignored: boolean;
  name: string;
  role: string;
}

export class AccessibilityTreeNode extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-accessibility-tree-node`;
  private readonly shadow = this.attachShadow({mode: 'open'});

  private ignored: boolean = true;
  private name: string = '';
  private role: string = '';

  set data(data: AccessibilityTreeNodeData) {
    this.ignored = data.ignored;
    this.name = data.name;
    this.role = data.role;
    this.update();
  }

  private async update(): Promise<void> {
    await this.render();
  }

  private async render(): Promise<void> {
    await Coordinator.RenderCoordinator.RenderCoordinator.instance().write('Accessibility node render', () => {
      // clang-format off
      // eslint-disable-next-line rulesdir/ban_style_tags_in_lit_html
      LitHtml.render(LitHtml.html`
      <style>
          .ax-readable-string {
            font-style: italic;
          }

          .monospace {
            font-family: var(--monospace-font-family);
            font-size: var(--monospace-font-size);
          }
      </style>
      ${this.ignored?
          LitHtml.html`<span class='monospace ignored-node'>${i18nString(UIStrings.ignored)}</span>`:
          LitHtml.html`
             <span class='monospace'>${truncateTextIfNeeded(this.role)}</span>
             <span class='separator'>\xA0</span>
             <span class='ax-readable-string'>"${this.name}"</span>
          `}
     `, this.shadow, {
        host: this,
      });
      // clang-format on
    });
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-accessibility-tree-node', AccessibilityTreeNode);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-accessibility-tree-node': AccessibilityTreeNode;
  }
}
