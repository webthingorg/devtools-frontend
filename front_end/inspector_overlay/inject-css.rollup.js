// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// @ts-nocheck
// TODO(crbug.com/1011811): Enable TypeScript compiler checks

module.exports = function injectCSS() {
  let styleId = 0;
  return {
    name: 'injectCSS',
    transform(code, id) {
      if (id.endsWith('.css')) {
        styleId++;
        return {
          code: `
            const styleTag${styleId} = document.createElement('style');
            styleTag${styleId}.textContent = \`${code}\`;
            document.head.append(styleTag${styleId});
          `,
          map: null
        };
      }
      return;
    }
  };
};
