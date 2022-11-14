// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {describeWithRealConnection} from '../../helpers/RealConnection.js';
import type * as ElementsModule from '../../../../../front_end/panels/elements/elements.js';

describeWithRealConnection('StylePropertyHighlighter', () => {
  let Elements: typeof ElementsModule;
  before(async () => {
    Elements = await import('../../../../../front_end/panels/elements/elements.js');
  });

  it('highlights layers.', () => {
    const stylesSidebarPane = Elements.StylesSidebarPane.StylesSidebarPane.instance();

    const titleElement = sinon.createStubInstance(Element);
    const block = new Elements.StylesSidebarPane.SectionBlock(titleElement);
    const section = sinon.createStubInstance(Elements.StylePropertiesSection.StylePropertiesSection);
    block.sections = [section];
    sinon.stub(stylesSidebarPane, 'getSectionBlockByName').returns(block);
    const highlighter = new Elements.StylePropertyHighlighter.StylePropertyHighlighter(stylesSidebarPane);
    highlighter.findAndHighlightLayer('layer');

    assert.isTrue(section.showAllItems.called);
    assert.isTrue(titleElement.scrollIntoViewIfNeeded.called);
    assert.isTrue(titleElement.animate.called);
  });

  afterEach(() => {
    sinon.restore();
  });
});
