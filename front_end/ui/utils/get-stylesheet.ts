// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const sheetsCache = new Map<string, CSSStyleSheet>();

export function getStyleSheet(path: string): CSSStyleSheet {
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
  sheetsCache.set(path, stylesheet);

  // TODO: themeStyleSheet

  return stylesheet;
}
