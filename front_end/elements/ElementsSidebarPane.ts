// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as SDK from '../sdk/sdk.js';  // eslint-disable-line no-unused-vars
import * as UI from '../ui/ui.js';

import {ComputedStyleModel, Events} from './ComputedStyleModel.js';

export class ElementsSidebarPane extends UI.Widget.VBox {
  _computedStyleModel: ComputedStyleModel;
  _updateThrottler: Common.Throttler.Throttler;
  _updateWhenVisible: boolean;
  constructor(delegatesFocus?: boolean|undefined) {
    super(true, delegatesFocus);
    this.element.classList.add('flex-none');
    this._computedStyleModel = new ComputedStyleModel();
    this._computedStyleModel.addEventListener(Events.ComputedStyleChanged, this.onCSSModelChanged, this);

    this._updateThrottler = new Common.Throttler.Throttler(100);
    this._updateWhenVisible = false;
  }

  node(): SDK.DOMModel.DOMNode|null {
    return this._computedStyleModel.node();
  }

  cssModel(): SDK.CSSModel.CSSModel|null {
    return this._computedStyleModel.cssModel();
  }

  computedStyleModel(): ComputedStyleModel {
    return this._computedStyleModel;
  }

  /**
   * @protected
   */
  doUpdate(): Promise<any> {
    return Promise.resolve();
  }

  update() {
    this._updateWhenVisible = !this.isShowing();
    if (this._updateWhenVisible) {
      return;
    }
    this._updateThrottler.schedule(innerUpdate.bind(this));

    function innerUpdate(this: ElementsSidebarPane): Promise<any> {
      return this.isShowing() ? this.doUpdate() : Promise.resolve();
    }
  }

  wasShown() {
    super.wasShown();
    if (this._updateWhenVisible) {
      this.update();
    }
  }

  onCSSModelChanged(event: Common.EventTarget.EventTargetEvent) {
  }
}
