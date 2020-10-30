// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../third_party/lit-html/lit-html.js';

import {Endianness, format, isNumber, isValidMode, typeHasSignedNotation, ValueType, ValueTypeMode} from './ValueInterpreterDisplayUtils.js';

const {render, html} = LitHtml;

export interface ValueDisplayData {
  value: ArrayBuffer;
  valueTypes: ValueType[];
  endianness: Endianness;
  valueTypeModes?: Map<ValueType, ValueTypeMode>;
}

export class ValueInterpreterDisplay extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private endianness = Endianness.Little;
  private buffer = new ArrayBuffer(0);
  private valueTypes: ValueType[] = [];
  private valueTypeModeConfig: Map<ValueType, ValueTypeMode> = this.getDefaultModeMapping();

  set data(data: ValueDisplayData) {
    this.buffer = data.value;
    this.valueTypes = data.valueTypes;
    this.valueTypeModeConfig = this.getDefaultModeMapping();

    if (data.valueTypeModes) {
      data.valueTypeModes.forEach((mode, valueType, _map) => {
        if (isValidMode(valueType, mode)) {
          this.valueTypeModeConfig.set(valueType, mode);
        }
      });
    }

    this.render();
  }

  private getDefaultModeMapping() {
    const defaultMapping = new Map([
      [ValueType.Int8, ValueTypeMode.Decimal],
      [ValueType.Int16, ValueTypeMode.Decimal],
      [ValueType.Int32, ValueTypeMode.Decimal],
      [ValueType.Int64, ValueTypeMode.Decimal],
      [ValueType.Float32, ValueTypeMode.Decimal],
      [ValueType.Float64, ValueTypeMode.Decimal],
      [ValueType.Boolean, ValueTypeMode.None],
      [ValueType.String, ValueTypeMode.None],
    ]);
    return defaultMapping;
  }

  private render() {
    render(
        html`
    <style>
      :host {
        flex: auto;
        display: flex;
      }

      .mode-type-button {
        border: none;
        padding: 0px;
        background-color: transparent;
        color: var(--text-highlight-color);
      }

      .value-types {
        display: grid;
        overflow: hidden;
        grid-template-columns: minmax(90px, 1fr) minmax(25px, 0.5fr) minmax(100px, 2fr) minmax(100px, 2fr);
        grid-column-gap: 10px;
        padding-left: 12px;
        padding-right: 12px;
      }

      .value-type-cell {
        height: 21px;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        display: flex;
      }

      </style>
        <div class="value-types">
          ${this.valueTypes.map(type => this.showValue(type))}
        </div>
      </div>
    `,
        this.shadow, {eventContext: this});
  }

  private showValue(type: ValueType) {
    return html`
        <span class="value-type-cell">${type}</span>
        ${
        isNumber(type) ?
            html`<button class="mode-type-button value-type-cell">${this.valueTypeModeConfig.get(type)}</button>` :
            html`<span/>`}

        ${
        typeHasSignedNotation(type) ? html`
            <span class="value-type-cell" data-value="true">+ ${this.parse({
          type,
          signed: false,
        })}</span>
            <span class="value-type-cell" data-value="true">± ${this.parse({type, signed: true})}</span>` :
                                      html`
            <span class="value-type-cell" data-value="true">${this.parse({type})}</span>`}
    `;
  }

  private parse(data: {type: ValueType, signed?: boolean}) {
    const mode = this.valueTypeModeConfig.get(data.type);
    if (!mode) {
      throw new Error(`No known way of showing value for ${data.type}`);
    }

    return format(
        {buffer: this.buffer, type: data.type, endianness: this.endianness, signed: data.signed || false, mode});
  }
}

customElements.define('devtools-linear-memory-inspector-interpreter-display', ValueInterpreterDisplay);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-linear-memory-inspector-interpreter-display': ValueInterpreterDisplay;
  }
}
