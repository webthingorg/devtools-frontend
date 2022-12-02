// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
const {assert} = chai;
import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import type * as Protocol from '../../../../../front_end/generated/protocol.js';
import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection} from '../../helpers/MockConnection.js';

function assertPropertValues<T>(object: T, expectedKeyValuePairs: [key: string, value: unknown][]): void {
  for (const [key, value] of expectedKeyValuePairs) {
    assert.propertyVal(object, key, value);
  }
}

describeWithMockConnection('CSSStyleDeclaration', () => {
  it('should correctly construct new CSSStyleDeclaration', () => {
    const target = createTarget();
    const cssModel = new SDK.CSSModel.CSSModel(target);
    const stubCSSStyle = {
      styleSheetId: 'STYLE_SHEET_ID' as Protocol.CSS.StyleSheetId,
      cssProperties: [
        {
          name: 'margin',
          value: '1px',
          disabled: false,
          implicit: false,
          longhandProperties: [
            {name: 'margin-top', value: '1px'},
            {name: 'margin-right', value: '1px'},
            {name: 'margin-bottom', value: '1px'},
            {name: 'margin-left', value: '1px'},
          ],
          range: {startLine: 1, startColumn: 4, endLine: 1, endColumn: 16},
          text: 'margin: 1px;',
        },
        {
          name: 'margin-top',
          value: '5px',
          disabled: false,
          implicit: false,
          longhandProperties: [],
          range: {startLine: 2, startColumn: 4, endLine: 1, endColumn: 20},
          text: 'margin-top: 5px;',
        },
      ],
      shorthandEntries: [],
      cssText: '\n    margin: 1px;\n    margin-top: 5px;\n',
      range: {startLine: 0, startColumn: 0, endLine: 3, endColumn: 0},
    } as Protocol.CSS.CSSStyle;

    const style = new SDK.CSSStyleDeclaration.CSSStyleDeclaration(
        cssModel, null, stubCSSStyle, SDK.CSSStyleDeclaration.Type.Regular);
    assertPropertValues(style.allProperties()[0], [
      ['name', 'margin'],
      ['value', '1px'],
      ['implicit', false],
      ['index', 0],
    ]);
    assertPropertValues(style.allProperties()[1], [
      ['name', 'margin-top'],
      ['value', '5px'],
      ['implicit', false],
      ['index', 1],
    ]);
    assertPropertValues(style.allProperties()[2], [
      ['name', 'margin-top'],
      ['value', '1px'],
      ['implicit', true],
      ['index', 2],
    ]);
    assertPropertValues(style.allProperties()[3], [
      ['name', 'margin-right'],
      ['value', '1px'],
      ['implicit', true],
      ['index', 3],
    ]);
    assertPropertValues(style.allProperties()[4], [
      ['name', 'margin-bottom'],
      ['value', '1px'],
      ['implicit', true],
      ['index', 4],
    ]);
    assertPropertValues(style.allProperties()[5], [
      ['name', 'margin-left'],
      ['value', '1px'],
      ['implicit', true],
      ['index', 5],
    ]);
  });
});
