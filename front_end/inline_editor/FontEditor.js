// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as CssOverviewModule from '../css_overview/css_overview.js';
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

import {CSSLength, CSSShadowModel} from './CSSShadowModel.js';  // eslint-disable-line no-unused-vars

const fontSizeRegex = /([0-9\.]+)(px|em|rem|%|vh|vw)/;
const lineHeightRegex = /([0-9\.]+)(px|em|rem|%|vh|vw|)/;
const fontWeightRegex = /([0-9\.]+)/;
const letterSpacingRegex = /([\-0-9\.]+)(em|rem|px)/;


const fontSizeUnits = ['px', 'em', 'rem', '%', 'vh', 'vw'];
const lineHeightUnits = ['', 'px', 'em', '%'];
const letterSpacingUnits = ['em', 'rem', 'px'];

const fontSizeValues = [
  '', 'medium', 'xx-small', 'x-small', 'small', 'large', 'x-large', 'xx-large', 'smaller', 'larger', 'initial',
  'inherit'
];
const lineHeightValues = ['', 'normal', 'initial', 'inherit'];
const fontWeightValues = ['', 'bold', 'bolder', 'lighter', 'initial', 'inherit'];
const letterSpacingValues = ['', 'normal', 'initial', 'inherit'];

const unitMap = new Map([
  ['font-size', fontSizeUnits],
  ['line-height', lineHeightUnits],
  ['letter-spacing', letterSpacingUnits],
]);

const selectorInputValuesMap = new Map([
  ['font-size', fontSizeValues],
  ['line-height', lineHeightValues],
  ['font-weight', fontWeightValues],
  ['letter-spacing', letterSpacingValues],
]);

const fontSizeRangeMap = new Map([
  ['px', {min: 0, max: 72, step: 1}], ['em', {min: 0, max: 4.5, step: .1}], ['rem', {min: 0, max: 4.5, step: .1}],
  ['%', {min: 0, max: 450, step: 1}], ['vh', {min: 0, max: 10, step: .1}], ['vw', {min: 0, max: 10, step: .1}]
]);

const lineHeightRangeMap = new Map([
  ['', {min: 0, max: 2, step: .1}], ['em', {min: 0, max: 2, step: .1}], ['%', {min: 0, max: 200, step: 1}],
  ['px', {min: 0, max: 32, step: 1}]
]);

const fontWeightRangeMap = new Map([
  ['', {min: 100, max: 700, step: 100}],
]);

const letterSpacingRangeMap = new Map([
  ['px', {min: -10, max: 10, step: .01}], ['em', {min: -0.625, max: 0.625, step: .001}],
  ['rem', {min: -0.625, max: 0.625, step: .001}]
]);

/**
 * @unrestricted
 */
