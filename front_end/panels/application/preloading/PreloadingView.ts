// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as DataGrid from '../../../ui/components/data_grid/data_grid.js';
import * as i18n from '../../../core/i18n/i18n.js';
import * as UI from '../../../ui/legacy/legacy.js';
import * as SDK from '../../../core/sdk/sdk.js';

import * as PreloadingComponents from './components/components.js';

// eslint-disable-next-line rulesdir/es_modules_import
import emptyWidgetStyles from '../../../ui/legacy/emptyWidget.css.js';
import preloadingViewStyles from './preloadingView.css.js';

type PreId = SDK.PrerenderingModel.PreId;
type PrerenderingAttempt = SDK.PrerenderingModel.PrerenderingAttempt;

const UIStrings = {
  /**
  *@description Text to clear content
  */
  clearNotOngoing: 'Clear not ongoing',
  /**
  *@description Text in grid and details
  */
  statusPrerendering: 'Prerendering',
  /**
  *@description Text in grid and details
  */
  statusActivated: 'Activated',
  /**
  *@description Text in grid and details
  */
  statusCancelled: 'Cancelled',
  /**
  *@description Text in grid and details
  */
  statusDiscarded: 'Discarded',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/preloading/PreloadingView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

class PrerenderingUIUtils {
  static trigger(x: PrerenderingAttempt): string {
    switch (x.trigger.kind) {
      case 'PrerenderingTriggerSpecRules':
        return i18n.i18n.lockedString('Speculation Rules');
      case 'PrerenderingTriggerDUI':
        return i18n.i18n.lockedString('Direct User Input');
      case 'PrerenderingTriggerDSE':
        return i18n.i18n.lockedString('Default Search Engine');
      case 'PrerenderingTriggerOpaque':
        return i18n.i18n.lockedString('Opaque');
    }
  }

  static status(x: PrerenderingAttempt): string {
    switch (x.status) {
      case 'prerendering':
        return i18nString(UIStrings.statusPrerendering);
      case 'activated':
        return i18nString(UIStrings.statusActivated);
      case 'cancelled':
        return i18nString(UIStrings.statusCancelled);
      case 'discarded':
        return i18nString(UIStrings.statusDiscarded);
    }
  }
}

export class PreloadingView extends UI.Widget.VBox {
  private readonly model: SDK.PrerenderingModel.PrerenderingModel;
  private focused: PreId|null = null;

  private readonly toolbar: UI.Toolbar.Toolbar;
  private readonly splitWidget: UI.SplitWidget.SplitWidget;
  private readonly grid = new PreloadingComponents.PreloadingGrid.PreloadingGrid();
  private readonly bottomContainer: UI.Widget.VBox;
  private bottom: UI.Widget.Widget;

  constructor(model: SDK.PrerenderingModel.PrerenderingModel) {
    super(/* isWebComponent */ true, /* delegatesFocus */ false);

    this.model = model;
    this.model.addEventListener(SDK.PrerenderingModel.Events.PrerenderingAttemptStarted, this.onModelUpdated, this);
    this.model.addEventListener(SDK.PrerenderingModel.Events.PrerenderingAttemptUpdated, this.onModelUpdated, this);
    this.model.addEventListener(SDK.PrerenderingModel.Events.PrerenderingAttemptsRemoved, this.onModelUpdated, this);

    // this (VBox)
    //   +- toolbar (| [clear] |)
    //   +- splitWidget
    //        +- topContainer
    //             +- PreloadingGrid
    //        +- bottomContainer
    //             +- PreloadingDetailsView
    //
    // - If an row selected, PreloadingDetailsView shows details of it.
    // - If not, PreloadingDetailsView shows some messages.

    this.toolbar = new UI.Toolbar.Toolbar('preloading-toolbar', this.contentElement);

    const clearButton = new UI.Toolbar.ToolbarButton(i18nString(UIStrings.clearNotOngoing), 'largeicon-clear');
    clearButton.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, () => this.onClearNotOngoing());
    this.toolbar.appendToolbarItem(clearButton);

    this.toolbar.appendSeparator();

    const topContainer = new UI.Widget.VBox();
    topContainer.setMinimumSize(0, 40);
    this.bottomContainer = new UI.Widget.VBox();
    this.bottomContainer.setMinimumSize(0, 80);
    this.splitWidget = new UI.SplitWidget.SplitWidget(
        /* isVertical */ false,
        /* secondIsSidebar */ true,
        /* settingName */ undefined,
        /* defaultSidebarWidth */ undefined,
        /* defaultSidebarHeight */ 500,
        /* constraintsInDip */ undefined,
    );
    this.splitWidget.setMainWidget(topContainer);
    this.splitWidget.setSidebarWidget(this.bottomContainer);

    this.grid.addEventListener('cellfocused', this.onCellFocused.bind(this));
    topContainer.contentElement.appendChild(this.grid);

    this.bottom = new PreloadingDetailsView(null);
  }

  show(parentElement: Element, insertBefore?: Node|null): void {
    super.show(parentElement, insertBefore);

    this.splitWidget.show(this.contentElement);
    this.bottom.show(this.bottomContainer.contentElement);

    this.onModelUpdated();
  }

  private onModelUpdated(): void {
    const convert = ([id, x]: [PreId, PrerenderingAttempt]): PreloadingComponents.PreloadingGrid.PreloadingGridRow => {
      return {
        id: id,
        startedAt: new Date(x.startedAt).toLocaleString(),
        type: i18n.i18n.lockedString('Prerendering'),
        trigger: PrerenderingUIUtils.trigger(x),
        url: x.url,
        status: PrerenderingUIUtils.status(x),
      };
    };
    const rows = this.model.getRegistry().getAll().map(convert);
    this.grid.update(rows);
    this.showDetails();
  }

  private onCellFocused(event: Event): void {
    const focusedEvent = event as DataGrid.DataGridEvents.BodyCellFocusedEvent;
    this.focused = focusedEvent.data.row.cells.find(cell => cell.columnId === 'id')?.value as PreId;
    this.showDetails();
  }

  private showDetails(): void {
    const prerenderingAttempt = this.focused === null ? null : this.model.getById(this.focused);

    this.bottom.detach();
    this.bottom = new PreloadingDetailsView(prerenderingAttempt);
    this.bottom.show(this.bottomContainer.contentElement);
  }

  private onClearNotOngoing(): void {
    this.model.clearNotOngoing();
  }

  wasShown(): void {
    super.wasShown();

    this.registerCSSFiles([emptyWidgetStyles, preloadingViewStyles]);
  }
}

// Widget showing details of a prerendering attempt.
class PreloadingDetailsView extends UI.ThrottledWidget.ThrottledWidget {
  private readonly reportView = new PreloadingComponents.PreloadingDetailsReportView.PreloadingDetailsReportView();
  private readonly data: PrerenderingAttempt|null;

  constructor(data: PrerenderingAttempt|null) {
    super();

    this.data = data;
    this.contentElement.classList.add('overflow-auto');
    this.contentElement.appendChild(this.reportView);
    this.update();
  }

  async doUpdate(): Promise<void> {
    this.reportView.data = this.data;
  }
}
