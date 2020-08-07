// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';

const sheetsCache = new Map<string, CSSStyleSheet>();

declare global {
  interface Window {
    UI: {themeSupport: UI.UIUtils.ThemeSupport}
  }
}

export function getStyleSheet(path: string, {patchThemeSupport = false} = {}): CSSStyleSheet {
  const cachedSheet = sheetsCache.get(path);
  if (cachedSheet) {
    return cachedSheet;
  }

  const content = self.Runtime.cachedResources[path] || '';
  if (!content) {
    throw new Error(`${path} not preloaded.`);
  }

  const stylesheet = new CSSStyleSheet();
  stylesheet.replaceSync(content);

  if (!patchThemeSupport) {
    sheetsCache.set(path, stylesheet);
    return stylesheet;
  }

  const themeStyleSheet = (self.UI.themeSupport).themeStyleSheet(path, content);

  if (themeStyleSheet) {
    stylesheet.replaceSync(themeStyleSheet + '\n' + Root.Runtime.Runtime.resolveSourceURL(path + '.theme'));
  }

  sheetsCache.set(path, stylesheet);
  return stylesheet;
}

export const DARK_MODE_CLASS = '.component-in-dark-mode';
export function applyDarkModeClassIfNeeded() {
  if (document.documentElement.classList.contains('-theme-with-dark-background') ||
      window.matchMedia('prefers-color-scheme: dark')) {
    return DARK_MODE_CLASS.slice(1);
  }

  return '';
}
