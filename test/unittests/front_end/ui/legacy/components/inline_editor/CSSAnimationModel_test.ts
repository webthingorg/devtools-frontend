// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as InlineEditor from '../../../../../../../front_end/ui/legacy/components/inline_editor/inline_editor.js';

const {assert} = chai;

describe('CSSAnimationModel', () => {
  it('should parse a case with only time and animation name', () => {
    const cssAnimationModel = InlineEditor.CSSAnimationModel.CSSAnimationModel.parse('3s slide-in', ['slide-in']);

    assert.deepEqual(cssAnimationModel.parts, [
      {
        name: InlineEditor.CSSAnimationModel.PartType.Text,
        value: '3s',
      },
      {
        name: InlineEditor.CSSAnimationModel.PartType.AnimationName,
        value: 'slide-in',
      },
    ]);
  });

  it('should parse a case with non-animation-name keywords as corresponding longhand parts', () => {
    const cssAnimationModel = InlineEditor.CSSAnimationModel.CSSAnimationModel.parse('3s linear none', []);

    assert.deepEqual(cssAnimationModel.parts, [
      {
        name: InlineEditor.CSSAnimationModel.PartType.Text,
        value: '3s',
      },
      {
        name: InlineEditor.CSSAnimationModel.PartType.EasingFunction,
        value: 'linear',
      },
      {
        name: InlineEditor.CSSAnimationModel.PartType.Text,
        value: 'none',
      },
    ]);
  });

  it('should parse a case with variable and animation name', () => {
    const cssAnimationModel =
        InlineEditor.CSSAnimationModel.CSSAnimationModel.parse('3s var(--this-is-var) slide-in', ['slide-in']);

    assert.deepEqual(cssAnimationModel.parts, [
      {
        name: InlineEditor.CSSAnimationModel.PartType.Text,
        value: '3s',
      },
      {
        name: InlineEditor.CSSAnimationModel.PartType.Variable,
        value: 'var(--this-is-var)',
      },
      {
        name: InlineEditor.CSSAnimationModel.PartType.AnimationName,
        value: 'slide-in',
      },
    ]);
  });

  it('should parse a case with non-animation-name keywords as corresponding longhand parts', () => {
    const cssAnimationModel = InlineEditor.CSSAnimationModel.CSSAnimationModel.parse('3s none linear', []);

    assert.deepEqual(cssAnimationModel.parts, [
      {
        name: InlineEditor.CSSAnimationModel.PartType.Text,
        value: '3s',
      },
      {
        name: InlineEditor.CSSAnimationModel.PartType.Text,
        value: 'none',
      },
      {
        name: InlineEditor.CSSAnimationModel.PartType.EasingFunction,
        value: 'linear',
      },
    ]);
  });

  it('should parse a case with multiple single animations', () => {
    const cssAnimationModel =
        InlineEditor.CSSAnimationModel.CSSAnimationModel.parse('3s slide-in, 1s slide-out', ['slide-in', 'slide-out']);

    assert.deepEqual(cssAnimationModel.parts, [
      {
        name: InlineEditor.CSSAnimationModel.PartType.Text,
        value: '3s',
      },
      {
        name: InlineEditor.CSSAnimationModel.PartType.AnimationName,
        value: 'slide-in',
      },
      {
        name: InlineEditor.CSSAnimationModel.PartType.Text,
        value: ',',
      },
      {
        name: InlineEditor.CSSAnimationModel.PartType.Text,
        value: '1s',
      },
      {
        name: InlineEditor.CSSAnimationModel.PartType.AnimationName,
        value: 'slide-out',
      },
    ]);
  });

  it('should parse a case with multiple single animations and keyword in the second animation', () => {
    const cssAnimationModel =
        InlineEditor.CSSAnimationModel.CSSAnimationModel.parse('3s linear linear, 1s linear', ['linear']);

    assert.deepEqual(cssAnimationModel.parts, [
      {
        name: InlineEditor.CSSAnimationModel.PartType.Text,
        value: '3s',
      },
      {
        name: InlineEditor.CSSAnimationModel.PartType.EasingFunction,
        value: 'linear',
      },
      {
        name: InlineEditor.CSSAnimationModel.PartType.AnimationName,
        value: 'linear',
      },
      {
        name: InlineEditor.CSSAnimationModel.PartType.Text,
        value: ',',
      },
      {
        name: InlineEditor.CSSAnimationModel.PartType.Text,
        value: '1s',
      },
      {
        name: InlineEditor.CSSAnimationModel.PartType.EasingFunction,
        value: 'linear',
      },
    ]);
  });

  it('should parse a case with animation name as a keyword', () => {
    const cssAnimationModel = InlineEditor.CSSAnimationModel.CSSAnimationModel.parse('3s linear linear', ['linear']);

    assert.deepEqual(cssAnimationModel.parts, [
      {
        name: InlineEditor.CSSAnimationModel.PartType.Text,
        value: '3s',
      },
      {
        name: InlineEditor.CSSAnimationModel.PartType.EasingFunction,
        value: 'linear',
      },
      {
        name: InlineEditor.CSSAnimationModel.PartType.AnimationName,
        value: 'linear',
      },
    ]);
  });

  it('should parse a case without animation name (only keywords)', () => {
    const cssAnimationModel = InlineEditor.CSSAnimationModel.CSSAnimationModel.parse('3s linear alternate', []);

    assert.deepEqual(cssAnimationModel.parts, [
      {
        name: InlineEditor.CSSAnimationModel.PartType.Text,
        value: '3s',
      },
      {
        name: InlineEditor.CSSAnimationModel.PartType.EasingFunction,
        value: 'linear',
      },
      {
        name: InlineEditor.CSSAnimationModel.PartType.Text,
        value: 'alternate',
      },
    ]);
  });

  describe('easing function parsing', () => {
    it('should parse a case with easing function keyword', () => {
      const cssAnimationModel = InlineEditor.CSSAnimationModel.CSSAnimationModel.parse('3s linear', []);

      assert.deepEqual(cssAnimationModel.parts, [
        {
          name: InlineEditor.CSSAnimationModel.PartType.Text,
          value: '3s',
        },
        {
          name: InlineEditor.CSSAnimationModel.PartType.EasingFunction,
          value: 'linear',
        },
      ]);
    });

    it('should parse a case with easing function cubic-bezier', () => {
      const cssAnimationModel =
          InlineEditor.CSSAnimationModel.CSSAnimationModel.parse('3s cubic-bezier(0.25, 0.1, 0.25, 1)', []);

      assert.deepEqual(cssAnimationModel.parts, [
        {
          name: InlineEditor.CSSAnimationModel.PartType.Text,
          value: '3s',
        },
        {
          name: InlineEditor.CSSAnimationModel.PartType.EasingFunction,
          value: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        },
      ]);
    });
  });
});
