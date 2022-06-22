// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as ElementsModule from '../../../../../front_end/panels/elements/elements.js';
import {describeWithEnvironment} from '../../helpers/EnvironmentHelpers.js';

const {assert} = chai;

describeWithEnvironment('CSSRuleValidator', async () => {
  let Elements: typeof ElementsModule;
  let tests: Array<{
    description: string,
    computedStyles: Map<string, string>,
    parentsComputedStyles: Map<string, string>| null,
    validator: ElementsModule.CSSRuleValidator.CSSRuleValidator,
    expectedResult: boolean,
  }>;

  before(async () => {
    Elements = await import('../../../../../front_end/panels/elements/elements.js');

    tests = [
      {
        description: '',
        computedStyles: new Map<string, string>([
          ['display', 'inline-flex'],
          ['flex-wrap', 'nowrap'],
          ['align-content', 'center'],
        ]),
        parentsComputedStyles: null,
        validator: new Elements.CSSRuleValidator.AlignContentValidator(),
        expectedResult: false,
      },
      {
        description: '',
        computedStyles: new Map<string, string>([
          ['display', 'block'],
          ['flex-wrap', 'nowrap'],
          ['align-content', 'center'],
        ]),
        parentsComputedStyles: null,
        validator: new Elements.CSSRuleValidator.AlignContentValidator(),
        expectedResult: true,
      },
      {
        description: '',
        computedStyles: new Map<string, string>([
          ['flex', '1'],
        ]),
        parentsComputedStyles: new Map<string, string>([
          ['display', 'table'],
        ]),
        validator: new Elements.CSSRuleValidator.FlexItemValidator(),
        expectedResult: false,
      },
      {
        description: '',
        computedStyles: new Map<string, string>([
          ['flex', '1'],
        ]),
        parentsComputedStyles: new Map<string, string>([
          ['display', 'flex'],
        ]),
        validator: new Elements.CSSRuleValidator.FlexItemValidator(),
        expectedResult: true,
      },
    ];
  });

  it('', () => {
    for (const test of tests) {
      const actualResult = test.validator.isRuleValid(test.computedStyles, test.parentsComputedStyles);
      if (actualResult !== test.expectedResult) {
        assert.fail(test.description + ' FAILED!');
      }
    }
  });
});
