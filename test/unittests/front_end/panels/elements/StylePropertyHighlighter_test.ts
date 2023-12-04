// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';
import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import type * as ElementsModule from '../../../../../front_end/panels/elements/elements.js';
import * as PanelUtils from '../../../../../front_end/panels/utils/utils.js';
import {describeWithRealConnection} from '../../helpers/RealConnection.js';
import {createBlockAndSection, createSection, setupStylesPane} from '../../helpers/StyleHelpers.js';

describeWithRealConnection('StylePropertyHighlighter', () => {
  let Elements: typeof ElementsModule;
  before(async () => {
    Elements = await import('../../../../../front_end/panels/elements/elements.js');
  });

  it('highlights layers', async () => {
    const {stylesSidebarPane, matchedStyles} = await setupStylesPane();
    const getSectionBlockByName = sinon.stub(stylesSidebarPane, 'getSectionBlockByName');

    const block = createBlockAndSection(stylesSidebarPane, matchedStyles);
    getSectionBlockByName.returns(block);
    const [section] = block.sections;

    const style = section.style() as sinon.SinonStubbedInstance<SDK.CSSStyleDeclaration.CSSStyleDeclaration>;
    // Attach a property late, in order to verify that highlighting the layer repopulates the tree view.
    const property = new SDK.CSSProperty.CSSProperty(style, 0, '', '', true, false, true, false, '', undefined);
    style.leadingProperties.returns([property]);
    assert.isUndefined(section.propertiesTreeOutline.firstChild());

    const highlighter = new Elements.StylePropertyHighlighter.StylePropertyHighlighter(stylesSidebarPane);
    const highlightSpy = sinon.spy(PanelUtils.PanelUtils, 'highlightElement');
    highlighter.findAndHighlightSectionBlock('dontcare');

    const firstChild = section.propertiesTreeOutline.firstChild();
    assertNotNullOrUndefined(firstChild);
    assert.deepEqual(
        (firstChild as ElementsModule.StylePropertyTreeElement.StylePropertyTreeElement).property, property);

    assert.isTrue(highlightSpy.calledOnceWithExactly(block.titleElement() as HTMLElement));
  });

  it('highlights sections', async () => {
    const {stylesSidebarPane, matchedStyles} = await setupStylesPane();
    const getSectionBlockByName = sinon.stub(stylesSidebarPane, 'getSectionBlockByName');

    const block = createBlockAndSection(stylesSidebarPane, matchedStyles, 'sectionname');
    const blockExpandSpy = sinon.spy(block, 'expand');

    getSectionBlockByName.callsFake(name => name === 'blockname' ? block : undefined);

    const highlighter = new Elements.StylePropertyHighlighter.StylePropertyHighlighter(stylesSidebarPane);
    const highlightSpy = sinon.stub(PanelUtils.PanelUtils, 'highlightElement');
    highlighter.findAndHighlightSection('sectionname', 'blockname');

    assert.isTrue(blockExpandSpy.called);
    assert.isTrue(highlightSpy.calledOnceWithExactly(block.sections[0].element));
  });

  it('highlights properties in sections in blocks', async () => {
    const {stylesSidebarPane, matchedStyles} = await setupStylesPane();
    const getSectionBlockByName = sinon.stub(stylesSidebarPane, 'getSectionBlockByName');

    const block1 = createBlockAndSection(stylesSidebarPane, matchedStyles, 'section1', ['property']);
    const block1ExpandSpy = sinon.spy(block1, 'expand');
    const block2 = createBlockAndSection(stylesSidebarPane, matchedStyles, 'section2', ['property']);
    block2.sections.unshift(createSection(stylesSidebarPane, matchedStyles, 'extrasection'));
    const block2ExpandSpy = sinon.spy(block2, 'expand');

    getSectionBlockByName.callsFake(name => {
      if (name === 'block1') {
        return block1;
      }
      if (name === 'block2') {
        return block2;
      }
      return undefined;
    });

    const highlighter = new Elements.StylePropertyHighlighter.StylePropertyHighlighter(stylesSidebarPane);
    const highlightSpy = sinon.stub(PanelUtils.PanelUtils, 'highlightElement');
    highlighter.findAndHighlightPropertyName('property', undefined, 'section2', 'block2');

    assert.isFalse(block1ExpandSpy.called);
    assert.isTrue(block2ExpandSpy.called);
    const element = block2.sections[1].propertiesTreeOutline.firstChild()?.listItemElement;
    assertNotNullOrUndefined(element);
    assert.isTrue(highlightSpy.calledOnceWithExactly(element));
  });

  for (const important of [false, true]) {
    it(`highlights properties respecting inheritance ${important ? 'with' : 'without'} !important`, async () => {
      const {stylesSidebarPane, matchedStyles} = await setupStylesPane();

      createBlockAndSection(stylesSidebarPane, matchedStyles, 'section1', ['property']);
      const block2 =
          createBlockAndSection(stylesSidebarPane, matchedStyles, 'section2', ['property', 'other', 'property']);
      block2.sections[0].style().leadingProperties()[0].important = important;
      block2.sections.unshift(createSection(stylesSidebarPane, matchedStyles, 'extrasection'));

      const allSectionsSpy = sinon.stub(stylesSidebarPane, 'allSections');
      allSectionsSpy.returns(block2.sections);

      const highlighter = new Elements.StylePropertyHighlighter.StylePropertyHighlighter(stylesSidebarPane);
      const highlightSpy = sinon.stub(PanelUtils.PanelUtils, 'highlightElement');
      highlighter.findAndHighlightPropertyName('property', block2.sections[0], 'section2', 'block2');

      assert.isTrue(allSectionsSpy.calledOnceWith(block2.sections[0]));

      const expectedElement = important ?
          block2.sections[1].propertiesTreeOutline.rootElement().firstChild()?.listItemElement :
          block2.sections[1].propertiesTreeOutline.rootElement().lastChild()?.listItemElement;
      assertNotNullOrUndefined(expectedElement);
      assert.isTrue(highlightSpy.calledOnce, 'highlightSpy.calledOnce');
      assert.strictEqual(highlightSpy.args[0][0], expectedElement);
    });
  }
});
