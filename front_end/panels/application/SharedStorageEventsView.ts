// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../core/i18n/i18n.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as UI from '../../ui/legacy/legacy.js';

import type * as DataGrid from '../../ui/components/data_grid/data_grid.js';
import type * as Protocol from '../../generated/protocol.js';
import * as SourceFrame from '../../ui/legacy/components/source_frame/source_frame.js';
import * as ApplicationComponents from './components/components.js';

import sharedStorageEventsViewStyles from './sharedStorageEventsView.css.js';

const UIStrings = {
  /**
   *@description Placeholder text instructing the user how to display shared
   *storage event details.
  */
  clickToDisplayBody: 'Click on any shared storage event to display the event parameters.',
  /**
  *@description Placeholder text telling the user no details are available for
  *the selected shared storage event.
  */
  noDataAvailable: 'No details available for the selected shared storage event.',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/SharedStorageEventsView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

class WrappedEvent {
  accessTime: string;
  accessType: string;
  ownerOrigin: string;
  eventParams: string;

  constructor(accessTime: string, accessType: string, ownerOrigin: string, eventParams: string) {
    this.accessTime = accessTime;
    this.accessType = accessType;
    this.ownerOrigin = ownerOrigin;
    this.eventParams = eventParams;
  }
}

function eventEquals(
    a: Protocol.Storage.SharedStorageAccessedEvent, b: Protocol.Storage.SharedStorageAccessedEvent): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export class SharedStorageEventsView extends UI.SplitWidget.SplitWidget {
  private readonly sharedStorageEventGrid = new ApplicationComponents.SharedStorageAccessGrid.SharedStorageAccessGrid();
  private events: Protocol.Storage.SharedStorageAccessedEvent[] = [];
  private noDataView: UI.Widget.VBox;
  private noDisplayView: UI.Widget.VBox;

  constructor() {
    super(/* isVertical */ false, /* secondIsSidebar: */ true);

    const topPanel = new UI.Widget.VBox();
    this.noDisplayView = new UI.Widget.VBox();
    this.noDataView = new UI.Widget.VBox();

    topPanel.setMinimumSize(0, 80);
    this.setMainWidget(topPanel);
    this.noDisplayView.setMinimumSize(0, 40);
    this.setSidebarWidget(this.noDisplayView);
    this.noDataView.setMinimumSize(0, 40);

    topPanel.contentElement.appendChild(this.sharedStorageEventGrid);
    this.sharedStorageEventGrid.addEventListener('cellfocused', this.onFocus.bind(this));

    this.noDisplayView.contentElement.classList.add('placeholder');
    const noDisplayDiv = this.noDisplayView.contentElement.createChild('div');
    noDisplayDiv.textContent = i18nString(UIStrings.clickToDisplayBody);

    this.noDataView.contentElement.classList.add('placeholder');
    const noDataDiv = this.noDataView.contentElement.createChild('div');
    noDataDiv.textContent = i18nString(UIStrings.noDataAvailable);
  }

  private getMainResourceTreeModel(): SDK.ResourceTreeModel.ResourceTreeModel|null {
    const mainTarget = SDK.TargetManager.TargetManager.instance().mainTarget();
    return mainTarget?.model(SDK.ResourceTreeModel.ResourceTreeModel) || null;
  }

  private getMainFrame(): SDK.ResourceTreeModel.ResourceTreeFrame|null {
    return this.getMainResourceTreeModel()?.mainFrame || null;
  }

  get id(): Protocol.Page.FrameId|null {
    return this.getMainFrame()?.id || null;
  }

  wasShown(): void {
    super.wasShown();
    const sbw = this.sidebarWidget();
    if (sbw) {
      sbw.registerCSSFiles([sharedStorageEventsViewStyles]);
    }
  }

  addEvent(event: Protocol.Storage.SharedStorageAccessedEvent): void {
    // Only add event if main frame id matches.
    if (event.mainFrameId !== this.id) {
      return;
    }

    // Only add if not already present.
    const foundEvent = this.events.find(t => eventEquals(t, event));
    if (foundEvent) {
      return;
    }

    this.events.push(event);
    this.sharedStorageEventGrid.data = this.events;
  }

  clearEvents(): void {
    this.events = [];
    this.sharedStorageEventGrid.data = this.events;
    this.setSidebarWidget(this.noDisplayView);
  }

  private async onFocus(event: Event): Promise<void> {
    const focusedEvent = event as DataGrid.DataGridEvents.BodyCellFocusedEvent;
    const row = focusedEvent.data.row;
    if (!row) {
      return;
    }

    const eventTime = row.cells.find(cell => cell.columnId === 'event-time')?.value as string;
    const eventType = row.cells.find(cell => cell.columnId === 'event-type')?.value as string;
    const origin = row.cells.find(cell => cell.columnId === 'event-owner-origin')?.value as string;
    const params = row.cells.find(cell => cell.columnId === 'event-params')?.value as string;

    const wrappedEvent = new WrappedEvent(eventTime, eventType, origin, params);

    const jsonView = await SourceFrame.JSONView.JSONView.createView(JSON.stringify(wrappedEvent));
    jsonView?.setMinimumSize(0, 40);
    if (jsonView) {
      this.setSidebarWidget(jsonView);
    } else {
      this.setSidebarWidget(this.noDataView);
    }
  }

  getEventsForTesting(): Array<Protocol.Storage.SharedStorageAccessedEvent> {
    return this.events;
  }

  getSharedStorageEventGridForTesting(): ApplicationComponents.SharedStorageAccessGrid.SharedStorageAccessGrid {
    return this.sharedStorageEventGrid;
  }
}
