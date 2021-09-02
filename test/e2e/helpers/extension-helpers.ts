// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as pptr from 'puppeteer';
import {$$, getBrowserAndPages, getResourcesPath} from '../../shared/helper.js';

// TODO: Remove once Chromium updates its version of Node.js to 12+.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalThis: any = global;

export async function loadExtension(name: string, startPage?: string) {
  startPage = startPage || `${getResourcesPath()}/extensions/empty_extension.html`;
  const {frontend} = getBrowserAndPages();
  await frontend.evaluate((name: string, startPage: string) => {
    const extensionServer = globalThis.Extensions.ExtensionServer.instance();
    const extensionInfo = {startPage, name};
    extensionServer.addExtension(extensionInfo);

    const extensionIFrames =
        Array.from(document.body.querySelectorAll(`[data-devtools-extension="${extensionInfo.name}"]`)) as
        HTMLIFrameElement[];

    const injectedAPI = globalThis.buildExtensionAPIInjectedScript(
        extensionInfo, undefined, 'default', globalThis.UI.shortcutRegistry.globalShortcutKeys());

    return Promise.all(extensionIFrames.map(element => new Promise<boolean>(resolve => {
                                              element.onload = injectAPICallback(resolve);
                                            })));

    function injectAPICallback(completionCallback: (installed: boolean) => void) {
      return (ev: Event) => {
        let installed = false;
        if (ev.target) {
          const iframeWin = (ev.target as HTMLIFrameElement).contentWindow;
          if (iframeWin) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (iframeWin as any).eval(`${injectedAPI}()`);
            installed = true;
          }
        }
        completionCallback(installed);
      };
    }
  }, name, startPage);

  const iframes = await $$(`[data-devtools-extension="${name}"]`);
  const frames = await Promise.all(iframes.map(f => f.contentFrame()));
  return frames.filter(f => f && f.url() === startPage) as pptr.Frame[];
}
