// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

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
