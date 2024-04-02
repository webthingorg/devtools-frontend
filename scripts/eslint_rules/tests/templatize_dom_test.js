// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

const rule = require('../lib/templatize_dom.js');
const ruleTester = new (require('eslint').RuleTester)({
  parserOptions: {ecmaVersion: 9, sourceType: 'module'},
  parser: require.resolve('@typescript-eslint/parser'),
});

ruleTester.run('templatize_dom', rule, {
  valid: [
    {
      code: `import {assert} from 'chai';

      it('normal test', async () => {
        assert.strictEqual(2, 2);
      });
      `,
      filename: 'test/e2e/folder/file.ts',
    },
  ],
  invalid: [
    {
      code: `function createBoxPartElement(
        this: MetricsSidebarPane, 
        style: Map<string, string>, name: string, side: string,
        suffix: string): HTMLDivElement {
      const element = document.createElement('div');
      element.className = side;

      const propertyName = (name !== 'position' ? name + '-' : '') + side + suffix;
      let value = style.get(propertyName);
      if (value === undefined) {
        return element;
      }

      if (value === '' || (name !== 'position' && value === '0px')) {
        value = '\u2012';
      } else if (name === 'position' && value === 'auto') {
        value = '\u2012';
      }
      value = value.replace(/px$/, '');
      value = Platform.NumberUtilities.toFixedIfFloating(value);

      element.textContent = value;
      element.setAttribute('jslog', \`\${VisualLogging.value(propertyName).track({
                             dblclick: true,
                             keydown: 'Enter|Escape|ArrowUp|ArrowDown|PageUp|PageDown',
                             change: true,
                           })}\`);
      element.addEventListener('dblclick', this.startEditing.bind(this, element, name, propertyName, style), false);
      return element;
    }`,
      filename: 'test/e2e/folder/file.ts',
      errors: [{message: 'Missing semicolon'}],
    },
  ]
});

