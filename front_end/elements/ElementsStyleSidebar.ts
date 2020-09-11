// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as SDK from '../sdk/sdk.js';

import * as LitHtml from '../third_party/lit-html/lit-html.js';
import {classMap, ifDefined, live} from '../third_party/lit-html/directives.js';

import {EditTargetHandler, CommitType} from './edit-target.js';

const {html} = LitHtml;

interface StyleData {
  indentation: number;
  selectors: ReadonlyArray<StyleSelector>;
  rules: ReadonlyArray<StyleRule>;
}

interface StyleSelector {
  selector: string;
  matches: boolean;
}

interface StyleRule {
  name: string;
  value: string;
  enabled: boolean;
  property?: SDK.CSSProperty.CSSProperty;
  subRules?: ReadonlyArray<StyleRule>;
}

interface RuleLevelType {
  name: string;
  hasCheckbox: boolean;
  focusable: boolean;
  valueInitiallyFocusable: boolean;
}

const TOP_LEVEL_RULE: RuleLevelType = {
  name: 'top-level-rule',
  hasCheckbox: true,
  focusable: true,
  valueInitiallyFocusable: true,
};

const SUB_LEVEL_RULE: RuleLevelType = {
  name: 'sub-level-rule',
  hasCheckbox: false,
  focusable: false,
  valueInitiallyFocusable: false,
};

