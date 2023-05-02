// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as i18n from '../../core/i18n/i18n.js';
import type * as Platform from '../../core/platform/platform.js';
import * as UI from '../../ui/legacy/legacy.js';

import {
  Events,
  LighthouseController,
  type AuditProgressChangedEvent,
  type Flags,
} from './LighthouseController.js';
import lighthousePanelStyles from './lighthousePanel.css.js';

import {ProtocolService} from './LighthouseProtocolService.js';

import {type ReportJSON, type RunnerResultArtifacts} from './LighthouseReporterTypes.js';
import {LighthouseReportRenderer} from './LighthouseReportRenderer.js';
import {Item, ReportSelector} from './LighthouseReportSelector.js';
import {StartView} from './LighthouseStartView.js';
import {StatusView} from './LighthouseStatusView.js';
import {TimespanView} from './LighthouseTimespanView.js';

const UIStrings = {
  /**
   * @description Text that appears when user drag and drop something (for example, a file) in Lighthouse Panel
   */
  dropLighthouseJsonHere: 'Drop `Lighthouse` JSON here',
  /**
   * @description Tooltip text that appears when hovering over the largeicon add button in the Lighthouse Panel
   */
  performAnAudit: 'Perform an audit…',
  /**
   * @description Text to clear everything
   */
  clearAll: 'Clear all',
  /**
   * @description Tooltip text that appears when hovering over the largeicon settings gear in show settings pane setting in start view of the audits panel
   */
  lighthouseSettings: '`Lighthouse` settings',
  /**
   * @description Status header in the Lighthouse panel
   */
  printing: 'Printing',
  /**
   * @description Status text in the Lighthouse panel
   */
  thePrintPopupWindowIsOpenPlease: 'The print popup window is open. Please close it to continue.',
  /**
   * @description Text in Lighthouse Panel
   */
  cancelling: 'Cancelling',
  /**
   * @description Text of checkbox to include running the performance audits in Lighthouse
   */
  performance: 'Performance',
  /**
   * @description Tooltip text of checkbox to include running the performance audits in Lighthouse
   */
  howLongDoesThisAppTakeToShow: 'How long does this app take to show content and become usable',
  /**
   * @description Text of checkbox to include running the Progressive Web App audits in Lighthouse
   */
  progressiveWebApp: 'Progressive Web App',
  /**
   * @description Tooltip text of checkbox to include running the Progressive Web App audits in Lighthouse
   */
  doesThisPageMeetTheStandardOfA: 'Does this page meet the standard of a Progressive Web App',
  /**
   * @description Text of checkbox to include running the Best Practices audits in Lighthouse
   */
  bestPractices: 'Best practices',
  /**
   * @description Tooltip text of checkbox to include running the Best Practices audits in Lighthouse
   */
  doesThisPageFollowBestPractices: 'Does this page follow best practices for modern web development',
  /**
   * @description Text of checkbox to include running the Accessibility audits in Lighthouse
   */
  accessibility: 'Accessibility',
  /**
   * @description Tooltip text of checkbox to include running the Accessibility audits in Lighthouse
   */
  isThisPageUsableByPeopleWith: 'Is this page usable by people with disabilities or impairments',
  /**
   * @description Text of checkbox to include running the Search Engine Optimization audits in Lighthouse
   */
  seo: 'SEO',
  /**
   * @description Tooltip text of checkbox to include running the Search Engine Optimization audits in Lighthouse
   */
  isThisPageOptimizedForSearch: 'Is this page optimized for search engine results ranking',
  /**
   * @description Text of checkbox to include running the Ad speed and quality audits in Lighthouse
   */
  publisherAds: 'Publisher Ads',
  /**
   * @description Tooltip text of checkbox to include running the Ad speed and quality audits in Lighthouse
   */
  isThisPageOptimizedForAdSpeedAnd: 'Is this page optimized for ad speed and quality',
  /**
   * @description ARIA label for a radio button input to emulate mobile device behavior when running audits in Lighthouse.
   */
  applyMobileEmulation: 'Apply mobile emulation',
  /**
   * @description Tooltip text of checkbox to emulate mobile device behavior when running audits in Lighthouse
   */
  applyMobileEmulationDuring: 'Apply mobile emulation during auditing',
  /**
   * @description ARIA label for a radio button input to select the Lighthouse mode.
   */
  lighthouseMode: 'Lighthouse mode',
  /**
   * @description Tooltip text of a radio button to select the Lighthouse mode. "Navigation" is a Lighthouse mode that audits a page navigation. "Timespan" is a Lighthouse mode that audits user interactions over a period of time. "Snapshot" is a Lighthouse mode that audits the current page state.
   */
  runLighthouseInMode: 'Run Lighthouse in navigation, timespan, or snapshot mode',
  /**
   * @description Label of a radio option for a Lighthouse mode that audits a page navigation. This should be marked as the default radio option.
   */
  navigation: 'Navigation (Default)',
  /**
   * @description Tooltip description of a radio option for a Lighthouse mode that audits a page navigation.
   */
  navigationTooltip: 'Navigation mode analyzes a page load, exactly like the original Lighthouse reports.',
  /**
   * @description Label of a radio option for a Lighthouse mode that audits user interactions over a period of time.
   */
  timespan: 'Timespan',
  /**
   * @description Tooltip description of a radio option for a Lighthouse mode that audits user interactions over a period of time.
   */
  timespanTooltip: 'Timespan mode analyzes an arbitrary period of time, typically containing user interactions.',
  /**
   * @description Label of a radio option for a Lighthouse mode that audits the current page state.
   */
  snapshot: 'Snapshot',
  /**
   * @description Tooltip description of a radio option for a Lighthouse mode that audits the current page state.
   */
  snapshotTooltip: 'Snapshot mode analyzes the page in a particular state, typically after user interactions.',
  /**
   * @description Text for the mobile platform, as opposed to desktop
   */
  mobile: 'Mobile',
  /**
   * @description Text for the desktop platform, as opposed to mobile
   */
  desktop: 'Desktop',
  /**
   * @description Text for an option to select a throttling method.
   */
  throttlingMethod: 'Throttling method',
  /**
   * @description Text for an option in a dropdown to use simulated throttling. This is the default setting.
   */
  simulatedThrottling: 'Simulated throttling (default)',
  /**
   * @description Text for an option in a dropdown to use DevTools throttling. This option should only be used by advanced users.
   */
  devtoolsThrottling: 'DevTools throttling (advanced)',
  /**
   * @description Tooltip text that appears when hovering over the 'Simulated Throttling' checkbox in the settings pane opened by clicking the setting cog in the start view of the audits panel
   */
  simulateASlowerPageLoadBasedOn:
      'Simulated throttling simulates a slower page load based on data from an initial unthrottled load. DevTools throttling actually slows down the page.',
  /**
   * @description Text of checkbox to reset storage features prior to running audits in Lighthouse
   */
  clearStorage: 'Clear storage',
  /**
   * @description Text of checkbox to use the legacy Lighthouse navigation mode
   */
  legacyNavigation: 'Legacy navigation',
  /**
   * @description Tooltip text that appears when hovering over the 'Legacy navigation' checkbox in the settings pane opened by clicking the setting cog in the start view of the audits panel. "Navigation mode" is a Lighthouse mode that analyzes a page navigation.
   */
  useLegacyNavigation: 'Analyze the page using classic Lighthouse when in navigation mode.',
  /**
   * @description Tooltip text of checkbox to reset storage features prior to running audits in
   * Lighthouse. Resetting the storage clears/empties it to a neutral state.
   */
  resetStorageLocalstorage:
      'Reset storage (`cache`, `service workers`, etc) before auditing. (Good for performance & `PWA` testing)',
};
const str_ = i18n.i18n.registerUIStrings('panels/lighthouse/LighthousePanel.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);

let lighthousePanelInstace: LighthousePanel;

export class LighthousePanel extends UI.Panel.Panel {
  readonly controller: LighthouseController;
  private readonly startView: StartView;
  private readonly statusView: StatusView;
  private readonly timespanView: TimespanView;
  private readonly cachedRenderedReports: Map<ReportJSON, HTMLElement>;
  private readonly dropTarget: UI.DropTarget.DropTarget;
  private readonly auditResultsElement: HTMLElement;
  private clearButton!: UI.Toolbar.ToolbarButton;
  private newButton!: UI.Toolbar.ToolbarButton;
  private reportSelector!: ReportSelector;
  private settingsPane!: UI.Widget.Widget;
  private rightToolbar!: UI.Toolbar.Toolbar;
  private showSettingsPaneSetting!: Common.Settings.Setting<boolean>;

  private constructor(
      controller: LighthouseController,
  ) {
    super('lighthouse');

    this.controller = controller;
    this.startView = new StartView(this);
    this.timespanView = new TimespanView(this);
    this.statusView = new StatusView(this);

    this.cachedRenderedReports = new Map();

    this.dropTarget = new UI.DropTarget.DropTarget(
        this.contentElement, [UI.DropTarget.Type.File], i18nString(UIStrings.dropLighthouseJsonHere),
        this.handleDrop.bind(this));

    this.controller.addEventListener(Events.AuditProgressChanged, this.refreshStatusUI.bind(this));

    this.renderToolbar();
    this.auditResultsElement = this.contentElement.createChild('div', 'lighthouse-results-container');
    this.renderStartView();

    this.controller.recomputePageAuditability();
  }

  static instance(opts?: {forceNew: boolean, protocolService: ProtocolService, controller: LighthouseController}):
      LighthousePanel {
    if (!lighthousePanelInstace || opts?.forceNew) {
      const protocolService = opts?.protocolService ?? new ProtocolService();
      const controller = opts?.controller ?? new LighthouseController(protocolService);

      lighthousePanelInstace = new LighthousePanel(controller);
    }

    return lighthousePanelInstace;
  }

  static getEvents(): typeof Events {
    return Events;
  }

  getFlags(): Flags {
    const flags = {};
    for (const runtimeSetting of RuntimeSettings) {
      runtimeSetting.setFlags(flags, runtimeSetting.setting.get());
    }
    return flags as Flags;
  }

  getCategoryIDs(): string[] {
    const categoryIDs = [];
    for (const preset of Presets) {
      if (preset.setting.get()) {
        categoryIDs.push(preset.configID);
      }
    }
    return categoryIDs;
  }

  async handleTimespanStart(): Promise<void> {
    try {
      this.timespanView.show(this.contentElement);
      await this.controller.startLighthouse(this.getCategoryIDs(), this.getFlags());
      this.timespanView.ready();
    } catch (err) {
      this.handleError(err);
    }
  }

  async handleTimespanEnd(): Promise<void> {
    try {
      this.timespanView.hide();
      this.renderStatusView();
      const {lhr, artifacts} = await this.controller.collectLighthouseResults();
      this.buildReportUI(lhr, artifacts);
    } catch (err) {
      this.handleError(err);
    }
  }

  async handleCompleteRun(): Promise<void> {
    try {
      await this.controller.startLighthouse(this.getCategoryIDs(), this.getFlags());
      this.renderStatusView();
      const {lhr, artifacts} = await this.controller.collectLighthouseResults();
      this.buildReportUI(lhr, artifacts);
    } catch (err) {
      this.handleError(err);
    }
  }

  async handleRunCancel(): Promise<void> {
    this.statusView.updateStatus(i18nString(UIStrings.cancelling));
    this.timespanView.hide();
    await this.controller.cancelLighthouse();
    this.renderStartView();
  }

  private handleError(err: unknown): void {
    if (err instanceof Error) {
      this.statusView.renderBugReport(err);
    }
  }

  private refreshStatusUI(evt: Common.EventTarget.EventTargetEvent<AuditProgressChangedEvent>): void {
    this.statusView.updateStatus(evt.data.message);
  }

  private refreshToolbarUI(): void {
    this.clearButton.setEnabled(this.reportSelector.hasItems());
  }

  private clearAll(): void {
    this.reportSelector.clearAll();
    this.renderStartView();
    this.refreshToolbarUI();
  }

  private renderToolbar(): void {
    const lighthouseToolbarContainer = this.element.createChild('div', 'lighthouse-toolbar-container');

    const toolbar = new UI.Toolbar.Toolbar('', lighthouseToolbarContainer);

    this.newButton = new UI.Toolbar.ToolbarButton(i18nString(UIStrings.performAnAudit), 'plus');
    toolbar.appendToolbarItem(this.newButton);
    this.newButton.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, this.renderStartView.bind(this));

    toolbar.appendSeparator();

    this.reportSelector = new ReportSelector(() => this.renderStartView());
    toolbar.appendToolbarItem(this.reportSelector.comboBox());

    this.clearButton = new UI.Toolbar.ToolbarButton(i18nString(UIStrings.clearAll), 'clear');
    toolbar.appendToolbarItem(this.clearButton);
    this.clearButton.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, this.clearAll.bind(this));

    this.settingsPane = new UI.Widget.HBox();
    this.settingsPane.show(this.contentElement);
    this.settingsPane.element.classList.add('lighthouse-settings-pane');
    this.settingsPane.element.appendChild(this.startView.settingsToolbar().element);
    this.showSettingsPaneSetting = Common.Settings.Settings.instance().createSetting(
        'lighthouseShowSettingsToolbar', false, Common.Settings.SettingStorageType.Synced);

    this.rightToolbar = new UI.Toolbar.Toolbar('', lighthouseToolbarContainer);
    this.rightToolbar.appendSeparator();
    this.rightToolbar.appendToolbarItem(new UI.Toolbar.ToolbarSettingToggle(
        this.showSettingsPaneSetting, 'gear', i18nString(UIStrings.lighthouseSettings), 'gear-filled'));
    this.showSettingsPaneSetting.addChangeListener(this.updateSettingsPaneVisibility.bind(this));
    this.updateSettingsPaneVisibility();

    this.refreshToolbarUI();
  }

  private updateSettingsPaneVisibility(): void {
    this.settingsPane.element.classList.toggle('hidden', !this.showSettingsPaneSetting.get());
  }

  private toggleSettingsDisplay(show: boolean): void {
    this.rightToolbar.element.classList.toggle('hidden', !show);
    this.settingsPane.element.classList.toggle('hidden', !show);
    this.updateSettingsPaneVisibility();
  }

  private renderStartView(): void {
    this.auditResultsElement.removeChildren();
    this.statusView.hide();

    this.reportSelector.selectNewReport();
    this.contentElement.classList.toggle('in-progress', false);

    this.startView.show(this.contentElement);
    this.toggleSettingsDisplay(true);

    this.newButton.setEnabled(false);
    this.refreshToolbarUI();
    this.setDefaultFocusedChild(this.startView);
  }

  private renderStatusView(): void {
    const inspectedURL = this.controller.getCurrentRun()?.inspectedURL;
    this.contentElement.classList.toggle('in-progress', true);
    this.statusView.setInspectedURL(inspectedURL);
    this.statusView.show(this.contentElement);
  }

  private beforePrint(): void {
    this.statusView.show(this.contentElement);
    this.statusView.toggleCancelButton(false);
    this.statusView.renderText(i18nString(UIStrings.printing), i18nString(UIStrings.thePrintPopupWindowIsOpenPlease));
  }

  private afterPrint(): void {
    this.statusView.hide();
    this.statusView.toggleCancelButton(true);
  }

  private renderReport(lighthouseResult: ReportJSON, artifacts?: RunnerResultArtifacts): void {
    this.toggleSettingsDisplay(false);
    this.contentElement.classList.toggle('in-progress', false);
    this.startView.hideWidget();
    this.statusView.hide();
    this.auditResultsElement.removeChildren();
    this.newButton.setEnabled(true);
    this.refreshToolbarUI();

    const cachedRenderedReport = this.cachedRenderedReports.get(lighthouseResult);
    if (cachedRenderedReport) {
      this.auditResultsElement.appendChild(cachedRenderedReport);
      return;
    }

    const reportContainer = LighthouseReportRenderer.renderLighthouseReport(lighthouseResult, artifacts, {
      beforePrint: this.beforePrint.bind(this),
      afterPrint: this.afterPrint.bind(this),
    });

    this.cachedRenderedReports.set(lighthouseResult, reportContainer);
  }

  private buildReportUI(lighthouseResult: ReportJSON, artifacts?: RunnerResultArtifacts): void {
    if (lighthouseResult === null) {
      return;
    }

    const optionElement = new Item(
        lighthouseResult, () => this.renderReport(lighthouseResult, artifacts), this.renderStartView.bind(this));
    this.reportSelector.prepend(optionElement);
    this.refreshToolbarUI();
    this.renderReport(lighthouseResult);
    this.newButton.element.focus();
  }

  private handleDrop(dataTransfer: DataTransfer): void {
    const items = dataTransfer.items;
    if (!items.length) {
      return;
    }
    const item = items[0];
    if (item.kind === 'file') {
      const file = items[0].getAsFile();
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = (): void => this.loadedFromFile(reader.result as string);
      reader.readAsText(file);
    }
  }

  private loadedFromFile(report: string): void {
    const data = JSON.parse(report);
    if (!data['lighthouseVersion']) {
      return;
    }
    this.buildReportUI(data as ReportJSON);
  }

  override elementsToRestoreScrollPositionsFor(): Element[] {
    const els = super.elementsToRestoreScrollPositionsFor();
    const lhContainerEl = this.auditResultsElement.querySelector('.lh-container');
    if (lhContainerEl) {
      els.push(lhContainerEl);
    }
    return els;
  }

  override wasShown(): void {
    super.wasShown();
    this.registerCSSFiles([lighthousePanelStyles]);
  }
}

