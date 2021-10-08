// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../core/i18n/i18n.js';

const UIStrings = {
  /**
     * @description Title text in Back-forward Cache view of the Application panel
     */
  mainFrame: 'Main Frame',
  /**
     * @description Section header text in Back-forward Cache view of the Application panel
     */
  lastMainFrameNavigation: 'Last Main Frame Navigation',
  /**
     * @description Title text in Back-forward Cache view of the Application panel
     */
  backForwardCacheTitle: 'Back-forward Cache',
  /**
     * @description Status text for the status of the main frame
     */
  unavailable: 'unavailable',
  /**
     * @description Entry name text in the Back-forward Cache view of the Application panel
     */
  url: 'URL',
  /**
     * @description Entry name text in the Back-forward Cache view of the Application panel
     */
  bfcacheStatus: 'Back-forward Cache Status',
  /**
     * @description Status text for the status of the back-forward cache status
     */
  unknown: 'unknown',
  /**
      * @description Status text for the status of the back-forward cache status indicating that
      * the back-forward cache was not used and a normal navigation occured instead.
      */
  normalNavigation: 'Normal navigation (Not restored from back-forward cache)',
  /**
      * @description Status text for the status of the back-forward cache status indicating that
      * the back-forward cache was used to restore the page instead of reloading it.
      */
  restoredFromBFCache: 'Restored from back-forward cache',
  /**
      * @description Category text for the reasons which need to be cleaned up on the websites in
      * order to make the page eligible for the back-forward cache.
      */
  pageSupportNeeded: 'Actionable',
  /**
      * @description Category text for the reasons which are circumstantial and cannot be addressed
      * by developers.
      */
  circumstantial: 'Not Actionable',
  /**
      * @description Explanation text appended to a reason why the usage of the back-forward cache
      * is not possible, if in a future version of Chrome this reason will not prevent the usage
      * of the back-forward cache anymore.
      */
  supportPending: 'Pending Support',
  /**
      * @description Description text for not restored reason NotMainFrame.
      */
  notMainFrame: 'Navigation happened in a frame other than the main frame.',
  /**
      * @description Description text for not restored reason BackForwardCacheDisabled.
      */
  backForwardCacheDisabled:
      'Back/forward cache is disabled by flags. Visit chrome://flags/#back-forward-cache to enable it locally on this device.',
  /**
      * @description Description text for not restored reason RelatedActiveContentsExist.
      */
  relatedActiveContentsExist:
      'The page was opened using `window.open()` and another tab has a reference to it, or the page opened a window.',
  /**
      * @description Description text for not restored reason HTTPStatusNotOK.
      */
  HTTPStatusNotOK: 'Only pages with a status code of 2XX can be cached.',
  /**
      * @description Description text for not restored reason SchemeNotHTTPOrHTTPS.
      */
  schemeNotHTTPOrHTTPS: 'Only pages whose URL scheme is HTTP / HTTPS can be cached.',
  /**
      * @description Description text for not restored reason Loading.
      */
  loading: 'The page did not finish loading before navigating away.',
  /**
      * @description Description text for not restored reason WasGrantedMediaAccess.
      */
  wasGrantedMediaAccess:
      'Pages that have granted access to record video or audio are not currently eligible for back/forward cache.',
  /**
      * @description Description text for not restored reason HTTPMethodNotGET.
      */
  HTTPMethodNotGET: 'Only pages loaded via a GET request are eligible for back/forward cache.',
  /**
      * @description Description text for not restored reason SubframeIsNavigating.
      */
  subframeIsNavigating: 'An iframe on the page started a navigation that did not complete.',
  /**
      * @description Description text for not restored reason Timeout.
      */
  timeout: 'The page exceeded the maximum time in back/forward cache and was expired.',
  /**
      * @description Description text for not restored reason CacheLimit.
      */
  cacheLimit: 'The page was evicted from the cache to allow another page to be cached.',
  /**
      * @description Description text for not restored reason JavaScriptExecution.
      */
  JavaScriptExecution: 'Chrome detected an attempt to execute JavaScript while in the cache.',
  /**
      * @description Description text for not restored reason RendererProcessKilled.
      */
  rendererProcessKilled: 'The renderer process for the page in back/forward cache was killed.',
  /**
      * @description Description text for not restored reason RendererProcessCrashed.
      */
  rendererProcessCrashed: 'The renderer process for the page in back/forward cache crashed.',
  /**
      * @description Description text for not restored reason GrantedMediaStreamAccess.
      */
  grantedMediaStreamAccess:
      'Pages that have granted media stream access are not currently eligible for back/forward cache.',
  /**
      * @description Description text for not restored reason CacheFlushed.
      */
  cacheFlushed: 'The cache was intentionally cleared.',
  /**
      * @description Description text for not restored reason ServiceWorkerVersionActivation.
      */
  serviceWorkerVersionActivation: 'The page was evicted from back/forward cache due to a service worker activation.',
  /**
      * @description Description text for not restored reason SessionRestored.
      */
  sessionRestored: 'Chrome restarted and cleared the back/forward cache entries.',
  /**
      * @description Description text for not restored reason ServiceWorkerPostMessage.
      */
  serviceWorkerPostMessage: 'A service worker attempted to send the page in back/forward cache a `MessageEvent`.',
  /**
      * @description Description text for not restored reason EnteredBackForwardCacheBeforeServiceWorkerHostAdded.
      */
  enteredBackForwardCacheBeforeServiceWorkerHostAdded:
      'A service worker was activated while the page was in back/forward cache.',
  /**
      * @description Description text for not restored reason ServiceWorkerClaim.
      */
  serviceWorkerClaim: 'The page was claimed by a service worker while it is in back/forward cache.',
  /**
      * @description Description text for not restored reason HaveInnerContents.
      */
  haveInnerContents: 'Pages that use portals are not currently eligible for back/forward cache.',
  /**
      * @description Description text for not restored reason TimeoutPuttingInCache.
      */
  timeoutPuttingInCache:
      'The page timed out entering back/forward cache (likely due to long-running pagehide handlers).',
  /**
      * @description Description text for not restored reason BackForwardCacheDisabledByLowMemory.
      */
  backForwardCacheDisabledByLowMemory: 'Back/forward cache is disabled due to insufficient memory.',
  /**
      * @description Description text for not restored reason BackForwardcCacheDisabledByCommandLine.
      */
  backForwardCacheDisabledByCommandLine: 'Back/forward cache is disabled by the command line.',
  /**
      * @description Description text for not restored reason NetworkRequestDatapipeDrainedAsBytesConsumer.
      */
  networkRequestDatapipeDrainedAsBytesConsumer:
      'Pages that have inflight fetch() or XHR are not currently eligible for back/forward cache.',
  /**
      * @description Description text for not restored reason NetworkRequestRedirected.
      */
  networkRequestRedirected:
      'The page was evicted from back/forward cache because an active network request involved a redirect.',
  /**
      * @description Description text for not restored reason NetworkRequestTimeout.
      */
  networkRequestTimeout:
      'The page was evicted from the cache because a network connection was open too long. Chrome limits the amount of time that a page may receive data while cached.',
  /**
      * @description Description text for not restored reason NetworkExceedsBufferLimit.
      */
  networkExceedsBufferLimit:
      'The page was evicted from the cache because an active network connection received too much data. Chrome limits the amount of data that a page may receive while cached.',
  /**
      * @description Description text for not restored reason NavigationCancelledWhileRestoring.
      */
  navigationCancelledWhileRestoring:
      'Navigation was cancelled before the page could be restored from back/forward cache.',
  /**
      * @description Description text for not restored reason BackForwardCacheDisabledForPrerender.
      */
  backForwardCacheDisabledForPrerender: 'Back/forward cache is disabled for prerenderer.',
  /**
      * @description Description text for not restored reason userAgentOverrideDiffers.
      */
  userAgentOverrideDiffers: 'Browser has changed the user agent override header.',
  /**
      * @description Description text for not restored reason ForegroundCacheLimit.
      */
  foregroundCacheLimit: 'The page was evicted from the cache to allow another page to be cached.',
  /**
      * @description Description text for not restored reason BackForwardCacheDisabledForDelegate.
      */
  backForwardCacheDisabledForDelegate: 'Back/forward cache is not supported by delegate.',
  /**
      * @description Description text for not restored reason OptInUnloadHeaderNotPresent.
      */
  optInUnloadHeaderNotPresent: 'The page has unload handler without the back/forward cache opt-in header.',
  /**
      * @description Description text for not restored reason UnloadHandlerExistsInMainFrame.
      */
  unloadHandlerExistsInMainFrame: 'The page has an unload handler in the main frame.',
  /**
      * @description Description text for not restored reason UnloadHandlerExistsInSubFrame.
      */
  unloadHandlerExistsInSubFrame: 'The page has an unload handler in a sub frame.',
  /**
      * @description Description text for not restored reason ServiceWorkerUnregistration.
      */
  serviceWorkerUnregistration: 'ServiceWorker was unregistered while a page was in back/forward cache.',
  /**
      * @description Description text for not restored reason NoResponseHead.
      */
  noResponseHead: 'Pages that do not have a valid response head cannot enter back/forward cache.',
  /**
      * @description Description text for not restored reason CacheControlNoStore.
      */
  cacheControlNoStore: 'Pages with cache-control:no-store header cannot enter back/forward cache.',
  /**
      * @description Description text for not restored reason IneligibleAPI.
      */
  ineligibleAPI: 'Ineligible APIs were used.',
  /**
      * @description Description text for not restored reason InternalError.
      */
  internalError: 'Internal error.',
  /**
      * @description Description text for not restored reason WebSocket.
      */
  webSocket: 'Pages with WebSocket cannot enter back/forward cache.',
  /**
      * @description Description text for not restored reason WebTransport.
      */
  webTransport: 'Pages with WebTransport cannot enter back/forward cache.',
  /**
      * @description Description text for not restored reason WebRTC.
      */
  webRTC: 'Pages with WebRTC cannot enter back/forward cache.',
  /**
      * @description Description text for not restored reason MainResourceHasCacheControlNoStore.
      */
  mainResourceHasCacheControlNoStore: 'MainResourceHasCacheControlNoStore',
  /**
      * @description Description text for not restored reason MainResourceHasCacheControlNoCache.
      */
  mainResourceHasCacheControlNoCache: 'MainResourceHasCacheControlNoCache',
  /**
      * @description Description text for not restored reason SubresourceHasCacheControlNoStore.
      */
  subresourceHasCacheControlNoStore: 'SubresourceHasCacheControlNoStore',
  /**
      * @description Description text for not restored reason SubresourceHasCacheControlNoCache.
      */
  subresourceHasCacheControlNoCache: 'SubresourceHasCacheControlNoCache',
  /**
      * @description Description text for not restored reason ContainsPlugins.
      */
  containsPlugins: 'ContainsPlugins',
  /**
      * @description Description text for not restored reason DocumentLoaded.
      */
  documentLoaded: 'DocumentLoaded',
  /**
      * @description Description text for not restored reason DedicatedWorkerOrWorklet.
      */
  dedicatedWorkerOrWorklet: 'DedicatedWorkerOrWorklet',
  /**
      * @description Description text for not restored reason OutstandingNetworkRequestOthers.
      */
  outstandingNetworkRequestOthers: 'OutstandingNetworkRequestOthers',
  /**
      * @description Description text for not restored reason OutstandingIndexedDBTransaction.
      */
  outstandingIndexedDBTransaction: 'OutstandingIndexedDBTransaction',
  /**
      * @description Description text for not restored reason RequestedNotificationsPermission.
      */
  requestedNotificationsPermission: 'RequestedNotificationsPermission',
  /**
      * @description Description text for not restored reason RequestedMIDIPermission.
      */
  requestedMIDIPermission: 'RequestedMIDIPermission',
  /**
      * @description Description text for not restored reason RequestedAudioCapturePermission.
      */
  requestedAudioCapturePermission: 'RequestedAudioCapturePermission',
  /**
      * @description Description text for not restored reason RequestedVideoCapturePermission.
      */
  requestedVideoCapturePermission: 'RequestedVideoCapturePermission',
  /**
      * @description Description text for not restored reason RequestedBackForwardCacheBlockedSensors.
      */
  requestedBackForwardCacheBlockedSensors: 'RequestedBackForwardCacheBlockedSensors',
  /**
      * @description Description text for not restored reason RequestedBackgroundWorkPermission.
      */
  requestedBackgroundWorkPermission: 'RequestedBackgroundWorkPermission',
  /**
      * @description Description text for not restored reason BroadcastChannel.
      */
  broadcastChannel: 'BroadcastChannel',
  /**
      * @description Description text for not restored reason IndexedDBConnection.
      */
  indexedDBConnection: 'IndexedDBConnection',
  /**
      * @description Description text for not restored reason WebXR.
      */
  webXR: 'WebXR',
  /**
      * @description Description text for not restored reason SharedWorker.
      */
  sharedWorker: 'SharedWorker',
  /**
      * @description Description text for not restored reason WebLocks.
      */
  webLocks: 'WebLocks',
  /**
      * @description Description text for not restored reason WebHID.
      */
  webHID: 'WebHID',
  /**
      * @description Description text for not restored reason WebShare.
      */
  webShare: 'WebShare',
  /**
      * @description Description text for not restored reason RequestedStorageAccessGrant.
      */
  requestedStorageAccessGrant: 'RequestedStorageAccessGrant',
  /**
      * @description Description text for not restored reason WebNfc.
      */
  webNfc: 'WebNfc',
  /**
      * @description Description text for not restored reason OutstandingNetworkRequestFetch.
      */
  outstandingNetworkRequestFetch: 'OutstandingNetworkRequestFetch',
  /**
      * @description Description text for not restored reason OutstandingNetworkRequestXHR.
      */
  outstandingNetworkRequestXHR: 'OutstandingNetworkRequestXHR',
  /**
      * @description Description text for not restored reason AppBanner.
      */
  appBanner: 'AppBanner',
  /**
      * @description Description text for not restored reason Printing.
      */
  printing: 'Printing',
  /**
      * @description Description text for not restored reason WebDatabase.
      */
  webDatabase: 'WebDatabase',
  /**
      * @description Description text for not restored reason PictureInPicture.
      */
  pictureInPicture: 'PictureInPicture',
  /**
      * @description Description text for not restored reason Portal.
      */
  portal: 'Portal',
  /**
      * @description Description text for not restored reason SpeechRecognizer.
      */
  speechRecognizer: 'SpeechRecognizer',
  /**
      * @description Description text for not restored reason IdleManager.
      */
  idleManager: 'IdleManager',
  /**
      * @description Description text for not restored reason PaymentManager.
      */
  paymentManager: 'PaymentManager',
  /**
      * @description Description text for not restored reason SpeechSynthesis.
      */
  speechSynthesis: 'SpeechSynthesis',
  /**
      * @description Description text for not restored reason KeyboardLock.
      */
  keyboardLock: 'KeyboardLock',
  /**
      * @description Description text for not restored reason WebOTPService.
      */
  webOTPService: 'WebOTPService',
  /**
      * @description Description text for not restored reason OutstandingNetworkRequestDirectSocket.
      */
  outstandingNetworkRequestDirectSocket: 'OutstandingNetworkRequestDirectSocket',
  /**
      * @description Description text for not restored reason InjectedJavascript.
      */
  injectedJavascript: 'InjectedJavascript',
  /**
      * @description Description text for not restored reason InjectedStyleSheet.
      */
  injectedStyleSheet: 'InjectedStyleSheet',
  /**
      * @description Description text for not restored reason ContentSecurityHandler.
      */
  contentSecurityHandler: 'ContentSecurityHandler',
  /**
      * @description Description text for not restored reason NotMainFrame.
      */
  contentWebAuthenticationAPI: 'ContentWebAuthenticationAPI',
  /**
      * @description Description text for not restored reason NotMainFrame.
      */
  contentFileChooser: 'ContentFileChooser',
  /**
      * @description Description text for not restored reason NotMainFrame.
      */
  contentSerial: 'ContentSerial',
  /**
      * @description Description text for not restored reason NotMainFrame.
      */
  contentFileSystemAccess: 'ContentFileSystemAccess',
  /**
      * @description Description text for not restored reason NotMainFrame.
      */
  contentMediaDevicesDispatcherHost: 'ContentMediaDevicesDispatcherHost',
  /**
      * @description Description text for not restored reason NotMainFrame.
      */
  contentWebBluetooth: 'ContentWebBluetooth',
  /**
      * @description Description text for not restored reason ContentWebUSB.
      */
  contentWebUSB: 'ContentWebUSB',
  /**
      * @description Description text for not restored reason ContentMediaSession.
      */
  contentMediaSession: 'ContentMediaSession',
  /**
      * @description Description text for not restored reason ContentMediaSessionService.
      */
  contentMediaSessionService: 'ContentMediaSessionService',
  /**
      * @description Description text for not restored reason ContentMediaPlay.
      */
  contentMediaPlay: 'ContentMediaPlay',
  /**
      * @description Description text for not restored reason EmbedderPopupBlockerTabHelper.
      */
  embedderPopupBlockerTabHelper: 'EmbedderPopupBlockerTabHelper',
  /**
      * @description Description text for not restored reason EmbedderSafeBrowsingTriggeredPopupBlocker.
      */
  embedderSafeBrowsingTriggeredPopupBlocker: 'EmbedderSafeBrowsingTriggeredPopupBlocker',
  /**
      * @description Description text for not restored reason EmbedderSafeBrowsingThreatDetails.
      */
  embedderSafeBrowsingThreatDetails: 'EmbedderSafeBrowsingThreatDetails',
  /**
      * @description Description text for not restored reason EmbedderAppBannerManager.
      */
  embedderAppBannerManager: 'EmbedderAppBannerManager',
  /**
      * @description Description text for not restored reason EmbedderDomDistillerViewerSource.
      */
  embedderDomDistillerViewerSource: 'EmbedderDomDistillerViewerSource',
  /**
      * @description Description text for not restored reason EmbedderDomDistillerSelfDeletingRequestDelegate.
      */
  embedderDomDistillerSelfDeletingRequestDelegate: 'EmbedderDomDistillerSelfDeletingRequestDelegate',
  /**
      * @description Description text for not restored reason EmbedderOomInterventionTabHelper.
      */
  embedderOomInterventionTabHelper: 'EmbedderOomInterventionTabHelper',
  /**
      * @description Description text for not restored reason EmbedderOfflinePage.
      */
  embedderOfflinePage: 'EmbedderOfflinePage',
  /**
      * @description Description text for not restored reason EmbedderChromePasswordManagerClientBindCredentialManager.
      */
  embedderChromePasswordManagerClientBindCredentialManager: 'EmbedderChromePasswordManagerClientBindCredentialManager',
  /**
      * @description Description text for not restored reason EmbedderPermissionRequestManager.
      */
  embedderPermissionRequestManager: 'EmbedderPermissionRequestManager',
  /**
      * @description Description text for not restored reason EmbedderModalDialog.
      */
  embedderModalDialog: 'EmbedderModalDialog',
  /**
      * @description Description text for not restored reason EmbedderExtensions.
      */
  embedderExtensions: 'EmbedderExtensions',
  /**
      * @description Description text for not restored reason EmbedderExtensionMessaging.
      */
  embedderExtensionMessaging: 'EmbedderExtensionMessaging',
  /**
      * @description Description text for not restored reason EmbedderExtensionMessagingForOpenPort.
      */
  embedderExtensionMessagingForOpenPort: 'EmbedderExtensionMessagingForOpenPort',
  /**
      * @description Description text for not restored reason EmbedderExtensionSentMessageToCachedFrame.
      */
  embedderExtensionSentMessageToCachedFrame: 'EmbedderExtensionSentMessageToCachedFrame',
};

