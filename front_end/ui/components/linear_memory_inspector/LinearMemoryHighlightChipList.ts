// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../../core/i18n/i18n.js';
import * as LitHtml from '../../lit-html/lit-html.js';
import * as ComponentHelpers from '../helpers/helpers.js';
import {type HighlightInfo} from './LinearMemoryViewerUtils.js';
import * as IconButton from '../icon_button/icon_button.js';

import linearMemoryHighlightChipListStyles from './linearMemoryHighlightChipList.css.js';

const UIStrings = {
  /**
  *@description Tooltip text that appears when hovering over a 'jump-to-address' button that is next to a pointer (32-bit or 64-bit) with an invalid address under the Value Interpreter.
  */
  jumpToAddress: 'Jump to address',
  /**
   *@description Tooltip text that appears when hovering over a 'remove-highlight-button' button that is on the right-side of a 'highlight-chip' chip.
   */
  deleteHighlight: 'Delete memory highlight',
};
const str_ =
    i18n.i18n.registerUIStrings('ui/components/linear_memory_inspector/LinearMemoryHighlightChipList.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
const {render, html} = LitHtml;

export interface LinearMemoryHighlightChipListData {
  highlightInfos: HighlightInfo[];
}

export class DeleteHighlightChipEvent extends Event {
  static readonly eventName = 'deletehighlightchip';
  data: HighlightInfo;

  constructor(highlightInfo: HighlightInfo) {
    super(DeleteHighlightChipEvent.eventName);
    this.data = highlightInfo;
  }
}

export class JumpToHighlightedMemoryEvent extends Event {
  static readonly eventName = 'jumptohighlightedmemory';
  data: number;

  constructor(address: number) {
    super(JumpToHighlightedMemoryEvent.eventName);
    this.data = address;
  }
}

export class LinearMemoryHighlightChipList extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-linear-memory-highlight-chip-list`;

  readonly #shadow = this.attachShadow({mode: 'open'});
  #highlightedAreas: HighlightInfo[] = [];

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [linearMemoryHighlightChipListStyles];
  }

  set data(data: LinearMemoryHighlightChipListData) {
    this.#highlightedAreas = data.highlightInfos.filter(highlight => highlight !== undefined);
    this.#render();
  }

  #render(): void {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    const chips = [];
    for (const highlightInfo of this.#highlightedAreas) {
      chips.push(this.#createChip(highlightInfo));
    }
    const result = html`
            <div class="highlight-chip-list">
              ${chips}
            </div>
        `;
    render(result, this.#shadow, { host: this });
    // clang-format on
  }

  #createChip(highlightInfo: HighlightInfo): LitHtml.TemplateResult {
    const expressionName = (highlightInfo?.name || '<anonymous>');
    const expressionType = highlightInfo.type;

    return html`
      <div class="highlight-chip">
        <button class="jump-to-highlight-button" data-button=${JumpToHighlightedMemoryEvent.eventName} title=${
        i18nString(UIStrings.jumpToAddress)}
          @click=${this.dispatchEvent.bind(this, new JumpToHighlightedMemoryEvent(highlightInfo.startAddress))}>
          <span class="source-code">
            <span class="value">${expressionName}</span><span class="separator">: </span><span>${expressionType}</span>
          </span>
        </button>
        <button class="delete-highlight-button" data-button=${DeleteHighlightChipEvent.eventName} title=${
        i18nString(UIStrings.deleteHighlight)}
          @click=${this.dispatchEvent.bind(this, new DeleteHighlightChipEvent(highlightInfo))}>
          <${IconButton.Icon.Icon.litTagName} .data=${{
      iconName: 'close-icon',
      color: 'black',
      width: '7px',
    } as IconButton.Icon.IconData}>
          </${IconButton.Icon.Icon.litTagName}>
          </button>
      </div>
    `;
  }
}

ComponentHelpers.CustomElements.defineComponent(
    'devtools-linear-memory-highlight-chip-list', LinearMemoryHighlightChipList);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-linear-memory-highlight-chip-list': LinearMemoryHighlightChipList;
  }
}
