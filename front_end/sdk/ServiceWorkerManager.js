/*
 * Copyright (C) 2011 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import {assert} from 'front_end/third_party/puppeteer/package/lib/esm/puppeteer/common/assert.js';
import * as Common from '../common/common.js';

import {ls} from '../platform/platform.js';

import {Events as RuntimeModelEvents, ExecutionContext, RuntimeModel} from './RuntimeModel.js';  // eslint-disable-line no-unused-vars
import {Capability, SDKModel, Target, TargetManager, Type} from './SDKModel.js';  // eslint-disable-line no-unused-vars
import {ServiceWorkerCacheModel} from './ServiceWorkerCacheModel.js';

export class ServiceWorkerManager extends SDKModel {
  /**
   * @param {!Target} target
   */
  constructor(target) {
    super(target);
    target.registerServiceWorkerDispatcher(new ServiceWorkerDispatcher(this));
    this._lastAnonymousTargetId = 0;
    this._agent = target.serviceWorkerAgent();
    /** @type {!Map.<string, !ServiceWorkerRegistration>} */
    this._registrations = new Map();
    /** @type {boolean} */
    this._enabled = false;
    this.enable();
    /** @type {!Common.Settings.Setting<boolean>} */
    this._forceUpdateSetting = Common.Settings.Settings.instance().createSetting('serviceWorkerUpdateOnReload', false);
    if (this._forceUpdateSetting.get()) {
      this._forceUpdateSettingChanged();
    }
    this._forceUpdateSetting.addChangeListener(this._forceUpdateSettingChanged, this);
    new ServiceWorkerContextNamer(target, this);

    /** Status of service worker network requests panel */
    this.serviceWorkerNetworkRequestsPanelStatus = {
      isOpen: false,
      openedAt: 0,
    };
  }

  async enable() {
    if (this._enabled) {
      return;
    }
    this._enabled = true;
    await this._agent.invoke_enable();
  }

  async disable() {
    if (!this._enabled) {
      return;
    }
    this._enabled = false;
    this._registrations.clear();
    await this._agent.invoke_enable();
  }

  /**
   * @return {!Map.<string, !ServiceWorkerRegistration>}
   */
  registrations() {
    return this._registrations;
  }

  /**
   * @param {!Array<string>} urls
   * @return {boolean}
   */
  hasRegistrationForURLs(urls) {
    for (const registration of this._registrations.values()) {
      if (urls.filter(url => url && url.startsWith(registration.scopeURL)).length === urls.length) {
        return true;
      }
    }
    return false;
  }

  /**
   * @param {string} versionId
   * @return {?ServiceWorkerVersion}
   */
  findVersion(versionId) {
    for (const registration of this.registrations().values()) {
      const version = registration.versions.get(versionId);
      if (version) {
        return version;
      }
    }
    return null;
  }

  /**
   * @param {string} registrationId
   */
  deleteRegistration(registrationId) {
    const registration = this._registrations.get(registrationId);
    if (!registration) {
      return;
    }
    if (registration._isRedundant()) {
      this._registrations.delete(registrationId);
      this.dispatchEventToListeners(Events.RegistrationDeleted, registration);
      return;
    }
    registration._deleting = true;
    for (const version of registration.versions.values()) {
      this.stopWorker(version.id);
    }
    this._unregister(registration.scopeURL);
  }

  /**
   * @param {string} registrationId
   */
  async updateRegistration(registrationId) {
    const registration = this._registrations.get(registrationId);
    if (!registration) {
      return;
    }
    console.log('updating... ' + registrationId);
    await this._agent.invoke_updateRegistration({scopeURL: registration.scopeURL});
  }

  /**
   * @param {string} registrationId
   * @param {string} data
   */
  async deliverPushMessage(registrationId, data) {
    const registration = this._registrations.get(registrationId);
    if (!registration) {
      return;
    }
    const origin = Common.ParsedURL.ParsedURL.extractOrigin(registration.scopeURL);
    await this._agent.invoke_deliverPushMessage({origin, registrationId, data});
  }

  /**
   * @param {string} registrationId
   * @param {string} tag
   * @param {boolean} lastChance
   */
  async dispatchSyncEvent(registrationId, tag, lastChance) {
    const registration = this._registrations.get(registrationId);
    if (!registration) {
      return;
    }
    const origin = Common.ParsedURL.ParsedURL.extractOrigin(registration.scopeURL);
    await this._agent.invoke_dispatchSyncEvent({origin, registrationId, tag, lastChance});
  }

  /**
   * @param {string} registrationId
   * @param {string} tag
   */
  async dispatchPeriodicSyncEvent(registrationId, tag) {
    const registration = this._registrations.get(registrationId);
    if (!registration) {
      return;
    }
    const origin = Common.ParsedURL.ParsedURL.extractOrigin(registration.scopeURL);
    await this._agent.invoke_dispatchPeriodicSyncEvent({origin, registrationId, tag});
  }

  /**
   * @param {string} scopeURL
   */
  async _unregister(scopeURL) {
    await this._agent.invoke_unregister({scopeURL});
  }

  /**
   * @param {string} scopeURL
   */
  async startWorker(scopeURL) {
    await this._agent.invoke_startWorker({scopeURL});
  }

  /**
   * @param {string} scopeURL
   */
  async skipWaiting(scopeURL) {
    await this._agent.invoke_skipWaiting({scopeURL});
  }

  /**
   * @param {string} versionId
   */
  async stopWorker(versionId) {
    await this._agent.invoke_stopWorker({versionId});
  }

  /**
   * @param {string} versionId
   */
  async inspectWorker(versionId) {
    await this._agent.invoke_inspectWorker({versionId});
  }

  /**
   * @param {!Array.<!Protocol.ServiceWorker.ServiceWorkerRegistration>} registrations
   */
  _workerRegistrationUpdated(registrations) {
    for (const payload of registrations) {
      let registration = this._registrations.get(payload.registrationId);
      if (!registration) {
        registration = new ServiceWorkerRegistration(payload);
        this._registrations.set(payload.registrationId, registration);
        this.dispatchEventToListeners(Events.RegistrationUpdated, registration);
        continue;
      }
      registration._update(payload);

      if (registration._shouldBeRemoved()) {
        this._registrations.delete(registration.id);
        this.dispatchEventToListeners(Events.RegistrationDeleted, registration);
      } else {
        this.dispatchEventToListeners(Events.RegistrationUpdated, registration);
      }
    }
  }

  /**
   * @param {!Array.<!Protocol.ServiceWorker.ServiceWorkerVersion>} versions
   */
  _workerVersionUpdated(versions) {
    /** @type {!Set.<!ServiceWorkerRegistration>} */
    const registrations = new Set();
    for (const payload of versions) {
      const registration = this._registrations.get(payload.registrationId);
      if (!registration) {
        continue;
      }
      console.log('before update version');

      const version = registration._updateVersion(payload);
      this._snapShotCacheEntriesIfNecessary(registration, version);
      registrations.add(registration);
    }
    for (const registration of registrations) {
      if (registration._shouldBeRemoved()) {
        this._registrations.delete(registration.id);
        this.dispatchEventToListeners(Events.RegistrationDeleted, registration);
      } else {
        this.dispatchEventToListeners(Events.RegistrationUpdated, registration);
      }
    }
  }

  /**
   *  @param {!ServiceWorkerRegistration} registration
   * @param {!ServiceWorkerVersion} version
   */
  _snapShotCacheEntriesIfNecessary(registration, version) {
    const cacheModel = this.target().model(ServiceWorkerCacheModel);
    if (version.isNew() && !version.previousState) {
      this._versionInitiated(registration, version, cacheModel);
    }

    if (version.isActivated() && version.isPreviouslyActivating()) {
      this._versionActivated(registration, version, cacheModel);
    }

    if (version.isInstalled() && version.isPreviouslyInstalling()) {
      this._versionInstalled(registration, version, cacheModel);
    }
  }

  /**
   * @param {!ServiceWorkerRegistration} registration
   * @param {!ServiceWorkerVersion} version
   * @param  {?ServiceWorkerCacheModel} cacheModel
   */
  async _versionInitiated(registration, version, cacheModel) {
    version._cacheEntriesInitial = [];
    if (!cacheModel)
      return;

    console.log('version initiated, about to query caches');
    const caches = cacheModel.caches();
    for (let cache of caches) {
      console.log('cache is:' + cache.cacheName);
      /** @type {?Promise<!Array<!Protocol.CacheStorage.DataEntry>>} */
      const loadingPromise = new Promise(resolve => {
        cacheModel.loadAllCacheData(cache, '', (entries, returnCount) => {
          resolve(entries);
        });
      });

      /** @type {Protocol.CacheStorage.DataEntry []}*/
      const entries = await loadingPromise;
      const newEntries = entries.map(
          /**@type {Protocol.CacheStorage.DataEntry}*/
          entry => this._getCacheUpdateInfo(cache.cacheName, entry));
      version._cacheEntriesInitial = [...version._cacheEntriesInitial, ...newEntries];
      this.dispatchEventToListeners(Events.RegistrationUpdated, registration);
      console.warn('initial cache done, updating....');
    };
  }

  /**
   *  @param {!ServiceWorkerRegistration} registration
   *  @param {!ServiceWorkerVersion} version
   *  @param  {?ServiceWorkerCacheModel} cacheModel
   */
  async _versionInstalled(registration, version, cacheModel) {
    version._cacheEntriesInstallation = [];
    if (!cacheModel)
      return;

    console.log('version installed, about to query caches');
    const caches = cacheModel.caches();
    for (let cache of caches) {
      console.log('cache is:' + cache.cacheName);
      /** @type {?Promise<!Array<!Protocol.CacheStorage.DataEntry>>} */
      const loadingPromise = new Promise(resolve => {
        cacheModel.loadAllCacheData(cache, '', (entries, returnCount) => {
          resolve(entries);
        });
      });

      /** @type {Protocol.CacheStorage.DataEntry []}*/
      const entries = await loadingPromise;
      const newEntries = entries.map(
          /**@type {Protocol.CacheStorage.DataEntry}*/
          entry => this._getCacheUpdateInfo(cache.cacheName, entry));
      version._cacheEntriesInstallation = [...version._cacheEntriesInstallation, ...newEntries];
      this.dispatchEventToListeners(Events.RegistrationUpdated, registration);
      console.warn('installation cache done, updating....');
    };
  }

  /**
   *
   * @param {string} name
   * @param {!Protocol.CacheStorage.DataEntry} e
   */
  _getCacheUpdateInfo(name, e) {
    return {'cacheName': name, 'requestURL': e.requestURL, 'responseTime': e.responseTime};
  }

  /**
   *  @param {!ServiceWorkerRegistration} registration
   *  @param {!ServiceWorkerVersion} version
   *  @param  {?ServiceWorkerCacheModel} cacheModel
   */
  async _versionActivated(registration, version, cacheModel) {
    version._cacheEntriesActivation = [];
    if (!cacheModel)
      return;

    console.log('version activated, about to query caches');
    const caches = cacheModel.caches();
    for (let cache of caches) {
      console.log('cache is:' + cache.cacheName);
      /** @type {?Promise<!Array<!Protocol.CacheStorage.DataEntry>>} */
      const loadingPromise = new Promise(resolve => {
        cacheModel.loadAllCacheData(cache, '', (entries, returnCount) => {
          resolve(entries);
        });
      });

      /** @type {Protocol.CacheStorage.DataEntry []}*/
      const entries = await loadingPromise;
      const newEntries = entries.map(
          /**@type {Protocol.CacheStorage.DataEntry}*/
          entry => this._getCacheUpdateInfo(cache.cacheName, entry));
      version._cacheEntriesActivation = [...version._cacheEntriesActivation, ...newEntries];
      this.dispatchEventToListeners(Events.RegistrationUpdated, registration);
      console.warn('activation cache done, updating....');
    };
  }


  /**
   * @param {!Protocol.ServiceWorker.ServiceWorkerErrorMessage} payload
   */
  _workerErrorReported(payload) {
    const registration = this._registrations.get(payload.registrationId);
    if (!registration) {
      return;
    }
    registration.errors.push(payload);
    this.dispatchEventToListeners(Events.RegistrationErrorAdded, {registration: registration, error: payload});
  }

  /**
   * @return {!Common.Settings.Setting<boolean>}
   */
  forceUpdateOnReloadSetting() {
    return this._forceUpdateSetting;
  }

  _forceUpdateSettingChanged() {
    const forceUpdateOnPageLoad = this._forceUpdateSetting.get();
    this._agent.invoke_setForceUpdateOnPageLoad({forceUpdateOnPageLoad});
  }
}

