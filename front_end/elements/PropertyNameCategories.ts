// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../sdk/sdk.js';

export enum Category {
  Layout = 'Layout',
  Text = 'Text',
  Appearance = 'Appearance',
  Animation = 'Animation',
  Grid = 'Grid',
  Flex = 'Flex',
  Table = 'Table',
  CSSVariables = 'CSS Variables',
  GeneratedContent = 'Generated Content',
  Other = 'Other',
}


export const DefaultCategoryOrder = [
  Category.Layout,
  Category.Text,
  Category.Appearance,
  Category.Animation,
  Category.CSSVariables,
  Category.Grid,
  Category.Flex,
  Category.Table,
  Category.GeneratedContent,
  Category.Other,
];

const CategorizedProperties = new Map([
  [
    Category.Layout,
    [
      'display',       'margin',      'padding',     'height',    'width',           'position',
      'top',           'right',       'bottom',      'left',      'z-index',         'float',
      'clear',         'overflow',    'resize',      'clip',      'visibility',      'box-sizing',
      'align-content', 'align-items', 'align-self',  'flex',      'flex-basis',      'flex-direction',
      'flex-flow',     'flex-grow',   'flex-shrink', 'flex-wrap', 'justify-content', 'order',
    ],
  ],
  [
    Category.Text,
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
    ],
  ],
  [
    Category.Appearance,
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
    ],
  ],
  [
    Category.Animation,
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
    ],
  ],
  [
    Category.Grid,
    [
      'grid',
      'grid-column',
      'grid-row',
      'order',
      'place-items',
      'place-content',
      'place-self',
    ],
  ],
  [
    Category.Flex,
    [
      'flex',
      'order',
      'place-items',
      'place-content',
      'place-self',
    ],
  ],
  [
    Category.Table,
    [
      'border-collapse',
      'border-spacing',
      'caption-side',
      'empty-cells',
      'table-layout',
    ],
  ],
  [
    Category.GeneratedContent,
    [
      'content',
      'quotes',
      'counter-reset',
      'counter-increment',
    ],
  ],
]);

const CategoriesByPropertyName: Map<String, Category[]> = new Map();

for (const [category, styleNames] of CategorizedProperties.entries()) {
  for (const styleName of styleNames) {
    if (!CategoriesByPropertyName.has(styleName)) {
      CategoriesByPropertyName.set(styleName, []);
    }
    const categories = CategoriesByPropertyName.get(styleName)!;
    categories.push(category);
  }
}

const matchCategoriesByPropertyName = (propertyName: string): Category[] => {
  const categories = CategoriesByPropertyName.get(propertyName);
  if (categories) {
    return categories;
  }

  // dynamic rules can be appended here
  if (propertyName.startsWith('--')) {
    return [Category.CSSVariables];
  }

  return [];
};

/**
 * Categorize a given property name to one or more categories.
 *
 * @remarks
 * It matches against the static CategoriesByPropertyName first. It then
 * matches against several dynamic rules. It then tries to use the canonical
 * name's shorthands for matching. If nothing matches, it returns the "Other"
 * category.
 */
export const categorizePropertyName = (propertyName: string): Category[] => {
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

  return [Category.Other];
};
