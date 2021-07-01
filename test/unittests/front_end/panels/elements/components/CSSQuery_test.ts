// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as ElementsComponents from '../../../../../../front_end/panels/elements/components/components.js';
import {assertShadowRoot, renderElementIntoDOM} from '../../../helpers/DOMHelpers.js';

const {assert} = chai;

describe('CSSQuery', () => {
  it('renders a normal query correctly', () => {
    const component = new ElementsComponents.CSSQuery.CSSQuery();
    renderElementIntoDOM(component);
    component.data = {
      queryPrefix: '@container',
      queryText: '(min-width: 10px)',
    };

    assertShadowRoot(component.shadowRoot);

    const queryElement = component.shadowRoot.querySelector('.query');
    if (!queryElement) {
      assert.fail('query element should exist');
      return;
    }

    assert.strictEqual(
        queryElement.textContent,
        '@container (min-width: 10px)',
        'text content of query element should match query text',
    );
  });

  it('renders an editable named query correctly', () => {
    const component = new ElementsComponents.CSSQuery.CSSQuery();
    renderElementIntoDOM(component);

    let clickCounter = 0;
    const clickListener = () => {
      clickCounter++;
    };

    component.data = {
      queryPrefix: '@container',
      queryName: 'container-query-1',
      queryText: '(max-width: 10px)',
      onQueryTextClick: clickListener,
    };

    assertShadowRoot(component.shadowRoot);

    const queryElement = component.shadowRoot.querySelector('.query');
    if (!queryElement) {
      assert.fail('query element should exist');
      return;
    }

    assert.strictEqual(
        queryElement.textContent,
        '@container container-query-1 (max-width: 10px)',
        'text content of query element should match query text',
    );

    const queryText = queryElement.querySelector<HTMLElement>('.query-text.editable');
    if (!queryText) {
      assert.fail('editable query text should exist');
      return;
    }

    queryText.click();
    assert.strictEqual(clickCounter, 1, 'query text click listener should be triggered by clicking');
  });
});
