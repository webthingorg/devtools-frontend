// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {FormattedContentBuilder} from './FormattedContentBuilder.js';  // eslint-disable-line no-unused-vars

export class IdentityFormatter {
  constructor(private builder: FormattedContentBuilder) {
  }

  format(text: string, lineEndings: number[], fromOffset: number, toOffset: number) {
    const content = text.substring(fromOffset, toOffset);
    console.error('Where is this');
    this.builder.addToken(content, fromOffset);
  }
}
