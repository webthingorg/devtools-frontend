// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {
  click,
  step,
  waitFor,
} from '../../shared/helper.js';
import {
  navigateToNetworkTab,
  selectRequestByName,
  waitForSomeRequestsToAppear,
} from '../helpers/network-helpers.js';
import {retrieveCodeMirrorEditorContent} from '../helpers/sources-helpers.js';

const PRETTY_PRINT_BUTTON = '[aria-label="Pretty print"]';

describe('The Network Tab', function() {
  if (this.timeout() > 0) {
    this.timeout(10000);
  }

  it('can pretty print a Json subtype file inline', async () => {
    await navigateToNetworkTab('minified-sourcecode-ld.html');
    await waitForSomeRequestsToAppear(2);
    await selectRequestByName('json-subtype-ld.rawresponse');

    const networkView = await waitFor('.network-item-view');
    await click('#tab-headersComponent', {
      root: networkView,
    });

    await click('[aria-label=Response][role="tab"]', {
      root: networkView,
    });
    await waitFor('[aria-label=Response][role=tab][aria-selected=true]', networkView);

    const editor = await waitFor('[aria-label="Code editor"]');

    await step('can pretty-print successfully a Json subtype', async () => {
      const textFromResponse = await retrieveCodeMirrorEditorContent();

      const expectedTextFromResponse = [
        '{',
        '    "todos": [',
        '        {',
        '            "todo": "Buy groceries",',
        '            "to4567do": "Buy groceries",',
        '            "completed": false',
        '        },',
        '        {',
        '            "todo": "Do laundry",',
        '            "completed": true',
        '        },',
        '        {',
        '            "todo": "Write a blog post",',
        '            "completed": false',
        '        }',
        '    ]',
        '}',
      ];

      assert.strictEqual(textFromResponse.toString(), expectedTextFromResponse.toString());
    });

    await step('can highlight the pretty-printed text', async () => {
      const elementsWithTokenString = await editor.evaluate(
          node => [...node.querySelectorAll('.token-string')].map(node => node.textContent || '') || [],
      );

      assert.isTrue(elementsWithTokenString.indexOf('"Buy groceries"') !== -1);

      const elementsWithTokenAtom = await editor.evaluate(
          node => [...node.querySelectorAll('.token-atom')].map(node => node.textContent || '') || [],
      );

      assert.isTrue(elementsWithTokenAtom.indexOf('true') !== -1);
    });

    await step('can un-pretty-print successfully a Json subtype', async () => {
      await click(PRETTY_PRINT_BUTTON);

      const actualNotPrettyText = await retrieveCodeMirrorEditorContent();
      const expectedNotPrettyText =
          '{"todos": [{"todo": "Buy groceries","to4567do": "Buy groceries","completed": false},{"todo": "Do laundry","completed": true},{"todo": "Write a blog post","completed": false}]}';

      assert.strictEqual(expectedNotPrettyText, actualNotPrettyText.toString());
    });

    await step('can highligh the un-pretty-printed text', async () => {
      const elementsWithTokenString = await editor.evaluate(
          node => [...node.querySelectorAll('.token-string')].map(node => node.textContent || '') || [],
      );

      assert.isTrue(elementsWithTokenString.indexOf('"Buy groceries"') !== -1);

      const elementsWithTokenAtom = await editor.evaluate(
          node => [...node.querySelectorAll('.token-atom')].map(node => node.textContent || '') || [],
      );

      assert.isTrue(elementsWithTokenAtom.indexOf('true') !== -1);
    });
  });
});
