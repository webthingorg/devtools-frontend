// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as DataGrid from '../../../ui/components/data_grid/data_grid.js';

import * as Platform from '../../../core/platform/platform.js';
import * as Common from '../../../core/common/common.js';
import * as ChromeLink from '../../../ui/components/chrome_link/chrome_link.js';
import * as i18n from '../../../core/i18n/i18n.js';
import * as UI from '../../../ui/legacy/legacy.js';
import * as Protocol from '../../../generated/protocol.js';
import * as SDK from '../../../core/sdk/sdk.js';
import * as LegacyWrapper from '../../../ui/components/legacy_wrapper/legacy_wrapper.js';

import * as PreloadingComponents from './components/components.js';

// eslint-disable-next-line rulesdir/es_modules_import
import emptyWidgetStyles from '../../../ui/legacy/emptyWidget.css.js';
import preloadingViewStyles from './preloadingView.css.js';

const UIStrings = {
  /**
   *@description DropDown text for filtering preloading attempts by rule set
   */
  filterByRuleSet: 'Filter by rule set',
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
  /**
   *@description Title in infobar
   */
  warningTitlePreloadingDisabledByFeatureFlag: 'Preloading was disabled, but is force-enabled now',
  /**
   *@description Detail in infobar
   */
  warningDetailPreloadingDisabledByFeatureFlag:
      'Preloading is forced-enabled because DevTools is open. When DevTools is closed, prerendering will be disabled because this browser session is part of a holdback group used for performance comparisons.',
  /**
   *@description Title in infobar
   */
  warningTitlePrerenderingDisabledByFeatureFlag: 'Prerendering was disabled, but is force-enabled now',
  /**
   *@description Detail in infobar
   */
  warningDetailPrerenderingDisabledByFeatureFlag:
      'Prerendering is forced-enabled because DevTools is open. When DevTools is closed, prerendering will be disabled because this browser session is part of a holdback group used for performance comparisons.',
  /**
   *@description Title of preloading state disabled warning in infobar
   */
  warningTitlePreloadingStateDisabled: 'Preloading is disabled',
  /**
   *@description Detail of preloading state disabled warning in infobar
   *@example {chrome://settings/preloading} PH1
   *@example {chrome://extensions} PH2
   */
  warningDetailPreloadingStateDisabled:
      'Preloading is disabled because of user settings or an extension. Go to {PH1} to learn more, or go to {PH2} to disable the extension.',
  /**
   *@description Detail in infobar when preloading is disabled by data saver.
   */
  warningDetailPreloadingDisabledByDatasaver:
      'Preloading is disabled because of the operating system\'s Data Saver mode.',
  /**
   *@description Detail in infobar when preloading is disabled by data saver.
   */
  warningDetailPreloadingDisabledByBatterysaver:
      'Preloading is disabled because of the operating system\'s Battery Saver mode.',
  /**
   *@description Text of Preload pages settings
   */
  preloadingPageSettings: 'Preload pages settings',
  /**
   *@description Text of Extension settings
   */
  extensionSettings: 'Extensions settings',
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

  static status({status}: SDK.PreloadingModel.PreloadingAttempt): string {
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
}

// Holds PreloadingModel of current context
//
// There can be multiple Targets and PreloadingModels and they switch as
// time goes. For example:
//
// - Prerendering started and a user switched context with
//   ExecutionContextSelector. This switching is bidirectional.
// - Prerendered page is activated. This switching is unidirectional.
//
// Context switching is managed by scoped target. This class handles
// switching events and holds PreloadingModel of current context.
//
// Note that switching at the timing of activation triggers handing over
// from the old model to the new model. See
// PreloadingModel.onPrimaryPageChanged.
class PreloadingModelProxy extends Common.ObjectWrapper.ObjectWrapper<SDK.PreloadingModel.EventTypes> implements
    SDK.TargetManager.SDKModelObserver<SDK.PreloadingModel.PreloadingModel> {
  model: SDK.PreloadingModel.PreloadingModel;

  constructor(model: SDK.PreloadingModel.PreloadingModel) {
    super();

    this.model = model;
    this.add();
    SDK.TargetManager.TargetManager.instance().observeModels(SDK.PreloadingModel.PreloadingModel, this, {scoped: true});
  }

  private add(): void {
    this.model.addEventListener(SDK.PreloadingModel.Events.ModelUpdated, this.onModelUpdated, this);
    this.model.addEventListener(SDK.PreloadingModel.Events.WarningsUpdated, this.onWarningsUpdated, this);
  }

  private remove(): void {
    this.model.removeEventListener(SDK.PreloadingModel.Events.ModelUpdated, this.onModelUpdated, this);
    this.model.removeEventListener(SDK.PreloadingModel.Events.WarningsUpdated, this.onWarningsUpdated, this);
  }

  private onModelUpdated(): void {
    this.dispatchEventToListeners(SDK.PreloadingModel.Events.ModelUpdated);
  }

  private onWarningsUpdated(event: Common.EventTarget.EventTargetEvent<SDK.PreloadingModel.PreloadWarnings>): void {
    this.dispatchEventToListeners(SDK.PreloadingModel.Events.WarningsUpdated, event.data);
  }

  // Method for SDK.TargetManager.SDKModelObserver<SDK.PreloadingModel.PreloadingModel>
  modelAdded(model: SDK.PreloadingModel.PreloadingModel): void {
    // Ignore models/targets of non-outermost frames like iframe/FencedFrames.
    if (model.target().outermostTarget() !== model.target()) {
      return;
    }

    this.remove();
    this.model = model;
    this.add();

    this.onModelUpdated();
  }

  // Method for SDK.TargetManager.SDKModelObserver<SDK.PreloadingModel.PreloadingModel>
  modelRemoved(_model: SDK.PreloadingModel.PreloadingModel): void {
    this.remove();
  }
}

function makeHsplit(
    left: LegacyWrapper.LegacyWrapper.WrappableComponent<UI.Widget.VBox>,
    right: LegacyWrapper.LegacyWrapper.WrappableComponent<UI.Widget.VBox>): UI.SplitWidget.SplitWidget {
  const leftContainer = LegacyWrapper.LegacyWrapper.legacyWrapper(UI.Widget.VBox, left);
  leftContainer.setMinimumSize(0, 40);
  leftContainer.contentElement.classList.add('overflow-auto');

  const rightContainer = LegacyWrapper.LegacyWrapper.legacyWrapper(UI.Widget.VBox, right);
  rightContainer.setMinimumSize(0, 80);
  rightContainer.contentElement.classList.add('overflow-auto');

  const hsplit = new UI.SplitWidget.SplitWidget(
      /* isVertical */ false,
      /* secondIsSidebar */ true,
      /* settingName */ undefined,
      /* defaultSidebarWidth */ 400,
      /* defaultSidebarHeight */ undefined,
      /* constraintsInDip */ undefined,
  );
  hsplit.setMainWidget(leftContainer);
  hsplit.setSidebarWidget(rightContainer);

  return hsplit;
}

export class PreloadingRuleSetView extends UI.Widget.VBox {
  private readonly modelProxy: PreloadingModelProxy;
  private focusedRuleSetId: Protocol.Preload.RuleSetId|null = null;
  private focusedPreloadingAttemptId: SDK.PreloadingModel.PreloadingAttemptId|null = null;

  private readonly warningsContainer: HTMLDivElement;
  private readonly warningsView = new PreloadingWarningsView();
  private readonly hsplit: UI.SplitWidget.SplitWidget;
  private readonly ruleSetGrid = new PreloadingComponents.RuleSetGrid.RuleSetGrid();
  private readonly ruleSetDetails = new PreloadingComponents.RuleSetDetailsReportView.RuleSetDetailsReportView();

  constructor(model: SDK.PreloadingModel.PreloadingModel) {
    super(/* isWebComponent */ true, /* delegatesFocus */ false);

    this.modelProxy = new PreloadingModelProxy(model);
    this.modelProxy.addEventListener(SDK.PreloadingModel.Events.ModelUpdated, this.render, this);
    this.modelProxy.addEventListener(
        SDK.PreloadingModel.Events.WarningsUpdated, this.warningsView.onWarningsUpdated, this.warningsView);

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
    this.hsplit = makeHsplit(this.ruleSetGrid, this.ruleSetDetails);
    this.hsplit.show(this.contentElement);
  }

  override wasShown(): void {
    super.wasShown();

    this.registerCSSFiles([emptyWidgetStyles, preloadingViewStyles]);

    this.render();
  }

  private updateRuleSetDetails(): void {
    const id = this.focusedRuleSetId;
    const ruleSet = id === null ? null : this.modelProxy.model.getRuleSetById(id);
    this.ruleSetDetails.data = ruleSet;

    if (ruleSet === null) {
      this.hsplit.hideSidebar();
    } else {
      this.hsplit.showBoth();
    }
  }

  render(): void {
    // Update rule sets grid
    //
    // Currently, all rule sets that appear in DevTools are valid.
    // TODO(https://crbug.com/1384419): Add property `validity` to the CDP.
    const ruleSetRows = this.modelProxy.model.getAllRuleSets().map(({id, value}) => ({
                                                                     id,
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
  private readonly modelProxy: PreloadingModelProxy;
  private focusedPreloadingAttemptId: SDK.PreloadingModel.PreloadingAttemptId|null = null;

  private readonly warningsContainer: HTMLDivElement;
  private readonly warningsView = new PreloadingWarningsView();
  private readonly preloadingGrid = new PreloadingComponents.PreloadingGrid.PreloadingGrid();
  private readonly preloadingDetails =
      new PreloadingComponents.PreloadingDetailsReportView.PreloadingDetailsReportView();
  private readonly ruleSetSelector: PreloadingRuleSetSelector;

  constructor(model: SDK.PreloadingModel.PreloadingModel) {
    super(/* isWebComponent */ true, /* delegatesFocus */ false);

    this.modelProxy = new PreloadingModelProxy(model);
    this.modelProxy.addEventListener(SDK.PreloadingModel.Events.ModelUpdated, this.render, this);
    this.modelProxy.addEventListener(
        SDK.PreloadingModel.Events.WarningsUpdated, this.warningsView.onWarningsUpdated, this.warningsView);

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
    this.ruleSetSelector = new PreloadingRuleSetSelector(model, () => this.render());
    toolbar.appendToolbarItem(this.ruleSetSelector.item());

    this.preloadingGrid.addEventListener('cellfocused', this.onPreloadingGridCellFocused.bind(this));
    const hsplit = makeHsplit(this.preloadingGrid, this.preloadingDetails);
    hsplit.show(vbox.contentElement);

    vbox.show(this.contentElement);
  }

  override wasShown(): void {
    super.wasShown();

    this.registerCSSFiles([emptyWidgetStyles, preloadingViewStyles]);

    this.render();
  }

  private updatePreloadingDetails(): void {
    const id = this.focusedPreloadingAttemptId;
    const preloadingAttempt = id === null ? null : this.modelProxy.model.getPreloadingAttemptById(id);
    if (preloadingAttempt === null) {
      this.preloadingDetails.data = null;
    } else {
      const ruleSets =
          preloadingAttempt.ruleSetIds.map(id => this.modelProxy.model.getRuleSetById(id)).filter(x => x !== null) as
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
    const preloadingAttemptRows = this.modelProxy.model.getPreloadingAttempts(filteringRuleSetId).map(({id, value}) => {
      // Shorten URL if a preloading attempt is same-origin.
      const orig = value.key.url;
      const url = securityOrigin && orig.startsWith(securityOrigin) ? orig.slice(securityOrigin.length) : orig;

      return {
        id,
        url,
        action: PreloadingUIUtils.action(value),
        status: PreloadingUIUtils.status(value),
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
  private readonly modelProxy: PreloadingModelProxy;

  private readonly warningsContainer: HTMLDivElement;
  private readonly warningsView = new PreloadingWarningsView();
  private readonly usedPreloading = new PreloadingComponents.UsedPreloadingView.UsedPreloadingView();

  constructor(model: SDK.PreloadingModel.PreloadingModel) {
    super(/* isWebComponent */ true, /* delegatesFocus */ false);

    this.modelProxy = new PreloadingModelProxy(model);
    this.modelProxy.addEventListener(SDK.PreloadingModel.Events.ModelUpdated, this.render, this);
    this.modelProxy.addEventListener(
        SDK.PreloadingModel.Events.WarningsUpdated, this.warningsView.onWarningsUpdated, this.warningsView);

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

  render(): void {
    this.usedPreloading.data = this.modelProxy.model.getPreloadingAttemptsOfPreviousPage().map(({value}) => value);
  }

  getUsedPreloadingForTest(): PreloadingComponents.UsedPreloadingView.UsedPreloadingView {
    return this.usedPreloading;
  }
}

class PreloadingRuleSetSelector implements UI.Toolbar.Provider,
                                           UI.SoftDropDown.Delegate<Protocol.Preload.RuleSetId|null> {
  private readonly modelProxy: PreloadingModelProxy;
  private readonly onSelectionChanged: () => void = () => {};

  private readonly toolbarItem: UI.Toolbar.ToolbarItem;

  private readonly listModel: UI.ListModel.ListModel<Protocol.Preload.RuleSetId|null>;
  private readonly dropDown: UI.SoftDropDown.SoftDropDown<Protocol.Preload.RuleSetId|null>;

  constructor(model: SDK.PreloadingModel.PreloadingModel, onSelectionChanged: () => void) {
    this.modelProxy = new PreloadingModelProxy(model);
    this.modelProxy.addEventListener(SDK.PreloadingModel.Events.ModelUpdated, this.onModelUpdated, this);

    this.listModel = new UI.ListModel.ListModel();

    this.dropDown = new UI.SoftDropDown.SoftDropDown(this.listModel, this);
    this.dropDown.setRowHeight(36);
    this.dropDown.setPlaceholderText(i18nString(UIStrings.filterByRuleSet));

    this.toolbarItem = new UI.Toolbar.ToolbarItem(this.dropDown.element);
    this.toolbarItem.setTitle(i18nString(UIStrings.filterByRuleSet));
    this.toolbarItem.element.classList.add('toolbar-has-dropdown');

    this.onModelUpdated();

    // Prevents emitting onSelectionChanged on the first call of this.onModelUpdated for initialization.
    this.onSelectionChanged = onSelectionChanged;
  }

  getSelected(): Protocol.Preload.RuleSetId|null {
    return this.dropDown.getSelectedItem();
  }

  select(id: Protocol.Preload.RuleSetId|null): void {
    this.dropDown.selectItem(id);
  }

  private onModelUpdated(): void {
    const ids = this.modelProxy.model.getAllRuleSets().map(({id}) => id);
    const items = [null, ...ids];
    const selected = this.dropDown.getSelectedItem();
    const newSelected = items.indexOf(selected) === -1 ? null : selected;
    this.listModel.replaceAll(items);
    this.dropDown.selectItem(newSelected);
  }

  // Method for UI.Toolbar.Provider
  item(): UI.Toolbar.ToolbarItem {
    return this.toolbarItem;
  }

  // Method for UI.SoftDropDown.Delegate<Protocol.Preload.RuleSetId|null>
  titleFor(id: Protocol.Preload.RuleSetId|null): string {
    if (id === null) {
      return 'No filter';
    }

    // RuleSetId is form of '<processId>.<processLocalId>'
    const index = id.indexOf('.');
    const processLocalId = index === -1 ? id : id.slice(index + 1);
    return 'Rule set: ' + processLocalId;
  }

  subtitleFor(id: Protocol.Preload.RuleSetId|null): string {
    const ruleSet = id === null ? null : this.modelProxy.model.getRuleSetById(id);

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
  constructor() {
    super(/* isWebComponent */ false, /* delegatesFocus */ false);
  }

  onWarningsUpdated(event: Common.EventTarget.EventTargetEvent<SDK.PreloadingModel.PreloadWarnings>): void {
    // TODO(crbug.com/1384419): Add more information in PreloadEnabledState from
    // backend to distinguish the details of the reasons why preloading is
    // disabled.
    function createDisabledMessages(warnings: SDK.PreloadingModel.PreloadWarnings): HTMLDivElement|null {
      const detailsMessage = document.createElement('div');
      let shouldShowWarning = false;

      if (warnings.disabledByPreference) {
        const preloadingSettingLink = new ChromeLink.ChromeLink.ChromeLink();
        preloadingSettingLink.href = 'chrome://settings/cookies';
        preloadingSettingLink.textContent = i18nString(UIStrings.preloadingPageSettings);
        const extensionSettingLink = new ChromeLink.ChromeLink.ChromeLink();
        extensionSettingLink.href = 'chrome://extensions';
        extensionSettingLink.textContent = i18nString(UIStrings.extensionSettings);
        detailsMessage.appendChild(i18n.i18n.getFormatLocalizedString(
            str_, UIStrings.warningDetailPreloadingStateDisabled,
            {PH1: preloadingSettingLink, PH2: extensionSettingLink}));
        shouldShowWarning = true;
      }

      if (warnings.disabledByDataSaver) {
        const element = document.createElement('div');
        element.append(i18nString(UIStrings.warningDetailPreloadingDisabledByDatasaver));
        detailsMessage.appendChild(element);
        shouldShowWarning = true;
      }

      if (warnings.disabledByBatterySaver) {
        const element = document.createElement('div');
        element.append(i18nString(UIStrings.warningDetailPreloadingDisabledByBatterysaver));
        detailsMessage.appendChild(element);
        shouldShowWarning = true;
      }

      return shouldShowWarning ? detailsMessage : null;
    }

    const warnings = event.data;
    const detailsMessage = createDisabledMessages(warnings);
    if (detailsMessage !== null) {
      this.showInfobar(i18nString(UIStrings.warningTitlePreloadingStateDisabled), detailsMessage);
    } else {
      if (warnings.featureFlagPreloadingHoldback) {
        this.showInfobar(
            i18nString(UIStrings.warningTitlePreloadingDisabledByFeatureFlag),
            i18nString(UIStrings.warningDetailPreloadingDisabledByFeatureFlag));
      }

      if (warnings.featureFlagPrerender2Holdback) {
        this.showInfobar(
            i18nString(UIStrings.warningTitlePrerenderingDisabledByFeatureFlag),
            i18nString(UIStrings.warningDetailPrerenderingDisabledByFeatureFlag));
      }
    }
  }

  private showInfobar(titleText: string, detailsMessage: string|Element): void {
    const infobar = new UI.Infobar.Infobar(
        UI.Infobar.Type.Warning, /* text */ titleText, /* actions? */ undefined, /* disableSetting? */ undefined);
    infobar.setParentView(this);
    infobar.createDetailsRowMessage(detailsMessage);
    this.contentElement.appendChild(infobar.element);
  }
}
