// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {focusChanged} from './focus-changed.js';
import {injectCoreStyles} from './inject-core-styles.js';

interface ShadowRootOptions {
  cssFiles: CSSStyleSheet[];
  delegatesFocus?: boolean;
}

export function createShadowRootWithStyles(element: Element, options: ShadowRootOptions = {
  delegatesFocus: undefined,
  cssFiles: [],
}): ShadowRoot {
  const {
    cssFiles,
    delegatesFocus,
  } = options;

  const shadowRoot = element.attachShadow({mode: 'open', delegatesFocus});
  injectCoreStyles(shadowRoot);
  shadowRoot.adoptedStyleSheets = cssFiles;
  shadowRoot.addEventListener('focus', focusChanged, true);
  return shadowRoot;
}