export class FontEditor extends UI.Widget.VBox {
  /**
   * @param {!Map<string, object>} propertyMap
   */
  constructor(propertyMap) {
    super(true);
    this.registerRequiredCSS('inline_editor/fontEditor.css');
    const [model] = SDK.SDKModel.TargetManager.instance().models(CssOverviewModule.CSSOverviewModel.CSSOverviewModel);
    this._model = model;
    this._selectedNode = self.UI.context.flavor(SDK.DOMModel.DOMNode);
    this._selectedNode.domModel().cssModel().addEventListener(SDK.CSSModel.Events.ComputedStyleUpdated, () => {
      this.updateRenderedFontList();
    }, this);

    this._propertyMap = propertyMap;
    this.contentElement.tabIndex = 0;
    this.setDefaultFocusedElement(this.contentElement);
    this._fontsMap = new Map();
    this._isFontFamilyOverloaded = false;

    // Font Selector Section
    this._fontSelectorSection = this.contentElement.createChild('div');
    this._fontSelectorSection.setAttribute('style', 'overflow-y: auto; padding-bottom: 10px;');
    this._fontSelectorSection.createChild('h2', 'font-section-header').textContent = ls`Font Family`;
    const renderedFontDiv = this._fontSelectorSection.createChild('div', 'rendered-font-div');
    const renderedFontLabel = renderedFontDiv.createChild('div');
    renderedFontLabel.textContent = ls`Rendered Fonts:`;
    renderedFontLabel.classList.add('rendered-font-list-label');
    this._renderedFontListSpan = renderedFontDiv.createChild('div', 'rendered-font-list');
    this.updateRenderedFontList().then(() => {
      this.dispatchEventToListeners(Events.FontEditorResized);
    });

    this._fontSelectors = [];

    if (this._propertyMap.has('font-family')) {
      const propertyValue = this._propertyMap.get('font-family');
      this._isFontFamilyOverloaded = propertyValue.isOverloaded;
      const splitValue = propertyValue.value.split(',');
      this._createFontSelector(splitValue[0], ls`Font Family`);
      for (let i = 1; i < splitValue.length + 1; i++) {
        this._createFontSelector(splitValue[i]);
      }
    } else {
      this._createFontSelector('', ls`Font Family`);
    }

    //  CSS Font Property Section
    const cssPropertySection = this.contentElement.createChild('div', 'font-section');
    cssPropertySection.createChild('h2', 'font-section-header').textContent = ls`CSS Properties`;

    const fontSizePropertyInfo = this._getPropertyInfo('font-size', fontSizeRegex);

    const lineHeightPropertyInfo = this._getPropertyInfo('line-height', lineHeightRegex);

    const fontWeightPropertyInfo = this._getPropertyInfo('font-weight', fontWeightRegex);

    const letterSpacingPropertyInfo = this._getPropertyInfo('letter-spacing', letterSpacingRegex);

    new FontPropertyInputs(
        'font-size', ls`Font Size`, cssPropertySection, fontSizePropertyInfo, fontSizeRangeMap,
        this._updatePropertyValue.bind(this), this._model, true);
    new FontPropertyInputs(
        'line-height', ls`Line Height`, cssPropertySection, lineHeightPropertyInfo, lineHeightRangeMap,
        this._updatePropertyValue.bind(this), this._model, true);
    new FontPropertyInputs(
        'font-weight', ls`Font Weight`, cssPropertySection, fontWeightPropertyInfo, fontWeightRangeMap,
        this._updatePropertyValue.bind(this), this._model, false);
    new FontPropertyInputs(
        'letter-spacing', ls`Spacing`, cssPropertySection, letterSpacingPropertyInfo, letterSpacingRangeMap,
        this._updatePropertyValue.bind(this), this._model, true);
  }

  async updateRenderedFontList() {
    const platformFonts = await this._model.getPlatformFontsForNode(this._selectedNode.id);
    this._renderedFontListSpan.textContent = '';
    if (platformFonts.length === 0) {
      this._renderedFontListSpan.textContent = '';
    }
    for (let i = 0; i < platformFonts.length; i++) {
      if (i !== platformFonts.length - 1) {
        this._renderedFontListSpan.textContent += platformFonts[i].familyName + ', ';
      } else {
        this._renderedFontListSpan.textContent += platformFonts[i].familyName;
      }
    }
  }

  async _createFontsList() {
    const {fontInfo} = await Promise.resolve(this._model.getNodeStyleStats());
    const computedFontArray = Array.from(fontInfo.keys());
    const computedMap = new Map();
    const splicedArray = this._splitComputedFontArray(computedFontArray);

    computedMap.set('Computed Fonts', splicedArray);
    const systemMap = new Map();
    systemMap.set('System Fonts', [
      'Arial', {text: 'Comic Sans MS', value: '\'Comic Sans MS\''}, {text: 'Courier New', value: '\'Courier New\''},
      'Helvetica', 'Impact', {text: 'Times New Roman', value: '\'Times New Roman\''}, 'Verdana'
    ]);

    /** @type {!Array<any>} */
    const fontList = [''];
    fontList.push(computedMap);
    fontList.push(systemMap);
    return fontList;
  }

