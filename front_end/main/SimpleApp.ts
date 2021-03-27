// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable rulesdir/no_underscored_properties */

import * as Common from '../common/common.js'; // eslint-disable-line no-unused-vars
import * as UI from '../ui/ui.js';

export class SimpleApp implements Common.App.App {
  presentUI(document: Document): void {
    const rootView = new UI.RootView.RootView();
    UI.InspectorView.InspectorView.instance().show(rootView.element);
    rootView.attachToDocument(document);
    rootView.focus();
  }
}

let simpleAppProviderInstance: SimpleAppProvider;

export class SimpleAppProvider implements Common.AppProvider.AppProvider {
  static instance(opts: {
    forceNew: boolean | null;
  } = { forceNew: null }): SimpleAppProvider {
    const { forceNew } = opts;
    if (!simpleAppProviderInstance || forceNew) {
      simpleAppProviderInstance = new SimpleAppProvider();
    }

    return simpleAppProviderInstance;
  }

  createApp(): Common.App.App {
    return new SimpleApp();
  }
}