/** @enum {symbol} */
export const Events = {
  RegistrationUpdated: Symbol('RegistrationUpdated'),
  RegistrationErrorAdded: Symbol('RegistrationErrorAdded'),
  RegistrationDeleted: Symbol('RegistrationDeleted'),
};

/**
 * @implements {ProtocolProxyApi.ServiceWorkerDispatcher}
 */
class ServiceWorkerDispatcher {
  /**
   * @param {!ServiceWorkerManager} manager
   */
  constructor(manager) {
    this._manager = manager;
  }

  /**
   * @override
   * @param {!Protocol.ServiceWorker.WorkerRegistrationUpdatedEvent} event
   */
  workerRegistrationUpdated({registrations}) {
    this._manager._workerRegistrationUpdated(registrations);
  }

  /**
   * @override
   * @param {!Protocol.ServiceWorker.WorkerVersionUpdatedEvent} event
   */
  workerVersionUpdated({versions}) {
    this._manager._workerVersionUpdated(versions);
  }

  /**
   * @override
   * @param {!Protocol.ServiceWorker.WorkerErrorReportedEvent} event
   */
  workerErrorReported({errorMessage}) {
    this._manager._workerErrorReported(errorMessage);
  }
}

export class ServiceWorkerVersionState {
  /**
   *
   * @param {!Protocol.ServiceWorker.ServiceWorkerVersionRunningStatus} runningStatus
   * @param {!Protocol.ServiceWorker.ServiceWorkerVersionStatus} status
   * @param {?ServiceWorkerVersionState} previousState
   * @param {number=} timestamp
   */
  constructor(runningStatus, status, previousState, timestamp) {
    this.runningStatus = runningStatus;
    this.status = status;
    this.timestamp = timestamp;
    this.previousState = previousState;
  }
}

