// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import './LinearMemoryNavigator.js';
import './LinearMemoryViewer.js';

import * as Sources from '../sources/sources.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';

const {render, html} = LitHtml;

import {HistoryNavigationEvent, LinearMemoryNavigatorData, Navigation, PageNavigationEvent} from './LinearMemoryNavigator.js';
import {ByteSelectedEvent, LinearMemoryViewer, LinearMemoryViewerData} from './LinearMemoryViewer.js';

export interface LinearMemoryInspectorData {
  memory: Uint8Array;
  address: number;
}

class AddressHistoryEntry extends Sources.SimpleHistoryManager.HistoryEntry {
  private address = 0;
  private callback;

  constructor(address: number, callback: (x: number) => void) {
    super();
    this.address = address;
    this.callback = callback;
  }

  valid() {
    return this.address >= 0;
  }

  reveal() {
    this.callback(this.address);
  }
}

export class LinearMemoryInspector extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private readonly history = new Sources.SimpleHistoryManager.SimpleHistoryManager(10);
  private memory = new Uint8Array();
  private address = 0;

  set data(data: LinearMemoryInspectorData) {
    this.memory = data.memory;
    this.address = data.address;
    this.render();
  }

  private render() {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    render(html`
      <style>
        :host {
          flex: auto;
          display: flex;
        }

        .memory-inspector {
          display: flex;
          flex: auto;
          flex-wrap: wrap;
          flex-direction: column;
          font-family: monospace;
          padding: 9px 12px 9px 7px;
        }

        devtools-linear-memory-inspector-navigator + devtools-linear-memory-inspector-viewer {
          margin-top: 12px;
        }
      </style>
      <div class="memory-inspector">
        <devtools-linear-memory-inspector-navigator
          .data=${{address: this.address} as LinearMemoryNavigatorData}
          @page-navigation=${this.navigatePage}
          @history-navigation=${this.navigateHistory}></devtools-linear-memory-inspector-navigator>
        <devtools-linear-memory-inspector-viewer
          .data=${{memory: this.memory, address: this.address} as LinearMemoryViewerData}
          @byte-selected=${(e: ByteSelectedEvent) => this.jumpToAddress(true /* makeHistoryEntry */, e.data)}></devtools-linear-memory-inspector-viewer>
      </div>
      `, this.shadow, {
      eventContext: this,
    });
    // clang-format on
  }

  private navigateHistory(e: HistoryNavigationEvent) {
    if (!this.history.empty()) {
      switch (e.data) {
        case Navigation.Backward:
          this.history.rollback();
          break;
        case Navigation.Forward:
          this.history.rollover();
          break;
        default:
          // do nothing
      }
    }
  }

  private navigatePage(e: PageNavigationEvent) {
    const viewer = this.shadow.querySelector<LinearMemoryViewer>('devtools-linear-memory-inspector-viewer');
    if (!viewer) {
      return;
    }

    let newAddress;
    switch (e.data) {
      case Navigation.Forward:
        newAddress = Math.min(this.address + viewer.getNumBytesPerPage(), this.memory.length - 1);
        break;
      case Navigation.Backward:
        newAddress = Math.max(this.address - viewer.getNumBytesPerPage(), 0);
        break;
      default:
        // do nothing
        return;
    }
    this.jumpToAddress(true /* makeHistoryEntry */, newAddress);
  }

  private jumpToAddress(makeHistoryEntry: boolean, address: number) {
    if (makeHistoryEntry) {
      const historyEntry = new AddressHistoryEntry(address, x => this.jumpToAddress(false /* makeHistoryEntry */, x));
      this.history.push(historyEntry);
    }

    this.address = address;
    this.render();
  }
}

customElements.define('devtools-linear-memory-inspector-inspector', LinearMemoryInspector);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-linear-memory-inspector-inspector': LinearMemoryInspector;
  }
}
