// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as UI from '../ui/ui.js';
import {LinearMemoryInspector, MemoryRequestEvent} from './LinearMemoryInspector.js';

export class Wrapper extends UI.Widget.VBox {
  private readonly view: LinearMemoryInspectorPaneImpl;

  constructor() {
    super();
    this.view = LinearMemoryInspectorPaneImpl.instance();
  }

  wasShown() {
    this.view.show(this.contentElement);
  }
}

export class LinearMemoryInspectorPaneImpl extends UI.Widget.VBox {
  private static inspectorInstance: LinearMemoryInspectorPaneImpl;
  private tabbedPane: UI.TabbedPane.TabbedPane = new UI.TabbedPane.TabbedPane();
  private tabIdToInspectorView: Map<string, LinearMemoryInspectorView> = new Map();

  private constructor() {
    super(false);
    const placeholder = document.createElement('div');
    placeholder.textContent = ls`No open inspections`;
    placeholder.style.display = 'flex';
    this.tabbedPane.setPlaceholderElement(placeholder);
    this.tabbedPane.setCloseableTabs(true);
    this.tabbedPane.setAllowTabReorder(true, true);
    this.tabbedPane.addEventListener(UI.TabbedPane.Events.TabClosed, this._tabClosed, this);
    this.tabbedPane.show(this.contentElement);
  }

  static instance() {
    if (!LinearMemoryInspectorPaneImpl.inspectorInstance) {
      LinearMemoryInspectorPaneImpl.inspectorInstance = new LinearMemoryInspectorPaneImpl();
    }
    return LinearMemoryInspectorPaneImpl.inspectorInstance;
  }

  showLinearMemory(scriptId: string, title: string, arrayWrapper: LazyUint8Array, address: number) {
    if (this.tabIdToInspectorView.has(scriptId)) {
      this.tabbedPane.selectTab(scriptId);
      return;
    }
    const inspectorView = new LinearMemoryInspectorView(arrayWrapper, address);
    this.tabIdToInspectorView.set(scriptId, inspectorView);
    this.tabbedPane.appendTab(scriptId, title, inspectorView, undefined, false, true);
    this.tabbedPane.selectTab(scriptId);
  }

  // Typescript currently cannot pick up EventTargetEvents.
  // eslint-disable-next-line
  _tabClosed(event: any) {
    const tabId = event.data.tabId;
    this.tabIdToInspectorView.delete(tabId);
  }
}
export interface LazyUint8Array {
  getRange(start: number, end: number): Promise<Uint8Array>;
  length(): number;
}

class LinearMemoryInspectorView extends UI.Widget.VBox {
  static MEMORY_TRANSFER_CHUNK_SIZE = 1000;
  private readonly memoryWrapper: LazyUint8Array;
  private readonly inspector: LinearMemoryInspector;

  constructor(memoryWrapper: LazyUint8Array, address: number) {
    super(true /* isWebComponent */);

    if (address < 0 || address > memoryWrapper.length()) {
      throw new Error('Invalid address to show');
    }

    this.memoryWrapper = memoryWrapper;
    this.inspector = new LinearMemoryInspector();
    this.inspector.addEventListener('memory-requested', ((event: MemoryRequestEvent) => {
                                                          this.memoryRequested(event);
                                                        }) as EventListener);
    this.contentElement.appendChild(this.inspector);

    const memoryChunkStart = Math.max(0, address - LinearMemoryInspectorView.MEMORY_TRANSFER_CHUNK_SIZE / 2);
    const memoryChunkEnd = memoryChunkStart + LinearMemoryInspectorView.MEMORY_TRANSFER_CHUNK_SIZE;
    this.memoryWrapper.getRange(memoryChunkStart, memoryChunkEnd).then(memory => {
      this.inspector.data = {
        memory: memory,
        address: address,
        memoryOffset: memoryChunkStart,
      };
    });
  }

  private memoryRequested(e: MemoryRequestEvent) {
    const {start, end, address} = e.data;
    if (address < start || address >= end) {
      throw new Error('Requested address is out of bounds.');
    }

    // Check that the requested start is within bounds.
    // If the requested end is larger than the actual
    // memory, it will be automatically capped when
    // requesting the range.
    if (start < 0 || start > end || start >= this.memoryWrapper.length()) {
      throw new Error('Requested range is out of bounds.');
    }
    const chunkEnd = Math.max(end, start + LinearMemoryInspectorView.MEMORY_TRANSFER_CHUNK_SIZE);
    this.memoryWrapper.getRange(start, chunkEnd).then(memory => {
      this.inspector.data = {
        memory: memory,
        address: address,
        memoryOffset: start,
      };
    });
  }
}