export class ServiceWorkerVersion {
  /**
   * @param {!ServiceWorkerRegistration} registration
   * @param {!Protocol.ServiceWorker.ServiceWorkerVersion} payload
   */
  constructor(registration, payload) {
    /** @type {string} */ this.id;
    /** @type {string} */ this.scriptURL;
    /** @type {!Common.ParsedURL.ParsedURL} */ this.parsedURL;
    /** @type {string} */ this.securityOrigin;
    /** @type {number|undefined} */ this.scriptLastModified;
    /** @type {number|undefined} */ this.scriptResponseTime;
    /** @type {!Array<!Protocol.Target.TargetID>} */ this.controlledClients;
    /** @type {?Protocol.Target.TargetID} */ this.targetId;
    /** @type {!ServiceWorkerVersionState} */ this.currentState;
    /** @type {!Array<!any>} */ this._cacheEntriesInitial;
    /** @type {!Array<!any>} */ this._cacheEntriesInstallation;
    /** @type {!Array<!any>} */ this._cacheEntriesActivation;
    this.registration = registration;
    this._update(payload);
    console.log('here in the version constructor.');
  }

  /**
   * @param {!Protocol.ServiceWorker.ServiceWorkerVersion} payload
   */
  _update(payload) {
    this.previousState = this.currentState;
    console.warn(
        'in _update:' + payload.registrationId + ',' + payload.versionId + ':' + payload.status + ':' +
        payload.runningStatus + ' at :' + payload.scriptResponseTime + ' vs now:' + Date.now());
    this.id = payload.versionId;
    this.scriptURL = payload.scriptURL;
    const parsedURL = new Common.ParsedURL.ParsedURL(payload.scriptURL);
    this.securityOrigin = parsedURL.securityOrigin();
    this.currentState = new ServiceWorkerVersionState(
        payload.runningStatus, payload.status, this.currentState, (payload.scriptResponseTime || 0) * 1000);
    this.scriptLastModified = payload.scriptLastModified;
    this.scriptResponseTime = payload.scriptResponseTime;
    if (payload.controlledClients) {
      this.controlledClients = payload.controlledClients.slice();
    } else {
      this.controlledClients = [];
    }
    this.targetId = payload.targetId || null;
  }