export interface Preset {
  setting: Common.Settings.Setting<boolean>;
  configID: string;
  title: () => Common.UIString.LocalizedString;
  description: () => Common.UIString.LocalizedString;
  plugin: boolean;
  supportedModes: string[];
}

export interface RuntimeSetting {
  setting: Common.Settings.Setting<string|boolean>;
  description: () => Common.UIString.LocalizedString;
  setFlags: (flags: Record<string, string|boolean>, value: string|boolean) => void;
  options?: {
    label: () => Common.UIString.LocalizedString,
    value: string,
    tooltip?: () => Common.UIString.LocalizedString,
  }[];
  title?: () => Common.UIString.LocalizedString;
  learnMore?: Platform.DevToolsPath.UrlString;
}

export const Presets: Preset[] = [
  // configID maps to Lighthouse's Object.keys(config.categories)[0] value
  {
    setting: Common.Settings.Settings.instance().createSetting(
        'lighthouse.cat_perf', true, Common.Settings.SettingStorageType.Synced),
    configID: 'performance',
    title: i18nLazyString(UIStrings.performance),
    description: i18nLazyString(UIStrings.howLongDoesThisAppTakeToShow),
    plugin: false,
    supportedModes: ['navigation', 'timespan', 'snapshot'],
  },
  {
    setting: Common.Settings.Settings.instance().createSetting(
        'lighthouse.cat_a11y', true, Common.Settings.SettingStorageType.Synced),
    configID: 'accessibility',
    title: i18nLazyString(UIStrings.accessibility),
    description: i18nLazyString(UIStrings.isThisPageUsableByPeopleWith),
    plugin: false,
    supportedModes: ['navigation', 'snapshot'],
  },
  {
    setting: Common.Settings.Settings.instance().createSetting(
        'lighthouse.cat_best_practices', true, Common.Settings.SettingStorageType.Synced),
    configID: 'best-practices',
    title: i18nLazyString(UIStrings.bestPractices),
    description: i18nLazyString(UIStrings.doesThisPageFollowBestPractices),
    plugin: false,
    supportedModes: ['navigation', 'timespan', 'snapshot'],
  },
  {
    setting: Common.Settings.Settings.instance().createSetting(
        'lighthouse.cat_seo', true, Common.Settings.SettingStorageType.Synced),
    configID: 'seo',
    title: i18nLazyString(UIStrings.seo),
    description: i18nLazyString(UIStrings.isThisPageOptimizedForSearch),
    plugin: false,
    supportedModes: ['navigation', 'snapshot'],
  },
  {
    setting: Common.Settings.Settings.instance().createSetting(
        'lighthouse.cat_pwa', true, Common.Settings.SettingStorageType.Synced),
    configID: 'pwa',
    title: i18nLazyString(UIStrings.progressiveWebApp),
    description: i18nLazyString(UIStrings.doesThisPageMeetTheStandardOfA),
    plugin: false,
    supportedModes: ['navigation'],
  },
  {
    setting: Common.Settings.Settings.instance().createSetting(
        'lighthouse.cat_pubads', false, Common.Settings.SettingStorageType.Synced),
    plugin: true,
    configID: 'lighthouse-plugin-publisher-ads',
    title: i18nLazyString(UIStrings.publisherAds),
    description: i18nLazyString(UIStrings.isThisPageOptimizedForAdSpeedAnd),
    supportedModes: ['navigation'],
  },
];

