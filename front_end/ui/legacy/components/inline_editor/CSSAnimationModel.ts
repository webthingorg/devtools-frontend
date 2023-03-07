// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as CodeMirror from '../../../../third_party/codemirror.next/codemirror.next.js';
import * as UI from '../../../../ui/legacy/legacy.js';

const cssParser = CodeMirror.css.cssLanguage.parser;

const enum LonghandPart {
  Direction = 'D',
  FillMode = 'F',
  PlayState = 'P',
  IterationCount = 'I',
  EasingFunction = 'E',
}

const longhandIdentifierMap: Record<LonghandPart, Set<string>> = {
  [LonghandPart.Direction]: new Set([
    'normal',
    'alternate',
    'reverse',
    'alternate-reverse',
  ]),
  [LonghandPart.FillMode]: new Set([
    'none',
    'forwards',
    'backwards',
    'both',
  ]),
  [LonghandPart.PlayState]: new Set([
    'running',
    'paused',
  ]),
  [LonghandPart.IterationCount]: new Set(['infinite']),
  [LonghandPart.EasingFunction]: new Set(['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out']),
};

function tokenize(text: string): string[] {
  const textToParse = `*{animation:${text};}`;
  const parsed = cssParser.parse(textToParse);
  // Take the cursor from declaration
  const cursor = parsed.cursorAt(textToParse.indexOf(':') + 1);
  cursor.firstChild();
  cursor.nextSibling();

  const tokens: string[] = [];
  while (cursor.nextSibling()) {
    tokens.push(textToParse.substring(cursor.from, cursor.to));
  }
  return tokens;
}

/**
 * For animation shorthand, we can show two swatches:
 * - Easing function swatch (or also called bezier swatch)
 * - Animation name swatch
 * all the other tokens in the shorthands are rendered as text.
 *
 * This helper model takes an animation shorthand value (`1s linear slide-in`)
 * and finds out which parts to render as "what" by taking its syntax and parsing logic
 * into consideration. Details can be found here: https://w3c.github.io/csswg-drafts/css-animations/#animation.
 *
 * The rule says that whenever there is a keyword that is valid for a property other than
 * `animation-name` whose values are not found earlier in the shorthand must be accepted
 * for those properties rather than for `animation-name`.
 *
 * Beware that, an animation shorthand can contain multiple animation definitions that are
 * separated by a comma (The syntax is animation = <single-animation>#). The above rule only
 * applies to parsing of <single-animation>.
 */
export class CSSAnimationModel {
  parts: Part[];
  constructor(parts: Part[]) {
    this.parts = parts;
  }

  // Parses a given `animation` shorthand text and marks all the tokens as
  // Text, EasingFunction or AnimationName.
  // Functions defined inside can contain side effects that act on the
  // scope of the `parse` function.
  static parse(text: string, animationNames: string[]): CSSAnimationModel {
    const tokens = tokenize(text);
    const parts: Part[] = [];

    // We're holding a map of possible longhand parts with identifiers
    // than can be found inside the shorthand value and whether they are
    // found in the currently parsed single animation.
    const foundLonghands: Record<LonghandPart, boolean> = {
      [LonghandPart.EasingFunction]: false,
      [LonghandPart.IterationCount]: false,
      [LonghandPart.Direction]: false,
      [LonghandPart.FillMode]: false,
      [LonghandPart.PlayState]: false,
    };

    // `animationNames` can be an array that map to the animation names of
    // different single animations in the order of presence.
    let searchedAnimationNameIndex = 0;

    // Checks whether a token matches an identifier for a longhand property.
    const matchesLonghandIdentifier = (token: string): boolean => {
      for (const [longhandPart, keywords] of Object.entries(longhandIdentifierMap)) {
        if (keywords.has(token) && !foundLonghands[longhandPart as LonghandPart]) {
          foundLonghands[longhandPart as LonghandPart] = true;
          return true;
        }
      }

      return false;
    };

    // Parses a token and puts it into the `parts` array.
    // Logic is, in order:
    // * Checks whether the token can be an easing function.
    // * Checks whether the token can be a longhand property other than `animation-name`.
    // * Checks whether the token can be the animation name by comparing it with the expected animation name.
    // Based on the results of these checks, creates a text, easing function or animation name part.
    const consumeToken = (token: string): void => {
      const searchedAnimationName = animationNames[searchedAnimationNameIndex];
      if (token.match(UI.Geometry.CubicBezier.Regex) && !foundLonghands[LonghandPart.EasingFunction]) {
        parts.push({
          name: PartName.EasingFunction,
          value: token,
        });
        foundLonghands[LonghandPart.EasingFunction] = true;
        return;
      }

      const matchedLonghandPart = matchesLonghandIdentifier(token);
      if (matchedLonghandPart || token !== searchedAnimationName) {
        parts.push({
          name: PartName.Text,
          value: token,
        });
        return;
      }

      if (token === searchedAnimationName) {
        parts.push({
          name: PartName.AnimationName,
          value: token,
        });
      }
    };

    for (const token of tokens) {
      consumeToken(token);

      if (token === ',') {
        // `token` being equal to `,` means that parsing of a `<single-animation>`
        // is complete and we start parsing of the next `<single-animation>`.
        // Because of that, we're resetting `foundLonghands` and moving the
        // animation name to match.
        for (const longhandPart of Object.keys(foundLonghands)) {
          foundLonghands[longhandPart as LonghandPart] = false;
        }

        searchedAnimationNameIndex++;
      }
    }

    return new CSSAnimationModel(parts);
  }
}

export const enum PartName {
  // Things that should be rendered as text
  Text = 'T',
  // Things that should be rendered with bezier swatch
  EasingFunction = 'EF',
  // Things that should be rendered with animation name swatch
  AnimationName = 'AN',
}

type Part = {
  name: PartName,
  value: string,
};