  _splitComputedFontArray(computedFontArray) {
    const array = [];
    for (let i = 0; i < computedFontArray.length; i++) {
      if (computedFontArray[i].indexOf(',') !== -1) {
        const fonts = computedFontArray[i].split(',');
        fonts.forEach(element => {
          if (array.findIndex(item => item.toLowerCase() === element.trim().toLowerCase().replace(/"/g, '\'')) === -1) {
            array.push(element.trim().replace(/"/g, '\''));
          }
        });
      } else if (
          array.findIndex(item => item.toLowerCase() === computedFontArray[i].toLowerCase().replace('"', '\'')) ===
          -1) {
        array.push(computedFontArray[i].replace(/"/g, '\''));
      }
    }
    return array;
  }

  async _createFontSelector(value, label) {
    value = value ? value.trim() : '';
    if (value.includes(' ') && value.charAt(0) !== '\'') {
      value = '\'' + value + '\'';
    }
    label = label ? label : ls`Fallback`;
    const selectorField = this._fontSelectorSection.createChild('div', 'shadow-editor-field shadow-editor-flex-field');
    const fontsList = await this._createFontsList();
    const fontSelector = this._createSelector(selectorField, label, fontsList, value.trim());
    this._fontSelectors.push(fontSelector);
  }

  setPropertyMap(propertyMap) {
    this._propertyMap = propertyMap;
  }

  _getPropertyInfo(name, regex) {
    // Check what happens if match doesn't work
    if (this._propertyMap.has(name)) {
      const value = this._propertyMap.get(name);
      const valueString = value.value;
      const match = valueString.match(regex);
      if (match) {
        return {value: match[1], units: match[2] ? match[2] : '', isOverloaded: value.isOverloaded};
      }
      return {value: valueString, units: undefined, isOverloaded: value.isOverloaded};
    }
    return {};
  }

  _createSelector(field, label, options, current) {
    const selectInput = UI.UIUtils.createSelect(label, options);
    if (this._isFontFamilyOverloaded) {
      selectInput.classList.add('error-input');
    }
    selectInput.value = current;
    const selectLabel = UI.UIUtils.createLabel(label, 'shadow-editor-label', selectInput);
    selectInput.addEventListener('input', this._onSelectorChanged.bind(this), false);
    field.appendChild(selectLabel);
    field.appendChild(selectInput);
    return selectInput;
  }

  /**
   * @param {!Event} event
   */
  _onSelectorChanged() {
    let value = '';
    for (let i = 0; i < this._fontSelectors.length; i++) {
      if (this._fontSelectors[i].value !== '') {
        if (value === '') {
          value = this._fontSelectors[0].value;
        } else {
          value += ', ' + this._fontSelectors[i].value;
        }
      } else if (i < this._fontSelectors.length - 1) {
        this._fontSelectorSection.removeChild(this._fontSelectors[i].parentNode);
        if (i === 0) {
          this._fontSelectors[1].previousSibling.textContent = 'Font Family';
        }
        this._fontSelectors.splice(i, 1);

        i -= 1;
        this.dispatchEventToListeners(Events.FontEditorResized);
      }
    }
    if (this._fontSelectors[this._fontSelectors.length - 1].value !== '' && this._fontSelectors.length < 10) {
      this._createFontSelector(ls`Fallback`, '');
      this.dispatchEventToListeners(Events.FontEditorResized);
    }
    this._updatePropertyValue('font-family', value);
  }

  _updatePropertyValue(propertyName, value) {
    this.dispatchEventToListeners(Events.FontValueChanged, {propertyName: propertyName, value: value});
  }
}
/**
 * @typedef {{name: string, slider: !Element, textInput: !Element, unitInput: Element | undefined, units: string | undefined}}
 */
FontEditor.PropertyInputs;

/**
 * @typedef {{value: string, units: string|undefined, isOverloaded: boolean}}
 */
FontEditor.PropertyInfo;

/** @enum {symbol} */
export const Events = {
  FontValueChanged: Symbol('FontValueChanged'),
  FontEditorResized: Symbol('FontEditorResized'),
};

class FontPropertyInputs {
  constructor(propertyName, label, field, propertyInfo, rangeMap, updateCallback, model, hasUnits) {
    this._showSliderMode = true;
    const propertyField = field.createChild('div', 'shadow-editor-field shadow-editor-flex-field');
    this._propertyInfo = propertyInfo;
    this._rangeMap = rangeMap;
    this._model = model;
    this._hasUnits = hasUnits;
    if (this._hasUnits) {
      this._units = propertyInfo.units !== undefined ? propertyInfo.units : unitMap.get(propertyName)[0];
    } else {
      this._units = '';
    }
    this._propertyName = propertyName;
    this._boundUpdateCallback = updateCallback;
    this._selectedNode = self.UI.context.flavor(SDK.DOMModel.DOMNode);
    this._sliderInput = this._createSliderInput(propertyField, label);
    this._textInput = this._createTextInput(propertyField);
    this._unitInput = this._createUnitInput(propertyField);
    this._selectorInput = this._createSelectorInput(propertyField);
    this._createTypeToggle(propertyField);
    this._checkSelectorValueAndToggle();
  }

  _checkSelectorValueAndToggle() {
    const valuesArray = selectorInputValuesMap.get(this._propertyName);
    if (valuesArray && (valuesArray.indexOf(this._propertyInfo.value) !== -1)) {
      this._toggleInputType();
      return true;
    }
    return false;
  }

  /**
   * @param {!Element} field
   * @param {string} label
   * @return {!Element}
   */
  _createSliderInput(field, label) {
    const min = this._propertyInfo.value ? Math.min(this._rangeMap.get(this._units).min, this._propertyInfo.value) :
                                           this._rangeMap.get(this._units).min;
    const max = this._propertyInfo.value ? Math.max(this._rangeMap.get(this._units).max, this._propertyInfo.value) :
                                           this._rangeMap.get(this._units).max;

    const slider = UI.UIUtils.createSlider(min, max, -1);
    slider.sliderElement.step = this._rangeMap.get(this._units).step;
    const sliderLabel = UI.UIUtils.createLabel(label, 'shadow-editor-label', slider);
    if (this._propertyInfo.value) {
      slider.value = this._propertyInfo.value;
    } else {
      slider.value = (min + max) / 2;
    }
    slider.addEventListener('input', this._onSliderInput.bind(this), false);
    field.appendChild(sliderLabel);
    field.appendChild(slider);
    return slider;
  }

  /**
   * @param {!Element} field
   * @return {!Element}
   */
  _createTextInput(field) {
    const min = this._propertyInfo.value ? Math.min(this._rangeMap.get(this._units).min, this._propertyInfo.value) :
                                           this._rangeMap.get(this._units).min;
    const max = this._propertyInfo.value ? Math.max(this._rangeMap.get(this._units).max, this._propertyInfo.value) :
                                           this._rangeMap.get(this._units).max;

    const textInput = UI.UIUtils.createInput('shadow-editor-text-input', 'number');
    if (this._propertyInfo.isOverloaded) {
      textInput.classList.add('error-input');
    }
    textInput.min = min;
    textInput.max = max;
    textInput.classList.add('font-editor-text-input');
    textInput.value = this._propertyInfo.value;
    textInput.step = 'any';
    textInput.addEventListener('input', this._onTextInput.bind(this), false);
    field.appendChild(textInput);
    return textInput;
  }

  /**
   * @param {!Element} field
   * @return {!Element}
   */
  _createUnitInput(field) {
    let unitInput;
    if (this._hasUnits) {
      const currentValue = this._propertyInfo.units;
      const options = unitMap.get(this._propertyName);
      unitInput = UI.UIUtils.createSelect(ls`Units`, options);
      unitInput.classList.add('font-editor-select');
      if (this._propertyInfo.isOverloaded) {
        unitInput.classList.add('error-input');
      }
      if (currentValue) {
        unitInput.value = currentValue;
      }
      unitInput.addEventListener('change', this._onUnitInput.bind(this), false);
    } else {
      unitInput = UI.UIUtils.createSelect(ls`Units`, []);
      unitInput.classList.add('font-editor-select');
      unitInput.disabled = true;
    }
    field.appendChild(unitInput);
    return unitInput;
  }

  _createSelectorInput(field) {
    const options = selectorInputValuesMap.get(this._propertyName);
    const selectInput = UI.UIUtils.createSelect('Selector Values', options);
    if (this._isFontFamilyOverloaded) {
      selectInput.classList.add('error-input');
    }
    selectInput.classList.add('font-selector-input');
    selectInput.value = this._propertyInfo.value;
    selectInput.addEventListener('input', this._onSelectorInput.bind(this), false);
    field.appendChild(selectInput);
    selectInput.hidden = true;
    return selectInput;
  }

  _onSelectorInput(event) {
    const value = event.currentTarget.value;
    this._textInput.value = '';
    this._sliderInput.value = (this._sliderInput.min + this._sliderInput.max) / 2;
    this._boundUpdateCallback(this._propertyName, value);
  }

  /**
   * @param {!Event} event
   */
  _onSliderInput(event) {
    const value = event.currentTarget.value;
    this._textInput.value = value;
    this._selectorInput.value = '';
    const valueString = this._hasUnits ? value + this._unitInput.value : value;
    this._boundUpdateCallback(this._propertyName, valueString);
  }

  /**
   * @param {!Event} event
   */
  _onTextInput(event) {
    const value = event.currentTarget.value;
    const units = value === '' ? '' : this._unitInput.value;
    this._sliderInput.value = value;
    this._selectorInput.value = '';
    this._boundUpdateCallback(this._propertyName, value + units);
  }

  /**
   * @param {!Event} event
   */
  async _onUnitInput(event) {
    const newUnit = event.currentTarget.value;
    const prevUnit = this._units;
    const conversionMultiplier = await this._getNumConversionMultiplier(1, prevUnit, newUnit, /* isFontInput= */ true);
    const isPx = newUnit === 'px';
    this._setInputUnits(conversionMultiplier, newUnit, isPx);
    if (this._textInput.value) {
      this._boundUpdateCallback(this._propertyName, this._textInput.value + newUnit);
    }
    this._units = newUnit;
  }

  _createTypeToggle(field) {
    const displaySwitcher = field.createChild('div', 'spectrum-switcher');
    appendSwitcherIcon(displaySwitcher);
    displaySwitcher.addEventListener('click', this._toggleInputType.bind(this));

    function appendSwitcherIcon(parentElement) {
      const icon = parentElement.createSVGChild('svg');
      icon.setAttribute('height', 16);
      icon.setAttribute('width', 16);
      const path = icon.createSVGChild('path');
      path.setAttribute('d', 'M5,6 L11,6 L8,2 Z M5,10 L11,10 L8,14 Z');
      return icon;
    }
  }

  _toggleInputType() {
    if (this._showSliderMode) {
      // Show selector input type
      this._sliderInput.hidden = true;
      this._textInput.hidden = true;
      this._unitInput.hidden = true;
      this._selectorInput.hidden = false;
      this._showSliderMode = false;
    } else {
      // Show sliderinput type
      this._sliderInput.hidden = false;
      this._textInput.hidden = false;
      this._unitInput.hidden = false;
      this._selectorInput.hidden = true;

      this._showSliderMode = true;
    }
  }

  async _getNumConversionMultiplier(baseMultiplier, prevUnit, newUnit, isFontInput) {
    // px em rem % vh vw
    if (prevUnit === 'px') {
      if (newUnit === 'px') {
        return baseMultiplier;
      }
      if (newUnit === 'em' || (this._propertyName === 'line-height' && newUnit === '')) {
        const fontSizeNodeId = isFontInput ? this._selectedNode.parentNode.id : this._selectedNode.id;
        let currentFontSize = await this._model.getComputedStyleForNode(fontSizeNodeId).then(computedArray => {
          return computedArray[19].value;
        });
        currentFontSize = currentFontSize.replace(/[a-z]/g, '');
        return baseMultiplier / currentFontSize;
      }
      if (newUnit === 'rem') {
        const htmlNode = this._findHtmlNode();
        let rootFontSize = await this._model.getComputedStyleForNode(htmlNode.id).then(computedArray => {
          return computedArray[19].value;
        });
        rootFontSize = rootFontSize.replace(/[a-z]/g, '');
        return baseMultiplier / rootFontSize;
      }
      if (newUnit === '%') {
        const fontSizeNodeId = isFontInput ? this._selectedNode.parentNode.id : this._selectedNode.id;
        let currentFontSize = await this._model.getComputedStyleForNode(fontSizeNodeId).then(computedArray => {
          return computedArray[19].value;
        });
        currentFontSize = currentFontSize.replace(/[a-z]/g, '');
        return baseMultiplier / currentFontSize * 100;
      }
      if (newUnit === 'vh') {
        const viewportHeight = window.innerHeight;
        return baseMultiplier / (viewportHeight / 100);
      }
      if (newUnit === 'vw') {
        const viewportWidth = window.innerWidth;
        return baseMultiplier / (viewportWidth / 100);
      }
      return -1;
    }
    if (prevUnit === 'em' || (this._propertyName === 'line-height' && prevUnit === '')) {
      const fontSizeNodeId = isFontInput ? this._selectedNode.parentNode.id : this._selectedNode.id;
      let currentFontSize = await this._model.getComputedStyleForNode(fontSizeNodeId).then(computedArray => {
        return computedArray[19].value;
      });
      currentFontSize = currentFontSize.replace(/[a-z]/g, '');
      const emToPxValue = currentFontSize;
      return await this._getNumConversionMultiplier(emToPxValue, 'px', newUnit, isFontInput);
    }
    if (prevUnit === 'rem') {
      const htmlNode = this._findHtmlNode();
      let rootFontSize = await this._model.getComputedStyleForNode(htmlNode.id).then(computedArray => {
        return computedArray[19].value;
      });
      rootFontSize = rootFontSize.replace(/[a-z]/g, '');
      const remToPxValue = rootFontSize;
      return await this._getNumConversionMultiplier(remToPxValue, 'px', newUnit, isFontInput);
    }
    if (prevUnit === '%') {
      const fontSizeNodeId = isFontInput ? this._selectedNode.parentNode.id : this._selectedNode.id;
      let currentFontSize = await this._model.getComputedStyleForNode(fontSizeNodeId).then(computedArray => {
        return computedArray[19].value;
      });
      currentFontSize = currentFontSize.replace(/[a-z]/g, '');
      const percentToPxValue = currentFontSize / 100;
      return await this._getNumConversionMultiplier(percentToPxValue, 'px', newUnit, isFontInput);
    }
    if (prevUnit === 'vh') {
      const viewportHeight = window.innerHeight;
      const vhToPxValue = viewportHeight / 100;
      return await this._getNumConversionMultiplier(vhToPxValue, 'px', newUnit, isFontInput);
    }
    if (prevUnit === 'vw') {
      const viewportWidth = window.innerWidth;
      const vwToPxValue = viewportWidth / 100;
      return await this._getNumConversionMultiplier(vwToPxValue, 'px', newUnit, isFontInput);
    }
    return -1;
  }

  _setInputUnits(multiplier, newUnit, isPx) {
    const roundingPrecision = (isPx && this._propertyName !== 'letter-spacing') ? 0 : 3;

    this._sliderInput.sliderElement.min = (this._sliderInput.sliderElement.min * multiplier).toFixed(roundingPrecision);
    this._sliderInput.sliderElement.max = (this._sliderInput.sliderElement.max * multiplier).toFixed(roundingPrecision);
    this._textInput.min = (this._textInput.min * multiplier).toFixed(roundingPrecision);
    this._textInput.max = (this._textInput.max * multiplier).toFixed(roundingPrecision);
    this._sliderInput.sliderElement.step = this._rangeMap.get(newUnit).step;
    if (this._textInput.value) {
      const newValue = parseFloat((this._textInput.value * multiplier).toFixed(roundingPrecision));
      this._textInput.value = newValue;
      this._sliderInput.value = newValue;
    } else {
      this._sliderInput.value = (this._sliderInput.min + this._sliderInput.max) / 2;
    }
  }

  _findHtmlNode() {
    let node = this._selectedNode;
    while (node.nodeName() !== 'HTML') {
      if (node.parentNode) {
        node = node.parentNode;
      } else {
        break;
      }
    }
    return node;
  }
}
