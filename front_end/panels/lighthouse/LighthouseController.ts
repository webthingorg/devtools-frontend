// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as Host from '../../core/host/host.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as Platform from '../../core/platform/platform.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as Protocol from '../../generated/protocol.js';
import * as EmulationModel from '../../models/emulation/emulation.js';
import * as Emulation from '../emulation/emulation.js';

import {type ProtocolService, type LighthouseRun} from './LighthouseProtocolService.js';
import {type RunnerResult} from './LighthouseReporterTypes.js';

const UIStrings = {
  /**
   *@description Explanation for user that Ligthhouse can only audit HTTP/HTTPS pages
   */
  canOnlyAuditHttphttpsPages: 'Can only audit pages on HTTP or HTTPS. Navigate to a different page.',
  /**
   *@description Text when stored data in one location may affect Lighthouse run
   *@example {IndexedDB} PH1
   */
  thereMayBeStoredDataAffectingSingular:
      'There may be stored data affecting loading performance in this location: {PH1}. Audit this page in an incognito window to prevent those resources from affecting your scores.',
  /**
   *@description Text when stored data in multiple locations may affect Lighthouse run
   *@example {IndexedDB, WebSQL} PH1
   */
  thereMayBeStoredDataAffectingLoadingPlural:
      'There may be stored data affecting loading performance in these locations: {PH1}. Audit this page in an incognito window to prevent those resources from affecting your scores.',
  /**
   *@description Help text in Lighthouse Controller
   */
  multipleTabsAreBeingControlledBy:
      'Multiple tabs are being controlled by the same `service worker`. Close your other tabs on the same origin to audit this page.',
  /**
   *@description Text in Application Panel Sidebar of the Application panel
   */
  localStorage: 'Local Storage',
  /**
   *@description Text in Application Panel Sidebar of the Application panel
   */
  indexeddb: 'IndexedDB',
  /**
   *@description Text in Application Panel Sidebar of the Application panel
   */
  webSql: 'Web SQL',
  /**
   *@description Explanation for user that Ligthhouse can only audit when JavaScript is enabled
   */
  javaScriptDisabled:
      'JavaScript is disabled. You need to enable JavaScript to audit this page. Open the Command Menu and run the Enable JavaScript command to enable JavaScript.',
};
const str_ = i18n.i18n.registerUIStrings('panels/lighthouse/LighthouseController.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);

export class LighthouseController extends Common.ObjectWrapper.ObjectWrapper<EventTypes> implements
    SDK.TargetManager.SDKModelObserver<SDK.ServiceWorkerManager.ServiceWorkerManager> {
  private readonly protocolService: ProtocolService;
  private manager?: SDK.ServiceWorkerManager.ServiceWorkerManager|null;
  private serviceWorkerListeners?: Common.EventTarget.EventDescriptor[];
  private inspectedURL?: Platform.DevToolsPath.UrlString;
  private currentLighthouseRun?: LighthouseRun;
  private emulationStateBefore?: {
    emulation: {
      type: EmulationModel.DeviceModeModel.Type,
      enabled: boolean,
      outlineEnabled: boolean,
      toolbarControlsEnabled: boolean,
      scale: number,
      device: EmulationModel.EmulatedDevices.EmulatedDevice|null,
      mode: EmulationModel.EmulatedDevices.Mode|null,
    },
    network: {conditions: SDK.NetworkManager.Conditions},
  };

  constructor(protocolService: ProtocolService) {
    super();

    this.protocolService = protocolService;
    protocolService.registerStatusCallback(
        message => this.dispatchEventToListeners(Events.AuditProgressChanged, {message}));

    const javaScriptDisabledSetting = Common.Settings.Settings.instance().moduleSetting('javaScriptDisabled');
    javaScriptDisabledSetting.addChangeListener(this.recomputePageAuditability.bind(this));

    SDK.TargetManager.TargetManager.instance().observeModels(SDK.ServiceWorkerManager.ServiceWorkerManager, this);
    SDK.TargetManager.TargetManager.instance().addEventListener(
        SDK.TargetManager.Events.InspectedURLChanged, this.handleUrlChange, this);
  }

  modelAdded(serviceWorkerManager: SDK.ServiceWorkerManager.ServiceWorkerManager): void {
    if (serviceWorkerManager.target() !== SDK.TargetManager.TargetManager.instance().primaryPageTarget()) {
      return;
    }

    this.manager = serviceWorkerManager;
    this.serviceWorkerListeners = [
      this.manager.addEventListener(
          SDK.ServiceWorkerManager.Events.RegistrationUpdated, this.recomputePageAuditability, this),
      this.manager.addEventListener(
          SDK.ServiceWorkerManager.Events.RegistrationDeleted, this.recomputePageAuditability, this),
    ];

    this.recomputePageAuditability();
  }

  modelRemoved(serviceWorkerManager: SDK.ServiceWorkerManager.ServiceWorkerManager): void {
    if (this.manager !== serviceWorkerManager) {
      return;
    }
    if (this.serviceWorkerListeners) {
      Common.EventTarget.removeEventListeners(this.serviceWorkerListeners);
    }
    this.manager = null;
    this.recomputePageAuditability();
  }

  private handleUrlChange(): void {
    this.recomputePageAuditability();
    // Pages can add data to local storage after load.
    // We should poll the page again shortly after navigating to capture these cases.
    setTimeout(this.recomputePageAuditability.bind(this), 1000);
    setTimeout(this.recomputePageAuditability.bind(this), 5000);
  }

  private hasActiveServiceWorker(): boolean {
    if (!this.manager) {
      return false;
    }

    const mainTarget = this.manager.target();
    if (!mainTarget) {
      return false;
    }

    const inspectedURL = Common.ParsedURL.ParsedURL.fromString(mainTarget.inspectedURL());
    const inspectedOrigin = inspectedURL && inspectedURL.securityOrigin();
    for (const registration of this.manager.registrations().values()) {
      if (registration.securityOrigin !== inspectedOrigin) {
        continue;
      }

      for (const version of registration.versions.values()) {
        if (version.controlledClients.length > 1) {
          return true;
        }
      }
    }

    return false;
  }

  private unauditablePageMessage(): string|null {
    if (!this.manager) {
      return null;
    }

    const mainTarget = this.manager.target();
    const inspectedURL = mainTarget && mainTarget.inspectedURL();
    /*
     * The full history of Lighthouse panel + extensions et al:
     *
     * Running Lighthouse against extensions caused crashes (crbug.com/734532), so we disabled it in Aug 2017
     * Unfortunately, the CAN_DOCK heuristic used also disabled auditing any page while remote-debugging.
     * FYI: The CAN_DOCK signal is what determines if the device-mode functionality (viewport emulation) should be shown in the UI.
     *
     * In Sept 2017 we allow-listed http* and chrome-extension URLs formally: crrev.com/c/639032
     * This added support for chrome-extension:// pages (not overlays/popups) as they satisfy CAN_DOCK.
     *
     * We wanted remote-debugging support restored, and the crashes were fixed,
     * so we renabled auditing in all CAN_DOCK cases in Feb 2019 (crbug.com/931849). This included all chrome extensions views.
     *
     * Auditing overlay windows/popups cause problems with viewport emulation (eg crbug.com/1116347)
     * And even full-page extension tabs (like OneTab) have NO_NAVSTART problems and others (crbug.com/1065323)
     * So in in April 2023 we blocked all chrome-extension cases.
     */
    // Only http*, thus disallow: chrome-extension://*, about:*, chrome://dino, file://*, devtools://*, etc.
    if (!inspectedURL?.startsWith('http')) {
      return i18nString(UIStrings.canOnlyAuditHttphttpsPages);
    }

    // Catch .pdf. TODO: handle other MimeHandler extensions. crbug.com/1168245
    try {
      const isPdf = new URL(inspectedURL).pathname.endsWith('.pdf');
      if (isPdf) {
        return i18nString(UIStrings.canOnlyAuditHttphttpsPages);
      }
    } catch (e) {
      return i18nString(UIStrings.canOnlyAuditHttphttpsPages);
    }

    return null;
  }

  private javaScriptDisabled(): boolean {
    return Common.Settings.Settings.instance().moduleSetting('javaScriptDisabled').get();
  }

  private async hasImportantResourcesNotCleared(): Promise<string> {
    if (!this.manager) {
      return '';
    }
    const mainTarget = this.manager.target();
    const origin = mainTarget.inspectedURL();
    if (!origin) {
      return '';
    }
    const usageData = await mainTarget.storageAgent().invoke_getUsageAndQuota({origin});
    if (usageData.getError()) {
      return '';
    }
    const locations = usageData.usageBreakdown.filter(usage => usage.usage)
                          .map(usage => STORAGE_TYPE_NAMES.get(usage.storageType))
                          .map(i18nStringFn => i18nStringFn ? i18nStringFn() : undefined)
                          .filter(Boolean);
    if (locations.length === 1) {
      return i18nString(UIStrings.thereMayBeStoredDataAffectingSingular, {PH1: String(locations[0])});
    }
    if (locations.length > 1) {
      return i18nString(UIStrings.thereMayBeStoredDataAffectingLoadingPlural, {PH1: locations.join(', ')});
    }
    return '';
  }

  private async evaluateInspectedURL(): Promise<Platform.DevToolsPath.UrlString> {
    if (!this.manager) {
      return Platform.DevToolsPath.EmptyUrlString;
    }
    const mainTarget = this.manager.target();
    // target.inspectedURL is reliably populated, however it lacks any url #hash
    const inspectedURL = mainTarget.inspectedURL();

    // We'll use the navigationHistory to acquire the current URL including hash
    const resourceTreeModel = mainTarget.model(SDK.ResourceTreeModel.ResourceTreeModel);
    const navHistory = resourceTreeModel && await resourceTreeModel.navigationHistory();
    if (!resourceTreeModel || !navHistory) {
      return inspectedURL;
    }

    const {currentIndex, entries} = navHistory;
    const navigationEntry = entries[currentIndex];
    return navigationEntry.url as Platform.DevToolsPath.UrlString;
  }

  getCurrentRun(): LighthouseRun|undefined {
    return this.currentLighthouseRun;
  }

  async getInspectedURL(options?: {force: boolean}): Promise<Platform.DevToolsPath.UrlString> {
    if (options && options.force || !this.inspectedURL) {
      this.inspectedURL = await this.evaluateInspectedURL();
    }
    return this.inspectedURL;
  }

  recomputePageAuditability(): void {
    // We don't want to emit any auditability changes during a Lighthouse run.
    if (this.currentLighthouseRun) {
      return;
    }

    const hasActiveServiceWorker = this.hasActiveServiceWorker();
    const unauditablePageMessage = this.unauditablePageMessage();
    const javaScriptDisabled = this.javaScriptDisabled();

    let helpText = '';
    if (hasActiveServiceWorker) {
      helpText = i18nString(UIStrings.multipleTabsAreBeingControlledBy);
    } else if (unauditablePageMessage) {
      helpText = unauditablePageMessage;
    } else if (javaScriptDisabled) {
      helpText = i18nString(UIStrings.javaScriptDisabled);
    }

    this.dispatchEventToListeners(Events.PageAuditabilityChanged, {helpText});

    void this.hasImportantResourcesNotCleared().then(warning => {
      this.dispatchEventToListeners(Events.PageWarningsChanged, {warning});
    });
  }

  private recordMetrics(flags: {mode: string, legacyNavigation: boolean}): void {
    Host.userMetrics.actionTaken(Host.UserMetrics.Action.LighthouseStarted);

    switch (flags.mode) {
      case 'navigation':
        if (flags.legacyNavigation) {
          Host.userMetrics.lighthouseModeRun(Host.UserMetrics.LighthouseModeRun.LegacyNavigation);
        } else {
          Host.userMetrics.lighthouseModeRun(Host.UserMetrics.LighthouseModeRun.Navigation);
        }
        break;
      case 'timespan':
        Host.userMetrics.lighthouseModeRun(Host.UserMetrics.LighthouseModeRun.Timespan);
        break;
      case 'snapshot':
        Host.userMetrics.lighthouseModeRun(Host.UserMetrics.LighthouseModeRun.Snapshot);
        break;
    }
  }

  async startLighthouse(categoryIDs: string[], flags: Flags): Promise<void> {
    try {
      const inspectedURL = await this.getInspectedURL({force: true});

      this.recordMetrics(flags);

      this.currentLighthouseRun = {inspectedURL, categoryIDs, flags};

      await this.setupEmulationAndProtocolConnection(flags);

      if (flags.mode === 'timespan') {
        await this.protocolService.startTimespan(this.currentLighthouseRun);
      }
    } catch (err) {
      await this.restoreEmulationAndProtocolConnection();
      throw err;
    }
  }

  async collectLighthouseResults(): Promise<RunnerResult> {
    try {
      if (!this.currentLighthouseRun) {
        throw new Error('Lighthouse is not started');
      }

      const lighthouseResponse = await this.protocolService.collectLighthouseResults(this.currentLighthouseRun);
      if (!lighthouseResponse) {
        throw new Error('Auditing failed to produce a result');
      }

      if (lighthouseResponse.fatal) {
        const error = new Error(lighthouseResponse.message);
        error.stack = lighthouseResponse.stack;
        throw error;
      }

      Host.userMetrics.actionTaken(Host.UserMetrics.Action.LighthouseFinished);

      await this.restoreEmulationAndProtocolConnection();
      return lighthouseResponse;
    } catch (err) {
      await this.restoreEmulationAndProtocolConnection();
      throw err;
    } finally {
      this.currentLighthouseRun = undefined;
    }
  }

  async cancelLighthouse(): Promise<void> {
    await this.restoreEmulationAndProtocolConnection();
    this.currentLighthouseRun = undefined;
  }

  /**
   * We set the device emulation on the DevTools-side for two reasons:
   * 1. To workaround some odd device metrics emulation bugs like occuluding viewports
   * 2. To get the attractive device outline
   */
  private async setupEmulationAndProtocolConnection(flags: Flags): Promise<void> {
    const emulationModel = EmulationModel.DeviceModeModel.DeviceModeModel.instance();
    this.emulationStateBefore = {
      emulation: {
        type: emulationModel.type(),
        enabled: emulationModel.enabledSetting().get(),
        outlineEnabled: emulationModel.deviceOutlineSetting().get(),
        toolbarControlsEnabled: emulationModel.toolbarControlsEnabledSetting().get(),
        scale: emulationModel.scaleSetting().get(),
        device: emulationModel.device(),
        mode: emulationModel.mode(),
      },
      network: {conditions: SDK.NetworkManager.MultitargetNetworkManager.instance().networkConditions()},
    };

    emulationModel.toolbarControlsEnabledSetting().set(false);
    if ('formFactor' in flags && flags.formFactor === 'desktop') {
      emulationModel.enabledSetting().set(false);
      emulationModel.emulate(EmulationModel.DeviceModeModel.Type.None, null, null);
    } else if (flags.formFactor === 'mobile') {
      emulationModel.enabledSetting().set(true);
      emulationModel.deviceOutlineSetting().set(true);

      for (const device of EmulationModel.EmulatedDevices.EmulatedDevicesList.instance().standard()) {
        if (device.title === 'Moto G Power') {
          emulationModel.emulate(EmulationModel.DeviceModeModel.Type.Device, device, device.modes[0], 1);
        }
      }
    }

    await this.protocolService.attach();
  }

  private async restoreEmulationAndProtocolConnection(): Promise<void> {
    if (!this.currentLighthouseRun) {
      return;
    }

    await this.protocolService.detach();

    if (this.emulationStateBefore) {
      const emulationModel = EmulationModel.DeviceModeModel.DeviceModeModel.instance();

      // Detaching a session after overriding device metrics will prevent other sessions from overriding device metrics in the future.
      // A workaround is to call "Emulation.clearDeviceMetricOverride" which is the result of the next line.
      // https://bugs.chromium.org/p/chromium/issues/detail?id=1337089
      emulationModel.emulate(EmulationModel.DeviceModeModel.Type.None, null, null);

      const {type, enabled, outlineEnabled, toolbarControlsEnabled, scale, device, mode} =
          this.emulationStateBefore.emulation;
      emulationModel.enabledSetting().set(enabled);
      emulationModel.deviceOutlineSetting().set(outlineEnabled);
      emulationModel.toolbarControlsEnabledSetting().set(toolbarControlsEnabled);

      // `emulate` will ignore the `scale` parameter for responsive emulation.
      // In this case we can just set it here.
      if (type === EmulationModel.DeviceModeModel.Type.Responsive) {
        emulationModel.scaleSetting().set(scale);
      }

      emulationModel.emulate(type, device, mode, scale);

      SDK.NetworkManager.MultitargetNetworkManager.instance().setNetworkConditions(
          this.emulationStateBefore.network.conditions);
      delete this.emulationStateBefore;
    }

    Emulation.InspectedPagePlaceholder.InspectedPagePlaceholder.instance().update(true);

    const mainTarget = SDK.TargetManager.TargetManager.instance().primaryPageTarget();
    if (!mainTarget) {
      return;
    }
    const resourceTreeModel = mainTarget.model(SDK.ResourceTreeModel.ResourceTreeModel);
    if (!resourceTreeModel) {
      return;
    }

    // Reload to reset page state after a navigation.
    // We want to retain page state for timespan and snapshot modes.
    const mode = this.currentLighthouseRun.flags.mode;
    if (mode === 'navigation') {
      const inspectedURL = await this.getInspectedURL();
      await resourceTreeModel.navigate(inspectedURL);
    }
  }
}

const STORAGE_TYPE_NAMES = new Map([
  [Protocol.Storage.StorageType.Local_storage, i18nLazyString(UIStrings.localStorage)],
  [Protocol.Storage.StorageType.Indexeddb, i18nLazyString(UIStrings.indexeddb)],
  [Protocol.Storage.StorageType.Websql, i18nLazyString(UIStrings.webSql)],
]);

export type Flags = {
  mode: 'navigation'|'timespan'|'snapshot',
  legacyNavigation: boolean,
  disableStorageReset: boolean,
  formFactor: 'mobile'|'desktop',
  throttlingMethod: 'simulate'|'devtools',
};

// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export enum Events {
  PageAuditabilityChanged = 'PageAuditabilityChanged',
  PageWarningsChanged = 'PageWarningsChanged',
  AuditProgressChanged = 'AuditProgressChanged',
}

export interface PageAuditabilityChangedEvent {
  helpText: string;
}

export interface PageWarningsChangedEvent {
  warning: string;
}

export interface AuditProgressChangedEvent {
  message: string;
}

export type EventTypes = {
  [Events.PageAuditabilityChanged]: PageAuditabilityChangedEvent,
  [Events.PageWarningsChanged]: PageWarningsChangedEvent,
  [Events.AuditProgressChanged]: AuditProgressChangedEvent,
};
