// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import {ElementsTreeElement} from '../../../../front_end/elements/ElementsTreeElement.js';
import {DOMNode} from '../../../../front_end/sdk/DOMModel.js';
import {AdornerCategories} from '../../../../front_end/elements/Adorner.js';

describe.skip('ElementsTreeElement', () => {
  const node = {} as DOMNode;
  node.nodeType = () => 1;
  const element = new ElementsTreeElement(node, false);

  it('can create an adorner with text', () => {
    element.adornText('hello', AdornerCategories.Security);
    assert.strictEqual(element._adorners.length, 1);
  });

  it('can remove a given adorner', () => {});

  it('can create multiple adorners with the correct order', () => {});

  it('can remove all the adorners', () => {});
});
