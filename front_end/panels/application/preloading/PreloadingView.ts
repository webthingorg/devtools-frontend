// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as DataGrid from '../../../ui/components/data_grid/data_grid.js';

import {assertNotNullOrUndefined} from '../../../core/platform/platform.js';
import * as Platform from '../../../core/platform/platform.js';
import * as Common from '../../../core/common/common.js';
import * as SplitView from '../../../ui/components/split_view/split_view.js';
import * as i18n from '../../../core/i18n/i18n.js';
import * as UI from '../../../ui/legacy/legacy.js';
import * as Protocol from '../../../generated/protocol.js';
import * as SDK from '../../../core/sdk/sdk.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';
import * as LegacyWrapper from '../../../ui/components/legacy_wrapper/legacy_wrapper.js';

import * as PreloadingComponents from './components/components.js';
import type * as PreloadingHelper from './helper/helper.js';

// eslint-disable-next-line rulesdir/es_modules_import
import emptyWidgetStyles from '../../../ui/legacy/emptyWidget.css.js';
import preloadingViewStyles from './preloadingView.css.js';

const UIStrings = {
  /**
   *@description DropDown title for filtering preloading attempts by rule set
   */
  filterFilterByRuleSet: 'Filter by rule set',
  /**
   *@description DropDown text for filtering preloading attempts by rule set: No filter
   */
  filterAllRuleSets: 'All rule sets',
  /**
   *@description DropDown text for filtering preloading attempts by rule set: By rule set
   *@example {0} PH1
   */
  filterRuleSet: 'Rule set: {PH1}',
  /**
   *@description Text in grid: Rule set is valid
   */
  validityValid: 'Valid',
  /**
   *@description Text in grid: Rule set must be a valid JSON object
   */
  validityInvalid: 'Invalid',
  /**
   *@description Text in grid: Rule set contains invalid rules and they are ignored
   */
  validitySomeRulesInvalid: 'Some rules invalid',
  /**
   *@description Text in grid and details: Preloading attempt is not yet triggered.
   */
  statusNotTriggered: 'Not triggered',
  /**
   *@description Text in grid and details: Preloading attempt is eligible but pending.
   */
  statusPending: 'Pending',
  /**
   *@description Text in grid and details: Preloading is running.
   */
  statusRunning: 'Running',
  /**
   *@description Text in grid and details: Preloading finished and the result is ready for the next navigation.
   */
  statusReady: 'Ready',
  /**
   *@description Text in grid and details: Ready, then used.
   */
  statusSuccess: 'Success',
  /**
   *@description Text in grid and details: Preloading failed.
   */
  statusFailure: 'Failure',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/preloading/PreloadingView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

class PreloadingUIUtils {
  static action({key}: SDK.PreloadingModel.PreloadingAttempt): string {
    // Use "prefetch"/"prerender" as is in SpeculationRules.
    switch (key.action) {
      case Protocol.Preload.SpeculationAction.Prefetch:
        return i18n.i18n.lockedString('prefetch');
      case Protocol.Preload.SpeculationAction.Prerender:
        return i18n.i18n.lockedString('prerender');
    }
  }

  static status(status: SDK.PreloadingModel.PreloadingStatus): string {
    // See content/public/browser/preloading.h PreloadingAttemptOutcome.
    switch (status) {
      case SDK.PreloadingModel.PreloadingStatus.NotTriggered:
        return i18nString(UIStrings.statusNotTriggered);
      case SDK.PreloadingModel.PreloadingStatus.Pending:
        return i18nString(UIStrings.statusPending);
      case SDK.PreloadingModel.PreloadingStatus.Running:
        return i18nString(UIStrings.statusRunning);
      case SDK.PreloadingModel.PreloadingStatus.Ready:
        return i18nString(UIStrings.statusReady);
      case SDK.PreloadingModel.PreloadingStatus.Success:
        return i18nString(UIStrings.statusSuccess);
      case SDK.PreloadingModel.PreloadingStatus.Failure:
        return i18nString(UIStrings.statusFailure);
      // NotSupported is used to handle unreachable case. For example,
      // there is no code path for
      // PreloadingTriggeringOutcome::kTriggeredButPending in prefetch,
      // which is mapped to NotSupported. So, we regard it as an
      // internal error.
      case SDK.PreloadingModel.PreloadingStatus.NotSupported:
        return i18n.i18n.lockedString('Internal error');
    }
  }

  static preloadsStatusSummary(
      ruleSet: Protocol.Preload.RuleSet,
      countsByRuleSetId: Map<Protocol.Preload.RuleSetId, Map<SDK.PreloadingModel.PreloadingStatus, number>>): string {
    const LIST = [
      SDK.PreloadingModel.PreloadingStatus.NotTriggered,
      SDK.PreloadingModel.PreloadingStatus.Pending,
      SDK.PreloadingModel.PreloadingStatus.Running,
      SDK.PreloadingModel.PreloadingStatus.Ready,
      SDK.PreloadingModel.PreloadingStatus.Success,
      SDK.PreloadingModel.PreloadingStatus.Failure,
    ];

    if (ruleSet.errorType !== undefined) {
      return '';
    }

    const counts = countsByRuleSetId.get(ruleSet.id);

    return LIST.filter(status => (counts?.get(status) || 0) > 0)
        .map(status => (counts?.get(status) || 0) + ' ' + this.status(status))
        .join(' / ');
  }

  // Summary of error of rule set shown in grid.
  static validity({errorType}: Protocol.Preload.RuleSet): string {
    switch (errorType) {
      case undefined:
        return i18nString(UIStrings.validityValid);
      case Protocol.Preload.RuleSetErrorType.SourceIsNotJsonObject:
        return i18nString(UIStrings.validityInvalid);
      case Protocol.Preload.RuleSetErrorType.InvalidRulesSkipped:
        return i18nString(UIStrings.validitySomeRulesInvalid);
    }
  }

  // Where a rule set came from, shown in grid.
  static location(ruleSet: Protocol.Preload.RuleSet): string {
    if (ruleSet.backendNodeId !== undefined) {
      return i18n.i18n.lockedString('<script>');
    }

    if (ruleSet.url !== undefined) {
      return ruleSet.url;
    }

    throw Error('unreachable');
  }

  static processLocalId(id: Protocol.Preload.RuleSetId): string {
    // RuleSetId is form of '<processId>.<processLocalId>'
    const index = id.indexOf('.');
    return index === -1 ? id : id.slice(index + 1);
  }
}

export class PreloadingRuleSetView extends UI.Widget.VBox {
  private model: SDK.PreloadingModel.PreloadingModel;
  private focusedRuleSetId: Protocol.Preload.RuleSetId|null = null;
  private focusedPreloadingAttemptId: SDK.PreloadingModel.PreloadingAttemptId|null = null;

  private readonly warningsContainer: HTMLDivElement;
  private readonly warningsView = new PreloadingWarningsView();
  private readonly hsplit: SplitView.SplitView.SplitView;
  private readonly ruleSetGrid = new PreloadingComponents.RuleSetGrid.RuleSetGrid();
  private readonly ruleSetDetails = new PreloadingComponents.RuleSetDetailsReportView.RuleSetDetailsReportView();

  constructor(model: SDK.PreloadingModel.PreloadingModel) {
    super(/* isWebComponent */ true, /* delegatesFocus */ false);

    this.model = model;
    SDK.TargetManager.TargetManager.instance().addScopeChangeListener(this.onScopeChange.bind(this));
    SDK.TargetManager.TargetManager.instance().addModelListener(
        SDK.PreloadingModel.PreloadingModel, SDK.PreloadingModel.Events.ModelUpdated, this.render, this,
        {scoped: true});
    SDK.TargetManager.TargetManager.instance().addModelListener(
        SDK.PreloadingModel.PreloadingModel, SDK.PreloadingModel.Events.WarningsUpdated,
        this.warningsView.onWarningsUpdated, this.warningsView, {scoped: true});

    // this (VBox)
    //   +- warningsContainer
    //        +- PreloadingWarningsView
    //   +- hsplit
    //        +- leftContainer
    //             +- RuleSetGrid
    //        +- rightContainer
    //             +- RuleSetDetailsReportView
    //
    // - If an row of RuleSetGrid selected, RuleSetDetailsReportView shows details of it.
    // - If not, RuleSetDetailsReportView hides.

    this.warningsContainer = document.createElement('div');
    this.warningsContainer.classList.add('flex-none');
    this.contentElement.insertBefore(this.warningsContainer, this.contentElement.firstChild);
    this.warningsView.show(this.warningsContainer);

    this.ruleSetGrid.addEventListener('cellfocused', this.onRuleSetsGridCellFocused.bind(this));
    LitHtml.render(
        LitHtml.html`
        <${SplitView.SplitView.SplitView.litTagName} .horizontal=${true} style="--min-sidebar-size: 0px">
          <div slot="main" class="overflow-auto" style="height: 100%">
            ${this.ruleSetGrid}
          </div>
          <div slot="sidebar" class="overflow-auto" style="height: 100%">
            ${this.ruleSetDetails}
          </div>
        </${SplitView.SplitView.SplitView.litTagName}>`,
        this.contentElement, {host: this});
    this.hsplit = this.contentElement.querySelector('devtools-split-view') as SplitView.SplitView.SplitView;
  }

  override wasShown(): void {
    super.wasShown();

    this.registerCSSFiles([emptyWidgetStyles, preloadingViewStyles]);

    this.render();
  }

  onScopeChange(): void {
    const model = SDK.TargetManager.TargetManager.instance().scopeTarget()?.model(SDK.PreloadingModel.PreloadingModel);
    assertNotNullOrUndefined(model);
    this.model = model;
    this.render();
  }

  private updateRuleSetDetails(): void {
    const id = this.focusedRuleSetId;
    const ruleSet = id === null ? null : this.model.getRuleSetById(id);
    this.ruleSetDetails.data = ruleSet;

    if (ruleSet === null) {
      this.hsplit.style.setProperty('--current-main-area-size', '100%');
    } else {
      this.hsplit.style.setProperty('--current-main-area-size', '60%');
    }
  }

  render(): void {
    // Update rule sets grid
    const countsByRuleSetId = this.model.getPreloadCountsByRuleSetId();
    const ruleSetRows = this.model.getAllRuleSets().map(
        ({id, value}) => ({
          id,
          processLocalId: PreloadingUIUtils.processLocalId(value.id),
          preloadsStatusSummary: PreloadingUIUtils.preloadsStatusSummary(value, countsByRuleSetId),
          ruleSetId: value.id,
          validity: PreloadingUIUtils.validity(value),
          location: PreloadingUIUtils.location(value),
        }));
    this.ruleSetGrid.update(ruleSetRows);

    this.updateRuleSetDetails();
  }

  private onRuleSetsGridCellFocused(event: Event): void {
    const focusedEvent = event as DataGrid.DataGridEvents.BodyCellFocusedEvent;
    this.focusedRuleSetId =
        focusedEvent.data.row.cells.find(cell => cell.columnId === 'id')?.value as Protocol.Preload.RuleSetId;
    this.render();
  }

  getInfobarContainerForTest(): HTMLDivElement {
    return this.warningsView.contentElement;
  }

  getRuleSetGridForTest(): PreloadingComponents.RuleSetGrid.RuleSetGrid {
    return this.ruleSetGrid;
  }

  getRuleSetDetailsForTest(): PreloadingComponents.RuleSetDetailsReportView.RuleSetDetailsReportView {
    return this.ruleSetDetails;
  }
}

export class PreloadingAttemptView extends UI.Widget.VBox {
  private model: SDK.PreloadingModel.PreloadingModel;
  private focusedPreloadingAttemptId: SDK.PreloadingModel.PreloadingAttemptId|null = null;

  private readonly warningsContainer: HTMLDivElement;
  private readonly warningsView = new PreloadingWarningsView();
  private readonly preloadingGrid = new PreloadingComponents.PreloadingGrid.PreloadingGrid();
  private readonly preloadingDetails =
      new PreloadingComponents.PreloadingDetailsReportView.PreloadingDetailsReportView();
  private readonly ruleSetSelector: PreloadingRuleSetSelector;

  constructor(model: SDK.PreloadingModel.PreloadingModel) {
    super(/* isWebComponent */ true, /* delegatesFocus */ false);

    this.model = model;
    SDK.TargetManager.TargetManager.instance().addScopeChangeListener(this.onScopeChange.bind(this));
    SDK.TargetManager.TargetManager.instance().addModelListener(
        SDK.PreloadingModel.PreloadingModel, SDK.PreloadingModel.Events.ModelUpdated, this.render, this,
        {scoped: true});
    SDK.TargetManager.TargetManager.instance().addModelListener(
        SDK.PreloadingModel.PreloadingModel, SDK.PreloadingModel.Events.WarningsUpdated,
        this.warningsView.onWarningsUpdated, this.warningsView, {scoped: true});

    // this (VBox)
    //   +- warningsContainer
    //        +- PreloadingWarningsView
    //   +- VBox
    //        +- toolbar (filtering)
    //        +- hsplit
    //             +- leftContainer
    //                  +- PreloadingGrid
    //             +- rightContainer
    //                  +- PreloadingDetailsReportView
    //
    // - If an row of PreloadingGrid selected, PreloadingDetailsReportView shows details of it.
    // - If not, PreloadingDetailsReportView shows some messages.

    this.warningsContainer = document.createElement('div');
    this.warningsContainer.classList.add('flex-none');
    this.contentElement.insertBefore(this.warningsContainer, this.contentElement.firstChild);
    this.warningsView.show(this.warningsContainer);

    const vbox = new UI.Widget.VBox();

    const toolbar = new UI.Toolbar.Toolbar('preloading-toolbar', vbox.contentElement);
    this.ruleSetSelector = new PreloadingRuleSetSelector(() => this.render());
    toolbar.appendToolbarItem(this.ruleSetSelector.item());

    this.preloadingGrid.addEventListener('cellfocused', this.onPreloadingGridCellFocused.bind(this));
    LitHtml.render(
        LitHtml.html`
        <${SplitView.SplitView.SplitView.litTagName} .horizontal=${true} style="--min-sidebar-size: 0px">
          <div slot="main" class="overflow-auto" style="height: 100%">
            ${this.preloadingGrid}
          </div>
          <div slot="sidebar" class="overflow-auto" style="height: 100%">
            ${this.preloadingDetails}
          </div>
        </${SplitView.SplitView.SplitView.litTagName}>`,
        vbox.contentElement, {host: this});

    vbox.show(this.contentElement);
  }

  override wasShown(): void {
    super.wasShown();

    this.registerCSSFiles([emptyWidgetStyles, preloadingViewStyles]);

    this.render();
  }

  onScopeChange(): void {
    const model = SDK.TargetManager.TargetManager.instance().scopeTarget()?.model(SDK.PreloadingModel.PreloadingModel);
    assertNotNullOrUndefined(model);
    this.model = model;
    this.render();
  }

  setFilter(filter: PreloadingHelper.PreloadingForward.AttemptViewWithFilter): void {
    const id = filter.ruleSetId;
    this.model.getRuleSetById(id) && this.ruleSetSelector.select(id);
  }

  private updatePreloadingDetails(): void {
    const id = this.focusedPreloadingAttemptId;
    const preloadingAttempt = id === null ? null : this.model.getPreloadingAttemptById(id);
    if (preloadingAttempt === null) {
      this.preloadingDetails.data = null;
    } else {
      const ruleSets = preloadingAttempt.ruleSetIds.map(id => this.model.getRuleSetById(id)).filter(x => x !== null) as
          Protocol.Preload.RuleSet[];
      this.preloadingDetails.data = {
        preloadingAttempt,
        ruleSets,
      };
    }
  }

  render(): void {
    // Update preloaidng grid
    const filteringRuleSetId = this.ruleSetSelector.getSelected();
    const url = SDK.TargetManager.TargetManager.instance().inspectedURL();
    const securityOrigin = url ? (new Common.ParsedURL.ParsedURL(url)).securityOrigin() : null;
    const preloadingAttemptRows = this.model.getPreloadingAttempts(filteringRuleSetId).map(({id, value}) => {
      // Shorten URL if a preloading attempt is same-origin.
      const orig = value.key.url;
      const url = securityOrigin && orig.startsWith(securityOrigin) ? orig.slice(securityOrigin.length) : orig;

      return {
        id,
        url,
        action: PreloadingUIUtils.action(value),
        status: PreloadingUIUtils.status(value.status),
      };
    });
    this.preloadingGrid.update(preloadingAttemptRows);

    this.updatePreloadingDetails();
  }

  private onPreloadingGridCellFocused(event: Event): void {
    const focusedEvent = event as DataGrid.DataGridEvents.BodyCellFocusedEvent;
    this.focusedPreloadingAttemptId = focusedEvent.data.row.cells.find(cell => cell.columnId === 'id')?.value as
        SDK.PreloadingModel.PreloadingAttemptId;
    this.render();
  }

  getRuleSetSelectorToolbarItemForTest(): UI.Toolbar.ToolbarItem {
    return this.ruleSetSelector.item();
  }

  getPreloadingGridForTest(): PreloadingComponents.PreloadingGrid.PreloadingGrid {
    return this.preloadingGrid;
  }

  getPreloadingDetailsForTest(): PreloadingComponents.PreloadingDetailsReportView.PreloadingDetailsReportView {
    return this.preloadingDetails;
  }

  selectRuleSetOnFilterForTest(id: Protocol.Preload.RuleSetId|null): void {
    this.ruleSetSelector.select(id);
  }
}

export class PreloadingResultView extends UI.Widget.VBox {
  private model: SDK.PreloadingModel.PreloadingModel;

  private readonly warningsContainer: HTMLDivElement;
  private readonly warningsView = new PreloadingWarningsView();
  private readonly usedPreloading = new PreloadingComponents.UsedPreloadingView.UsedPreloadingView();

  constructor(model: SDK.PreloadingModel.PreloadingModel) {
    super(/* isWebComponent */ true, /* delegatesFocus */ false);

    this.model = model;
    SDK.TargetManager.TargetManager.instance().addScopeChangeListener(this.onScopeChange.bind(this));
    SDK.TargetManager.TargetManager.instance().addModelListener(
        SDK.PreloadingModel.PreloadingModel, SDK.PreloadingModel.Events.ModelUpdated, this.render, this,
        {scoped: true});
    SDK.TargetManager.TargetManager.instance().addModelListener(
        SDK.PreloadingModel.PreloadingModel, SDK.PreloadingModel.Events.WarningsUpdated,
        this.warningsView.onWarningsUpdated, this.warningsView, {scoped: true});

    this.warningsContainer = document.createElement('div');
    this.warningsContainer.classList.add('flex-none');
    this.contentElement.insertBefore(this.warningsContainer, this.contentElement.firstChild);
    this.warningsView.show(this.warningsContainer);

    const usedPreloadingContainer = new UI.Widget.VBox();
    usedPreloadingContainer.contentElement.appendChild(this.usedPreloading);
    usedPreloadingContainer.show(this.contentElement);
  }

  override wasShown(): void {
    super.wasShown();

    this.registerCSSFiles([emptyWidgetStyles, preloadingViewStyles]);

    this.render();
  }

  onScopeChange(): void {
    const model = SDK.TargetManager.TargetManager.instance().scopeTarget()?.model(SDK.PreloadingModel.PreloadingModel);
    assertNotNullOrUndefined(model);
    this.model = model;
    this.render();
  }

  render(): void {
    this.usedPreloading.data = {
      pageURL: SDK.TargetManager.TargetManager.instance().scopeTarget()?.inspectedURL() ||
          ('' as Platform.DevToolsPath.UrlString),
      attempts: this.model.getPreloadingAttemptsOfPreviousPage().map(({value}) => value),
    };
  }

  getUsedPreloadingForTest(): PreloadingComponents.UsedPreloadingView.UsedPreloadingView {
    return this.usedPreloading;
  }
}

class PreloadingRuleSetSelector implements UI.Toolbar.Provider,
                                           UI.SoftDropDown.Delegate<Protocol.Preload.RuleSetId|null> {
  private model: SDK.PreloadingModel.PreloadingModel;
  private readonly onSelectionChanged: () => void = () => {};

  private readonly toolbarItem: UI.Toolbar.ToolbarItem;

  private readonly listModel: UI.ListModel.ListModel<Protocol.Preload.RuleSetId|null>;
  private readonly dropDown: UI.SoftDropDown.SoftDropDown<Protocol.Preload.RuleSetId|null>;

  constructor(onSelectionChanged: () => void) {
    const model = SDK.TargetManager.TargetManager.instance().scopeTarget()?.model(SDK.PreloadingModel.PreloadingModel);
    assertNotNullOrUndefined(model);
    this.model = model;
    SDK.TargetManager.TargetManager.instance().addScopeChangeListener(this.onScopeChange.bind(this));
    SDK.TargetManager.TargetManager.instance().addModelListener(
        SDK.PreloadingModel.PreloadingModel, SDK.PreloadingModel.Events.ModelUpdated, this.onModelUpdated, this,
        {scoped: true});

    this.listModel = new UI.ListModel.ListModel();

    this.dropDown = new UI.SoftDropDown.SoftDropDown(this.listModel, this);
    this.dropDown.setRowHeight(36);
    this.dropDown.setPlaceholderText(i18nString(UIStrings.filterAllRuleSets));

    this.toolbarItem = new UI.Toolbar.ToolbarItem(this.dropDown.element);
    this.toolbarItem.setTitle(i18nString(UIStrings.filterFilterByRuleSet));
    this.toolbarItem.element.classList.add('toolbar-has-dropdown');

    // Initializes `listModel` and `dropDown` using data of the model.
    this.onModelUpdated();

    // Prevents emitting onSelectionChanged on the first call of `this.onModelUpdated()` for initialization.
    this.onSelectionChanged = onSelectionChanged;
  }

  private onScopeChange(): void {
    const model = SDK.TargetManager.TargetManager.instance().scopeTarget()?.model(SDK.PreloadingModel.PreloadingModel);
    assertNotNullOrUndefined(model);
    this.model = model;
    this.onModelUpdated();
  }

  private onModelUpdated(): void {
    const ids = this.model.getAllRuleSets().map(({id}) => id);
    const items = [null, ...ids];
    const selected = this.dropDown.getSelectedItem();
    const newSelected = items.indexOf(selected) === -1 ? null : selected;
    this.listModel.replaceAll(items);
    this.dropDown.selectItem(newSelected);
  }

  getSelected(): Protocol.Preload.RuleSetId|null {
    return this.dropDown.getSelectedItem();
  }

  select(id: Protocol.Preload.RuleSetId|null): void {
    this.dropDown.selectItem(id);
  }

  // Method for UI.Toolbar.Provider
  item(): UI.Toolbar.ToolbarItem {
    return this.toolbarItem;
  }

  // Method for UI.SoftDropDown.Delegate<Protocol.Preload.RuleSetId|null>
  titleFor(id: Protocol.Preload.RuleSetId|null): string {
    if (id === null) {
      return i18nString(UIStrings.filterAllRuleSets);
    }

    // RuleSetId is form of '<processId>.<processLocalId>'
    return i18nString(UIStrings.filterRuleSet, {PH1: PreloadingUIUtils.processLocalId(id)});
  }

  subtitleFor(id: Protocol.Preload.RuleSetId|null): string {
    const ruleSet = id === null ? null : this.model.getRuleSetById(id);

    if (ruleSet === null) {
      return '';
    }

    if (ruleSet.url !== undefined) {
      return ruleSet.url;
    }

    return '<script>';
  }

  // Method for UI.SoftDropDown.Delegate<Protocol.Preload.RuleSetId|null>
  createElementForItem(id: Protocol.Preload.RuleSetId|null): Element {
    const element = document.createElement('div');
    const shadowRoot =
        UI.Utils.createShadowRootWithCoreStyles(element, {cssFile: undefined, delegatesFocus: undefined});
    const title = shadowRoot.createChild('div', 'title');
    UI.UIUtils.createTextChild(title, Platform.StringUtilities.trimEndWithMaxLength(this.titleFor(id), 100));
    const subTitle = shadowRoot.createChild('div', 'subtitle');
    UI.UIUtils.createTextChild(subTitle, this.subtitleFor(id));
    return element;
  }

  // Method for UI.SoftDropDown.Delegate<Protocol.Preload.RuleSetId|null>
  isItemSelectable(_id: Protocol.Preload.RuleSetId|null): boolean {
    return true;
  }

  // Method for UI.SoftDropDown.Delegate<Protocol.Preload.RuleSetId|null>
  itemSelected(_id: Protocol.Preload.RuleSetId|null): void {
    this.onSelectionChanged();
  }

  // Method for UI.SoftDropDown.Delegate<Protocol.Preload.RuleSetId|null>
  highlightedItemChanged(
      _from: Protocol.Preload.RuleSetId|null, _to: Protocol.Preload.RuleSetId|null, _fromElement: Element|null,
      _toElement: Element|null): void {
  }
}

export class PreloadingWarningsView extends UI.Widget.VBox {
  private readonly infobar = new PreloadingComponents.PreloadingDisabledInfobar.PreloadingDisabledInfobar();

  constructor() {
    super(/* isWebComponent */ false, /* delegatesFocus */ false);
  }

  override wasShown(): void {
    super.wasShown();

    this.registerCSSFiles([emptyWidgetStyles]);

    const wrapper = LegacyWrapper.LegacyWrapper.legacyWrapper(UI.Widget.VBox, this.infobar);
    wrapper.show(this.contentElement);
  }

  onWarningsUpdated(args: Common.EventTarget.EventTargetEvent<Protocol.Preload.PreloadEnabledStateUpdatedEvent>): void {
    this.infobar.data = args.data;
  }
}
