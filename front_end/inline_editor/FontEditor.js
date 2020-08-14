// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as CssOverviewModule from '../css_overview/css_overview.js';
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

import {CSSLength, CSSShadowModel} from './CSSShadowModel.js';  // eslint-disable-line no-unused-vars

const fontSizeRegex = /([0-9\.]+)([a-zA-Z%]+)/;
const lineHeightRegex = /([0-9\.]+)([a-zA-Z%]+)/;
const fontWeightRegex = /([0-9\.]+)/;
const letterSpacingRegex = /([-0-9\.]+)([a-zA-Z%]+)/;


const fontSizeUnits = ['px', 'em', 'rem', '%', 'vh', 'vw'];
const lineHeightUnits = ['', 'px', 'em', '%'];
const letterSpacingUnits = ['em', 'rem', 'px'];

const fontSizeValues = [
  '',
  'medium',
  'xx-small',
  'x-small',
  'small',
  'large',
  'x-large',
  'xx-large',
  'smaller',
  'larger',
];
const lineHeightValues = ['', 'normal'];
const fontWeightValues = ['', 'normal', 'bold', 'bolder', 'lighter'];
const letterSpacingValues = ['', 'normal'];

const globalValues = ['inherit', 'initial', 'unset'];

fontSizeValues.push(...globalValues);
lineHeightValues.push(...globalValues);
fontWeightValues.push(...globalValues);
letterSpacingValues.push(...globalValues);

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
  // Common Units
  ['px', {min: 0, max: 72, step: 1}], ['em', {min: 0, max: 4.5, step: .1}], ['rem', {min: 0, max: 4.5, step: .1}],
  ['%', {min: 0, max: 450, step: 1}], ['vh', {min: 0, max: 10, step: .1}], ['vw', {min: 0, max: 10, step: .1}],

  // Extra Units
  ['vmin', {min: 0, max: 10, step: .1}], ['vmax', {min: 0, max: 10, step: .1}], ['cm', {min: 0, max: 2, step: .1}],
  ['mm', {min: 0, max: 20, step: .1}], ['in', {min: 0, max: 1, step: .01}], ['pt', {min: 0, max: 54, step: 1}],
  ['pc', {min: 0, max: 4.5, step: .1}]
]);

const lineHeightRangeMap = new Map([
  // Common Units
  ['', {min: 0, max: 2, step: .1}], ['em', {min: 0, max: 2, step: .1}], ['%', {min: 0, max: 200, step: 1}],
  ['px', {min: 0, max: 32, step: 1}],

  // Extra Units
  ['rem', {min: 0, max: 2, step: .1}], ['vh', {min: 0, max: 4.5, step: .1}], ['vw', {min: 0, max: 4.5, step: .1}],
  ['vmin', {min: 0, max: 4.5, step: .1}], ['vmax', {min: 0, max: 4.5, step: .1}], ['cm', {min: 0, max: 1, step: .1}],
  ['mm', {min: 0, max: 8.5, step: .1}], ['in', {min: 0, max: .5, step: .1}], ['pt', {min: 0, max: 24, step: 1}],
  ['pc', {min: 0, max: 2, step: .1}]
]);

const fontWeightRangeMap = new Map([
  ['', {min: 100, max: 700, step: 100}],
]);

