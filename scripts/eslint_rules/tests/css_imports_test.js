// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

const rule = require('../lib/css_imports.js');
const ruleTester = new (require('eslint').RuleTester)({
  parserOptions: {ecmaVersion: 9, sourceType: 'module'},
});

ruleTester.run('css_imports', rule, {
  valid: [
    {
      code: 'import styles from \'./IconButton.css.js\';',
      filename: 'front_end/ui/components/icon_button/file.ts',
    },
    {
      code: 'import styles from \'icon_button/IconButton.css.js\';',
      filename: 'front_end/ui/components/file.ts',
    },
    {
      // Paths are resolved correctly
      code: 'import styles from \'../icon_button/IconButton.css.js\';',
      filename: 'front_end/ui/components/test/file.ts',
    },
  ],

  invalid: [
    {
      // Files that do not exist are caught
      code: 'import styles from \'styles.css.js\';',
      filename: 'front_end/ui/components/component/file.ts',
      errors: [{
        message: 'File styles.css does not exist. Check you are importing the correct file.',
      }],
    },
    {
      // Filename typos are caught
      code: 'import styles from \'IconButtons.css.js\';',
      filename: 'front_end/ui/components/icon_button/file.ts',
      errors: [{
        message: 'File IconButtons.css does not exist. Check you are importing the correct file.',
      }],
    },
  ],
});
