// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable rulesdir/no_underscored_properties */

import * as Common from '../common/common.js';
import * as Components from '../components/components.js';
import * as Host from '../host/host.js';
import * as i18n from '../i18n/i18n.js';
import * as SDK from '../sdk/sdk.js';

const UIStrings = {
  /**
  *@description Text that refers to the main target.
  */
  main: 'Main',
};

const str_ = i18n.i18n.registerUIStrings('js_main/JsMain.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

let jsMainImplInstance: JsMainImpl;

export class JsMainImpl extends Common.ObjectWrapper.ObjectWrapper implements Common.Runnable.Runnable {
  static instance(opts: {
    forceNew: boolean | null;
  } = { forceNew: null }): JsMainImpl {
    const { forceNew } = opts;
    if (!jsMainImplInstance || forceNew) {
      jsMainImplInstance = new JsMainImpl();
    }

    return jsMainImplInstance;
  }
  run(): Promise<void> {
    Host.userMetrics.actionTaken(Host.UserMetrics.Action.ConnectToNodeJSDirectly);
    SDK.Connections.initMainConnection(() => {
      const target = SDK.SDKModel.TargetManager.instance().createTarget('main', i18nString(UIStrings.main), SDK.SDKModel.Type.Node, null);
      target.runtimeAgent().invoke_runIfWaitingForDebugger();
      return Promise.resolve();
    }, Components.TargetDetachedDialog.TargetDetachedDialog.webSocketConnectionLost);
    return Promise.resolve();
  }
}

Common.Runnable.registerEarlyInitializationRunnable(JsMainImpl.instance);
