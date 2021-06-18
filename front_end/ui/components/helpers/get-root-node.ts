// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../../../core/platform/platform.js';

/*
 * Function to define a customElement and display an error if the element has already been defined.
 */

export function getRoot(node: Node): ShadowRoot|Document {
  const potentialRoot = node.getRootNode();
  Platform.DCHECK(
      () => potentialRoot instanceof Document || potentialRoot instanceof ShadowRoot,
      `Expected root of widget to be a document or shadowRoot, but was "${potentialRoot.nodeName}"`);
  return potentialRoot as ShadowRoot | Document;
}
