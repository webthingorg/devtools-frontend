// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type {Chrome} from '../../../extension-api/ExtensionAPI.js'; // eslint-disable-line @typescript-eslint/no-unused-vars
import {getBrowserAndPages, getResourcesPath, waitFor} from '../../shared/helper.js';

// TODO: Remove once Chromium updates its version of Node.js to 12+.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalThis: any = global;

export async function loadExtension(name: string, startPage?: string) {
  startPage = startPage || `${getResourcesPath()}/extensions/empty_extension.html`;
  const {frontend} = getBrowserAndPages();
  const installed = await frontend.evaluate((name: string, startPage: string) => {
    const extensionServer = globalThis.Extensions.ExtensionServer.instance();
    const extensionInfo = {startPage, name};
    extensionServer.addExtension(extensionInfo);

    const extensionIFrames =
        Array.from(document.body.querySelectorAll(`[data-devtools-extension="${extensionInfo.name}"]`)) as
        HTMLIFrameElement[];

    if (extensionIFrames.length < 1) {
      throw new Error('Installing the extension failed.');
    }

    if (extensionIFrames.length > 1) {
      throw new Error(`Found duplicate extension with name ${extensionInfo.name}.`);
    }

    const injectedAPI = globalThis.buildExtensionAPIInjectedScript(
        extensionInfo, undefined, 'default', globalThis.UI.shortcutRegistry.globalShortcutKeys());

    return new Promise(resolve => {
      extensionIFrames[0].onload = injectAPICallback(resolve);
    });

    function injectAPICallback(completionCallback: (installed: boolean) => void) {
      return (ev: Event) => {
        let installed = false;
        if (ev.target) {
          const iframeWin = (ev.target as HTMLIFrameElement).contentWindow;
          if (iframeWin) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (iframeWin as any).eval(`(${declareChrome})();${injectedAPI}()`);
            installed = true;
          }
        }
        completionCallback(installed);
      };
    }

    function declareChrome() {
      if (!window.chrome) {
        (window.chrome as unknown) = {};
      }
    }
  }, name, startPage);

  if (!installed) {
    throw new Error('Injecting the API failed');
  }

  const iframe = await waitFor(`[data-devtools-extension="${name}"]`);
  const frame = await iframe.contentFrame();
  if (!frame) {
    throw new Error('Installing the extension failed.');
  }
  return frame;
}
