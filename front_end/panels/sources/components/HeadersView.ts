// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../../core/i18n/i18n.js';
import * as Persistence from '../../../models/persistence/persistence.js';
import * as Workspace from '../../../models/workspace/workspace.js';
import * as Buttons from '../../../ui/components/buttons/buttons.js';
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as UI from '../../../ui/legacy/legacy.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import HeadersViewStyles from './HeadersView.css.js';

const UIStrings = {
  /**
  *@description The title of a button that adds a field to input a header in the editor form.
  */
  addHeader: 'Add a header',
  /**
  *@description The title of a button that adds a section for defining header overrides in the editor form.
  */
  addBlock: 'Add an \'`ApplyTo`\'-section',
  /**
  *@description The title of a button that removes a field to input a header in the editor form.
  */
  removeHeader: 'Remove this header',
  /**
  *@description The title of a button that removes a section for defining header overrides in the editor form.
  */
  removeBlock: 'Remove this \'`ApplyTo`\'-section',
  /**
  *@description Error message when a file could not be parsed.
  *@example {.headers} PH1
  */
  errorWhenParsing: 'Error when parsing \'\'{PH1}\'\'.',
  /**
  *@description Explainer when a file cannot be parsed.
  *@example {.headers} PH1
  */
  parsingErrorExplainer:
      'This is most likely due to a syntax error in \'\'{PH1}\'\'. Try opening this file in an external editor to fix the error or delete the file and re-create the override.',
};
const str_ = i18n.i18n.registerUIStrings('panels/sources/components/HeadersView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

const plusIconUrl = new URL('../../../Images/plus_icon.svg', import.meta.url).toString();
const minusIconUrl = new URL('../../../Images/minus_icon.svg', import.meta.url).toString();

export class ContentEditable extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-content-editable`;

  get value(): string {
    return this.innerText;
  }

  set value(value: string) {
    this.innerText = value;
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-content-editable', ContentEditable);

export class HeadersView extends UI.View.SimpleView {
  readonly #headersViewComponent = new HeadersViewComponent();
  #uiSourceCode: Workspace.UISourceCode.UISourceCode;

  constructor(uiSourceCode: Workspace.UISourceCode.UISourceCode) {
    super('HeadersView');
    this.#uiSourceCode = uiSourceCode;
    this.#uiSourceCode.addEventListener(
        Workspace.UISourceCode.Events.WorkingCopyChanged, this.#onWorkingCopyChanged, this);
    this.#uiSourceCode.addEventListener(
        Workspace.UISourceCode.Events.WorkingCopyCommitted, this.#onWorkingCopyCommitted, this);
    this.element.appendChild(this.#headersViewComponent);
    void this.#setInitialData();
  }

  async #setInitialData(): Promise<void> {
    const content = await this.#uiSourceCode.requestContent();
    this.#setComponentData(content.content || '');
  }

  #setComponentData(content: string): void {
    let parsingError = false;
    let headerOverrides: Persistence.NetworkPersistenceManager.HeaderOverride[] = [];
    content = content || '[]';
    try {
      headerOverrides = JSON.parse(content) as Persistence.NetworkPersistenceManager.HeaderOverride[];
      if (!headerOverrides.every(Persistence.NetworkPersistenceManager.isHeaderOverride)) {
        throw 'Type mismatch after parsing';
      }
    } catch (e) {
      console.error('Failed to parse', this.#uiSourceCode.url(), 'for locally overriding headers.');
      parsingError = true;
    }

    const transformed: HeaderOverride[] = headerOverrides.map(headerOverride => {
      return {
        applyTo: headerOverride.applyTo,
        headers: Object.entries(headerOverride.headers).map(([headerName, headerValue]) => {
          return {
            name: headerName,
            value: headerValue,
          };
        }),
      };
    });

    this.#headersViewComponent.data = {
      headerOverrides: transformed,
      uiSourceCode: this.#uiSourceCode,
      parsingError,
    };
  }

  commitEditing(): void {
    this.#uiSourceCode.commitWorkingCopy();
    Persistence.NetworkPersistenceManager.NetworkPersistenceManager.instance().updateInterceptionPatterns();
  }

  #onWorkingCopyChanged(): void {
    this.#setComponentData(this.#uiSourceCode.workingCopy());
  }

  #onWorkingCopyCommitted(): void {
    this.#setComponentData(this.#uiSourceCode.workingCopy());
  }

  getComponent(): HeadersViewComponent {
    return this.#headersViewComponent;
  }

  dispose(): void {
    this.#uiSourceCode.removeEventListener(
        Workspace.UISourceCode.Events.WorkingCopyChanged, this.#onWorkingCopyChanged, this);
    this.#uiSourceCode.removeEventListener(
        Workspace.UISourceCode.Events.WorkingCopyCommitted, this.#onWorkingCopyCommitted, this);
  }
}

type Header = {
  name: string,
  value: string,
};

type HeaderOverride = {
  applyTo: string,
  headers: Header[],
};

export interface HeadersViewComponentData {
  headerOverrides: HeaderOverride[];
  uiSourceCode: Workspace.UISourceCode.UISourceCode;
  parsingError: boolean;
}

export class HeadersViewComponent extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-sources-headers-view`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  readonly #boundOnFocusIn = this.onFocusIn.bind(this);
  readonly #boundOnFocusOut = this.onFocusOut.bind(this);
  readonly #boundOnClick = this.onClick.bind(this);
  readonly #boundOnInput = this.onInput.bind(this);
  readonly #boundOnKeyDown = this.onKeyDown.bind(this);
  #headerOverrides: HeaderOverride[] = [];
  #uiSourceCode: Workspace.UISourceCode.UISourceCode|null = null;
  #focusedEditable: ContentEditable|null = null;
  #caretPosition = -1;
  #parsingError = false;

  constructor() {
    super();
    this.#shadow.addEventListener('focusin', this.#boundOnFocusIn);
    this.#shadow.addEventListener('focusout', this.#boundOnFocusOut);
    this.#shadow.addEventListener('click', this.#boundOnClick);
    this.#shadow.addEventListener('input', this.#boundOnInput);
    this.#shadow.addEventListener('keydown', this.#boundOnKeyDown);
  }

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [HeadersViewStyles];
  }

  set data(data: HeadersViewComponentData) {
    this.#headerOverrides = data.headerOverrides;
    this.#uiSourceCode = data.uiSourceCode;
    this.#parsingError = data.parsingError;
    this.#render();
  }

  // 'Enter' key should not create a new line in the contenteditable. Focus
  // on the next contenteditable instead.
  onKeyDown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    const target = event.target as HTMLElement;
    if (target.matches('.editable') && keyboardEvent.key === 'Enter') {
      event.preventDefault();
      this.#focusNext(target);
    }
  }

  #focusNext(target: HTMLElement): void {
    const selectors = '.editable';
    const elements = Array.from(this.#shadow.querySelectorAll(selectors)) as HTMLElement[];
    const idx = elements.indexOf(target);
    if (idx !== -1 && idx + 1 < elements.length) {
      elements[idx + 1].focus();
    }
  }

  #selectAllText(target: HTMLElement): void {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(target);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  #clearSelection(): void {
    const selection = window.getSelection();
    selection?.removeAllRanges();
  }

  onFocusIn(e: Event): void {
    const target = e.target as ContentEditable;
    if (target.matches('.editable')) {
      this.#selectAllText(target);
      this.#focusedEditable = target;
    }
  }

  onFocusOut(): void {
    this.#clearSelection();
    this.#focusedEditable = null;
    this.#caretPosition = -1;
  }

  #generateNextHeaderName(headers: Header[]): string {
    const takenNames = new Set<string>(headers.map(header => header.name));
    let idx = 1;
    while (takenNames.has('headerName' + idx)) {
      idx++;
    }
    return 'headerName' + idx;
  }

  onClick(e: Event): void {
    const target = e.target as HTMLButtonElement;
    const rowElement = target.closest('.row') as HTMLElement | null;
    const blockIndex = Number(rowElement?.dataset.blockIndex || 0);
    const headerIndex = Number(rowElement?.dataset.headerIndex || 0);
    if (target.matches('.add-header')) {
      this.#headerOverrides[blockIndex].headers.splice(
          headerIndex + 1, 0,
          {name: this.#generateNextHeaderName(this.#headerOverrides[blockIndex].headers), value: 'headerValue'});
      this.#render();
      const focusElement = this.#shadow.querySelector(
          `[data-block-index="${blockIndex}"][data-header-index="${headerIndex + 1}"] .header-name`);
      if (focusElement) {
        (focusElement as HTMLElement).focus();
      }
      this.onHeadersChanged();
    }
    if (target.matches('.remove-header')) {
      this.#headerOverrides[blockIndex].headers.splice(headerIndex, 1);
      this.onHeadersChanged();
    }
    if (target.matches('.add-block')) {
      this.#headerOverrides.splice(
          blockIndex + 1, 0, {applyTo: '*', headers: [{name: 'headerName', value: 'headerValue'}]});
      this.#render();
      const focusElement = this.#shadow.querySelector(`[data-block-index="${blockIndex + 1}"] .apply-to`);
      if (focusElement) {
        (focusElement as HTMLElement).focus();
      }
      this.onHeadersChanged();
    }
    if (target.matches('.remove-block')) {
      this.#headerOverrides.splice(blockIndex, 1);
      this.onHeadersChanged();
    }
  }

  getCaretPosition(element: HTMLElement): number {
    if (!element.hasFocus()) {
      return -1;
    }

    const selection = element.getComponentSelection();
    if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) {
      return -1;
    }
    const selectionRange = selection.getRangeAt(0);
    if (selectionRange.startOffset !== selectionRange.endOffset) {
      return -1;
    }
    return selectionRange.startOffset;
  }

  // `onInput()` changes the component's state and updates `#uiSourceCode`'s
  // working copy which causes a rerender. We need to keep track of the caret
  // position and explicitly set it during rendering, otherwise the cursor
  // would be placed at the start of the contenteditable each time.
  onInput(e: Event): void {
    this.#caretPosition = this.getCaretPosition(e.target as HTMLElement);

    const target = e.target as HTMLButtonElement;
    const rowElement = target.closest('.row') as HTMLElement;
    const blockIndex = Number(rowElement.dataset.blockIndex);
    const headerIndex = Number(rowElement.dataset.headerIndex);
    if (target.matches('.header-name')) {
      this.#headerOverrides[blockIndex].headers[headerIndex].name = target.value;
      this.onHeadersChanged();
    }
    if (target.matches('.header-value')) {
      this.#headerOverrides[blockIndex].headers[headerIndex].value = target.value;
      this.onHeadersChanged();
    }
    if (target.matches('.apply-to')) {
      this.#headerOverrides[blockIndex].applyTo = target.value;
      this.onHeadersChanged();
    }
  }

  onHeadersChanged(): void {
    const transformed: Persistence.NetworkPersistenceManager.HeaderOverride[] =
        this.#headerOverrides.map(headerOverride => {
          return {
            applyTo: headerOverride.applyTo,
            headers: headerOverride.headers.reduce((a, v) => ({...a, [v.name]: v.value}), {}),
          };
        });
    this.#uiSourceCode?.setWorkingCopy(JSON.stringify(transformed, null, 2));
  }

  #render(): void {
    if (this.#parsingError) {
      const fileName = this.#uiSourceCode?.name() || '.headerPH';
      // clang-format off
      LitHtml.render(LitHtml.html`
        <div class="center-wrapper">
          <div class="centered">
            <div class="error-header">${i18nString(UIStrings.errorWhenParsing, {PH1: fileName})}</div>
            <div class="error-body">${i18nString(UIStrings.parsingErrorExplainer, {PH1: fileName})}</div>
          </div>
        </div>
      `, this.#shadow, {host: this});
      // clang-format off
      return;
    }

    if (this.#headerOverrides.length === 0) {
      // clang-format off
      LitHtml.render(LitHtml.html`
        <div>
          <${Buttons.Button.Button.litTagName}
            title=${i18nString(UIStrings.addBlock)}
            .size=${Buttons.Button.Size.SMALL}
            .iconUrl=${plusIconUrl}
            .variant=${Buttons.Button.Variant.SECONDARY}
            class="add-block inline-button padded"
          ></${Buttons.Button.Button.litTagName}>
        </div>
      `, this.#shadow, {host: this});
      // clang-format on
      return;
    }

    // clang-format off
    LitHtml.render(LitHtml.html`
      <div>
        ${this.#headerOverrides.map((headerOverride, blockIndex) =>
          LitHtml.html`
            ${this.#renderApplyToRow(headerOverride.applyTo, blockIndex)}
            ${headerOverride.headers.map((header, headerIndex) =>
              LitHtml.html`
                ${this.#renderHeaderRow(header, blockIndex, headerIndex)}
              `,
            )}
          `,
        )}
      </div>
    `, this.#shadow, {host: this});
    // clang-format on

    // Set caret position
    if (this.#focusedEditable && this.#caretPosition >= 0) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.setStart(this.#focusedEditable.childNodes[0], this.#caretPosition);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }

  #renderApplyToRow(pattern: string, blockIndex: number): LitHtml.TemplateResult {
    const isOptional = true;
    return LitHtml.html`
      <div class="row" data-block-index=${blockIndex}
        ><div>${i18n.i18n.lockedString('Apply to')}</div
        ><div class="separator">:</div
        >${this.#renderEditable(pattern, 'apply-to')}${
        isOptional ? this.#renderAddRemoveButtons(BlockOrHeader.Block) : ''}</div>
    `;
  }

  #renderHeaderRow(header: Header, blockIndex: number, headerIndex: number): LitHtml.TemplateResult {
    const isOptional = true;
    return LitHtml.html`
      <div class="row padded" data-block-index=${blockIndex} data-header-index=${headerIndex}
        ><div>${this.#renderEditable(header.name, 'header-name red')}</div
        ><div class="separator">:</div
        >${this.#renderEditable(header.value, 'header-value')}${
        isOptional ? this.#renderAddRemoveButtons(BlockOrHeader.Header) : ''}</div>
    `;
  }

  #renderAddRemoveButtons(blockOrHeader: BlockOrHeader): LitHtml.TemplateResult {
    // clang-format off
    return LitHtml.html`
      <${Buttons.Button.Button.litTagName}
        title=${blockOrHeader === BlockOrHeader.Block ? i18nString(UIStrings.addBlock) : i18nString(UIStrings.addHeader)}
        .size=${Buttons.Button.Size.SMALL}
        .iconUrl=${plusIconUrl}
        .variant=${Buttons.Button.Variant.SECONDARY}
        class="add-${blockOrHeader} inline-button"
      ></${Buttons.Button.Button.litTagName}>
      <${Buttons.Button.Button.litTagName}
        title=${blockOrHeader === BlockOrHeader.Block ? i18nString(UIStrings.removeBlock) : i18nString(UIStrings.removeHeader)}
        .size=${Buttons.Button.Size.SMALL}
        .iconUrl=${minusIconUrl}
        .variant=${Buttons.Button.Variant.SECONDARY}
        class="remove-${blockOrHeader} inline-button"
      ></${Buttons.Button.Button.litTagName}>
    `;
    // clang-format on
  }

  #renderEditable(value: string, className?: string): LitHtml.TemplateResult {
    // clang-format off
    return LitHtml.html`<${ContentEditable.litTagName} contenteditable="true" class="editable ${className}" tabindex="0" .value=${value}></${
        ContentEditable.litTagName}>`;
    // clang-format on
  }
}

const enum BlockOrHeader {
  Block = 'block',
  Header = 'header',
}

ComponentHelpers.CustomElements.defineComponent('devtools-sources-headers-view', HeadersViewComponent);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-sources-headers-view': HeadersViewComponent;
    'devtools-content-editable': ContentEditable;
  }
}
