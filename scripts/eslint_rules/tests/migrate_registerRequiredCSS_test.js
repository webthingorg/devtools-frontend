// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

const rule = require('../lib/migrate_registerRequiredCSS.js');
const ruleTester = new (require('eslint').RuleTester)({
  parserOptions: {ecmaVersion: 9, sourceType: 'module'},
  parser: require.resolve('@typescript-eslint/parser'),
});

const EXPECTED_ERROR_MESSAGE = 'Import CSS file instead of using registerRequiredCSS';

ruleTester.run('check_migrate_RegisterRequiredCSS', rule, {
  valid: [
    {
      code: `
      export class Component extends UI.Widget.Widget {
        constructor(){

        }
      }
      `,
      filename: 'front_end/components/test.ts',
    },
    {
      code: `
      import componentStyles from './componentStyles.css.js';
      export class Component extends UI.Widget.Widget {
        constructor(){
        }

        wasShown() : void {
          this.registerCSSFiles([componentStyles]);
        }
      }
      `,
      filename: 'front_end/components/test.ts',
    },
  ],
  invalid: [
    {
      code: `export class Component extends UI.Widget.Widget {
  constructor(){
this.registerRequiredCSS('front_end/components/test.css')
  }
}`,
      filename: 'front_end/components/test.ts',
      errors: [{message: EXPECTED_ERROR_MESSAGE}],
      output: `import testStyles from './test.css.js';
export class Component extends UI.Widget.Widget {
  constructor(){

  }
  wasShown() : void {
    super.wasShown();
    this.adoptedStyleSheets = [testStyles];
  }
}`
    },
    {
      code: `export class Component extends UI.Widget.Widget {
  constructor(){
this.registerRequiredCSS('front_end/components/test.css')
  }
  willHide() : void {

  }
}`,
      filename: 'front_end/components/test.ts',
      errors: [{message: EXPECTED_ERROR_MESSAGE}],
      output: `import testStyles from './test.css.js';
export class Component extends UI.Widget.Widget {
  constructor(){

  }
  willHide() : void {

  }
  wasShown() : void {
    super.wasShown();
    this.adoptedStyleSheets = [testStyles];
  }
}`
    },
    {
      code: `export class Component extends UI.Widget.Widget {
  constructor(){
this.registerRequiredCSS('front_end/components/test.css')
  }
  willHide() : void {

  }
  wasShown() : void {
    super.wasShown();
  }
}`,
      filename: 'front_end/components/test.ts',
      errors: [{message: EXPECTED_ERROR_MESSAGE}],
      output: `import testStyles from './test.css.js';
export class Component extends UI.Widget.Widget {
  constructor(){

  }
  willHide() : void {

  }
  wasShown() : void {
    super.wasShown();
    this.adoptedStyleSheets = [testStyles];
  }
}`
    },
    {
      code: `export class Component extends UI.Widget.Widget {
  constructor(){
this.registerRequiredCSS('front_end/components/test.css')
  }
  willHide() : void {

  }
  wasShown() : void {
    super.wasShown();
    console.log('hello world');
  }
}`,
      filename: 'front_end/components/test.ts',
      errors: [{message: EXPECTED_ERROR_MESSAGE}],
      output: `import testStyles from './test.css.js';
export class Component extends UI.Widget.Widget {
  constructor(){

  }
  willHide() : void {

  }
  wasShown() : void {
    super.wasShown();
    this.adoptedStyleSheets = [testStyles];
    console.log('hello world');
  }
}`
    },
  ]
});
