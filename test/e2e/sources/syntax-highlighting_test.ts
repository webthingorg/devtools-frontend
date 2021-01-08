// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {$$, step} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {openSourceCodeEditorForFile, waitForSourceCodeLines} from '../helpers/sources-helpers.js';

describe('Sources Tab', async function() {
  it('is highlighting the syntax correctly', async () => {
    await step('navigate to a page and open the Sources tab', async () => {
      await openSourceCodeEditorForFile('syntax-highlighting.wasm', 'wasm/syntax-highlighting.html');
    });

    const numberOfLines = 7;

    await step('wait for all the source code to appear', async () => {
      await waitForSourceCodeLines(numberOfLines);
    });

    await step('check that variables are highlighted with the color blue', async () => {
      const expected_variables = ['$add', '$p0', '$p1', '$p0', '$p1'];
      const expected_color = 'rgb(0, 85, 170)';  // Cobalt Blue

      const variable_names = await Promise.all((await $$('.cm-variable-2')).map(elements => {
        return elements.evaluate(el => (el as HTMLElement).innerText);
      }));
      const variable_colors = await Promise.all((await $$('.cm-variable-2')).map(elements => {
        return elements.evaluate(el => getComputedStyle(el).color);
      }));

      assert.deepEqual(variable_names, expected_variables, 'highlighed variables are incorrect');
      variable_colors.forEach(variable_color => {
        assert.deepEqual(variable_color, expected_color, 'highlighed variables has incorrect formatting');
      });
    });

    await step('check that keywords are highlighted with the color purple', async () => {
      const expected_keywords = ['module', 'func', 'param', 'param', 'result', 'local.get', 'local.get', 'i32.add'];
      const expected_color = 'rgb(119, 0, 136)';  // Indigo Violet

      const keyword_names = await Promise.all((await $$('.cm-keyword')).map(elements => {
        return elements.evaluate(el => (el as HTMLElement).innerText);
      }));
      const keyword_colors = await Promise.all((await $$('.cm-keyword')).map(elements => {
        return elements.evaluate(el => getComputedStyle(el).color);
      }));

      assert.deepEqual(keyword_names, expected_keywords, 'highlighed keywords are incorrect');
      keyword_colors.forEach(keyword_color => {
        assert.deepEqual(keyword_color, expected_color, 'highlighed keywords has incorrect formatting');
      });
    });

    await step('check that comments are highlighted with the color orange', async () => {
      const expected_comments = ['(;', '0;)', '(;', '0;)', '(;', '1;)'];
      const expected_color = 'rgb(170, 85, 0)';  // Tenne Orange

      const comment_names = await Promise.all((await $$('.cm-comment')).map(elements => {
        return elements.evaluate(el => (el as HTMLElement).innerText);
      }));
      const comment_colors = await Promise.all((await $$('.cm-comment')).map(elements => {
        return elements.evaluate(el => getComputedStyle(el).color);
      }));

      assert.deepEqual(comment_names, expected_comments, 'highlighed comments are incorrect');
      comment_colors.forEach(comment_color => {
        assert.deepEqual(comment_color, expected_color, 'highlighed comments has incorrect formatting');
      });
    });

    await step(
        'check that strings are highlighted with the color red',
        async () => {
            // pending
        });
  });
});