export const RuntimeSettings: RuntimeSetting[] = [
  {
    setting: Common.Settings.Settings.instance().createSetting(
        'lighthouse.device_type', 'mobile', Common.Settings.SettingStorageType.Synced),
    title: i18nLazyString(UIStrings.applyMobileEmulation),
    description: i18nLazyString(UIStrings.applyMobileEmulationDuring),
    setFlags: (flags: Record<string, string|boolean>, value: string|boolean): void => {
      // See Audits.AuditsPanel._setupEmulationAndProtocolConnection()
      flags.formFactor = value;
    },
    options: [
      {label: i18nLazyString(UIStrings.mobile), value: 'mobile'},
      {label: i18nLazyString(UIStrings.desktop), value: 'desktop'},
    ],
    learnMore: undefined,
  },
  {
    setting: Common.Settings.Settings.instance().createSetting(
        'lighthouse.mode', 'navigation', Common.Settings.SettingStorageType.Synced),
    title: i18nLazyString(UIStrings.lighthouseMode),
    description: i18nLazyString(UIStrings.runLighthouseInMode),
    setFlags: (flags: Record<string, string|boolean>, value: string|boolean): void => {
      flags.mode = value;
    },
    options: [
      {
        label: i18nLazyString(UIStrings.navigation),
        tooltip: i18nLazyString(UIStrings.navigationTooltip),
        value: 'navigation',
      },
      {
        label: i18nLazyString(UIStrings.timespan),
        tooltip: i18nLazyString(UIStrings.timespanTooltip),
        value: 'timespan',
      },
      {
        label: i18nLazyString(UIStrings.snapshot),
        tooltip: i18nLazyString(UIStrings.snapshotTooltip),
        value: 'snapshot',
      },
    ],
    learnMore: 'https://github.com/GoogleChrome/lighthouse/blob/HEAD/docs/user-flows.md' as
        Platform.DevToolsPath.UrlString,
  },
  {
    // This setting is disabled, but we keep it around to show in the UI.
    setting: Common.Settings.Settings.instance().createSetting(
        'lighthouse.throttling', 'simulate', Common.Settings.SettingStorageType.Synced),
    title: i18nLazyString(UIStrings.throttlingMethod),
    // We will disable this when we have a Lantern trace viewer within DevTools.
    learnMore:
        'https://github.com/GoogleChrome/lighthouse/blob/master/docs/throttling.md#devtools-lighthouse-panel-throttling' as
        Platform.DevToolsPath.UrlString,
    description: i18nLazyString(UIStrings.simulateASlowerPageLoadBasedOn),
    setFlags: (flags: Record<string, string|boolean>, value: string|boolean): void => {
      if (typeof value === 'string') {
        flags.throttlingMethod = value;
      } else {
        flags.throttlingMethod = value ? 'simulate' : 'devtools';
      }
    },
    options: [
      {label: i18nLazyString(UIStrings.simulatedThrottling), value: 'simulate'},
      {label: i18nLazyString(UIStrings.devtoolsThrottling), value: 'devtools'},
    ],
  },
  {
    setting: Common.Settings.Settings.instance().createSetting(
        'lighthouse.clear_storage', true, Common.Settings.SettingStorageType.Synced),
    title: i18nLazyString(UIStrings.clearStorage),
    description: i18nLazyString(UIStrings.resetStorageLocalstorage),
    setFlags: (flags: Record<string, string|boolean>, value: string|boolean): void => {
      flags.disableStorageReset = !value;
    },
    options: undefined,
    learnMore: undefined,
  },
  {
    setting: Common.Settings.Settings.instance().createSetting(
        'lighthouse.legacy_navigation', false, Common.Settings.SettingStorageType.Synced),
    title: i18nLazyString(UIStrings.legacyNavigation),
    description: i18nLazyString(UIStrings.useLegacyNavigation),
    setFlags: (flags: Record<string, string|boolean>, value: string|boolean): void => {
      flags.legacyNavigation = value;
    },
    options: undefined,
    learnMore: undefined,
  },
];
