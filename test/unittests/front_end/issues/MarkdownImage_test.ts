// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as IssuesModule from '../../../../front_end/issues/issues.js';
import {assertShadowRoot, renderElementIntoDOM} from '../helpers/DOMHelpers.js';

const {assert} = chai;

describe('MarkdownImage', () => {
  let Issues: typeof IssuesModule;
  before(async () => {
    Issues = await import('../../../../front_end/issues/issues.js');
    Issues.MarkdownImagesMap.markdownImages.set('test-icon', {
      src: 'Images/feedback_thin_16x16_icon.svg',
      isIcon: true,
    });
    Issues.MarkdownImagesMap.markdownImages.set('test-image', {
      src: 'Images/lighthouse_logo.svg',
      width: '100px',
      height: '100px',
      isIcon: false,
    });
  });
  it('renders icon correctly', () => {
    const expectedHtml = '<devtools-icon></devtools-icon>';
    const component = new Issues.MarkdownImage.MarkdownImage();
    component.data = {key: 'test-icon', title: 'Test icon'};
    renderElementIntoDOM(component);

    assertShadowRoot(component.shadowRoot);

    const iconComponent = component.shadowRoot.querySelector('devtools-icon')?.outerHTML;
    assert.strictEqual(iconComponent, expectedHtml);
  });
  it('renders image correctly', () => {
    const expectedHtml =
        '<img class="markdown-image" src="Images/lighthouse_logo.svg" alt="Test image" width="100px" height="100px/">';
    const component = new Issues.MarkdownImage.MarkdownImage();
    component.data = {key: 'test-image', title: 'Test image'};
    renderElementIntoDOM(component);

    assertShadowRoot(component.shadowRoot);

    const imageComponent = component.shadowRoot.querySelector('img')?.outerHTML;
    assert.strictEqual(imageComponent, expectedHtml);
  });
});
