// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../core/i18n/i18n.js';

const UIStrings = {
  /**
    *@description Hint prefix for deprecated properties.
    */
  deprecatedPropertyHintPrefix: 'Deprecated Property',
  /**
    *@description Hint prefix for rule validation.
    */
  ruleValidationHintPrefix: 'Inactive rule',
  /**
    *@description Hint for Align-content rule where element also has flex-wrap nowrap rule.
    *@example {<code class="unbreakable-text">} RULE_OPENING
    *@example {</code>} RULE_CLOSING
    *@example {<span class="property">} PROPERTY_NAME_OPENING
    *@example {</span>} PROPERTY_NAME_CLOSING
    */
  alignContentRuleOnNoWrapFlexReason: 'This element has {RULE_OPENING}{PROPERTY_NAME_OPENING}flex-wrap{PROPERTY_NAME_CLOSING}: nowrap{RULE_CLOSING} rule, therefore {RULE_OPENING}{PROPERTY_NAME_OPENING}align-content{PROPERTY_NAME_CLOSING}{RULE_CLOSING} has no effect.',
  /**
    *@description Possible fix for Align-content rule where element also has flex-wrap nowrap rule.
    *@example {<code class="unbreakable-text">} RULE_OPENING
    *@example {</code>} RULE_CLOSING
    *@example {<span class="property">} PROPERTY_NAME_OPENING
    *@example {</span>} PROPERTY_NAME_CLOSING
    */
  alignContentRuleOnNoWrapFlexPossibleFix: 'For this property to work, please remove or change the value of {RULE_OPENING}{PROPERTY_NAME_OPENING}flex-wrap{PROPERTY_NAME_CLOSING}{RULE_CLOSING} rule.',
  /**
    *@description Hint for element that does not have effect if parent container is not flex.
    *@example {flex} PH1
    */
  notFlexItemReason: 'Parent of this element is not flex container, therefore {PH1} property has no effect.',
  /**
    *@description Possible fix for element that does not have effect if parent container is not flex.
    *@example {<code class="unbreakable-text">} RULE_OPENING
    *@example {</code>} RULE_CLOSING
    *@example {<span class="property">} PROPERTY_NAME_OPENING
    *@example {</span>} PROPERTY_NAME_CLOSING
    *@example {<span id="parent-element" class="clickable">} PARENT_ELEMENT_OPENING
    *@example {</span>} PARENT_ELEMENT_CLOSING
    */
  notFlexItemPossibleFix: 'For this property to work, please add {RULE_OPENING}{PROPERTY_NAME_OPENING}display{PROPERTY_NAME_CLOSING}: flex{RULE_CLOSING} to {PARENT_ELEMENT_OPENING}parent element{PARENT_ELEMENT_CLOSING}',
};
const str_ = i18n.i18n.registerUIStrings('panels/elements/CSSRuleValidator.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

const DEFAULT_HINT_ARGUMENTS = {
  'RULE_OPENING': '<code class="unbreakable-text">',
  'RULE_CLOSING': '</code>',
  'PROPERTY_NAME_OPENING': '<span class="property">',
  'PROPERTY_NAME_CLOSING': '</span>',
  'PARENT_ELEMENT_OPENING': '<span id="parent-element" class="clickable">',
  'PARENT_ELEMENT_CLOSING': '</span>',
};

export const enum AuthoringHintType {
  RULE_VALIDATION = 'ruleValidation',
  DEPRECATED_PROPERTY = 'deprecatedProperty',
}

export class AuthoringHint {
  readonly #hintType: AuthoringHintType;
  readonly #hintMessage: string;
  readonly #possibleFixMessage: string|null;
  readonly #learnMore: string|null;

  constructor(property: string, hintType: AuthoringHintType, hintMessage: string, possibleFixMessage: string|null, showLearnMore: boolean) {
    this.#hintType = hintType;
    this.#hintMessage = hintMessage;
    this.#possibleFixMessage = possibleFixMessage;
    this.#learnMore = showLearnMore ? property : null; // TODO: Add Goo.gle short link base url
  }

  getHintPrefix(): string {
    switch (this.#hintType) {
      case AuthoringHintType.RULE_VALIDATION:
        return i18nString(UIStrings.ruleValidationHintPrefix);
      case AuthoringHintType.DEPRECATED_PROPERTY:
        return i18nString(UIStrings.deprecatedPropertyHintPrefix);
    }
  }

  getHintMessage(): string {
    return this.#hintMessage;
  }

  getPossibleFixMessage(): string|null {
    return this.#possibleFixMessage;
  }

  getLearnMoreLink(): string|null {
    return this.#learnMore;
  }
}

export abstract class CSSRuleValidator {
  readonly #affectedProperties: string[];

  constructor(affectedProperties: string[]) {
    this.#affectedProperties = affectedProperties;
  }

  abstract isRuleValid(computedStyles: Map<String, String>|null, parentsComputedStyles?: Map<String, String>|null):
      boolean;

  getAffectedProperties(): string[] {
    return this.#affectedProperties;
  }

  abstract getAuthoringHint(propertyName: string): AuthoringHint;
}

export class AlignContentValidator extends CSSRuleValidator {
  constructor() {
    super(['align-content']);
  }

  isRuleValid(computedStyles: Map<String, String>|null): boolean {
    if (computedStyles === null || computedStyles === undefined) {
      return true;
    }
    const display = computedStyles.get('display');
    if (display !== 'flex' && display !== 'inline-flex') {
      return true;
    }
    return computedStyles.get('flex-wrap') !== 'nowrap';
  }

  getAuthoringHint(): AuthoringHint {
    return new AuthoringHint(
      'align-content',
      AuthoringHintType.RULE_VALIDATION,
      i18nString(UIStrings.alignContentRuleOnNoWrapFlexReason, DEFAULT_HINT_ARGUMENTS),
      i18nString(UIStrings.alignContentRuleOnNoWrapFlexPossibleFix, DEFAULT_HINT_ARGUMENTS),
      true,
    );
  }
}

export class FlexItemValidator extends CSSRuleValidator {
  constructor() {
    super(['flex', 'flex-basis', 'flex-grow', 'flex-shrink']);
  }

  isRuleValid(computedStyles: Map<String, String>|null, parentsComputedStyles: Map<String, String>|null): boolean {
    if (computedStyles === null || computedStyles === undefined || parentsComputedStyles === null ||
        parentsComputedStyles === undefined) {
      return true;
    }
    const parentDisplay = parentsComputedStyles.get('display');
    return parentDisplay === 'flex' || parentDisplay === 'inline-flex';
  }

  getAuthoringHint(property: string): AuthoringHint {
    return new AuthoringHint(
      property,
      AuthoringHintType.RULE_VALIDATION,
      i18nString(UIStrings.notFlexItemReason, {'PH1': property, ...DEFAULT_HINT_ARGUMENTS}),
      i18nString(UIStrings.notFlexItemPossibleFix, DEFAULT_HINT_ARGUMENTS),
      true,
    );
  }
}

const setupCSSRulesValidators = (): Map<String, CSSRuleValidator[]> => {
  const validators = [new AlignContentValidator(), new FlexItemValidator()];

  const validatorsMap = new Map<String, CSSRuleValidator[]>();
  for (const validator of validators) {
    const affectedProperties = validator.getAffectedProperties();

    for (const affectedProperty of affectedProperties) {
      let propertyValidators = validatorsMap.get(affectedProperty);
      if (propertyValidators === undefined) {
        propertyValidators = [];
      }
      propertyValidators.push(validator);

      validatorsMap.set(affectedProperty, propertyValidators);
    }
  }
  return validatorsMap;
};

export const cssRuleValidatorsMap: Map<String, CSSRuleValidator[]> = setupCSSRulesValidators();
