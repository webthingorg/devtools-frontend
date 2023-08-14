// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {
  click,
  hover,
  waitFor,
  waitForAria,
  waitForElementWithTextContent,
  waitForFunction,
  waitForMany,
  waitForNone,
} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {
  ELEMENTS_PANEL_SELECTOR,
  getStyleRule,
  goToResourceAndWaitForStyleSection,
  SECTION_SUBTITLE_SELECTOR,
  STYLE_PROPERTIES_SELECTOR,
} from '../helpers/elements-helpers.js';

async function getStyleRuleProperties(selector: string, count: number) {
  const rule = await getStyleRule(selector);
  const propertyElements = await waitForMany(STYLE_PROPERTIES_SELECTOR, count, rule);
  const properties = await Promise.all(propertyElements.map(e => e.evaluate(e => e.textContent)));
  properties.sort();
  const subtitle = await waitFor(SECTION_SUBTITLE_SELECTOR, rule).then(e => e.evaluate(e => e.textContent));

  return {properties, subtitle};
}

describe('The styles pane', () => {
  it('shows syntax mismatches as invalid properties', async () => {
    await goToResourceAndWaitForStyleSection('elements/at-property.html');
    await waitFor('.invalid-property-value:has(> [aria-label="CSS property name: --my-color"])');
  });

  it('shows a parser error message popover on syntax mismatches', async () => {
    await goToResourceAndWaitForStyleSection('elements/at-property.html');
    await hover('.invalid-property-value:has(> [aria-label="CSS property name: --my-color"]) .exclamation-mark');

    const popover = await waitFor('.variable-value-popup-wrapper');
    const popoverContents = (await popover.evaluate(e => e.textContent))?.trim()?.replaceAll(/\s\s+/g, ', ');

    assert.deepEqual(popoverContents, 'Invalid property value, expected type "<color>", @property');
  });

  it('correctly determines the computed value for non-overriden properties', async () => {
    await goToResourceAndWaitForStyleSection('elements/at-property.html');
    const myColorProp = await waitForAria('CSS property value: var(--my-cssom-color)');
    await waitFor('.link-swatch-link[data-title="orange"]', myColorProp);
  });

  it('shows registered properties', async () => {
    await goToResourceAndWaitForStyleSection('elements/at-property.html');
    assert.deepStrictEqual(await getStyleRuleProperties('--my-color', 3), {
      properties: ['    inherits: false;', '    initial-value: red;', '    syntax: "<color>";'],
      subtitle: '<style>',
    });
    assert.deepStrictEqual(await getStyleRuleProperties('--my-color2', 3), {
      properties: ['    inherits: false;', '    initial-value: #c0ffee;', '    syntax: "<color>";'],
      subtitle: '<style>',
    });
    assert.deepStrictEqual(await getStyleRuleProperties('--my-cssom-color', 3), {
      properties: ['    inherits: false;', '    initial-value: orange;', '    syntax: "<color>";'],
      subtitle: 'CSS.registerProperty',
    });
  });

  it('shows a foldable Registered Properties section', async () => {
    await goToResourceAndWaitForStyleSection('elements/at-property.html');

    const stylesPane = await waitFor('div.styles-pane');
    {
      const section = await waitForElementWithTextContent('Registered Properties', stylesPane);
      assert.deepStrictEqual(await section.evaluate(e => e.ariaExpanded), 'false');
      const rule = await getStyleRule('--my-color');
      assert.isTrue(await rule.evaluate(e => e.classList.contains('hidden')));
    }

    {
      const section = await click('pierceShadowText/Registered Properties', {root: stylesPane});
      await waitForFunction(async () => 'true' === await section.evaluate(e => e.ariaExpanded));
      const rule = await getStyleRule('--my-color');
      await waitForFunction(() => rule.evaluate(e => !e.classList.contains('hidden')));
    }
  });

  it('shows registration information in a variable popover', async () => {
    async function hoverVariable(label: string) {
      const isValue = label.startsWith('var(');
      if (isValue) {
        const prop = await waitForAria(`CSS property value: ${label}`);
        await hover('.link-swatch-link', {root: prop});
      } else {
        await hover(`aria/CSS property name: ${label}`);
      }

      const popover = await waitFor('.variable-value-popup-wrapper');
      const popoverContents = (await popover.evaluate(e => e.textContent))?.trim()?.replaceAll(/\s\s+/g, ', ');

      await hover(ELEMENTS_PANEL_SELECTOR);
      await waitForNone('.variable-value-popup-wrapper');

      return popoverContents;
    }
    await goToResourceAndWaitForStyleSection('elements/at-property.html');

    assert.strictEqual(
        await hoverVariable('var(--my-cssom-color)'),
        'orange, Registered property, syntax: "<color>", inherits: false, initial-value: orange, CSS.registerProperty');

    assert.strictEqual(
        await hoverVariable('--my-color'),
        'red, Registered property, syntax: "<color>", inherits: false, initial-value: red, @property');
    assert.strictEqual(
        await hoverVariable('var(--my-color)'),
        'red, Registered property, syntax: "<color>", inherits: false, initial-value: red, @property');

    assert.strictEqual(
        await hoverVariable('--my-color2'),
        'gray, Registered property, syntax: "<color>", inherits: false, initial-value: #c0ffee, @property');
    assert.strictEqual(
        await hoverVariable('var(--my-color2)'),
        'gray, Registered property, syntax: "<color>", inherits: false, initial-value: #c0ffee, @property');

    assert.strictEqual(await hoverVariable('--my-other-color'), 'green');
    assert.strictEqual(await hoverVariable('var(--my-other-color)'), 'green');
  });
});
