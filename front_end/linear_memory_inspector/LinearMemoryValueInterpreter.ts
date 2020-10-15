// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../common/common.js';
import * as ComponentHelpers from '../component_helpers/component_helpers.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';

const {render, html} = LitHtml;
const ls = Common.ls;
const getStyleSheets = ComponentHelpers.GetStylesheet.getStyleSheets;


export interface LinearMemoryValueInterpreterData {
  value: ArrayBuffer;
  valueTypes: ValueType[]
  valueRepresentation?: ValueRepresentation[]
}

export enum ValueType {
  Int8 = 'Integer 8-bit',
  Int16 = 'Integer 16-bit',
  Int64 = 'Integet 64-bit',
  Boolean = 'Boolean',
  Float16 = 'Float 16-bit',
  Float32 = 'Float 64-bit'
}

enum ValueRepresentation {
  dec,
  hex,
  sci
}

export class LinearMemoryValueInterpreter extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private value: ArrayBuffer = new ArrayBuffer(0);
  private valueTypes: ValueType[] = [];
  private valueTypeToRepresentation: Map<ValueType, ValueRepresentation> = new Map();
  private valueView: DataView = new DataView(this.value);

  constructor() {
    super();
    this.shadow.adoptedStyleSheets = [
      // ...getStyleSheets('ui/inspectorCommon.css', {patchThemeSupport: true}),
      ...getStyleSheets('ui/toolbar.css', {patchThemeSupport: true}),
      // ...getStyleSheets('ui/inspectorSyntaxHighlight.css', {patchThemeSupport: true}),
    ];
    //
  }

  set data(data: LinearMemoryValueInterpreterData) {
    this.value = data.value;
    this.valueTypes = data.valueTypes;
    this.valueView = new DataView(this.value);
    this.render();
  }

  private render() {
    render(
        html`
    <style>
    .value-interpreter {
      margin-left: 12px;
      width: 100%;
      height: 100%;
      padding: 9px 0px 7px 0px;
      border-left: var(--divider-border);
      background-color: var(--toolbar-bg-color);
    }

    .value-interpreter-settings-toolbar {
      min-height: 26px;
      display: flex;
      flex-wrap: nowrap;
      justify-content: space-between;
      background-color: var(--toolbar-bg-color);
      padding-left: 6px;
    }

    .value-interpreter-settings-icon {
      display: inline-block;
      width: 14px;
      height: 14px;
      -webkit-mask-position:-175px 163px;
      -webkit-mask-image: url(Images/largeIcons.svg);
    }

    .value-interpreter-dropdown-icon {
      display: inline-block;
      width: 10px;
      height: 10px;
      -webkit-mask-position: -80px 30px;
      -webkit-mask-image: url(Images/smallIcons.svg);
    }

    .value-types {
      display:inline-grid;
    }
    .value-type-line {
      height: 21px;
      width: 100%;
      display: flex;
      padding-left: 12px;
      padding-right: 12px;
    }

    .value-type-cell {
      overflow: hide; 
      padding: 1px;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
      display: flex;
      align-items: center;
    }

    .value-type-description {
      min-width: 90px;
    }

    .value-type-representation {
      min-width: 21px;
    }

    .value-type-value {
      min-width: 100px;
    }

    .value-type-line:nth-of-type(even) {
      background-color: white;
    }

    .value-type-cell + .value-type-cell {
      margin-left: 5px;
    }
      
    </style>
    <div class="value-interpreter">
      <div class="value-interpreter-settings-toolbar">
        <div class="toolbar">
          <button class="toolbar-button toolbar-item toolbar-has-dropdown">
            <span class="toolbar-text">Little endian</span>
            <span class="value-interpreter-dropdown-icon toolbar-glyph"></span>
          </button>
        </div>
        <button class="toolbar-button toolbar-item">
          <span class="value-interpreter-settings-icon toolbar-glyph "></span>
        </button>
      </div>
      <div class="value-types">
        ${this.valueTypes.map(type => this.showValue(type))}
      </div>
    </div>
 `,
        this.shadow, {eventContext: this});
  }

  private showValue(type: ValueType) {
    return html`
      <div class="value-type-line">
        <span class="value-type-description value-type-cell">${type}</span>
        <span class="value-type-representation value-type-cell">dec</span>
        <span class="value-type-value value-type-cell">${this.parseValueAs(type, true)}</span>
        <span class="value-type-value value-type-cell">${this.parseValueAs(type, false)}</span>
      </div>
    `;
  }

  private parseValueAs(type: ValueType, signed: boolean) {
    switch (type) {
      case ValueType.Int8:
        if (signed) {
          return this.valueView.getInt8(0);
        }
        return this.valueView.getUint8(0);

      case ValueType.Int16:
        if (signed) {
          return this.valueView.getInt16(0);
        }
        return this.valueView.getUint16(0);
      case ValueType.Int64:
        if (signed) {
          return this.valueView.getBigInt64(0);
        }
        return this.valueView.getBigUint64(0);
      default:
        return 0;
    }
  }
}

customElements.define('linear-memory-value-interpreter', LinearMemoryValueInterpreter);

declare global {
  interface HTMLElementTagNameMap {
    'linear-memory-value-interpreter': LinearMemoryValueInterpreter;
  }
}