const str_ = i18n.i18n.registerUIStrings('panels/application/BackForwardCacheStrings.ts', UIStrings);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);

export const BackForwardCacheUIStrings = {
  'mainFrame': {name: i18nLazyString(UIStrings.mainFrame)},
  'lastMainFrameNavigation': {name: i18nLazyString(UIStrings.lastMainFrameNavigation)},
  'backForwardCacheTitle': {name: i18nLazyString(UIStrings.backForwardCacheTitle)},
  'unavailable': {name: i18nLazyString(UIStrings.unavailable)},
  'url': {name: i18nLazyString(UIStrings.url)},
  'bfcacheStatus': {name: i18nLazyString(UIStrings.bfcacheStatus)},
  'unknown': {name: i18nLazyString(UIStrings.unknown)},
  'normalNavigation': {name: i18nLazyString(UIStrings.normalNavigation)},
  'restoredFromBFCache': {name: i18nLazyString(UIStrings.restoredFromBFCache)},
  'pageSupportNeeded': {name: i18nLazyString(UIStrings.pageSupportNeeded)},
  'circumstantial': {name: i18nLazyString(UIStrings.circumstantial)},
  'supportPending': {name: i18nLazyString(UIStrings.supportPending)},
};

export const NotRestoredReasonDescription = {
  'NotMainFrame': {name: i18nLazyString(UIStrings.notMainFrame)},
  'BackForwardCacheDisabled': {name: i18nLazyString(UIStrings.backForwardCacheDisabled)},
  'RelatedActiveContentsExist': {name: i18nLazyString(UIStrings.relatedActiveContentsExist)},
  'HTTPStatusNotOK': {name: i18nLazyString(UIStrings.HTTPStatusNotOK)},
  'SchemeNotHTTPOrHTTPS': {name: i18nLazyString(UIStrings.schemeNotHTTPOrHTTPS)},
  'Loading': {name: i18nLazyString(UIStrings.loading)},
  'WasGrantedMediaAccess': {name: i18nLazyString(UIStrings.wasGrantedMediaAccess)},
  'HTTPMethodNotGET': {name: i18nLazyString(UIStrings.HTTPMethodNotGET)},
  'SubframeIsNavigating': {name: i18nLazyString(UIStrings.subframeIsNavigating)},
  'Timeout': {name: i18nLazyString(UIStrings.timeout)},
  'CacheLimit': {name: i18nLazyString(UIStrings.cacheLimit)},
  'JavaScriptExecution': {name: i18nLazyString(UIStrings.JavaScriptExecution)},
  'RendererProcessKilled': {name: i18nLazyString(UIStrings.rendererProcessKilled)},
  'RendererProcessCrashed': {name: i18nLazyString(UIStrings.rendererProcessCrashed)},
  'GrantedMediaStreamAccess': {name: i18nLazyString(UIStrings.grantedMediaStreamAccess)},
  'CacheFlushed': {name: i18nLazyString(UIStrings.cacheFlushed)},
  'ServiceWorkerVersionActivation': {name: i18nLazyString(UIStrings.serviceWorkerVersionActivation)},
  'SessionRestored': {name: i18nLazyString(UIStrings.sessionRestored)},
  'ServiceWorkerPostMessage': {name: i18nLazyString(UIStrings.serviceWorkerPostMessage)},
  'EnteredBackForwardCacheBeforeServiceWorkerHostAdded':
      {name: i18nLazyString(UIStrings.enteredBackForwardCacheBeforeServiceWorkerHostAdded)},
  'ServiceWorkerClaim': {name: i18nLazyString(UIStrings.serviceWorkerClaim)},
  'HaveInnerContents': {name: i18nLazyString(UIStrings.haveInnerContents)},
  'TimeoutPuttingInCache': {name: i18nLazyString(UIStrings.timeoutPuttingInCache)},
  'BackForwardCacheDisabledByLowMemory': {name: i18nLazyString(UIStrings.backForwardCacheDisabledByLowMemory)},
  'BackForwardCacheDisabledByCommandLine': {name: i18nLazyString(UIStrings.backForwardCacheDisabledByCommandLine)},
  'NetworkRequestDatapipeDrainedAsBytesConsumer':
      {name: i18nLazyString(UIStrings.networkRequestDatapipeDrainedAsBytesConsumer)},
  'NetworkRequestRedirected': {name: i18nLazyString(UIStrings.networkRequestRedirected)},
  'NetworkRequestTimeout': {name: i18nLazyString(UIStrings.networkRequestTimeout)},
  'NetworkExceedsBufferLimit': {name: i18nLazyString(UIStrings.networkExceedsBufferLimit)},
  'NavigationCancelledWhileRestoring': {name: i18nLazyString(UIStrings.navigationCancelledWhileRestoring)},
  'BackForwardCacheDisabledForPrerender': {name: i18nLazyString(UIStrings.backForwardCacheDisabledForPrerender)},
  'UserAgentOverrideDiffers': {name: i18nLazyString(UIStrings.userAgentOverrideDiffers)},
  'ForegroundCacheLimit': {name: i18nLazyString(UIStrings.foregroundCacheLimit)},
  'BackForwardCacheDisabledForDelegate': {name: i18nLazyString(UIStrings.backForwardCacheDisabledForDelegate)},
  'OptInUnloadHeaderNotPresent': {name: i18nLazyString(UIStrings.optInUnloadHeaderNotPresent)},
  'UnloadHandlerExistsInMainFrame': {name: i18nLazyString(UIStrings.unloadHandlerExistsInMainFrame)},
  'UnloadHandlerExistsInSubFrame': {name: i18nLazyString(UIStrings.unloadHandlerExistsInSubFrame)},
  'ServiceWorkerUnregistration': {name: i18nLazyString(UIStrings.serviceWorkerUnregistration)},
  'NoResponseHead': {name: i18nLazyString(UIStrings.noResponseHead)},
  'CacheControlNoStore': {name: i18nLazyString(UIStrings.cacheControlNoStore)},
  'CacheControlNoStoreCookieModified': {name: i18nLazyString(UIStrings.cacheControlNoStore)},
  'CacheControlNoStoreHTTPOnlyCookieModified': {name: i18nLazyString(UIStrings.cacheControlNoStore)},
  'DisableForRenderFrameHostCalled': {name: i18nLazyString(UIStrings.ineligibleAPI)},
  'BlocklistedFeatures': {name: i18nLazyString(UIStrings.ineligibleAPI)},
  'SchedulerTrackedFeatureUsed': {name: i18nLazyString(UIStrings.ineligibleAPI)},
  'DomainNotAllowed': {name: i18nLazyString(UIStrings.internalError)},
  'ConflictingBrowsingInstance': {name: i18nLazyString(UIStrings.internalError)},
  'NotMostRecentNavigationEntry': {name: i18nLazyString(UIStrings.internalError)},
  'IgnoreEventAndEvict': {name: i18nLazyString(UIStrings.internalError)},
  'BrowsingInstanceNotSwapped': {name: i18nLazyString(UIStrings.internalError)},
  'ActivationNavigationsDisallowedForBug1234857': {name: i18nLazyString(UIStrings.internalError)},
  'Unknown': {name: i18nLazyString(UIStrings.internalError)},
  'RenderFrameHostReused_SameSite': {name: i18nLazyString(UIStrings.internalError)},
  'RenderFrameHostReused_CrossSite': {name: i18nLazyString(UIStrings.internalError)},
  'WebSocket': {name: i18nLazyString(UIStrings.webSocket)},
  'WebTransport': {name: i18nLazyString(UIStrings.webTransport)},
  'WebRTC': {name: i18nLazyString(UIStrings.webRTC)},
  'MainResourceHasCacheControlNoStore': {name: i18nLazyString(UIStrings.mainResourceHasCacheControlNoStore)},
  'MainResourceHasCacheControlNoCache': {name: i18nLazyString(UIStrings.mainResourceHasCacheControlNoCache)},
  'SubresourceHasCacheControlNoStore': {name: i18nLazyString(UIStrings.subresourceHasCacheControlNoStore)},
  'SubresourceHasCacheControlNoCache': {name: i18nLazyString(UIStrings.subresourceHasCacheControlNoCache)},
  'ContainsPlugins': {name: i18nLazyString(UIStrings.containsPlugins)},
  'DocumentLoaded': {name: i18nLazyString(UIStrings.documentLoaded)},
  'DedicatedWorkerOrWorklet': {name: i18nLazyString(UIStrings.dedicatedWorkerOrWorklet)},
  'OutstandingNetworkRequestOthers': {name: i18nLazyString(UIStrings.outstandingNetworkRequestOthers)},
  'OutstandingIndexedDBTransaction': {name: i18nLazyString(UIStrings.outstandingIndexedDBTransaction)},
  'RequestedNotificationsPermission': {name: i18nLazyString(UIStrings.requestedNotificationsPermission)},
  'RequestedMIDIPermission': {name: i18nLazyString(UIStrings.requestedMIDIPermission)},
  'RequestedAudioCapturePermission': {name: i18nLazyString(UIStrings.requestedAudioCapturePermission)},
  'RequestedVideoCapturePermission': {name: i18nLazyString(UIStrings.requestedVideoCapturePermission)},
  'RequestedBackForwardCacheBlockedSensors': {name: i18nLazyString(UIStrings.requestedBackForwardCacheBlockedSensors)},
  'RequestedBackgroundWorkPermission': {name: i18nLazyString(UIStrings.requestedBackgroundWorkPermission)},
  'BroadcastChannel': {name: i18nLazyString(UIStrings.broadcastChannel)},
  'IndexedDBConnection': {name: i18nLazyString(UIStrings.indexedDBConnection)},
  'WebXR': {name: i18nLazyString(UIStrings.webXR)},
  'SharedWorker': {name: i18nLazyString(UIStrings.sharedWorker)},
  'WebLocks': {name: i18nLazyString(UIStrings.webLocks)},
  'WebHID': {name: i18nLazyString(UIStrings.webHID)},
  'WebShare': {name: i18nLazyString(UIStrings.webShare)},
  'RequestedStorageAccessGrant': {name: i18nLazyString(UIStrings.requestedStorageAccessGrant)},
  'WebNfc': {name: i18nLazyString(UIStrings.webNfc)},
  'OutstandingNetworkRequestFetch': {name: i18nLazyString(UIStrings.outstandingNetworkRequestFetch)},
  'OutstandingNetworkRequestXHR': {name: i18nLazyString(UIStrings.outstandingNetworkRequestXHR)},
  'AppBanner': {name: i18nLazyString(UIStrings.appBanner)},
  'Printing': {name: i18nLazyString(UIStrings.printing)},
  'WebDatabase': {name: i18nLazyString(UIStrings.webDatabase)},
  'PictureInPicture': {name: i18nLazyString(UIStrings.pictureInPicture)},
  'Portal': {name: i18nLazyString(UIStrings.portal)},
  'SpeechRecognizer': {name: i18nLazyString(UIStrings.speechRecognizer)},
  'IdleManager': {name: i18nLazyString(UIStrings.idleManager)},
  'PaymentManager': {name: i18nLazyString(UIStrings.paymentManager)},
  'SpeechSynthesis': {name: i18nLazyString(UIStrings.speechSynthesis)},
  'KeyboardLock': {name: i18nLazyString(UIStrings.keyboardLock)},
  'WebOTPService': {name: i18nLazyString(UIStrings.webOTPService)},
  'OutstandingNetworkRequestDirectSocket': {name: i18nLazyString(UIStrings.outstandingNetworkRequestDirectSocket)},
  'InjectedJavascript': {name: i18nLazyString(UIStrings.injectedJavascript)},
  'InjectedStyleSheet': {name: i18nLazyString(UIStrings.injectedStyleSheet)},
  'Dummy': {name: i18nLazyString(UIStrings.internalError)},
  'ContentSecurityHandler': {name: i18nLazyString(UIStrings.contentSecurityHandler)},
  'ContentWebAuthenticationAPI': {name: i18nLazyString(UIStrings.contentWebAuthenticationAPI)},
  'ContentFileChooser': {name: i18nLazyString(UIStrings.contentFileChooser)},
  'ContentSerial': {name: i18nLazyString(UIStrings.contentSerial)},
  'ContentFileSystemAccess': {name: i18nLazyString(UIStrings.contentFileSystemAccess)},
  'ContentMediaDevicesDispatcherHost': {name: i18nLazyString(UIStrings.contentMediaDevicesDispatcherHost)},
  'ContentWebBluetooth': {name: i18nLazyString(UIStrings.contentWebBluetooth)},
  'ContentWebUSB': {name: i18nLazyString(UIStrings.contentWebUSB)},
  'ContentMediaSession': {name: i18nLazyString(UIStrings.contentMediaSession)},
  'ContentMediaSessionService': {name: i18nLazyString(UIStrings.contentMediaSessionService)},
  'ContentMediaPlay': {name: i18nLazyString(UIStrings.contentMediaPlay)},
  'EmbedderPopupBlockerTabHelper': {name: i18nLazyString(UIStrings.embedderPopupBlockerTabHelper)},
  'EmbedderSafeBrowsingTriggeredPopupBlocker':
      {name: i18nLazyString(UIStrings.embedderSafeBrowsingTriggeredPopupBlocker)},
  'EmbedderSafeBrowsingThreatDetails': {name: i18nLazyString(UIStrings.embedderSafeBrowsingThreatDetails)},
  'EmbedderAppBannerManager': {name: i18nLazyString(UIStrings.embedderAppBannerManager)},
  'EmbedderDomDistillerViewerSource': {name: i18nLazyString(UIStrings.embedderDomDistillerViewerSource)},
  'EmbedderDomDistillerSelfDeletingRequestDelegate':
      {name: i18nLazyString(UIStrings.embedderDomDistillerSelfDeletingRequestDelegate)},
  'EmbedderOomInterventionTabHelper': {name: i18nLazyString(UIStrings.embedderOomInterventionTabHelper)},
  'EmbedderOfflinePage': {name: i18nLazyString(UIStrings.embedderOfflinePage)},
  'EmbedderChromePasswordManagerClientBindCredentialManager':
      {name: i18nLazyString(UIStrings.embedderChromePasswordManagerClientBindCredentialManager)},
  'EmbedderPermissionRequestManager': {name: i18nLazyString(UIStrings.embedderPermissionRequestManager)},
  'EmbedderModalDialog': {name: i18nLazyString(UIStrings.embedderModalDialog)},
  'EmbedderExtensions': {name: i18nLazyString(UIStrings.embedderExtensions)},
  'EmbedderExtensionMessaging': {name: i18nLazyString(UIStrings.embedderExtensionMessaging)},
  'EmbedderExtensionMessagingForOpenPort': {name: i18nLazyString(UIStrings.embedderExtensionMessagingForOpenPort)},
  'EmbedderExtensionSentMessageToCachedFrame':
      {name: i18nLazyString(UIStrings.embedderExtensionSentMessageToCachedFrame)},
};
