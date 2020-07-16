// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import {_getLabelPosition, _getLabelPositionType, LabelPositionTypes} from '../../../../front_end/inspector_overlay/tool_source_order_impl.js';

const positionTypes = Object.values(LabelPositionTypes);
const labelHeight = 22;
const labelWidth = 27;
const defaultBounds = {
  minX: 100,
  minY: 100,
  maxX: 200,
  maxY: 200,
};

describe('_getLabelPosition', () => {
  type positionId = 'to'|'ab'|'be'|'bo';
  const expectedPositions = {
    'to': defaultBounds.minY,
    'ab': defaultBounds.minY - labelHeight,
    'be': defaultBounds.maxY,
    'bo': defaultBounds.maxY - labelHeight,
  };

  for (const positionType of positionTypes) {
    it('can place ' + positionType, () => {
      const position = _getLabelPosition(positionType, defaultBounds, labelHeight);
      const positionId = positionType.slice(0, 2);

      assert.strictEqual(
          position.contentTop, expectedPositions[<positionId>positionId], 'incorrect offset from the top of the page');
      assert.strictEqual(position.contentLeft, defaultBounds.minX, 'incorrect offset from the left of the page');
    });
  }
});

describe('_getLabelPositionType', () => {
  const thinBounds = {minX: 100, minY: 100, maxX: 110, maxY: 200};
  const shortBounds = {minX: 100, minY: 100, maxX: 200, maxY: 110};
  const canvasHeight = 1000;

  const TESTS = [
    {
      description: 'can assign topCorner type when the associated element is large enough',
      bounds: defaultBounds,
      overlap: false,
      expectedType: LabelPositionTypes.topCorner,
    },
    {
      description: 'can assign aboveElementWider type when the label is wider than the associated element',
      bounds: thinBounds,
      overlap: false,
      expectedType: LabelPositionTypes.aboveElementWider,
    },
    {
      description: 'can assign aboveElement type when the label is taller than the associated element',
      bounds: shortBounds,
      overlap: false,
      expectedType: LabelPositionTypes.aboveElement,
    },
    {
      description:
          'can assign belowElementWider type when a label in the above-element postition would extend off the page and the label is wider than the associated element',
      bounds: {minX: 100, minY: 0, maxX: 110, maxY: 200},
      overlap: false,
      expectedType: LabelPositionTypes.belowElementWider,
    },
    {
      description:
          'can assign below-element type when a label in the above-element postition would overlap with another label and the label is wider than the associated element',
      bounds: thinBounds,
      overlap: true,
      expectedType: LabelPositionTypes.belowElementWider,
    },
    {
      description: 'can assign belowElement type when a label in the above-element postition would extend off the page',
      bounds: {minX: 100, minY: 0, maxX: 200, maxY: 10},
      overlap: false,
      expectedType: LabelPositionTypes.belowElement,
    },
    {
      description:
          'can assign below-element type when a label in the above-element postition would overlap with another label',
      bounds: shortBounds,
      overlap: true,
      expectedType: LabelPositionTypes.belowElement,
    },
    {
      description:
          'can assign bottomCornerWider type when a label in the below-element position would extend off the page and the label is wider than the associated element',
      bounds: {minX: 100, minY: canvasHeight - 100, maxX: 110, maxY: canvasHeight},
      overlap: true,
      expectedType: LabelPositionTypes.bottomCornerWider,
    },
    {
      description:
          'can assign bottomCornerTaller type when a label in the below-element position would extend off the page and the label is taller than the associated element',
      bounds: {minX: 100, minY: canvasHeight - 10, maxX: 200, maxY: canvasHeight},
      overlap: true,
      expectedType: LabelPositionTypes.bottomCornerTaller,
    },
    {
      description:
          'can assign bottomCornerWiderTaller type when a label in the below-element position would extend off the page and the label is both wider and taller than the associated element',
      bounds: {minX: 100, minY: canvasHeight - 10, maxX: 110, maxY: canvasHeight},
      overlap: true,
      expectedType: LabelPositionTypes.bottomCornerWiderTaller,
    },
  ];

  for (const {description, bounds, overlap, expectedType} of TESTS) {
    it(description, () => {
      const otherLabelsCollection = <HTMLCollection><unknown>[];
      if (overlap) {
        const overlappingLabel = <Element>{
          getBoundingClientRect: () => {
            return new DOMRect(bounds.minX, bounds.minY - labelHeight, labelWidth, labelHeight);
          },
        };
        otherLabelsCollection[0] = overlappingLabel;
      }

      const positionType = _getLabelPositionType(bounds, labelHeight, labelWidth, otherLabelsCollection);
      assert.strictEqual(positionType, expectedType, 'incorrect position type');
    });
  }
});
