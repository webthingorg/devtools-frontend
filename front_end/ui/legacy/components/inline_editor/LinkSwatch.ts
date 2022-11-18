// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../../../core/i18n/i18n.js';
import * as Platform from '../../../../core/platform/platform.js';
import * as ComponentHelpers from '../../../components/helpers/helpers.js';
import * as LitHtml from '../../../lit-html/lit-html.js';

import linkSwatchStyles from './linkSwatch.css.js';

const UIStrings = {
  /**
  *@description Text displayed in a tooltip shown when hovering over a var() CSS function in the Styles pane when the custom property in this function does not exist. The parameter is the name of the property.
  *@example {--my-custom-property-name} PH1
  */
  sIsNotDefined: '{PH1} is not defined',
};
const str_ = i18n.i18n.registerUIStrings('ui/legacy/components/inline_editor/LinkSwatch.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
const {render, html, Directives} = LitHtml;

interface LinkSwatchRenderData {
  text: string;
  onLinkActivate: (linkText: string) => void;
}

/* eslint-disable-next-line rulesdir/check_component_naming */
abstract class LinkSwatch<RenderData extends LinkSwatchRenderData> extends HTMLElement {
  protected readonly shadow = this.attachShadow({mode: 'open'});
  protected onLinkActivate: (linkText: string, event: MouseEvent|KeyboardEvent) => void = () => undefined;

  constructor() {
    super();

    this.tabIndex = -1;

    this.addEventListener('focus', () => {
      const link = this.shadow.querySelector<HTMLElement>('[role="link"]');

      if (link) {
        link.focus();
      }
    });
  }

  connectedCallback(): void {
    this.shadow.adoptedStyleSheets = [linkSwatchStyles];
  }

  set data(data: RenderData) {
    this.onLinkActivate = (linkText: string, event: MouseEvent|KeyboardEvent): void => {
      if (event instanceof MouseEvent && event.button !== 0) {
        return;
      }

      if (event instanceof KeyboardEvent && !Platform.KeyboardUtilities.isEnterOrSpaceKey(event)) {
        return;
      }

      data.onLinkActivate(linkText);
      event.consume(true);
    };
    this.render(data);
  }

  protected renderLink(title: string|null, linkText: string, isDefined: boolean): LitHtml.TemplateResult {
    const classes = Directives.classMap({
      'link-swatch-link': true,
      'undefined': !isDefined,
    });
    // The linkText's space must be removed, otherwise it cannot be triggered when clicked.
    const onActivate = isDefined ? this.onLinkActivate.bind(this, linkText.trim()) : null;

    return html`<span class=${classes} title=${title} @mousedown=${onActivate} @keydown=${
        onActivate} role="link" tabindex="-1">${linkText}</span>`;
  }

  protected abstract render(data: RenderData): void;
}

const VARIABLE_FUNCTION_REGEX = /(^var\()\s*(--(?:[\s\w\P{ASCII}-]|\\.)+)(,?\s*.*)\s*(\))$/u;

interface CSSVarSwatchRenderData extends LinkSwatchRenderData {
  computedValue: string|null;
  fromFallback: boolean;
}

interface ParsedVariableFunction {
  pre: string;
  variableName: string;
  fallbackIncludeComma: string;
  post: string;
}

interface AnimationNameSwatchRenderData extends LinkSwatchRenderData {
  isDefined: boolean;
}

export class CSSVarSwatch extends LinkSwatch<CSSVarSwatchRenderData> {
  static readonly litTagName = LitHtml.literal`devtools-css-var-swatch`;

  private parseVariableFunctionParts(text: string): ParsedVariableFunction|null {
    // When the value of CSS var() is greater than two spaces, only one is
    // always displayed, and the actual number of spaces is displayed when
    // editing is clicked.
    const result = text.replace(/\s{2,}/g, ' ').match(VARIABLE_FUNCTION_REGEX);
    if (!result) {
      return null;
    }

    return {
      // Returns `var(`
      pre: result[1],

      // Returns the CSS variable name, e.g. `--foo`
      variableName: result[2],

      // Returns the fallback value in the CSS variable, including a comma if
      // one is present, e.g. `,50px`
      fallbackIncludeComma: result[3],

      // Returns `)`
      post: result[4],
    };
  }

  private variableName(text: string): string {
    const match = text.match(VARIABLE_FUNCTION_REGEX);
    if (match) {
      return match[2];
    }
    return '';
  }

  protected render(data: CSSVarSwatchRenderData): void {
    const functionParts = this.parseVariableFunctionParts(data.text);
    if (!functionParts) {
      render('', this.shadow, {host: this});
      return;
    }

    const isDefined = Boolean(data.computedValue) && !data.fromFallback;
    const title =
        isDefined ? data.computedValue : i18nString(UIStrings.sIsNotDefined, {PH1: this.variableName(data.text)});
    const variableNameLink = this.renderLink(title, functionParts.variableName, isDefined);
    const fallbackIncludeComma = functionParts.fallbackIncludeComma ? functionParts.fallbackIncludeComma : '';

    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    render(
        html`<span title=${data.computedValue || ''}>${functionParts.pre}${variableNameLink}${fallbackIncludeComma}${
            functionParts.post}</span>`,
        this.shadow, {host: this});
    // clang-format on
  }
}

export class AnimationNameSwatch extends LinkSwatch<AnimationNameSwatchRenderData> {
  static readonly litTagName = LitHtml.literal`devtools-animation-name-swatch`;

  protected render(data: AnimationNameSwatchRenderData): void {
    const title = data.isDefined ? data.text : i18nString(UIStrings.sIsNotDefined, {PH1: data.text});
    const animationNameLink = this.renderLink(title, data.text, data.isDefined);
    render(html`<span title=${data.text}>${animationNameLink}</span>`, this.shadow, {host: this});
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-animation-name-swatch', AnimationNameSwatch);
ComponentHelpers.CustomElements.defineComponent('devtools-css-var-swatch', CSSVarSwatch);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-animation-name-swatch': AnimationNameSwatch;
    'devtools-css-var-swatch': CSSVarSwatch;
  }
}
