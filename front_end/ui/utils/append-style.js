// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// @ts-nocheck
// TODO(crbug.com/1011811): Enable TypeScript compiler checks

/**
 * @param {!Node} node
 * @param {string} cssFile
 * @suppressGlobalPropertiesCheck
 */
export function appendStyle(node, cssFile) {
  for (const style of getStylesForFile(cssFile)) {
    const styleElement = createElement('style');
    styleElement.textContent = style;
    node.appendChild(styleElement);
  }
}

/**
 * @param {string} cssFile
 * @return {!Array<string>}
 * @suppressGlobalPropertiesCheck
 */
export function getStylesForFile(cssFile) {
  const result = [];
  const content = self.Runtime.cachedResources[cssFile] || '';
  if (!content) {
    console.error(cssFile + ' not preloaded. Check module.json');
  }
  result.push(content);
  const themeStyleSheet = self.UI.themeSupport.themeStyleSheet(cssFile, content);
  if (themeStyleSheet) {
    result.push(themeStyleSheet + '\n' + Root.Runtime.resolveSourceURL(cssFile + '.theme'));
  }
  return result;
}
