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

  it('can pretty print an inline json subtype file', async () => {
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

    await step('can pretty-print a json subtype', async () => {
      const textFromResponse = await retrieveCodeMirrorEditorContent();

      const expectedTextFromResponse = [
        '{',
        '    "People": [',
        '        {',
        '            "Name": "Name1",',
        '            "Age": "20",',
        '            "Adult": true',
        '        },',
        '        {',
        '            "Name": "Name2",',
        '            "Age": "13",',
        '            "Adult": false',
        '        }',
        '    ]',
        '}',
      ];

      assert.strictEqual(textFromResponse.toString(), expectedTextFromResponse.toString());
    });

    await step('can highlight the pretty-printed text', async () => {
      // verifies if the text is pretty-printed
      const prettyButton = await waitFor(PRETTY_PRINT_BUTTON);
      const isPretty = await prettyButton.evaluate(e => e.ariaPressed);
      assert.strictEqual('true', isPretty);

      const elementsWithTokenString = await editor.evaluate(
          node => [...node.querySelectorAll('.token-string')].map(node => node.textContent || '') || [],
      );
      assert.isTrue(elementsWithTokenString.indexOf('"Name1"') !== -1);

      const elementsWithTokenAtom = await editor.evaluate(
          node => [...node.querySelectorAll('.token-atom')].map(node => node.textContent || '') || [],
      );
      assert.isTrue(elementsWithTokenAtom.indexOf('true') !== -1);
    });

    await click(PRETTY_PRINT_BUTTON);

    await step('can un-pretty-print a json subtype', async () => {
      const actualNotPrettyText = await retrieveCodeMirrorEditorContent();
      const expectedNotPrettyText =
          '{"People": [{"Name": "Name1","Age": "20","Adult": true},{"Name": "Name2","Age": "13","Adult": false}]}';

      assert.strictEqual(expectedNotPrettyText, actualNotPrettyText.toString());
    });

    await step('can highligh the un-pretty-printed text', async () => {
      // verifies if the text is not pretty-printed
      const prettyButton = await waitFor(PRETTY_PRINT_BUTTON);
      const isPretty = await prettyButton.evaluate(e => e.ariaPressed);
      assert.strictEqual('false', isPretty);

      const elementsWithTokenString = await editor.evaluate(
          node => [...node.querySelectorAll('.token-string')].map(node => node.textContent || '') || [],
      );
      assert.isTrue(elementsWithTokenString.indexOf('"Name1"') !== -1);

      const elementsWithTokenAtom = await editor.evaluate(
          node => [...node.querySelectorAll('.token-atom')].map(node => node.textContent || '') || [],
      );
      assert.isTrue(elementsWithTokenAtom.indexOf('true') !== -1);
    });
  });
});
