// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as ComponentHelpers from '../component_helpers/component_helpers.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';

import {AddressChangedEvent, toHexString} from './LinearMemoryInspectorUtils.js';


const {render, html} = LitHtml;
const getStyleSheets = ComponentHelpers.GetStylesheet.getStyleSheets;


export interface LinearMemoryViewerData {
  memory: Uint8Array, index: number
  memoryOffset: number
}

export class LinearMemoryViewer extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private readonly resizeObserver = new ResizeObserver(() => this.update());
  private isObservingResize = false;
  private memory = new Uint8Array();
  private selectedRow = 0;
  private numRows = 1;
  private numBytes = 8;
  private startAddress = 0;
  private index = 0;
  private memoryOffset = 0;


  constructor() {
    super();
    this.shadow.adoptedStyleSheets = [
      ...getStyleSheets('ui/inspectorCommon.css', {patchThemeSupport: true}),
      ...getStyleSheets('ui/toolbar.css', {patchThemeSupport: true}),
    ];
    //
  }

  getBytesPerPage() {
    return this.numBytes * this.numRows;
  }

  getNextPageRange() {
    const start = this.startAddress + this.getBytesPerPage();
    return {
      start,
      end: start + this.getBytesPerPage(),
    };
  }

  getPreviousPageRange() {
    const start = Math.max(0, this.startAddress - this.getBytesPerPage());
    return {
      start,
      end: start + this.getBytesPerPage(),
    };
  }

  getPageRangeForIndex(index: number) {
    const start = Math.floor(index / this.getBytesPerPage()) * this.getBytesPerPage();
    return {
      start,
      end: start + this.getBytesPerPage(),
    };
  }

  private update() {
    this.recomputeSize();
    const numBytesInView = this.getBytesPerPage();
    this.startAddress = Math.floor(this.index / numBytesInView) * numBytesInView;
    this.selectedRow = Math.floor((this.index - this.startAddress) / this.numBytes);
    this.render();
    this.engageResizeObserver();
  }

  private computeCurrentWidth(selector: string) {
    const elements = this.shadowRoot!.querySelectorAll(`${selector}`);
    if (!elements) {
      return 0;
    }

    const first = elements[0];
    const last = elements[elements.length - 1];
    if (!last || !first) {
      return 0;
    }

    return last.getBoundingClientRect().right - first.getBoundingClientRect().left;
  }

  private recomputeSize() {
    if (this.clientWidth === 0 || this.clientHeight === 0) {
      return;
    }

    const bytesWidth = this.computeCurrentWidth('.memory-inspector-byte-cell');
    const asciiWidth = this.computeCurrentWidth('.memory-inspector-ascii-cell');
    const firstByte = this.shadowRoot!.querySelector('.memory-inspector-byte-cell');
    if (!firstByte) {
      return;
    }

    const spaceForBytes = this.clientWidth - firstByte!.getBoundingClientRect().left;
    const groupWidth = Math.ceil((bytesWidth + asciiWidth) / this.numBytes);
    if (spaceForBytes < groupWidth) {
      return;
    }
    const height = this.clientHeight;

    this.numBytes = Math.min(Math.floor(spaceForBytes / groupWidth), this.memory.length);
    const maxNumRows = Math.ceil(this.memory.length / this.numBytes);
    this.numRows = Math.min(Math.floor(height / firstByte.clientHeight), maxNumRows);
  }

  private engageResizeObserver() {
    if (!this.resizeObserver || this.isObservingResize) {
      return;
    }
    const viewer = this.shadow.querySelector('.memory-inspector-view');

    if (!viewer) {
      return;
    }

    this.resizeObserver.observe(viewer);
    this.isObservingResize = true;
  }

  set data(data: LinearMemoryViewerData) {
    this.memory = data.memory;
    this.index = data.index;
    this.memoryOffset = data.memoryOffset;
    this.update();
  }

  private render() {
    render(
        html`
    <style>
      :root {
        --selected-byte-color: #1a1aa6;
        --selected-byte-background-color: #cfe8fc;
      }

      .memory-inspector-view {
        height: 100%;
        width: 100%;
        margin: 5px 7px 5px 7px;
        overflow: hidden;
        text-overflow: ellipsis;
        box-sizing: border-box;
      }
      .memory-inspector-view-line {
        display: flex;
        height: 20px;
        width: 100%;
        font-size: 12px;
        display: flex;
        align-items: center;
      }
      .memory-inspector-cell {
        padding: 1px;
        text-align: center;
        display: inline-block;
        border: 1px solid transparent;
        border-radius: 2px;
      }
      .memory-inspector-cell.selected {
        border-color: #1a1aa6;
        color: #1a1aa6;
        background-color: #cfe8fc;     
      }
      .memory-inspector-byte-cell {
        min-width: 21px;
        min-height: 17px;
      }
      .memory-inspector-byte-cell:nth-of-type(4n+6) {
        margin-left: 8px;
      }
      .memory-inspector-ascii-cell {
        min-width: 14px;
        min-height: 17px;
        color: #1a1aa6;
      }
      .memory-inspector-view-address {
        min-width: 55px;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 11px;
        color: #9aa0a6;
      }
      .memory-inspector-view-address.selected {
        font-weight: bold;
        color: #333333;
      }
      .memory-inspector-divider {
        width: 1px;
        height: 100%;
        background-color: rgb(204, 204, 204);
        margin: 0px 4px 0px 4px;
      }
      .memory-inspector-view-ascii {
        margin-right: 8px;
      }

     
    
    </style>
    <div class="memory-inspector-view">
        ${this.renderBytes()}
    </div>`,
        this.shadow, {eventContext: this});
  }

  private onSelectedByte(index: number) {
    return () => {
      this.dispatchEvent(new AddressChangedEvent(index + this.memoryOffset));
    };
  }

  private renderByteValues(start: number, end: number) {
    const cells = [];
    for (let i = start; i < end; ++i) {
      const classMap = {
        'memory-inspector-cell': true,
        'memory-inspector-byte-cell': true,
        selected: (i + this.memoryOffset) === this.index,
      };
      const byteVal = i < this.memory.length ? LitHtml.html`${toHexString(this.memory[i], 2)}` : '';
      cells.push(LitHtml.html`
        <span class="${LitHtml.Directives.classMap(classMap)}" @click=${this.onSelectedByte(i)}>
          ${byteVal}
        </span>`);
    }
    return LitHtml.html`${cells}`;
  }

  private renderRow(row: number) {
    const startIndex = this.startAddress - this.memoryOffset + row * this.numBytes;
    const classMap = {
      'memory-inspector-view-address': true,
      selected: this.selectedRow === row,
    };
    const endIndex = startIndex + this.numBytes;
    return LitHtml.html`
    <div class="memory-inspector-view-line">
      <span class="${LitHtml.Directives.classMap(classMap)}">${toHexString(startIndex + this.memoryOffset, 8)}</span>
      <div class="memory-inspector-divider"></div>
      ${this.renderByteValues(startIndex, endIndex)}
      <div class="memory-inspector-divider"></div>
      <div class="memory-inspector-view-line memory-inspector-view-ascii">
      ${this.renderCharacterValues(startIndex, endIndex)}
      </div>
    </div>`;
  }

  private renderCharacterValues(start: number, end: number) {
    const cells = [];
    for (let i = start; i < end; ++i) {
      const classMap = {
        'memory-inspector-cell': true,
        'memory-inspector-ascii-cell': true,
        selected: this.index === (i + this.memoryOffset),
      };
      const value = i < this.memory.length ? LitHtml.html`${this.toASCII(this.memory[i])}` : '';
      cells.push(LitHtml.html`<span class="${LitHtml.Directives.classMap(classMap)}">${value}</span>`);
    }
    return LitHtml.html`${cells}`;
  }

  private toASCII(byte: number) {
    if (byte >= 20 && byte <= 0x7F) {
      return String.fromCharCode(byte);
    }
    return '.';
  }

  private renderBytes() {
    const itemTemplates = [];
    for (let i = 0; i < this.numRows; ++i) {
      itemTemplates.push(this.renderRow(i));
    }
    return LitHtml.html`${itemTemplates}`;
  }
}

customElements.define('linear-memory-viewer', LinearMemoryViewer);

declare global {
  interface HTMLElementTagNameMap {
    'linear-memory-viewer': LinearMemoryViewer;
  }
}
