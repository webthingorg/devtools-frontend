// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as CodeMirror from '../../third_party/codemirror.next/codemirror.next.js';

new CodeMirror.EditorView();

/**
 * @interface
 */
export interface App {
  presentUI(document: Document): void;
}
