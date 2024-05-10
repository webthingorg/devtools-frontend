// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../../core/sdk/sdk.js';

import * as Elements from './elements.js';

const resolveCSSExpressionWithVar = Elements.CSSExpressionHelper.resolveCSSExpressionWithVar;
const createMockDeclaration = (style: SDK.CSSStyleDeclaration.CSSStyleDeclaration): SDK.CSSProperty.CSSProperty => {
  const mockCssProperty = sinon.createStubInstance(SDK.CSSProperty.CSSProperty);
  mockCssProperty.ownerStyle = style;
  return mockCssProperty;
};

type NameValueMap = {
  [key in string]?: SDK.CSSMatchedStyles.CSSVariableValue;
};

describe('CSSExpressionHelper', () => {
  describe('resolveCSSExpressionWithVar', () => {
    let mockMatchedStyles: sinon.SinonStubbedInstance<SDK.CSSMatchedStyles.CSSMatchedStyles>;
    let mockCssStyleDeclaration: sinon.SinonStubbedInstance<SDK.CSSStyleDeclaration.CSSStyleDeclaration>;
    let mockInheritedCssStyleDeclaration: sinon.SinonStubbedInstance<SDK.CSSStyleDeclaration.CSSStyleDeclaration>;

    const resolveWithMocks = (text: string) => {
      return resolveCSSExpressionWithVar(mockMatchedStyles, mockCssStyleDeclaration, text);
    };

    beforeEach(() => {
      mockMatchedStyles = sinon.createStubInstance(SDK.CSSMatchedStyles.CSSMatchedStyles);
      mockCssStyleDeclaration = sinon.createStubInstance(SDK.CSSStyleDeclaration.CSSStyleDeclaration);
      mockInheritedCssStyleDeclaration = sinon.createStubInstance(SDK.CSSStyleDeclaration.CSSStyleDeclaration);

      const STYLE_VARIABLE_VALUE_MAP: Map<SDK.CSSStyleDeclaration.CSSStyleDeclaration, NameValueMap> = new Map([
        [
          mockCssStyleDeclaration,
          {
            '--a': {value: 'a', declaration: createMockDeclaration(mockCssStyleDeclaration)},
            '--b': {value: 'var(--a)', declaration: createMockDeclaration(mockCssStyleDeclaration)},
            '--itself': {value: 'var(--itself)', declaration: createMockDeclaration(mockCssStyleDeclaration)},
            '--itself-complex':
                {value: '10px var(--itself-complex)', declaration: createMockDeclaration(mockCssStyleDeclaration)},
            '--cycle-1': {value: 'var(--cycle-2)', declaration: createMockDeclaration(mockCssStyleDeclaration)},
            '--cycle-2': {value: 'var(--cycle-1)', declaration: createMockDeclaration(mockCssStyleDeclaration)},
            '--out-of-cycle':
                {value: 'var(--cycle-2, 40px)', declaration: createMockDeclaration(mockCssStyleDeclaration)},
            '--non-inherited':
                {value: 'var(--inherited)', declaration: createMockDeclaration(mockInheritedCssStyleDeclaration)},
            '--also-inherited-overloaded':
                {value: 'this is overloaded', declaration: createMockDeclaration(mockCssStyleDeclaration)},
          },
        ],
        [
          mockInheritedCssStyleDeclaration,
          {
            '--inherited': {
              value: 'var(--also-inherited-overloaded)',
              declaration: createMockDeclaration(mockInheritedCssStyleDeclaration),
            },
            '--also-inherited-overloaded': {
              value: 'inherited and overloaded',
              declaration: createMockDeclaration(mockInheritedCssStyleDeclaration),
            },
          },
        ],
      ]);
      mockMatchedStyles.getVariableValue.callsFake((style: SDK.CSSStyleDeclaration.CSSStyleDeclaration, name) => {
        return STYLE_VARIABLE_VALUE_MAP.get(style)?.[name] ?? null;
      });
    });

    describe('cyclic references', () => {
      it('should return `null` when the variable references itself', () => {
        assert.isNull(resolveWithMocks('var(--itself)'));
        assert.isNull(resolveWithMocks('var(--itself-complex)'));
        // Still `null` even though there is a fallback.
        assert.isNull(resolveWithMocks('var(--itself, 20px)'));
      });

      it('should return `null` when there is a simple cycle (a->b->a)', () => {
        assert.isNull(resolveWithMocks('var(--cycle-1)'));
      });

      // TODO(ergunsh): These are valid `var()` reference cases that we currently
      // don't handle correctly.
      it.skip('[crbug.com/329626445]: should return fallback value if the cyclic expression has a fallback', () => {
        assert.strictEqual(resolveWithMocks('var(--cycle-1, 20px)'), '20px');
      });

      // TODO(ergunsh): These are valid `var()` reference cases that we currently
      // don't handle correctly.
      it.skip(
          '[crbug.com/329626445]: should return fallback value of the `var()` call if the referenced variable is out of the cycle',
          () => {
            assert.strictEqual(resolveWithMocks('var(--out-of-cycle)'), '40px');
          });
    });

    it('should resolve a `var()` reference with nothing else', () => {
      assert.strictEqual(resolveCSSExpressionWithVar(mockMatchedStyles, mockCssStyleDeclaration, 'var(--a)'), 'a');
    });

    it('should resolve a `var()` reference until no `var()` references left', () => {
      assert.strictEqual(resolveCSSExpressionWithVar(mockMatchedStyles, mockCssStyleDeclaration, 'var(--b)'), 'a');
    });

    it('should resolve multiple `var()` references in a CSS expression', () => {
      assert.strictEqual(
          resolveCSSExpressionWithVar(mockMatchedStyles, mockCssStyleDeclaration, 'var(--a) var(--b)'), 'a a');
    });

    it('should resolve to fallback if the variable does not exist', () => {
      assert.strictEqual(
          resolveCSSExpressionWithVar(mockMatchedStyles, mockCssStyleDeclaration, 'var(--non-existent, 20px)'), '20px');
    });

    it('should resolve the `var()` references inside a fallback too', () => {
      assert.strictEqual(
          resolveCSSExpressionWithVar(mockMatchedStyles, mockCssStyleDeclaration, 'var(--non-existent, var(--a))'),
          'a');
    });

    it('should return null if the expression contains an unresolved variable', () => {
      assert.isNull(resolveCSSExpressionWithVar(
          mockMatchedStyles, mockCssStyleDeclaration, 'var(--non-existent, 10px var(--non-existent))'));
    });

    it('should return null for cyclic references', () => {
      assert.isNull(resolveCSSExpressionWithVar(mockMatchedStyles, mockCssStyleDeclaration, 'var(--cycle-1)'));
    });

    describe('inheritance case', () => {
      it('should correctly resolve the `var()` reference for complex inheritance case', () => {
        assert.strictEqual(
            resolveCSSExpressionWithVar(mockMatchedStyles, mockCssStyleDeclaration, 'var(--non-inherited)'),
            'inherited and overloaded');
      });
    });
  });
});
