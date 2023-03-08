// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../../../../core/sdk/sdk.js';
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

interface ParsingContext {
  parts: Part[];
  // We're holding a map of possible longhand parts with identifiers
  // than can be found inside the shorthand value and whether they are
  // found in the currently parsed single animation.
  foundLonghands: Record<LonghandPart, boolean>;
  searchedAnimationName: string;
}

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

// Checks whether a token matches an identifier for a longhand property.
function matchesLonghandIdentifier(token: string, parsingContext: ParsingContext): boolean {
  for (const [longhandPart, keywords] of Object.entries(longhandIdentifierMap)) {
    if (keywords.has(token) && !parsingContext.foundLonghands[longhandPart as LonghandPart]) {
      parsingContext.foundLonghands[longhandPart as LonghandPart] = true;
      return true;
    }
  }

  return false;
}

// Parses a token and puts it into the `parts` array of parsingContext
// Logic is, in order:
// * Checks whether the token can be an easing function.
// * Checks whether the token can be a longhand property other than `animation-name`.
// * Checks whether the token can be the animation name by comparing it with the expected animation name.
// Based on the results of these checks, creates a text, easing function or animation name part.
function consumeToken(token: string, parsingContext: ParsingContext): void {
  if (token.match(UI.Geometry.CubicBezier.Regex) && !parsingContext.foundLonghands[LonghandPart.EasingFunction]) {
    parsingContext.parts.push({
      type: PartType.EasingFunction,
      value: token,
    });
    parsingContext.foundLonghands[LonghandPart.EasingFunction] = true;
    return;
  }

  // Note: currently we don't handle resolving variables
  // and putting them in their respective longhand parts.
  // So, having a variable might break the logic for deciding on the
  // `animation-name` if the variable matches to a longhand
  // keyword and the `animation-name` is also the same keyword.
  // This case is very unlikely so we don't handle it for the
  // sake of keeping the implementation clearer.
  if (token.match(SDK.CSSMetadata.VariableRegex)) {
    parsingContext.parts.push({
      type: PartType.Variable,
      value: token,
    });
    return;
  }

  const matchedLonghandPart = matchesLonghandIdentifier(token, parsingContext);
  if (matchedLonghandPart || token !== parsingContext.searchedAnimationName) {
    parsingContext.parts.push({
      type: PartType.Text,
      value: token,
    });
    return;
  }

  if (token === parsingContext.searchedAnimationName) {
    parsingContext.parts.push({
      type: PartType.AnimationName,
      value: token,
    });
  }
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
  private constructor(parts: Part[]) {
    this.parts = parts;
  }

  static parse(text: string, animationNames: string[]): CSSAnimationModel {
    const tokens = tokenize(text);
    // `animationNames` can be an array that map to the animation names of
    // different single animations in the order of presence.
    let searchedAnimationNameIndex = 0;
    const parsingContext: ParsingContext = {
      parts: [],
      foundLonghands: {
        [LonghandPart.EasingFunction]: false,
        [LonghandPart.IterationCount]: false,
        [LonghandPart.Direction]: false,
        [LonghandPart.FillMode]: false,
        [LonghandPart.PlayState]: false,
      },
      searchedAnimationName: animationNames[searchedAnimationNameIndex],
    };

    for (const token of tokens) {
      consumeToken(token, parsingContext);

      if (token === ',') {
        // `token` being equal to `,` means that parsing of a `<single-animation>`
        // is complete and we start parsing of the next `<single-animation>`.
        // Because of that, we're resetting `foundLonghands` and moving the
        // animation name to match.
        for (const longhandPart of Object.keys(parsingContext.foundLonghands)) {
          parsingContext.foundLonghands[longhandPart as LonghandPart] = false;
        }

        searchedAnimationNameIndex++;
        parsingContext.searchedAnimationName = animationNames[searchedAnimationNameIndex];
      }
    }

    return new CSSAnimationModel(parsingContext.parts);
  }
}

export const enum PartType {
  // Things that should be rendered as text
  Text = 'T',
  // Things that should be rendered with bezier swatch
  EasingFunction = 'EF',
  // Things that should be rendered with animation name swatch
  AnimationName = 'AN',
  // Things that should be rendered with variable swatch
  Variable = 'V',
}

type Part = {
  type: PartType,
  value: string,
};
