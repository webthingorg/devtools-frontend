// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const stylelint = require('stylelint');
const path = require('path');
const {assert} = require('chai');

const config = {
  plugins: [path.resolve(__dirname, '../lib/wrap_container_queries_clean_css.js')],
  rules: {'plugin/wrap_container_queries_clean_css': [true]}
};

async function lint(code) {
  const {results: [{warnings}]} = await stylelint.lint({
    code,
    config,
  });
  return warnings;
}

const EXPECTED_ERROR_MESSAGE = '@container queries must be wrapped in clean-css ignore comments [crbug.com/1399763]';

describe('wrap_container_queries_clean_css', () => {
  it('errors if the query does not have the comments around it', async () => {
    const warnings = await lint(`
      @container (width<1024px) {
        .test {
          color: #fff;
        }
      }
    `);

    assert.deepEqual(warnings, [{
                       column: 7,
                       line: 2,
                       rule: 'plugin/wrap_container_queries_clean_css',
                       severity: 'error',
                       text: EXPECTED_ERROR_MESSAGE
                     }]);
  });

  it('does not error if the container is wrapped correctly', async () => {
    const warnings = await lint(`
      /* clean-css ignore:start */
      @container (width<1024px) {
        .test {
          color: #fff;
        }
      }
      /* clean-css ignore:end */
    `);

    assert.deepEqual(warnings, []);
  });

  it('does not match @ rules other than container', async () => {
    const warnings = await lint(`
      @media (width<1024px) {
        .test {
          color: #fff;
        }
      }
    `);

    assert.deepEqual(warnings, []);
  });
});
