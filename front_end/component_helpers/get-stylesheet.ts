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

/**
 * Helper for importing a legacy stylesheet into a component.
 *
 * Given a path to a stylesheet, it returns a CSSStyleSheet that can then be
 * adopted by your component.
 *
 * Pass `patchThemeSupport: true` to turn on the legacy dark mode theming and be
 * returned a stylesheet that's been adjusted for dark mode.
 */
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

/**
 * The combination of these gives components a way to toggle styling for dark
 * mode. It's not enough to just just the media query because the user may have
 * their OS level set to light mode but have turned on the dark theme via
 * settings.
 *
 * See ElementsBreadcrumbs.ts for an example of how this is used.
 */
export const DARK_MODE_CLASS = '.component-in-dark-mode';
export function applyDarkModeClassIfNeeded() {
  if (document.documentElement.classList.contains('-theme-with-dark-background') ||
      window.matchMedia('prefers-color-scheme: dark')) {
    return DARK_MODE_CLASS.slice(1);
  }

  return '';
}
