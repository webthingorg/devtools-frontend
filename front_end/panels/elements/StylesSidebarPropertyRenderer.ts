// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as Platform from '../../core/platform/platform.js';
import * as Root from '../../core/root/root.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as TextUtils from '../../models/text_utils/text_utils.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as VisualLogging from '../../ui/visual_logging/visual_logging.js';

const UIStrings = {
  /**
   *@description Text that is announced by the screen reader when the user focuses on an input field for entering the name of a CSS property in the Styles panel
   *@example {margin} PH1
   */
  cssPropertyName: '`CSS` property name: {PH1}',
  /**
   *@description Text that is announced by the screen reader when the user focuses on an input field for entering the value of a CSS property in the Styles panel
   *@example {10px} PH1
   */
  cssPropertyValue: '`CSS` property value: {PH1}',
};

const str_ = i18n.i18n.registerUIStrings('panels/elements/StylesSidebarPropertyRenderer.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class StylesSidebarPropertyRenderer {
  readonly propertyName: string;
  readonly propertyValue: string;
  private urlHandler: ((arg0: string) => Node)|null;
  private colorHandler: ((arg0: string) => Node)|null;
  private colorMixHandler: ((arg0: string) => Node)|null;
  private bezierHandler: ((arg0: string) => Node)|null;
  private fontHandler: ((arg0: string) => Node)|null;
  private shadowHandler: ((arg0: string, arg1: string) => Node)|null;
  private gridHandler: ((arg0: string, arg1: string) => Node)|null;
  private varHandler: ((arg0: string) => Node)|null;
  private angleHandler: ((arg0: string) => Node)|null;
  private lengthHandler: ((arg0: string) => Node)|null;
  private animationNameHandler: ((data: string) => Node)|null;
  private animationHandler: ((data: string) => Node)|null;
  private positionFallbackHandler: ((data: string) => Node)|null;

  constructor(name: string, value: string) {
    this.propertyName = name;
    this.propertyValue = value;
    this.urlHandler = null;
    this.colorHandler = null;
    this.colorMixHandler = null;
    this.bezierHandler = null;
    this.fontHandler = null;
    this.shadowHandler = null;
    this.gridHandler = null;
    this.varHandler = document.createTextNode.bind(document);
    this.animationNameHandler = null;
    this.angleHandler = null;
    this.lengthHandler = null;
    this.animationHandler = null;
    this.positionFallbackHandler = null;
  }

  setUrlHandler(handler: (arg0: string) => Node): void {
    this.urlHandler = handler;
  }

  setColorHandler(handler: (arg0: string) => Node): void {
    this.colorHandler = handler;
  }

  setColorMixHandler(handler: (arg0: string) => Node): void {
    this.colorMixHandler = handler;
  }

  setBezierHandler(handler: (arg0: string) => Node): void {
    this.bezierHandler = handler;
  }

  setFontHandler(handler: (arg0: string) => Node): void {
    this.fontHandler = handler;
  }

  setShadowHandler(handler: (arg0: string, arg1: string) => Node): void {
    this.shadowHandler = handler;
  }

  setGridHandler(handler: (arg0: string, arg1: string) => Node): void {
    this.gridHandler = handler;
  }

  setVarHandler(handler: (arg0: string) => Node): void {
    this.varHandler = handler;
  }

  setAnimationNameHandler(handler: (arg0: string) => Node): void {
    this.animationNameHandler = handler;
  }

  setAnimationHandler(handler: (arg0: string) => Node): void {
    this.animationHandler = handler;
  }

  setAngleHandler(handler: (arg0: string) => Node): void {
    this.angleHandler = handler;
  }

  setLengthHandler(handler: (arg0: string) => Node): void {
    this.lengthHandler = handler;
  }

  setPositionFallbackHandler(handler: (arg0: string) => Node): void {
    this.positionFallbackHandler = handler;
  }

  renderName(): Element {
    const nameElement = document.createElement('span');
    nameElement.setAttribute('jslog', `${VisualLogging.key().track({keydown: true, click: true})}`);
    UI.ARIAUtils.setLabel(nameElement, i18nString(UIStrings.cssPropertyName, {PH1: this.propertyName}));
    nameElement.className = 'webkit-css-property';
    nameElement.textContent = this.propertyName;
    nameElement.normalize();
    return nameElement;
  }

  renderValue(): Element {
    const valueElement = document.createElement('span');
    valueElement.setAttribute('jslog', `${VisualLogging.value().track({keydown: true, click: true})}`);
    UI.ARIAUtils.setLabel(valueElement, i18nString(UIStrings.cssPropertyValue, {PH1: this.propertyValue}));
    valueElement.className = 'value';
    if (!this.propertyValue) {
      return valueElement;
    }

    const metadata = SDK.CSSMetadata.cssMetadata();

    if (this.shadowHandler && metadata.isShadowProperty(this.propertyName) &&
        !SDK.CSSMetadata.VariableRegex.test(this.propertyValue)) {
      valueElement.appendChild(this.shadowHandler(this.propertyValue, this.propertyName));
      valueElement.normalize();
      return valueElement;
    }

    if (this.gridHandler && metadata.isGridAreaDefiningProperty(this.propertyName)) {
      valueElement.appendChild(this.gridHandler(this.propertyValue, this.propertyName));
      valueElement.normalize();
      return valueElement;
    }

    if (this.animationHandler && (this.propertyName === 'animation' || this.propertyName === '-webkit-animation')) {
      valueElement.appendChild(this.animationHandler(this.propertyValue));
      valueElement.normalize();
      return valueElement;
    }

    if (metadata.isStringProperty(this.propertyName)) {
      UI.Tooltip.Tooltip.install(valueElement, Platform.StringUtilities.unescapeCssString(this.propertyValue));
    }

    const regexes = [];
    const processors = [];

    // Push `color-mix` handler before pushing regex handler because
    // `color-mix` can contain variables inside and we want to handle
    // it as `color-mix` swatch that displays a variable swatch inside
    // `color: color-mix(in srgb, var(--a), var(--b))` should be handled
    // by colorMixHandler not varHandler.
    if (this.colorMixHandler && metadata.isColorAwareProperty(this.propertyName)) {
      regexes.push(Common.Color.ColorMixRegex);
      processors.push(this.colorMixHandler);
    }

    regexes.push(SDK.CSSMetadata.VariableRegex, SDK.CSSMetadata.URLRegex);
    processors.push(this.varHandler, this.urlHandler);
    // Handle `color` properties before handling other ones
    // because color Regex is fairly narrow to only select real colors.
    // However, some other Regexes like Bezier is very wide (text that
    // contains keyword 'linear'. So, we're handling the narrowly matching
    // handler first so that we will reduce the possibility of wrong matches.
    // i.e. color(srgb-linear ...) matching as a bezier curve (because
    // of the `linear` keyword)
    if (this.colorHandler && metadata.isColorAwareProperty(this.propertyName)) {
      regexes.push(Common.Color.Regex);
      processors.push(this.colorHandler);
    }
    if (this.bezierHandler && metadata.isBezierAwareProperty(this.propertyName)) {
      regexes.push(UI.Geometry.CubicBezier.Regex);
      processors.push(this.bezierHandler);
    }
    if (this.angleHandler && metadata.isAngleAwareProperty(this.propertyName)) {
      // TODO(changhaohan): crbug.com/1138628 refactor this to handle unitless 0 cases
      regexes.push(SDK.CSSMetadata.CSSAngleRegex);
      processors.push(this.angleHandler);
    }
    if (this.fontHandler && metadata.isFontAwareProperty(this.propertyName)) {
      if (this.propertyName === 'font-family') {
        regexes.push(SDK.CSSMetadata.FontFamilyRegex);
      } else {
        regexes.push(SDK.CSSMetadata.FontPropertiesRegex);
      }
      processors.push(this.fontHandler);
    }
    if (Root.Runtime.experiments.isEnabled('cssTypeComponentLength') && this.lengthHandler) {
      // TODO(changhaohan): crbug.com/1138628 refactor this to handle unitless 0 cases
      regexes.push(SDK.CSSMetadata.CSSLengthRegex);
      processors.push(this.lengthHandler);
    }
    if (this.propertyName === 'animation-name') {
      regexes.push(/^.*$/g);
      processors.push(this.animationNameHandler);
    }

    if (this.positionFallbackHandler && this.propertyName === 'position-fallback') {
      regexes.push(/^.*$/g);
      processors.push(this.positionFallbackHandler);
    }

    const results = TextUtils.TextUtils.Utils.splitStringByRegexes(this.propertyValue, regexes);
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const processor =
          result.regexIndex === -1 ? document.createTextNode.bind(document) : processors[result.regexIndex];
      if (processor) {
        valueElement.appendChild(processor(result.value));
      }
    }
    valueElement.normalize();
    return valueElement;
  }
}
