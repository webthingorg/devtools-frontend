// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as ElementsModule from '../../../../../front_end/panels/elements/elements.js';
import {describeWithEnvironment} from '../../helpers/EnvironmentHelpers.js';

const {assert} = chai;

describeWithEnvironment('CSSRuleValidator', async () => {
  let Elements: typeof ElementsModule;

  before(async () => {
    Elements = await import('../../../../../front_end/panels/elements/elements.js');
  });

  it('AlignContentValidator returns false', () => {
    const computedStyles = new Map<string, string>([
      ['display', 'inline-flex'],
      ['flex-wrap', 'nowrap'],
      ['align-content', 'center'],
    ]);

    const alignContentValidator = new Elements.CSSRuleValidator.AlignContentValidator();
    assert.isFalse(alignContentValidator.isRuleValid(computedStyles));
  });

  it('AlignContentValidator returns true when display is not flex', () => {
    const computedStyles = new Map<string, string>([
      ['display', 'block'],
      ['flex-wrap', 'nowrap'],
      ['align-content', 'center'],
    ]);

    const alignContentValidator = new Elements.CSSRuleValidator.AlignContentValidator();
    assert.isTrue(alignContentValidator.isRuleValid(computedStyles));
  });

  it('FlexItemValidator returns false when parent elements display is not flex', () => {
    const parentComputedStyles = new Map<string, string>([
      ['display', 'table'],
    ]);
    const computedStyles = new Map<string, string>([
      ['flex', '1'],
    ]);

    const flexItemValidator = new Elements.CSSRuleValidator.FlexItemValidator();
    assert.isFalse(flexItemValidator.isRuleValid(computedStyles, parentComputedStyles));
  });

  it('FlexItemValidator returns true when parent elements display is flex', () => {
    const parentComputedStyles = new Map<string, string>([
      ['display', 'flex'],
    ]);
    const computedStyles = new Map<string, string>([
      ['flex', '1'],
    ]);

    const flexItemValidator = new Elements.CSSRuleValidator.FlexItemValidator();
    assert.isTrue(flexItemValidator.isRuleValid(computedStyles, parentComputedStyles));
  });
});