  /**
   * @return {boolean}
   */
  isStartable() {
    return !this.registration.isDeleted && this.isActivated() && this.isStopped();
  }

  /**
   * @return {boolean}
   */
  isStoppedAndRedundant() {
    return this.runningStatus() === Protocol.ServiceWorker.ServiceWorkerVersionRunningStatus.Stopped &&
        this.status() === Protocol.ServiceWorker.ServiceWorkerVersionStatus.Redundant;
  }

  /**
   * @return {boolean}
   */
  isStopped() {
    return this.runningStatus() === Protocol.ServiceWorker.ServiceWorkerVersionRunningStatus.Stopped;
  }

  /**
   * @return {boolean}
   */
  isStarting() {
    return this.runningStatus() === Protocol.ServiceWorker.ServiceWorkerVersionRunningStatus.Starting;
  }

  /**
   * @return {boolean}
   */
  isRunning() {
    return this.runningStatus() === Protocol.ServiceWorker.ServiceWorkerVersionRunningStatus.Running;
  }

  /**
   * @return {boolean}
   */
  isStopping() {
    return this.runningStatus() === Protocol.ServiceWorker.ServiceWorkerVersionRunningStatus.Stopping;
  }

  /**
   * @return {boolean}
   */
  isNew() {
    return this.status() === Protocol.ServiceWorker.ServiceWorkerVersionStatus.New;
  }

