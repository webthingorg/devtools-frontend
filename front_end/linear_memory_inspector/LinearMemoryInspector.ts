// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import './LinearMemoryViewer.js';
import './LinearMemoryNavigator.js';
import './LinearMemoryValueInterpreter.js';

import * as ComponentHelpers from '../component_helpers/component_helpers.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';

const {render, html} = LitHtml;
const getStyleSheets = ComponentHelpers.GetStylesheet.getStyleSheets;

import type {LinearMemoryViewer, LinearMemoryViewerData} from './LinearMemoryViewer.js';
import type {LinearMemoryNavigatorData} from './LinearMemoryNavigator.js';
import {LinearMemoryValueInterpreterData, ValueType} from './LinearMemoryValueInterpreter.js';
import {AddressChangedEvent, Navigation, RequestMemoryEvent, HistoryNavigationEvent, PageNavigationEvent} from './LinearMemoryInspectorUtils.js';
import {SimpleHistoryManager, HistoryEntry} from '../sources/SimpleHistoryManager.js';

export interface LinearMemoryInspectorData {
  memory: Uint8Array
  index: number
  memoryOffset: number
}

class LinearMemoryInspectorHistoryEntry extends HistoryEntry {
  private index = 0;
  private inspector;

  constructor(inspector: LinearMemoryInspector, index: number) {
    super();
    this.inspector = inspector;
    this.index = index;
  }

  /**
   * @override
   * @return {boolean}
   */
  valid() {
    return this.index > 0;
  }

  reveal() {
    this.inspector.jumpToAddress(this.index);
  }
}

export class LinearMemoryInspector extends HTMLElement {
  static NUM_PAGES_TO_FETCH = 5;
  // Todo introduce max data to fetch
  private readonly shadow = this.attachShadow({mode: 'open'});
  private memory = new Uint8Array();
  private index = 0;
  private memoryOffset = 0;
  private history: SimpleHistoryManager = new SimpleHistoryManager(10);

  constructor() {
    super();
    this.shadow.adoptedStyleSheets = [
      ...getStyleSheets('ui/inspectorCommon.css', {patchThemeSupport: true}),
    ];
  }

  set data(data: LinearMemoryInspectorData) {
    this.memory = data.memory;
    this.index = data.index;
    this.memoryOffset = data.memoryOffset;
    this.render();
  }

  private render() {
    render(
        html`
    <style>
      .memory-inspector {
        height: 100%;
        width: 100%;
        display: flex;
        --width-main-view: 66%;
      }

      .memory-inspector-main-view {
        width: var(--width-main-view);
        display: inline-grid;
      }

      .memory-inspector-interpreter-view {
        width: calc(100% - var(--width-main-view));
        display: inline-grid;
      }
    </style>
    <div class="memory-inspector monospace">
      <div class="memory-inspector-main-view">
        <linear-memory-navigator @history-navigation=${this.navigateInHistory} @page-navigation=${
            this.navigatePage} .data=${{address: this.index} as LinearMemoryNavigatorData}></linear-memory-navigator>
        <linear-memory-viewer @address-changed=${this.updateAddress} .data=${
            {memory: this.memory, index: this.index, memoryOffset: this.memoryOffset} as
            LinearMemoryViewerData}></linear-memory-viewer>
      </div>
      <div class="memory-inspector-interpreter-view">
      <linear-memory-value-interpreter .data=${{
          value: this.memory.slice(this.index - this.memoryOffset, this.index - this.memoryOffset + 100).buffer,
          valueTypes: [ValueType.Int8, ValueType.Int16, ValueType.Int64],
        } as LinearMemoryValueInterpreterData}></linear-memory-value-interpreter>
    </div>

    </div>`,
        this.shadow, {eventContext: this});
  }

  navigatePage(e: PageNavigationEvent) {
    const viewer = this.shadowRoot!.querySelector<LinearMemoryViewer>('linear-memory-viewer');
    let requestedIndex;
    switch (e.data) {
      case Navigation.Forward:
        requestedIndex = this.index + viewer!.getBytesPerPage();
        break;
      case Navigation.Backward:
        requestedIndex = Math.max(this.index - viewer!.getBytesPerPage(), 0);
        break;
      default:
        // do nothing
        return;
    }

    const historyEntry = new LinearMemoryInspectorHistoryEntry(this, requestedIndex);
    this.history.push(historyEntry);
    this.jumpToAddress(requestedIndex);
  }

  jumpToAddress(index: number) {
    const viewer = this.shadowRoot!.querySelector<LinearMemoryViewer>('linear-memory-viewer');
    const {start, end} = viewer!.getPageRangeForIndex(Math.max(0, index));
    if (start >= this.memoryOffset && (end - this.memoryOffset) < this.memory.length) {
      this.index = index;
      this.render();
    } else {
      const startFetch = Math.max(0, start - LinearMemoryInspector.NUM_PAGES_TO_FETCH * viewer!.getBytesPerPage());
      const endFetch = end + LinearMemoryInspector.NUM_PAGES_TO_FETCH * viewer!.getBytesPerPage();
      this.dispatchEvent(new RequestMemoryEvent(startFetch, endFetch, index));
    }
  }

  getMemoryRequestRange(index: number, bytesPerPage: number) {
    const sizeFetch = 1000;
    const start = Math.floor(index / bytesPerPage) * bytesPerPage;
    const end = start + sizeFetch;
    return {start, end};
  }

  navigateInHistory(e: HistoryNavigationEvent) {
    if (this.history.empty()) {
      return;
    }
    switch (e.data) {
      case Navigation.Backward:
        this.history.rollback();
        break;
      case Navigation.Forward:
        this.history.rollover();
        break;
      default:
        // do nothing
        return;
    }
  }

  updateAddress(e: AddressChangedEvent) {
    this.index = e.data;
    const historyEntry = new LinearMemoryInspectorHistoryEntry(this, e.data);
    this.history.push(historyEntry);
    this.render();
  }
}

customElements.define('linear-memory-inspector', LinearMemoryInspector);

declare global {
  interface HTMLElementTagNameMap {
    'linear-memory-inspector': LinearMemoryInspector;
  }
}
