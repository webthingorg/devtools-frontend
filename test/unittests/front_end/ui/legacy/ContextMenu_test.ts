// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as IconButton from '../../../../../front_end/ui/components/icon_button/icon_button.js';
import * as UI from '../../../../../front_end/ui/legacy/legacy.js';
import {assertElement, assertShadowRoot, dispatchMouseUpEvent} from '../../helpers/DOMHelpers.js';
import {describeWithEnvironment} from '../../helpers/EnvironmentHelpers.js';

function getContextMenuElement(): HTMLElement {
  const container = document.querySelector('div[data-devtools-glass-pane]');
  assertElement(container, HTMLElement);
  assertShadowRoot(container.shadowRoot);
  const softMenuElement = container.shadowRoot.querySelector('.widget > .soft-context-menu');
  assertElement(softMenuElement, HTMLElement);
  return softMenuElement;
}

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
        menuItems as UI.SoftContextMenu.SoftContextMenuDescriptor[], () => {}, true, undefined, undefined);
    const contextMenuDiscardSpy = sinon.spy(softMenu, 'discard');
    softMenu.show(document, new AnchorBox(0, 0, 0, 0));

    const softMenuElement = getContextMenuElement();
    const item0 = softMenuElement.querySelector('[aria-label^="item0"]');
    const checkMark0 = item0?.querySelector<IconButton.Icon.Icon>('.checkmark');
    const item1 = softMenuElement.querySelector('[aria-label^="item1"]');
    const checkMark1 = item1?.querySelector<IconButton.Icon.Icon>('.checkmark');

    assertElement(item0, HTMLElement);
    assertElement(item1, HTMLElement);
    assert.strictEqual(checkMark0?.style.opacity, '0');
    assert.strictEqual(checkMark1?.style.opacity, '0');

    dispatchMouseUpEvent(item0);
    dispatchMouseUpEvent(item1);
    assert.strictEqual(checkMark0?.style.opacity, '1');
    assert.strictEqual(checkMark1?.style.opacity, '1');
    assert.isTrue(!contextMenuDiscardSpy.called);

    dispatchMouseUpEvent(item0);
    assert.strictEqual(checkMark0?.style.opacity, '0');
    assert.strictEqual(checkMark1?.style.opacity, '1');
    assert.isTrue(!contextMenuDiscardSpy.called);

    softMenu.discard();
  });

  it('contextMenu closes after one click on any item when keepOpen variable is false', () => {
    const softMenu = new UI.SoftContextMenu.SoftContextMenu(
        menuItems as UI.SoftContextMenu.SoftContextMenuDescriptor[], () => {}, false, undefined, undefined);
    const contextMenuDiscardSpy = sinon.spy(softMenu, 'discard');
    softMenu.show(document, new AnchorBox(0, 0, 0, 0));
    const softMenuElement = getContextMenuElement();

    const item0 = softMenuElement.querySelector('[aria-label^="item0"]');
    assertElement(item0, HTMLElement);
    dispatchMouseUpEvent(item0);
    assert.isTrue(contextMenuDiscardSpy.called);

    softMenu.discard();
  });
});