  /**
   * @return {boolean}
   */
  isInstalling() {
    return this.status() === Protocol.ServiceWorker.ServiceWorkerVersionStatus.Installing;
  }

  /**
   * @return {boolean}
   */
  isPreviouslyInstalling() {
    return this.previousState ?
        this.previousState.status === Protocol.ServiceWorker.ServiceWorkerVersionStatus.Installing :
        false;
  }

  /**
   * @return {boolean}
   */
  isInstalled() {
    return this.status() === Protocol.ServiceWorker.ServiceWorkerVersionStatus.Installed;
  }

  /**
   * @return {boolean}
   */
  isActivating() {
    return this.status() === Protocol.ServiceWorker.ServiceWorkerVersionStatus.Activating;
  }

  /**
   * @return {boolean}
   */
  isPreviouslyActivating() {
    return this.previousState ?
        this.previousState.status === Protocol.ServiceWorker.ServiceWorkerVersionStatus.Activating :
        false;
  }

  /**
   * @return {boolean}
   */
  isActivated() {
    return this.status() === Protocol.ServiceWorker.ServiceWorkerVersionStatus.Activated;
  }

  /**
   * @return {boolean}
   */
  isRedundant() {
    return this.status() === Protocol.ServiceWorker.ServiceWorkerVersionStatus.Redundant;
  }

  /**
   * @returns {!Protocol.ServiceWorker.ServiceWorkerVersionStatus}
   */
  status() {
    return this.currentState.status;
  }

  /**
   * @returns {!Protocol.ServiceWorker.ServiceWorkerVersionRunningStatus}
   */
  runningStatus() {
    return this.currentState.runningStatus;
  }

  /**
   * @return {string}
   */
  mode() {
    if (this.isNew() || this.isInstalling()) {
      return ServiceWorkerVersion.Modes.Installing;
    }
    if (this.isInstalled()) {
      return ServiceWorkerVersion.Modes.Waiting;
    }
    if (this.isActivating() || this.isActivated()) {
      return ServiceWorkerVersion.Modes.Active;
    }
    return ServiceWorkerVersion.Modes.Redundant;
  }

