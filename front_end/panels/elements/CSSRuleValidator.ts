// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/*
 * Copyright (C) 2007 Apple Inc.  All rights reserved.
 * Copyright (C) 2009 Joseph Pecoraro
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Computer, Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import * as i18n from '../../core/i18n/i18n.js';

const UIStrings = {
  /**
    *@description Hint for Align-content rule where element also has flex-wrap nowrap rule.
    */
  alignContentRuleOnNoWrapFlex: 'This element has flex-wrap: nowrap rule, therefore \'align-content\' has no effect.',
};
const str_ = i18n.i18n.registerUIStrings('panels/elements/CSSRuleValidator.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export abstract class CSSRuleValidator {
  readonly #affectedProperties: string[];

  constructor(affectedProperties: string[]) {
    this.#affectedProperties = affectedProperties;
  }

  abstract isRuleValid(computedStyles: Map<String, String>, parentsComputedStyles?: Map<String, String>|null|undefined):
      boolean;

  getAffectedProperties(): string[] {
    return this.#affectedProperties;
  }

  abstract getHintMessage(propertyName: string): string;
}

export class AlignContentValidator extends CSSRuleValidator {
  constructor() {
    super(['align-content']);
  }

  isRuleValid(computedStyles: Map<String, String>): boolean {
    const display = computedStyles.get('display');
    if (display !== 'flex' && display !== 'inline-flex') {
      return true;
    }
    return computedStyles.get('flex-wrap') !== 'nowrap';
  }

  getHintMessage(): string {
    return i18nString(UIStrings.alignContentRuleOnNoWrapFlex);
  }
}

export const cssRuleValidators: CSSRuleValidator[] = [new AlignContentValidator()];
export const cssRuleValidatorsMap: Map<String, CSSRuleValidator[]> = new Map<String, CSSRuleValidator[]>();
{
  for (let i = 0; i < cssRuleValidators.length; i++) {
    const validator = cssRuleValidators[i];
    const affectedProperties = validator.getAffectedProperties();

    for (let j = 0; j < affectedProperties.length; j++) {
      const affectedProperty = affectedProperties[j];

      let propertyValidators = cssRuleValidatorsMap.get(affectedProperty);
      if (propertyValidators === undefined) {
        propertyValidators = [];
      }
      propertyValidators.push(validator);

      cssRuleValidatorsMap.set(affectedProperty, propertyValidators);
    }
  }
}
