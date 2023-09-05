// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as IconButton from '../../../../../front_end/ui/components/icon_button/icon_button.js';
import * as UI from '../../../../../front_end/ui/legacy/legacy.js';
import {dispatchMouseUpEvent} from '../../helpers/DOMHelpers.js';
import {describeWithEnvironment} from '../../helpers/EnvironmentHelpers.js';

describeWithEnvironment('ContextMenu', () => {
  let menuItems: UI.SoftContextMenu.SoftContextMenuDescriptor[];
  beforeEach(() => {
    menuItems = [
      {
        type: 'checkbox',
        id: 0,
        label: 'item0',
        checked: false,
      },
      {
        type: 'checkbox',
        id: 1,
        label: 'item1',
        checked: false,
      },
    ];
  });

  it('can keep ContextMenu open after one click on any item when keepOpen variable is set', () => {
    const softMenu = new UI.SoftContextMenu.SoftContextMenu(
        menuItems as UI.SoftContextMenu.SoftContextMenuDescriptor[], () => {}, undefined, undefined, true);
    const contextMenuDiscardSpy = sinon.spy(softMenu, 'discard');
    softMenu.show(document, new AnchorBox(0, 0, 0, 0));

    const itemClicked = softMenu.getContextMenuElement().querySelector('[aria-label^="item0"]');
    const checkMark = itemClicked?.querySelector<IconButton.Icon.Icon>('.checkmark');
    const itemClicked1 = softMenu.getContextMenuElement().querySelector('[aria-label^="item1"]');
    const checkMark1 = itemClicked1?.querySelector<IconButton.Icon.Icon>('.checkmark');
    assert.strictEqual(checkMark?.style.opacity, '0');
    assert.strictEqual(checkMark1?.style.opacity, '0');

    if (itemClicked && itemClicked1) {
      dispatchMouseUpEvent(itemClicked);
      dispatchMouseUpEvent(itemClicked1);
    }
    assert.strictEqual(checkMark?.style.opacity, '1');
    assert.strictEqual(checkMark1?.style.opacity, '1');
    assert.isTrue(!contextMenuDiscardSpy.called);

    if (itemClicked) {
      dispatchMouseUpEvent(itemClicked);
    }
    assert.strictEqual(checkMark?.style.opacity, '0');
    assert.strictEqual(checkMark1?.style.opacity, '1');
    assert.isTrue(!contextMenuDiscardSpy.called);
  });

  it('contextMenu closes after one click on any item when keepOpen variable is undefined', () => {
    const softMenu = new UI.SoftContextMenu.SoftContextMenu(
        menuItems as UI.SoftContextMenu.SoftContextMenuDescriptor[], () => {}, undefined, undefined, false);
    const contextMenuDiscardSpy = sinon.spy(softMenu, 'discard');
    softMenu.show(document, new AnchorBox(0, 0, 0, 0));

    const itemClicked = softMenu.getContextMenuElement().querySelector('[aria-label^="item0"]');
    if (itemClicked) {
      dispatchMouseUpEvent(itemClicked);
    }
    assert.isTrue(contextMenuDiscardSpy.called);
  });
});