  get cacheEntriesInitial() {
    return this._cacheEntriesInitial;
  }

  set cacheEntriesInitial(value) {
    this._cacheEntriesInitial = value;
  }

  get cacheEntriesInstallation() {
    return this._cacheEntriesInstallation;
  }

  set cacheEntriesInstallation(value) {
    this._cacheEntriesInstallation = value;
  }

  get cacheEntriesActivation() {
    return this._cacheEntriesActivation;
  }

  set cacheEntriesActivation(value) {
    this._cacheEntriesActivation = value;
  }
}

/**
 * @type {!Object<string, string>}
 */
ServiceWorkerVersion.RunningStatus = {
  [Protocol.ServiceWorker.ServiceWorkerVersionRunningStatus.Running]: ls`running`,
  [Protocol.ServiceWorker.ServiceWorkerVersionRunningStatus.Starting]: ls`starting`,
  [Protocol.ServiceWorker.ServiceWorkerVersionRunningStatus.Stopped]: ls`stopped`,
  [Protocol.ServiceWorker.ServiceWorkerVersionRunningStatus.Stopping]: ls`stopping`,
};

/**
 * @type {!Object<string, string>}
 */
ServiceWorkerVersion.Status = {
  [Protocol.ServiceWorker.ServiceWorkerVersionStatus.Activated]: ls`activated`,
  [Protocol.ServiceWorker.ServiceWorkerVersionStatus.Activating]: ls`activating`,
  [Protocol.ServiceWorker.ServiceWorkerVersionStatus.Installed]: ls`installed`,
  [Protocol.ServiceWorker.ServiceWorkerVersionStatus.Installing]: ls`installing`,
  [Protocol.ServiceWorker.ServiceWorkerVersionStatus.New]: ls`new`,
  [Protocol.ServiceWorker.ServiceWorkerVersionStatus.Redundant]: ls`redundant`,
};

/**
 * @enum {string}
 */
ServiceWorkerVersion.Modes = {
  Installing: 'installing',
  Waiting: 'waiting',
  Active: 'active',
  Redundant: 'redundant'
};

export class ServiceWorkerRegistration {
  /**
   * @param {!Protocol.ServiceWorker.ServiceWorkerRegistration} payload
   */
  constructor(payload) {
    /** @type {symbol} */ this._fingerprint;
    /** @type {string} */ this.id;
    /** @type {string} */ this.scopeURL;
    /** @type {string} */ this.securityOrigin;
    /** @type {boolean} */ this.isDeleted;
    this._update(payload);
    /** @type {!Map.<string, !ServiceWorkerVersion>} */
    this.versions = new Map();
    this._deleting = false;
    /** @type {!Array<!Protocol.ServiceWorker.ServiceWorkerErrorMessage>} */
    this.errors = [];
  }

  /**
   * @param {!Protocol.ServiceWorker.ServiceWorkerRegistration} payload
   */
  _update(payload) {
    this._fingerprint = Symbol('fingerprint');
    this.id = payload.registrationId;
    this.scopeURL = payload.scopeURL;
    const parsedURL = new Common.ParsedURL.ParsedURL(payload.scopeURL);
    this.securityOrigin = parsedURL.securityOrigin();
    this.isDeleted = payload.isDeleted;
  }

  /**
   * @return {symbol}
   */
  fingerprint() {
    return this._fingerprint;
  }

  /**
   * @return {!Map<string, !ServiceWorkerVersion>}
   */
  versionsByMode() {
    /** @type {!Map<string, !ServiceWorkerVersion>} */
    const result = new Map();
    for (const version of this.versions.values()) {
      result.set(version.mode(), version);
    }
    return result;
  }

