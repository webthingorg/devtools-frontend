// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as Root from '../root/root.js';  // eslint-disable-line no-unused-vars
import * as SDK from '../sdk/sdk.js';     // eslint-disable-line no-unused-vars

/**
 * @interface
 */
export class MarkerDecorator {
  decorate(node: SDK.DOMModel.DOMNode): {title: string; color: string;}|null {
    throw new Error('Not implemented yet');
  }
}

export class GenericDecorator implements MarkerDecorator {
  _title: string;
  _color: string;
  constructor(extension: Root.Runtime.Extension) {
    this._title = Common.UIString.UIString(extension.title());
    this._color = (extension.descriptor()['color'] as string);
  }

  decorate(node: SDK.DOMModel.DOMNode): {title: string; color: string;}|null {
    return {title: this._title, color: this._color};
  }
}
