// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as HostModule from './host.js';

self.Host = self.Host || {};
Host = Host || {};

/** @type {!HostModule.InspectorFrontendHost.InspectorFrontendHostStub} */
Host.InspectorFrontendHost = HostModule.InspectorFrontendHost.InspectorFrontendHostInstance;

Host.InspectorFrontendHostAPI = {};

Host.InspectorFrontendHostAPI.Events = HostModule.InspectorFrontendHostAPI.Events;

Host.platform = HostModule.Platform.platform;
Host.isWin = HostModule.Platform.isWin;
Host.isMac = HostModule.Platform.isMac;

Host.ResourceLoader = HostModule.ResourceLoader.ResourceLoader;

/**
 * @param {string} url
 * @param {?Object.<string, string>} headers
 * @param {function(boolean, !Object.<string, string>, string, !HostModule.ResourceLoader.LoadErrorDescription)} callback
 */
Host.ResourceLoader.load = HostModule.ResourceLoader.load;

Host.userMetrics = HostModule.userMetrics;