  /**
   * @param {!Protocol.ServiceWorker.ServiceWorkerVersion} payload
   */
  _updateVersion(payload) {
    this._fingerprint = Symbol('fingerprint');
    let version = this.versions.get(payload.versionId);
    if (!version) {
      console.log('from _updateVersion' + payload.versionId + ' ' + payload.status + ' ' + payload.runningStatus);
      version = new ServiceWorkerVersion(this, payload);
      this.versions.set(payload.versionId, version);
      return version;
    }
    version._update(payload);
    return version;
  }

  /**
   * @return {boolean}
   */
  _isRedundant() {
    for (const version of this.versions.values()) {
      if (!version.isStoppedAndRedundant()) {
        return false;
      }
    }
    return true;
  }

  /**
   * @return {boolean}
   */
  _shouldBeRemoved() {
    return this._isRedundant() && (!this.errors.length || this._deleting);
  }

  /**
   * @return {boolean}
   */
  canBeRemoved() {
    return this.isDeleted || this._deleting;
  }


  clearErrors() {
    this._fingerprint = Symbol('fingerprint');
    this.errors = [];
  }
}

class ServiceWorkerContextNamer {
  /**
   * @param {!Target} target
   * @param {!ServiceWorkerManager} serviceWorkerManager
   */
  constructor(target, serviceWorkerManager) {
    this._target = target;
    this._serviceWorkerManager = serviceWorkerManager;
    /** @type {!Map<string, !ServiceWorkerVersion>} */
    this._versionByTargetId = new Map();
    serviceWorkerManager.addEventListener(Events.RegistrationUpdated, this._registrationsUpdated, this);
    serviceWorkerManager.addEventListener(Events.RegistrationDeleted, this._registrationsUpdated, this);
    TargetManager.instance().addModelListener(
        RuntimeModel, RuntimeModelEvents.ExecutionContextCreated, this._executionContextCreated, this);
  }

  /**
   * @param {!Common.EventTarget.EventTargetEvent} event
   */
  _registrationsUpdated(event) {
    this._versionByTargetId.clear();
    const registrations = this._serviceWorkerManager.registrations().values();
    for (const registration of registrations) {
      for (const version of registration.versions.values()) {
        if (version.targetId) {
          this._versionByTargetId.set(version.targetId, version);
        }
      }
    }
    this._updateAllContextLabels();
  }

  /**
   * @param {!Common.EventTarget.EventTargetEvent} event
   */
  _executionContextCreated(event) {
    const executionContext = /** @type {!ExecutionContext} */ (event.data);
    const serviceWorkerTargetId = this._serviceWorkerTargetId(executionContext.target());
    if (!serviceWorkerTargetId) {
      return;
    }
    this._updateContextLabel(executionContext, this._versionByTargetId.get(serviceWorkerTargetId) || null);
  }

  /**
   * @param {!Target} target
   * @return {?string}
   */
  _serviceWorkerTargetId(target) {
    if (target.parentTarget() !== this._target || target.type() !== Type.ServiceWorker) {
      return null;
    }
    return target.id();
  }

  _updateAllContextLabels() {
    for (const target of TargetManager.instance().targets()) {
      const serviceWorkerTargetId = this._serviceWorkerTargetId(target);
      if (!serviceWorkerTargetId) {
        continue;
      }
      const version = this._versionByTargetId.get(serviceWorkerTargetId) || null;
      const runtimeModel = target.model(RuntimeModel);
      const executionContexts = runtimeModel ? runtimeModel.executionContexts() : [];
      for (const context of executionContexts) {
        this._updateContextLabel(context, version);
      }
    }
  }

  /**
   * @param {!ExecutionContext} context
   * @param {?ServiceWorkerVersion} version
   */
  _updateContextLabel(context, version) {
    if (!version) {
      context.setLabel('');
      return;
    }
    const parsedUrl = Common.ParsedURL.ParsedURL.fromString(context.origin);
    const label = parsedUrl ? parsedUrl.lastPathComponentWithFragment() : context.name;
    const localizedStatus = ServiceWorkerVersion.Status[version.status()];
    context.setLabel(ls`${label} #${version.id} (${localizedStatus})`);
  }
}

SDKModel.register(ServiceWorkerManager, Capability.ServiceWorker, true);
