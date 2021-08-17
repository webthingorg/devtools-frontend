// Copyright (c) 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as ComponentHelpers from '../../../components/helpers/helpers.js';
import * as LitHtml from '../../../lit-html/lit-html.js';
import cssLengthStyles from './cssLength.css.js';

import type {Length} from './CSSLengthUtils.js';
import {getNextUnit, getNewLengthFromEvent, LengthUnit, LENGTH_UNITS, parseText} from './CSSLengthUtils.js';

const {render, html} = LitHtml;

// move this to a common InlineEditorUtils.ts
export class ValueChangedEvent extends Event {
  data: {value: string};

  constructor(value: string) {
    super('valuechanged', {});
    this.data = {value};
  }
}

export class DraggingFinishedEvent extends Event {
  constructor() {
    super('draggingfinished', {});
  }
}

export interface CSSLengthData {
  lengthText: string;
}

const DefaultLength = {
  value: 0,
  unit: LengthUnit.PIXEL,
};

export class CSSLength extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-css-length`;

  private readonly shadow = this.attachShadow({mode: 'open'});
  private readonly onDraggingValue = this.dragValue.bind(this);
  private length: Length = DefaultLength;
  private isEditingSlot = false;
  private isDraggingValue = false;
  private initialX = 0;
  private initialValue = 0;

  set data(data: CSSLengthData) {
    const parsedResult = parseText(data.lengthText);
    if (!parsedResult) {
      return;
    }
    this.length = parsedResult;
    this.render();
  }

  connectedCallback(): void {
    this.shadow.adoptedStyleSheets = [cssLengthStyles];
  }

  private onUnitChange(event: Event): void {
    this.length.unit = (event.target as HTMLInputElement).value as LengthUnit;
    this.dispatchEvent(new ValueChangedEvent(`${this.length.value}${this.length.unit}`));
    this.render();
  }

  private onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        event.stopPropagation();
        // this.minify();
        this.blur();
        break;
      case 'ArrowUp':
      case 'ArrowDown': {
        const newLength = getNewLengthFromEvent(this.length, event);
        if (newLength) {
          this.length = newLength;
          this.dispatchEvent(new ValueChangedEvent(`${this.length.value}${this.length.unit}`));
        }
        event.preventDefault();
        break;
      }
    }
  }

  private dragValue(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.isDraggingValue = true;
    const displacement = event.clientX - this.initialX;
    this.length.value = this.initialValue + displacement;
    this.dispatchEvent(new ValueChangedEvent(`${this.length.value}${this.length.unit}`));
    this.render();
  }

  private onValueMousedown(event: MouseEvent): void {
    this.initialX = event.clientX;
    this.initialValue = this.length.value;
    const targetDocument = event.target instanceof Node && event.target.ownerDocument;
    if (targetDocument) {
      targetDocument.addEventListener('mousemove', this.onDraggingValue, {capture: true});
      targetDocument.addEventListener('mouseup', (event: MouseEvent) => {
        event.preventDefault();
        targetDocument.removeEventListener('mousemove', this.onDraggingValue, {capture: true});
        this.isDraggingValue = false;
        this.dispatchEvent(new ValueChangedEvent(`${this.length.value}${this.length.unit}`));
      }, {once: true, capture: true});
    }
  }

  private onValueMouseup(): void {
    if (!this.isDraggingValue) {
      this.isEditingSlot = true;
      this.render();
    }
  }

  private onUnitMousedown(event: MouseEvent): void {
    if (event.shiftKey) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }
  }

  private onUnitMouseup(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();

    if (event.shiftKey) {
      const nextUnit = getNextUnit(this.length.unit);
      this.length.unit = nextUnit;
      this.dispatchEvent(new ValueChangedEvent(`${this.length.value}${this.length.unit}`));
      this.render();
    }
  }

  private render(): void {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    render(html`
      <div class="css-length" @keydown=${this.onKeydown} tabindex="-1">
        ${this.renderContent()}
      </div>
    `, this.shadow, {
      host: this,
    });
    // clang-format on
  }

  private renderContent(): LitHtml.TemplateResult {
    if (this.isEditingSlot) {
      console.warn('this should never happen');
      return html`<slot></slot>`;
    }
    const options = LENGTH_UNITS.map(unit => {
      return html`
          <option value=${unit} .selected=${this.length.unit === unit}>${unit}</option>
        `;
    });
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
      return html`
        <span class="value"
          @mousedown=${this.onValueMousedown}
          @mouseup=${this.onValueMouseup}
        >${this.length.value}</span><select class="unit ${this.length.unit}" @mousedown=${this.onUnitMousedown} @mouseup=${this.onUnitMouseup} @change=${this.onUnitChange}>
          ${options}
        </select>
      `;
    // clang-format on
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-css-length', CSSLength);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-css-length': CSSLength;
  }
}
