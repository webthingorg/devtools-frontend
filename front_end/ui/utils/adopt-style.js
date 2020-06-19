// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// @ts-nocheck
// TODO(crbug.com/1011811): Enable TypeScript compiler checks

const stylesheets = new Map();

/**
 * @param {!ShadowRoot} root
 * @param {string} cssFile
 * @suppressGlobalPropertiesCheck
 */
export function adoptStyle(root, cssFile) {
  if (!stylesheets.has(cssFile)) {
    const content = self.Runtime.cachedResources[cssFile] || '';
    if (!content) {
      console.error(cssFile + ' not preloaded. Check module.json');
    }

    const newSheet = new CSSStyleSheet();
    newSheet.replaceSync(content);
    stylesheets.set(cssFile, newSheet);
  }

  const sheet = stylesheets.get(cssFile);
  root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
}
