// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable  @typescript-eslint/no-non-null-assertion */

import * as SDK from '../../../../../front_end/core/sdk/sdk.js';

import type * as ElementsModule from '../../../../../front_end/panels/elements/elements.js';
import {describeWithRealConnection} from '../../helpers/RealConnection.js';

const {assert} = chai;

describeWithRealConnection('StylePropertyTreeElementsCopyContextMenu', async () => {
  let Elements: typeof ElementsModule;

  before(async () => {
    Elements = await import('../../../../../front_end/panels/elements/elements.js');
  });

  it('Menu Items Count Test', () => {
    const stylesPane = Elements.StylesSidebarPane.StylesSidebarPane.instance();

    const cssMatchedStyles = new SDK.CSSMatchedStyles.CSSMatchedStyles(
        stylesPane.cssModel()!, stylesPane.node()!, null, null, [], [], [], [], []);
    const cssProperty = new SDK.CSSProperty.CSSProperty(
        cssMatchedStyles.nodeStyles()[0], 0, '', '', true, false, true, false, '', undefined);
    const stylePropertyTreeElement = new Elements.StylePropertyTreeElement.StylePropertyTreeElement(
        stylesPane, cssMatchedStyles, cssProperty, false, false, false, true);

    const event = new CustomEvent('contextmenu');

    const contextMenu = stylePropertyTreeElement.createCopyContextMenu(event);

    assert.strictEqual(contextMenu.headerSection().items.length, 5);
    assert.strictEqual(contextMenu.clipboardSection().items.length, 2);
    assert.strictEqual(contextMenu.defaultSection().items.length, 1);
    assert.strictEqual(contextMenu.footerSection().items.length, 1);
  });
});
