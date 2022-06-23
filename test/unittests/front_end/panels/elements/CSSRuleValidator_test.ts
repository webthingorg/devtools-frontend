// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as ElementsModule from '../../../../../front_end/panels/elements/elements.js';
import {describeWithEnvironment} from '../../helpers/EnvironmentHelpers.js';

const {assert} = chai;

describeWithEnvironment('CSSRuleValidator', async () => {
  let Elements: typeof ElementsModule;
  const tests = [
    {
      description: 'AlignContentValidator returns false',
      computedStyles: new Map<string, string>([
        ['display', 'inline-flex'],
        ['flex-wrap', 'nowrap'],
        ['align-content', 'center'],
      ]),
      parentsComputedStyles: null,
      validator: () => new Elements.CSSRuleValidator.AlignContentValidator(),
      expectedResult: false,
    },
    {
      description: 'AlignContentValidator returns true when display is not flex',
      computedStyles: new Map<string, string>([
        ['display', 'block'],
        ['flex-wrap', 'nowrap'],
        ['align-content', 'center'],
      ]),
      parentsComputedStyles: null,
      validator: () => new Elements.CSSRuleValidator.AlignContentValidator(),
      expectedResult: true,
    },
    {
      description: 'FlexItemValidator returns false when parent elements display is not flex',
      computedStyles: new Map<string, string>([
        ['flex', '1'],
      ]),
      parentsComputedStyles: new Map<string, string>([
        ['display', 'table'],
      ]),
      validator: () => new Elements.CSSRuleValidator.FlexItemValidator(),
      expectedResult: false,
    },
    {
      description: 'FlexItemValidator returns true when parent elements display is flex',
      computedStyles: new Map<string, string>([
        ['flex', '1'],
      ]),
      parentsComputedStyles: new Map<string, string>([
        ['display', 'flex'],
      ]),
      validator: () => new Elements.CSSRuleValidator.FlexItemValidator(),
      expectedResult: true,
    },
  ];

  before(async () => {
    Elements = await import('../../../../../front_end/panels/elements/elements.js');
  });

  for (const test of tests) {
    it(test.description, () => {
      const actualResult = test.validator().isRuleValid(test.computedStyles, test.parentsComputedStyles);
      assert.deepEqual(actualResult, test.expectedResult);
    });
  }
});
