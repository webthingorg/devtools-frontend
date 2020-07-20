// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../sdk/sdk.js';

/** @enum {string} */
export const Categories = {
  Layout: 'Layout',
  Text: 'Text',
  Appearance: 'Appearance',
  Animation: 'Animation',
  Grid: 'Grid',
  Flex: 'Flex',
  Table: 'Table',
  CSSVariables: 'CSS Variables',
  GeneratedContent: 'Generated Content',
  Other: 'Other',
};

export const DefaultOrderedCategories = [
  Categories.Layout,
  Categories.Text,
  Categories.Appearance,
  Categories.Animation,
  Categories.CSSVariables,
  Categories.Grid,
  Categories.Flex,
  Categories.Table,
  Categories.GeneratedContent,
  Categories.Other,
];

const CategorizedProperties = new Map([
  [
    Categories.Layout,
    [
      'display',     'margin',     'padding',     'height',     'width',
      'position',    'top',        'right',       'bottom',     'left',
      'z-index',     'display',    'float',       'clear',      'overflow',
      'resize',      'clip',       'visibility',  'box-sizing', 'align-content',
      'align-items', 'align-self', 'flex',        'flex-basis', 'flex-direction',
      'flex-flow',   'flex-grow',  'flex-shrink', 'flex-wrap',  'justify-content',
      'order',
    ]
  ],
  [
    Categories.Text,
    [
      'font',
      'font-family',
      'font-size',
      'font-size-adjust',
      'font-stretch',
      'font-style',
      'font-variant',
      'font-weight',
      'direction',
      'tab-size',
      'text-align',
      'text-align-last',
      'text-decoration',
      'text-decoration-color',
      'text-decoration-line',
      'text-decoration-style',
      'text-indent',
      'text-justify',
      'text-overflow',
      'text-shadow',
      'text-transform',
      'line-height',
      'vertical-align',
      'letter-spacing',
      'word-spacing',
      'white-space',
      'word-break',
      'word-wrap',
    ]
  ],
  [
    Categories.Appearance,
    [
      'color',
      'outline',
      'outline-color',
      'outline-offset',
      'outline-style',
      'Outline-width',
      'border',
      'border-image',
      'background',
      'cursor',
      'box-shadow',
      '≈',
    ]
  ],
  [
    Categories.Animation,
    [
      'animation',
      'animation-delay',
      'animation-direction',
      'animation-duration',
      'animation-fill-mode',
      'animation-iteration-count',
      'animation-name',
      'animation-play-state',
      'animation-timing-function',
      'transition',
      'transition-delay',
      'transition-duration',
      'transition-property',
      'transition-timing-function',
    ]
  ],
  [
    Categories.Grid,
    [
      'grid',
      'grid-column',
      'grid-row',
      'order',
      'place-items',
      'place-content',
      'place-self',
    ]
  ],
  [
    Categories.Flex,
    [
      'flex',
      'order',
      'place-items',
      'place-content',
      'place-self',
    ]
  ],
  [
    Categories.Table,
    [
      'border-collapse',
      'border-spacing',
      'caption-side',
      'empty-cells',
      'table-layout',
    ]
  ],
  [
    Categories.GeneratedContent,
    [
      'content',
      'quotes',
      'counter-reset',
      'counter-increment',
    ]
  ],
]);

/** @type {!Map<string, Array<Categories>>} */
const CommonCategoriesByPropertyName = new Map();

for (const [category, styleNames] of CategorizedProperties.entries()) {
  for (const styleName of styleNames) {
    if (!CommonCategoriesByPropertyName.has(styleName)) {
      CommonCategoriesByPropertyName.set(styleName, []);
    }
    const categories = /** @type Array<Categories> */ (CommonCategoriesByPropertyName.get(styleName));
    categories.push(category);
  }
}

/**
 * @param {string} propertyName
 * @return {!Array<Categories>}
 */
const matchCategoriesByPropertyName = propertyName => {
  if (CommonCategoriesByPropertyName.has(propertyName)) {
    return /** @type {!Array<Categories>} */ (CommonCategoriesByPropertyName.get(propertyName));
  }

  if (propertyName.startsWith('--')) {
    return [Categories.CSSVariables];
  }

  return [];
};

/**
 * Categorize a given property name to one or more categories.
 *
 * @remarks
 * It matches against the static CommonCategoriesByPropertyName first. It then
 * matches against several dynamic rules. It then tries to use the canonical
 * name's shorthands for matching. If nothing matches, it returns the "Other"
 * category.
 *
 * @param {string} propertyName
 * @return {!Array<Categories>}
 */
export const categorizePropertyName = propertyName => {
  const cssMetadata = SDK.CSSMetadata.cssMetadata();
  const canonicalName = cssMetadata.canonicalPropertyName(propertyName);
  const categories = matchCategoriesByPropertyName(canonicalName);
  if (categories.length > 0) {
    return categories;
  }

  const shorthands = cssMetadata.shorthands(canonicalName);
  if (shorthands) {
    for (const shorthand of shorthands) {
      const shorthandCategories = matchCategoriesByPropertyName(shorthand);
      if (shorthandCategories.length > 0) {
        return shorthandCategories;
      }
    }
  }

  return [Categories.Other];
};