const letterSpacingRangeMap = new Map([
  // Common Units
  ['px', {min: -10, max: 10, step: .01}], ['em', {min: -0.625, max: 0.625, step: .001}],
  ['rem', {min: -0.625, max: 0.625, step: .001}],

  // Extra Units
  ['%', {min: -62.5, max: 62.5, step: .1}], ['vh', {min: -1.5, max: 1.5, step: .01}],
  ['vw', {min: -1.5, max: 1.5, step: .01}], ['vmin', {min: -1.5, max: 1.5, step: .01}],
  ['vmax', {min: -1.5, max: 1.5, step: .01}], ['cm', {min: -0.25, max: .025, step: .001}],
  ['mm', {min: -2.5, max: 2.5, step: .01}], ['in', {min: -0.1, max: 0.1, step: .001}],
  ['pt', {min: -7.5, max: 7.5, step: .01}], ['pc', {min: -0.625, max: 0.625, step: .001}]
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

    this._propertyMap = propertyMap;
    this.contentElement.tabIndex = 0;
    this.setDefaultFocusedElement(this.contentElement);
    this._fontsMap = new Map();
    this._isFontFamilyOverloaded = false;
    this._boundUpdateRenderedList = this.updateRenderedFontList.bind(this);

    // Font Selector Section
    this._fontSelectorSection = this.contentElement.createChild('div');
    this._fontSelectorSection.setAttribute('style', 'overflow-y: auto; padding-bottom: 10px;');
    this._fontSelectorSection.createChild('h2', 'font-section-header').textContent = ls`Font Family`;
    this._renderedFontDiv = this._fontSelectorSection.createChild('div');
    const renderedFontLabel = this._renderedFontDiv.createChild('div');
    renderedFontLabel.textContent = ls`Rendered Fonts:`;
    renderedFontLabel.classList.add('rendered-font-list-label');
    this._renderedFontListSpan = this._renderedFontDiv.createChild('div', 'rendered-font-list');
    this.updateRenderedFontList().then(() => {
      this._resizePopout();
    });

    /** @type {!Array<FontEditor.FontSelectorObject>} */
    this._fontSelectors = [];

    if (this._propertyMap.has('font-family')) {
      const propertyValue = this._propertyMap.get('font-family');
      this._isFontFamilyOverloaded = propertyValue.isOverloaded;
      const splitValue = propertyValue.value.split(',');
      this._createFontSelector(splitValue[0], true);
      if (!globalValues.includes(splitValue[0])) {
        for (let i = 1; i < splitValue.length + 1; i++) {
          this._createFontSelector(splitValue[i]);
        }
      }
    } else {
      this._createFontSelector('', true);
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
    this._selectedNode.domModel().cssModel().removeEventListener(
        SDK.CSSModel.Events.ComputedStyleUpdated, this._boundUpdateRenderedList, false);
    this._renderedFontListSpan.textContent = '';
    if (!platformFonts || platformFonts.length === 0) {
      this._renderedFontListSpan.textContent = 'None found in div';
      return;
    }
    for (let i = 0; i < platformFonts.length; i++) {
      if (i !== platformFonts.length - 1) {
        this._renderedFontListSpan.textContent += platformFonts[i].familyName + ', ';
      } else {
        this._renderedFontListSpan.textContent += platformFonts[i].familyName;
      }
    }
  }

  /**
   * @return {!Promise<!Array<Map<string, !Array<string>>>>}
   */
  async _createFontsList() {
    const {fontInfo} = await Promise.resolve(this._model.getNodeStyleStats());
    const computedFontArray = Array.from(fontInfo.keys());
    const computedMap = new Map();
    const splicedArray = this._splitComputedFontArray(computedFontArray);

    computedMap.set('Computed Fonts', splicedArray);
    const systemMap = new Map();
    systemMap.set(
        'System Fonts',
        ['Arial', '\'Comic Sans MS\'', '\'Courier New\'', 'Helvetica', 'Impact', '\'Times New Roman\'', 'Verdana']);
    systemMap.set('Generic Families', [
      'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-serif', 'ui-sans-serif',
      'ui-monospace', 'ui-rounded', 'emoji', 'math', 'fangsong'
    ]);

    /** @type {!Array<any>} */
    const fontList = [];
    fontList.push(computedMap);
    fontList.push(systemMap);
    return fontList;
  }

  /**
   * @param {!Array<string>} computedFontArray
   * @return {!Array<string>}
   */
  _splitComputedFontArray(computedFontArray) {
    /** @type Array<string> */
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

  /**
   * @param {string} value
   * @param {boolean=} isPrimary
   */
  async _createFontSelector(value, isPrimary) {
    value = value ? value.trim() : '';
    if (value.includes(' ') && value.charAt(0) !== '\'') {
      value = '\'' + value + '\'';
    }
    if (value.charAt(0) === '\'' && !value.includes(' ')) {
      value = value.replace(/\'/g, '');
    }
    const selectorField = this._fontSelectorSection.createChild('div', 'shadow-editor-field shadow-editor-flex-field');
    if (!this._fontsList) {
      this._fontsList = await this._createFontsList();
    }
    /** @type {FontEditor.FontSelectorObject} */
    let fontSelectorObject;
    let label;
    if (isPrimary) {
      label = ls`Font Family`;
      const globalValuesMap = new Map([['Global Values', ['inherit', 'initial', 'unset']]]);
      const primaryFontList = [...this._fontsList];
      primaryFontList.push(globalValuesMap);
      fontSelectorObject = this._createSelector(selectorField, label, primaryFontList, value.trim());
    } else {
      label = ls`Fallback ${this._fontSelectors.length}`;
      fontSelectorObject = this._createSelector(selectorField, label, this._fontsList, value.trim());
    }

    const deleteToolbar = new UI.Toolbar.Toolbar('', selectorField);
    const deleteButton = new UI.Toolbar.ToolbarButton(ls`Delete ${label}`, 'largeicon-trash-bin');
    deleteButton.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, () => {
      if (!isPrimary) {
        this._deleteFontSelector(fontSelectorObject);
      } else if (this._fontSelectors[1]) {
        fontSelectorObject.input.value = this._fontSelectors[1].input.value;
        this._deleteFontSelector(this._fontSelectors[1]);
      } else {
        fontSelectorObject.input.value = '';
        this._onFontSelectorChanged();
      }
    });
    deleteButton.element.addEventListener('keydown', event => {
      if (isEnterKey(event)) {
        this._deleteFontSelector(fontSelectorObject);
        event.consume();
      }
    }, false);
    deleteToolbar.appendToolbarItem(deleteButton);

    this._fontSelectors.push(fontSelectorObject);
  }

  /**
   * @param {!FontEditor.FontSelectorObject} fontSelectorObject
   */
  _deleteFontSelector(fontSelectorObject) {
    if (this._fontSelectors.length === 1) {
      this._fontSelectors[0].input.value = '';
    } else if (fontSelectorObject.input.parentNode) {
      this._fontSelectorSection.removeChild(fontSelectorObject.input.parentNode);
      const index = this._fontSelectors.indexOf(fontSelectorObject);
      this._fontSelectors.splice(index, 1);
      this._updateFontSelectorList();
    }
    this._onFontSelectorChanged();
    this._resizePopout();
  }

  _updateFontSelectorList() {
    for (let i = 0; i < this._fontSelectors.length; i++) {
      if (i === 0) {
        this._fontSelectors[i].label.textContent = ls`Font Family`;
      } else {
        this._fontSelectors[i].label.textContent = ls`Fallback ${i}`;
      }
    }
  }

  /**
   * @param {string} name
   * @param {RegExp} regex
   * @return {!FontEditor.PropertyInfo | Object}
   */
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

  /**
   * @param {Element} field
   * @param {Element} label
   * @param {!Array<Map<string, !Array<string>>>} options
   * @param {string} currentValue
   * @return {!FontEditor.FontSelectorObject}
   */
  _createSelector(field, label, options, currentValue) {
    const selectInput = UI.UIUtils.createSelect(label, options);
    if (this._isFontFamilyOverloaded) {
      selectInput.classList.add('error-input');
    }
    selectInput.value = currentValue;
    const selectLabel = UI.UIUtils.createLabel(label, 'shadow-editor-label', selectInput);
    selectInput.addEventListener('input', this._onFontSelectorChanged.bind(this), false);
    selectInput.addEventListener('keydown', event => {
      if (isEnterKey(event)) {
        event.consume();
      }
    }, false);
    field.appendChild(selectLabel);
    field.appendChild(selectInput);
    return {label: selectLabel, input: selectInput};
  }

  _onFontSelectorChanged() {
    let value = '';
    const isGlobalValue = globalValues.includes(this._fontSelectors[0].input.value);

    if (isGlobalValue) {
      while (this._fontSelectors.length > 1) {
        this._deleteFontSelector(this._fontSelectors[1]);
      }
    }
    for (let i = 0; i < this._fontSelectors.length; i++) {
      const fontSelectorInput = this._fontSelectors[i].input;
      if (fontSelectorInput.value !== '') {
        if (value === '') {
          value = this._fontSelectors[0].input.value;
        } else {
          value += ', ' + fontSelectorInput.value;
        }
      }
    }
    if (this._fontSelectors[this._fontSelectors.length - 1].input.value !== '' && !isGlobalValue &&
        this._fontSelectors.length < 10) {
      this._createFontSelector(ls`Fallback`, '');
      this._resizePopout();
    }
    this._selectedNode.domModel().cssModel().addEventListener(
        SDK.CSSModel.Events.ComputedStyleUpdated, this._boundUpdateRenderedList, false);
    this._updatePropertyValue('font-family', value);
  }

  _updatePropertyValue(propertyName, value) {
    this.dispatchEventToListeners(Events.FontChanged, {propertyName: propertyName, value: value});
  }

  _resizePopout() {
    this.dispatchEventToListeners(Events.FontEditorResized);
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

/**
 * @typedef {{label: !Element, input: !Element}}
 */
FontEditor.FontSelectorObject;


/**
 * @typedef {{min: number, max: number, step: number}}
 */
FontEditor.PropertyRange;

/** @enum {symbol} */
export const Events = {
  FontChanged: Symbol('FontChanged'),
  FontEditorResized: Symbol('FontEditorResized'),
};

class FontPropertyInputs {
  /**
   * @param {string} propertyName
   * @param {string} label
   * @param {!Element} field
   * @param {!FontEditor.PropertyInfo} propertyInfo
   * @param {!Map<string, !FontEditor.PropertyRange>} rangeMap
   * @param {function} updateCallback
   * @param {!CssOverviewModule.CSSOverviewModel} model
   * @param {boolean=} hasUnits
   */
  constructor(propertyName, label, field, propertyInfo, rangeMap, updateCallback, model, hasUnits) {
    this._showSliderMode = true;
    const propertyField = field.createChild('div', 'shadow-editor-field shadow-editor-flex-field');
    this._propertyInfo = propertyInfo;
    this._model = model;
    this._propertyName = propertyName;

    // Unit handling
    this._hasUnits = hasUnits;
    if (this._hasUnits) {
      this._units = propertyInfo.units !== undefined ? propertyInfo.units : unitMap.get(propertyName)[0];
    } else {
      this._units = '';
    }
    this._rangeMap = rangeMap;
    if (this._hasUnits) {
      this._addedUnit = unitMap.get(this._propertyName).includes(this._units) ? undefined : this._units;
    }
    this._range = this._getUnitRange();

    this._boundUpdateCallback = updateCallback;
    this._selectedNode = self.UI.context.flavor(SDK.DOMModel.DOMNode);
    this._sliderInput = this._createSliderInput(propertyField, label);
    this._textInput = this._createTextInput(propertyField);
    this._unitInput = this._createUnitInput(propertyField);
    this._selectorInput = this._createSelectorInput(propertyField);
    this._createTypeToggle(propertyField);
    this._checkSelectorValueAndToggle();
  }

  /**
   * @return {boolean}
   */
  _checkSelectorValueAndToggle() {
    const valuesArray = selectorInputValuesMap.get(this._propertyName);
    if (valuesArray && (valuesArray.indexOf(this._propertyInfo.value) !== -1)) {
      this._toggleInputType();
      return true;
    }
    return false;
  }

  /**
   * @return {!Array<number>}
   */
  _getUnitRange() {
    let min, max, step;
    if (/\d/.test(this._propertyInfo.value)) {
      if (this._rangeMap.get(this._units)) {
        min = Math.min(this._rangeMap.get(this._units).min, this._propertyInfo.value);
        max = Math.max(this._rangeMap.get(this._units).max, this._propertyInfo.value);
        step = this._rangeMap.get(this._units).step;
      } else {
        min = Math.min(this._rangeMap.get('px').min, this._propertyInfo.value);
        max = Math.max(this._rangeMap.get('px').max, this._propertyInfo.value);
        step = this._rangeMap.get('px').step;
      }
    } else {
      min = this._rangeMap.get(this._units).min;
      max = this._rangeMap.get(this._units).max;
      step = this._rangeMap.get(this._units).step;
    }
    return [min, max, step];
  }

  /**
   * @param {!Element} field
   * @param {string} label
   * @return {!Element}
   */
  _createSliderInput(field, label) {
    const min = this._range[0];
    const max = this._range[1];
    const step = this._range[2];
    const slider = UI.UIUtils.createSlider(min, max, -1);
    slider.sliderElement.step = step;
    slider.sliderElement.tabIndex = 0;
    const sliderLabel = UI.UIUtils.createLabel(label, 'shadow-editor-label', slider);
    if (this._propertyInfo.value) {
      slider.value = this._propertyInfo.value;
    } else {
      slider.value = (min + max) / 2;
    }
    slider.addEventListener('input', this._onSliderInput.bind(this), false);
    field.appendChild(sliderLabel);
    field.appendChild(slider);
    UI.ARIAUtils.setAccessibleName(slider.sliderElement, ls`${this._propertyName} slider`);
    return slider;
  }

  /**
   * @param {!Element} field
   * @return {!Element}
   */
  _createTextInput(field) {
    const textInput = UI.UIUtils.createInput('shadow-editor-text-input', 'number');
    if (this._propertyInfo.isOverloaded) {
      textInput.classList.add('error-input');
    }

    const min = this._range[0];
    const max = this._range[1];
    textInput.min = min;
    textInput.max = max;
    textInput.classList.add('font-editor-text-input');
    textInput.value = this._propertyInfo.value;
    textInput.step = 'any';
    textInput.addEventListener('input', this._onTextInput.bind(this), false);
    field.appendChild(textInput);
    UI.ARIAUtils.setAccessibleName(textInput, ls`${this._propertyName} Text Input`);
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
      if (this._addedUnit) {
        unitInput.add(new Option(currentValue, currentValue));
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
    unitInput.addEventListener('keydown', event => {
      if (isEnterKey(event)) {
        event.consume();
      }
    }, false);
    field.appendChild(unitInput);
    UI.ARIAUtils.setAccessibleName(unitInput, ls`${this._propertyName} Unit Input`);

    return unitInput;
  }

  /**
   * @param {!Element} field
   * @return {!Element}
   */
  _createSelectorInput(field) {
    const options = selectorInputValuesMap.get(this._propertyName);
    const selectInput = UI.UIUtils.createSelect(ls`${this._propertyName} Selector Values`, options);
    if (this._propertyInfo.isOverloaded) {
      selectInput.classList.add('error-input');
    }
    selectInput.classList.add('font-selector-input');
    selectInput.value = this._propertyInfo.value;
    selectInput.addEventListener('input', this._onSelectorInput.bind(this), false);
    selectInput.addEventListener('keydown', event => {
      if (isEnterKey(event)) {
        event.consume();
      }
    }, false);
    field.appendChild(selectInput);
    selectInput.hidden = true;
    return selectInput;
  }

  /**
   * @param {!Event} event
   */
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
    const unitInput = event.currentTarget;
    const hasFocus = unitInput.hasFocus();
    const newUnit = unitInput.value;
    unitInput.disabled = true;
    const prevUnit = this._units;
    const conversionMultiplier = await this._getNumConversionMultiplier(
        1, prevUnit, newUnit, /* isFontInput= */ this._propertyName === 'font-size');
    const isPx = newUnit === 'px';
    this._setInputUnits(conversionMultiplier, newUnit, isPx);
    if (this._textInput.value) {
      this._boundUpdateCallback(this._propertyName, this._textInput.value + newUnit);
    }
    this._units = newUnit;
    unitInput.disabled = false;
    if (hasFocus) {
      unitInput.focus();
    }
  }

  /**
   * @param {!Element} field
   * @return {!Element}
   */
  _createTypeToggle(field) {
    const displaySwitcher = field.createChild('div', 'spectrum-switcher');
    appendSwitcherIcon(displaySwitcher);
    displaySwitcher.tabIndex = 0;
    self.onInvokeElement(displaySwitcher, this._toggleInputType.bind(this));
    UI.ARIAUtils.setAccessibleName(displaySwitcher, ls`Toggle Input Type`);
    UI.ARIAUtils.markAsButton(displaySwitcher);
    function appendSwitcherIcon(parentElement) {
      const icon = parentElement.createSVGChild('svg');
      icon.setAttribute('height', 16);
      icon.setAttribute('width', 16);
      const path = icon.createSVGChild('path');
      path.setAttribute('d', 'M5,6 L11,6 L8,2 Z M5,10 L11,10 L8,14 Z');
      return icon;
    }
  }

  /**
   * @param {!Event} event
   */
  _toggleInputType(event) {
    if (event && isEnterKey(event)) {
      event.consume();
    }
    if (this._showSliderMode) {
      // Show selector input type
      this._sliderInput.hidden = true;
      this._textInput.hidden = true;
      this._unitInput.hidden = true;
      this._selectorInput.hidden = false;
      this._showSliderMode = false;
      UI.ARIAUtils.alert(ls`Selector Input Mode`, this._textInput);
    } else {
      // Show sliderinput type
      this._sliderInput.hidden = false;
      this._textInput.hidden = false;
      this._unitInput.hidden = false;
      this._selectorInput.hidden = true;
      this._showSliderMode = true;
      UI.ARIAUtils.alert(ls`Slider Input Mode`, this._textInput);
    }
  }

  /**
   * @param {!number} baseMultiplier
   * @param {!string} prevUnit
   * @param {!string} newUnit
   * @param {boolean=} isFontSizeInput
   * @return {!Promise<number>}
   */
  async _getNumConversionMultiplier(baseMultiplier, prevUnit, newUnit, isFontSizeInput) {
    // If either prevUnit or newUnit is an unsupported unit type, we treat it as 'px'
    if (prevUnit === 'px') {
      if (newUnit === 'px') {
        return baseMultiplier;
      }
      if (newUnit === 'em' || (this._propertyName === 'line-height' && newUnit === '')) {
        const fontSizeNodeId = isFontSizeInput ? this._selectedNode.parentNode.id : this._selectedNode.id;
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
        const fontSizeNodeId = isFontSizeInput ? this._selectedNode.parentNode.id : this._selectedNode.id;
        let currentFontSize = await this._model.getComputedStyleForNode(fontSizeNodeId).then(computedArray => {
          return computedArray[19].value;
        });
        currentFontSize = currentFontSize.replace(/[a-z]/g, '');
        return baseMultiplier / currentFontSize * 100;
      }
      if (newUnit === 'vh') {
        const pageLayout = await this._selectedNode.domModel().target().pageAgent().invoke_getLayoutMetrics({});
        const viewportHeight = pageLayout.visualViewport.clientHeight;
        return baseMultiplier / (viewportHeight / 100);
      }
      if (newUnit === 'vw') {
        const pageLayout = await this._selectedNode.domModel().target().pageAgent().invoke_getLayoutMetrics({});
        const viewportWidth = pageLayout.visualViewport.clientWidth;
        return baseMultiplier / (viewportWidth / 100);
      }
      if (newUnit === 'vmin') {
        const pageLayout = await this._selectedNode.domModel().target().pageAgent().invoke_getLayoutMetrics({});
        const viewportWidth = pageLayout.visualViewport.clientWidth;
        const viewportHeight = pageLayout.visualViewport.clientHeight;
        const minViewportSize = Math.min(viewportWidth, viewportHeight);
        return baseMultiplier / (minViewportSize / 100);
      }
      if (newUnit === 'vmax') {
        const pageLayout = await this._selectedNode.domModel().target().pageAgent().invoke_getLayoutMetrics({});
        const viewportWidth = pageLayout.visualViewport.clientWidth;
        const viewportHeight = pageLayout.visualViewport.clientHeight;
        const maxViewportSize = Math.max(viewportWidth, viewportHeight);
        return baseMultiplier / (maxViewportSize / 100);
      }
      if (newUnit === 'cm') {
        return baseMultiplier / 37.795;
      }
      if (newUnit === 'mm') {
        return baseMultiplier / 3.7795;
      }
      if (newUnit === 'in') {
        return baseMultiplier / 96;
      }
      if (newUnit === 'pt') {
        return baseMultiplier / 1.333;
      }
      if (newUnit === 'pc') {
        return baseMultiplier / 16;
      }
      return 1;
    }
    if (prevUnit === 'em' || (this._propertyName === 'line-height' && prevUnit === '')) {
      const fontSizeNodeId = isFontSizeInput ? this._selectedNode.parentNode.id : this._selectedNode.id;
      let currentFontSize = await this._model.getComputedStyleForNode(fontSizeNodeId).then(computedArray => {
        return computedArray[19].value;
      });
      currentFontSize = currentFontSize.replace(/[a-z]/g, '');
      const emToPxValue = currentFontSize;
      return await this._getNumConversionMultiplier(emToPxValue, 'px', newUnit, isFontSizeInput);
    }
    if (prevUnit === 'rem') {
      const htmlNode = this._findHtmlNode();
      let rootFontSize = await this._model.getComputedStyleForNode(htmlNode.id).then(computedArray => {
        return computedArray[19].value;
      });
      rootFontSize = rootFontSize.replace(/[a-z]/g, '');
      const remToPxValue = rootFontSize;
      return await this._getNumConversionMultiplier(remToPxValue, 'px', newUnit, isFontSizeInput);
    }
    if (prevUnit === '%') {
      const fontSizeNodeId = isFontSizeInput ? this._selectedNode.parentNode.id : this._selectedNode.id;
      let currentFontSize = await this._model.getComputedStyleForNode(fontSizeNodeId).then(computedArray => {
        return computedArray[19].value;
      });
      currentFontSize = currentFontSize.replace(/[a-z]/g, '');
      const percentToPxValue = currentFontSize / 100;
      return await this._getNumConversionMultiplier(percentToPxValue, 'px', newUnit, isFontSizeInput);
    }
    if (prevUnit === 'vh') {
      const pageLayout = await this._selectedNode.domModel().target().pageAgent().invoke_getLayoutMetrics({});
      const viewportHeight = pageLayout.visualViewport.clientHeight;
      const vhToPxValue = viewportHeight / 100;
      return await this._getNumConversionMultiplier(vhToPxValue, 'px', newUnit, isFontSizeInput);
    }
    if (prevUnit === 'vw') {
      const pageLayout = await this._selectedNode.domModel().target().pageAgent().invoke_getLayoutMetrics({});
      const viewportWidth = pageLayout.visualViewport.clientWidth;
      const vwToPxValue = viewportWidth / 100;
      return await this._getNumConversionMultiplier(vwToPxValue, 'px', newUnit, isFontSizeInput);
    }
    if (prevUnit === 'vmin') {
      const pageLayout = await this._selectedNode.domModel().target().pageAgent().invoke_getLayoutMetrics({});
      const viewportWidth = pageLayout.visualViewport.clientWidth;
      const viewportHeight = pageLayout.visualViewport.clientHeight;
      const minViewportSize = Math.min(viewportWidth, viewportHeight);
      const vminToPxValue = minViewportSize / 100;
      return await this._getNumConversionMultiplier(vminToPxValue, 'px', newUnit, isFontSizeInput);
    }
    if (prevUnit === 'vmax') {
      const pageLayout = await this._selectedNode.domModel().target().pageAgent().invoke_getLayoutMetrics({});
      const viewportWidth = pageLayout.visualViewport.clientWidth;
      const viewportHeight = pageLayout.visualViewport.clientHeight;
      const maxViewportSize = Math.max(viewportWidth, viewportHeight);
      const vmaxToPxValue = maxViewportSize / 100;
      return await this._getNumConversionMultiplier(vmaxToPxValue, 'px', newUnit, isFontSizeInput);
    }
    if (prevUnit === 'cm') {
      const cmToPxMultiplier = 37.795;
      return await this._getNumConversionMultiplier(cmToPxMultiplier, 'px', newUnit, isFontSizeInput);
    }
    if (prevUnit === 'mm') {
      const mmToPxMultiplier = 3.7795;
      return await this._getNumConversionMultiplier(mmToPxMultiplier, 'px', newUnit, isFontSizeInput);
    }
    if (prevUnit === 'in') {
      const inToPxMultiplier = 96;
      return await this._getNumConversionMultiplier(inToPxMultiplier, 'px', newUnit, isFontSizeInput);
    }
    if (prevUnit === 'pt') {
      const ptToPxMultiplier = 1.333;
      return await this._getNumConversionMultiplier(ptToPxMultiplier, 'px', newUnit, isFontSizeInput);
    }
    if (prevUnit === 'pc') {
      const pcToPxMultiplier = 16;
      return await this._getNumConversionMultiplier(pcToPxMultiplier, 'px', newUnit, isFontSizeInput);
    }
    return 1;
  }

  /**
   * @param {number} multiplier
   * @param {string} newUnit
   */
  _setInputUnits(multiplier, newUnit) {
    let rangeObject = this._rangeMap.get(this._units);
    if (!rangeObject) {
      rangeObject = this._rangeMap.get('px');
    }
    const roundingPrecision = 3;

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

  /**
   * @return {!SDK.DOMModel.DOMNode}
   */
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