const PENDING_LEVEL_RULE: RuleLevelType = {
  name: 'pending-level-rule',
  hasCheckbox: false,
  focusable: true,
  valueInitiallyFocusable: false,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function assertNever(value: never) {
}

class SelectorChangeEvent extends Event {
  private constructor(public newSelector: string) {
    super('style-selector-change');
  }
  static create(newSelector: string) {
    return new SelectorChangeEvent(newSelector);
  }
}

class NameChangeEvent extends Event {
  private constructor(public property: SDK.CSSProperty.CSSProperty, public newName: string) {
    super('style-name-change');
  }
  static create(property: SDK.CSSProperty.CSSProperty) {
    return (newName: string) => new NameChangeEvent(property, newName);
  }
}

class ValueChangeEvent extends Event {
  private constructor(public property: SDK.CSSProperty.CSSProperty, public newValue: string) {
    super('style-value-change');
  }
  static create(property: SDK.CSSProperty.CSSProperty) {
    return (newValue: string) => new ValueChangeEvent(property, newValue);
  }
}

class RuleEffectChange extends Event {
  private constructor(public property: SDK.CSSProperty.CSSProperty, public newEffectStatus: boolean) {
    super('style-rule-effect-change');
  }
  static create(property: SDK.CSSProperty.CSSProperty) {
    return (newEffectStatus: boolean) => new RuleEffectChange(property, newEffectStatus);
  }
}

const enum PasteLocation {
  Name = 'name',
  Value = 'value',
}

class PasteEvent extends Event {
  constructor(public pastedText: string, public pasteLocation: PasteLocation) {
    super('style-rule-paste');
  }
}

class ElementsStyleSidebar extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  // Determine whether the shorthand property is expanded and
  // the relevant shorthand properties are shown.
  private readonly isExpanded = new WeakSet<StyleRule>();
  // Necessary to prevent double-clicking of adding pending rules.
  // For more info, see `startEditingNewlyRenderedPendingRule()`.
  private preventDoubleClickPendingRule = false;
  // Used to determine whether the user is dragging rather than
  // clicking on the style component. If they are dragging, we
  // should not render the pending rule.
  private shouldAddPendingRuleForClick = false;
  private editTargetHandler = new EditTargetHandler(this.shadow);

  private dataInternal!: Readonly<StyleData>;
  set data(data: Readonly<StyleData>) {
    this.dataInternal = data;
    this.render();
  }

  get data(): Readonly<StyleData> {
    return this.dataInternal;
  }

  private render() {
    const {selectors, indentation, rules} = this.dataInternal;

    const styleRuleElements = rules.map(rule => this.createStyleRule(TOP_LEVEL_RULE, indentation, rule));

    // We always render the pending rule, even if there isn't necessarily a rule pending user input.
    // The reason being that we need to trap focus events into the name/value, if you are tabbing
    // from the last value in the current style section OR if you are shift-tabbing from the next
    // style section. As soon as the pending rule gains focus, it shows up and allows the user to
    // edit its values.
    styleRuleElements.push(html`
      <div class="pending-rule" @focusout=${this.finishPendingRule}>
        ${this.createStyleRule(PENDING_LEVEL_RULE, indentation, {
      name: '',
      value: '',
      enabled: true,
    })}
      </div>
    `);

    LitHtml.render(
        html`
    <style>
      :host {
        font-size: 11px;
        font-family: Menlo, monospace;

        display: block;

        --checkbox-size: 12px;
        --checkbox-margin-width: 5px;

        --checkbox-total-width: calc(var(--checkbox-size) + 2 * var(--checkbox-margin-width));
      }

      .header {
        display: flex;
        justify-content: space-between;
      }

      .style-selectors {
        color: hsl(0deg 0% 46%);
      }
      /* Highlight the matched selector, as well as the separator after it */
      .style-selector.style-selector-matches,
      .style-selector.style-selector-matches + .style-selector-separator {
        color: initial;
      }

      .source-location {
        user-select: none;
        /* On small width, make sure that the selectors wrap, but the location does not */
        white-space: nowrap;
        padding-left: 10px;
      }

      .style-rule-indentation,
      .style-rule-comment {
        display: inline-block;
        width: 0;
        opacity: 0;
        pointer-events: none;
        white-space: pre;
      }
      .style-rule-separator {
        display: inline;
        white-space: pre;
      }

      .style-rule-disabled {
        text-decoration: line-through;
      }

      .style-rule-checkbox {
        opacity: 0;

        width: var(--checkbox-size);
        height: var(--checkbox-size);
        margin: 1px var(--checkbox-margin-width);

        /* Make sure that the checkbox and the text align.
         * Note that we can't use "display: flex;" on the parent,
         * as that breaks the white-space copy-pasting of all
         * the selectors.
         */
        vertical-align: middle;
      }
      .style-rules:hover .style-rule-checkbox,
      .style-rules:focus-within .style-rule-checkbox {
        opacity: 1;
      }

      .style-rule-name {
        color: rgb(200 0 0);
      }

      /* Container around the button, so that we can show a proper
       * outline for accessibility. Since the button uses a mask image,
       * an outline would normally not show up.
       */
      .style-subrule-expand {
        --outline-width: 1px;
        --total-outline-width: calc(var(--outline-width) * 2);
        /* To give enough space between the ouline (--outline-width)
         * and space-between-outline-and-element.
         */
        --arrow-expansion-space: calc(2px + var(--outline-width));

        /* When the arrow rotates, it needs a bit more horizontal
         * space. Always add the margin, to make sure the other
         * elements don't move around when toggling the expand arrow.
         */
        margin-right: var(--arrow-expansion-space);
        /* Anticipate the extra pixels from the outline on both sides,
         * as well as the extra space for the arrow rotation.
         */
        padding: 2px var(--arrow-expansion-space) 2px var(--total-outline-width);
        outline-color: transparent;
        outline-style: none;
        outline-width: var(--outline-width);

        user-select: none;
        display: inline-block;
      }
      .style-subrule-expand:focus-within {
        outline-color: -webkit-focus-ring-color;
        outline-style: auto;
      }
      /* We use the button text for semantic meaning, but want
       * to hide the text to replace it with a sprite instead.
       */
      .style-subrule-expand button {
        font-size: 0;
        border: 0;
        padding: 0;

        background-color: rgb(110 110 110);
        -webkit-mask-position: 0 10px;
        -webkit-mask-image: url(/smallIcons.svg);
        width: 10px;
        height: 10px;
        vertical-align: middle;
      }
      .style-subrule-expand-rotated {
        transform: rotate(90deg);
      }

      .style-subrule {
        margin-left: calc(1.5 * var(--checkbox-total-width));
      }

      .pending-rule {
        margin-left: var(--checkbox-total-width);
      }
      .pending-rule .style-rule-name {
        min-width: 5px;
      }
      .pending-rule:not(:focus-within) {
        height: 0;
        width: 0;
        opacity: 0;
        user-select: none;
        /* Even though we are not visible on the page, the browser still
         * reserves some space for this rule as a block element. This leads
         * to dangling whitespace in a container, which breaks overflowing
         * of the surrounding container.
         */
        overflow: hidden;
      }
    </style>
    <div
        class="header"
        @mousedown=${this.preventDoubleClickPendingRule ? null : this.startProcessingClickPendingRule}
        @mousemove=${this.preventDoubleClickPendingRule ? null : this.cancelClickPendingRule}
        @mouseup=${this.preventDoubleClickPendingRule ? null : this.maybeAddPendingRule}
      >
      <div class="style-selectors">
        <div>
          <span
              tabindex="0"
              @focus=${this.editNodeFromEvent(SelectorChangeEvent.create)}
              .innerHTML=${live(this.createStyleSelectors(selectors))}
            ></span>
          <span>{</span>
        </div>
      </div>
      <a class="source-location" href="">
        demo-styles.css:9
      </a>
    </div>
    <div
        class="style-rules"
        @mousedown=${this.preventDoubleClickPendingRule ? null : this.startProcessingClickPendingRule}
        @mousemove=${this.preventDoubleClickPendingRule ? null : this.cancelClickPendingRule}
        @mouseup=${this.preventDoubleClickPendingRule ? null : this.maybeAddPendingRule}
      >
      ${styleRuleElements}
    </div>
    <div>}</div>
    `,
        this.shadow, {
          eventContext: this,
        });
  }

  // Represents the `html, body, .selector` selectors. The matched sections are
  // highlighted, including their trailing comma.
  private createStyleSelectors(selectors: ReadonlyArray<StyleSelector>): string {
    const template = html`${selectors.map(({selector, matches}, index) => {
      const selectorElement = html`<span class="style-selector ${classMap({
        ['style-selector-matches']: matches,
      })}">${selector}</span>`;

      if (index === 0) {
        return selectorElement;
      }

      return html`<span class="style-selector-separator">, </span>${selectorElement}`;
    })}`;

    const element = document.createElement('div');
    // Use lit as sanitizer for the input of the selectors.
    LitHtml.render(template, element);

    return element.innerHTML;
  }

  private createStyleRule(level: RuleLevelType, indentation: number, rule: StyleRule) {
    const {name, enabled, subRules, property} = rule;
    // Whitespace is important here, to make sure that, when selecting the selectors,
    // the correct indentation is used as defined by the user. This means that
    // the user can copy-paste the selectors and obtain correctly-indented CSS
    // output that the style rule represents.
    //
    // Therefore, rather than inlining these elements into the template below,
    // we declare them separately for readability purposes. This prevents
    // newline characters or other whitespace to be inserted in the template,
    // which would end up in the copy-pasted code.
    const checkboxElement = level.hasCheckbox ? html`<input
            class="style-rule-checkbox"
            .checked=${enabled}
            type="checkbox"
            aria-label=${enabled ? `Disable ${name}` : `Enable ${name}`}
            @change=${property !== undefined && this.fireRuleEffectChangeEvent(property)}
          />` :
                                                '';
    const indentationElement = html`<span class="style-rule-indentation">${Array(indentation + 1).join(' ')}</span>`;

    // Represents a `property: value;`
    let ruleElement = this.createRuleElement(level, rule);

    // If a rule is disabled, wrap it in CSS comments. Make sure to not include
    // the indentation, as that would generate weird CSS output.
    //
    // The output then becomes `/* property: value; */`
    if (!enabled) {
      ruleElement =
          html`<span class="style-rule-comment">/* </span>${ruleElement}<span class="style-rule-comment"> */</span>`;
    }

    let expandedProperties: LitHtml.TemplateResult[] = [];

    // Recursively generate the rules for the subrules, if the user expanded it.
    // Make sure to not make them focusable (e.g. passing in the SUB_LEVEL_RULE),
    // and pass in the `enabled` from the parent.
    if (subRules && subRules.length && this.isExpanded.has(rule)) {
      expandedProperties = subRules.map(subRule => {
        return html`
          <div class="style-subrule">
            ${this.createStyleRule(SUB_LEVEL_RULE, indentation, {
          ...subRule,
          enabled,
        })}
          </div>
        `;
      });
    }

    // Depending on whether the rule is disabled, the output is either:
    // Enabled: `    property: value;`
    // Disabled: `    /* property: value; */`
    //
    // (indentation of 4 spaces used in the above example)
    return html`
      <div
          class="style-rule-container ${classMap({
      ['style-rule-disabled']: !enabled,
    })}"
        >${checkboxElement}${indentationElement}${ruleElement}${expandedProperties}</div>
    `;
  }

  // Represents a `property: value;`
  private createRuleElement(level: RuleLevelType, rule: StyleRule) {
    const {name, value, subRules, property} = rule;

    const ruleNameElement = html`<span
        class="style-rule-name"
        tabindex=${ifDefined(level.focusable ? '0' : undefined)}
        @focus=${property !== undefined && this.editNodeFromEvent(NameChangeEvent.create(property))}
        @paste=${this.pasteIntoLocation(PasteLocation.Name)}
        @keydown=${level === PENDING_LEVEL_RULE ? this.keydownInPending : undefined}
        .textContent=${live(name)}
      ></span>`;

    const separatorElement = html`<span class="style-rule-separator">: </span>`;

    let valueElement = html`<span
        class="style-rule-value"
        tabindex=${ifDefined(level.valueInitiallyFocusable ? '0' : undefined)}
        @focus=${property !== undefined && this.editNodeFromEvent(ValueChangeEvent.create(property))}
        @paste=${this.pasteIntoLocation(PasteLocation.Value)}
        .textContent=${live(value)}
      ></span>`;

    const closingElement = html`<span>;</span>`;

    // Add expand arrow for subrules of a style-rule (e.g. `margin-top` for `margin`)
    if (subRules && subRules.length) {
      valueElement = html`<div class="style-subrule-expand"><button
          class="${classMap({
        ['style-subrule-expand-rotated']: this.isExpanded.has(rule),
      })}"
          @click=${this.handleExpand(rule)}
        >Expand</button></div>${valueElement}`;
    }

    return html`${ruleNameElement}${separatorElement}${valueElement}${closingElement}`;
  }

  private editNodeFromEvent(eventFactory: (text: string) => Event) {
    return async (event: Event) => {
      const target = event.currentTarget as HTMLElement | null;

      if (!target) {
        return;
      }
      const commitType = await this.editNode(target);

      switch (commitType) {
        case CommitType.IN_PROGRESS:
          break;
        case CommitType.CANCELED:
          this.render();
          break;
        case CommitType.COMMITTED:
          this.dispatchEvent(eventFactory(target.textContent || ''));
          break;
        default:
          assertNever(commitType);
      }
    };
  }

  private fireRuleEffectChangeEvent(property: SDK.CSSProperty.CSSProperty) {
    return (event: Event) => {
      this.dispatchEvent(RuleEffectChange.create(property)((event.target as HTMLInputElement).checked));
    };
  }

  private async editNode(target: HTMLElement): Promise<CommitType> {
    if (!target) {
      return CommitType.CANCELED;
    }

    return this.editTargetHandler.start(target);
  }

  private handleExpand(rule: StyleRule) {
    return () => {
      if (this.isExpanded.has(rule)) {
        this.isExpanded.delete(rule);
      } else {
        this.isExpanded.add(rule);
      }

      this.render();
    };
  }

  // We should only add the pending rule for a click, but should
  // bail out if the user is dragging. If the user drags over an
  // element, the `cancelClickPendingRule` is invoked.
  private startProcessingClickPendingRule(event: MouseEvent) {
    const classList = (event.target as HTMLElement).classList;
    const isTopLevel = classList.contains('style-rule-container') || classList.contains('header');

    if (!isTopLevel) {
      return;
    }

    this.shouldAddPendingRuleForClick = true;
  }

  private cancelClickPendingRule() {
    this.shouldAddPendingRuleForClick = false;
  }

  private maybeAddPendingRule() {
    if (this.shouldAddPendingRuleForClick) {
      this.startEditingNewlyRenderedPendingRule();
      this.shouldAddPendingRuleForClick = false;
    }
  }

  private getPendingRuleValue(type: 'name'|'value'): HTMLElement {
    return this.shadow.querySelector<HTMLElement>(`.pending-rule .style-rule-${type}`)!;
  }

  private startEditingNewlyRenderedPendingRule() {
    this.editNode(this.getPendingRuleValue('name'));
  }

  // Before we are tabbing out of the name element, we have to perform
  // a check. Namely that if you didn't enter any value, then we want
  // to remove the pending rule altogether and tab into the next element.
  // This will happen in the `finishPendingRule` which listens to `focusout`.
  //
  // However, if you have entered some data, then we *do* want to move to
  // the value element. Therefore, we have to make it focusable, so that
  // after the `keydown` event, the focus can move to the value, rather than
  // the next focusable element after this pending rule.
  private keydownInPending(event: KeyboardEvent) {
    if (event.key === 'Tab' && !event.shiftKey) {
      const nameElement = this.getPendingRuleValue('name');
      const valueElement = this.getPendingRuleValue('value');

      if (nameElement.textContent === '') {
        valueElement.removeAttribute('tabindex');
      } else {
        valueElement.setAttribute('tabindex', '0');
      }
    }
  }

  private finishPendingRule(event: FocusEvent) {
    const nameElement = this.getPendingRuleValue('name');
    const valueElement = this.getPendingRuleValue('value');

    // If we are tabbing between the name and value inside the pending rule,
    // do not try to reset the pending rule. If we would, then the
    // focusout event would fire in between moving the focus from the
    // name/value to the other name/value, and consequently would remove
    // the element before focus could be moved in.
    if (event.relatedTarget === valueElement && nameElement.textContent !== '') {
      return;
    }
    if (event.relatedTarget === nameElement) {
      return;
    }

    if (nameElement.textContent === '' || valueElement.textContent === '') {
      this.removePendingRule();
    }
  }

  private pasteIntoLocation(pasteLocation: PasteLocation) {
    return (event: ClipboardEvent) => {
      if (!event.clipboardData) {
        return;
      }

      const pastedText = event.clipboardData.getData('text');

      this.dispatchEvent(new PasteEvent(pastedText, pasteLocation));
    };
  }

  private removePendingRule() {
    this.preventDoubleClickPendingRule = true;
    this.render();

    // To make sure that, when we clear a pending rule,
    // we shouldn't immediately add a pending rule back in.
    // This could happen if we are clicking in the same spot
    // in the ruleset to add a pending rule.
    // In that scenario, we removed the pending rule and would
    // immediately add it again, as the click listener would
    // be added back.
    //
    // To counter this problem, we are explicitly waiting, before
    // we add the listener back. We set the value to 150ms, as it
    // seems that the time it takes for the clicks to be processed
    // is about 100ms (RAIL guidelines).
    setTimeout(() => {
      this.preventDoubleClickPendingRule = false;
      this.render();
    }, 150);
  }
}

customElements.define('elements-style-sidebar', ElementsStyleSidebar);
