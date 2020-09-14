// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// @ts-nocheck
// TODO(crbug.com/1011811): Enable TypeScript compiler checks

import * as CssOverviewModule from '../css_overview/css_overview.js';
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

import {CSSLength, CSSShadowModel} from './CSSShadowModel.js';  // eslint-disable-line no-unused-vars

const fontSizeRegex = /(^[\d\.]+)([a-zA-Z%]+)/;
const lineHeightRegex = /(^[\d\.]+)([a-zA-Z%]*)/;
const fontWeightRegex = /(^[\d\.]+)/;
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

const systemFonts = [
  'Arial',
  'Bookman',
  'Candara',
  'Comic Sans MS',
  'Courier New',
  'Garamond',
  'Georgia',
  'Helvetica',
  'Impact',
  'Palatino',
  'Roboto',
  'Times New Roman',
  'Verdana',
];

const genericFonts = [
  'serif',
  'sans-serif',
  'monspace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
  'ui-rounded',
  'emoji',
  'math',
  'fangsong',
];

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

let computedArrayFontSizeIndex = 7;

/**
 * @unrestricted
 */
export class FontEditor extends UI.Widget.VBox {
  /**
   * @param {!Map<string, FontEditor.PropertyInfo>} propertyMap
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

    // Font Selector Section
    this._fontSelectorSection = this.contentElement.createChild('div');
    this._fontSelectorSection.setAttribute('style', 'overflow-y: auto; padding-bottom: 10px;');
    this._fontSelectorSection.createChild('h2', 'font-section-header').textContent = ls`Font Family`;

    /** @type {!Array<FontEditor.FontSelectorObject>} */
    this._fontSelectors = [];

    /** @type {FontEditor.PropertyInfo | undefined} */
    const propertyValue = this._propertyMap.get('font-family');

    this._createFontSelectorSection(propertyValue);

    //  CSS Font Property Section
    const cssPropertySection = this.contentElement.createChild('div', 'font-section');
    cssPropertySection.createChild('h2', 'font-section-header').textContent = ls`CSS Properties`;

    const fontSizePropertyInfo = this._getPropertyInfo('font-size', fontSizeRegex);

    const lineHeightPropertyInfo = this._getPropertyInfo('line-height', lineHeightRegex);

    const fontWeightPropertyInfo = this._getPropertyInfo('font-weight', fontWeightRegex);

    const letterSpacingPropertyInfo = this._getPropertyInfo('letter-spacing', letterSpacingRegex);

    new FontPropertyInputs(
        'font-size', ls`Font Size`, cssPropertySection, fontSizePropertyInfo, fontSizeRangeMap, fontSizeRegex,
        this._updatePropertyValue.bind(this), this._resizePopout.bind(this), this._model, true);
    new FontPropertyInputs(
        'line-height', ls`Line Height`, cssPropertySection, lineHeightPropertyInfo, lineHeightRangeMap, lineHeightRegex,
        this._updatePropertyValue.bind(this), this._resizePopout.bind(this), this._model, true);
    new FontPropertyInputs(
        'font-weight', ls`Font Weight`, cssPropertySection, fontWeightPropertyInfo, fontWeightRangeMap, fontWeightRegex,
        this._updatePropertyValue.bind(this), this._resizePopout.bind(this), this._model, false);
    new FontPropertyInputs(
        'letter-spacing', ls`Spacing`, cssPropertySection, letterSpacingPropertyInfo, letterSpacingRangeMap,
        letterSpacingRegex, this._updatePropertyValue.bind(this), this._resizePopout.bind(this), this._model, true);
  }

  async _createFontSelectorSection(propertyValue) {
    if (propertyValue && propertyValue.value) {
      this._isFontFamilyOverloaded = propertyValue.isOverloaded;
      const splitValue = propertyValue.value.split(',');
      await this._createFontSelector(splitValue[0], true);
      if (!globalValues.includes(splitValue[0])) {
        for (let i = 1; i < splitValue.length + 1; i++) {
          this._createFontSelector(splitValue[i]);
        }
      }
    } else {
      this._createFontSelector('', true);
    }
    this._resizePopout();
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
    systemMap.set('System Fonts', systemFonts);
    systemMap.set('Generic Families', genericFonts);

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
            array.push(element.trim().replace(/"/g, ''));
          }
        });
      } else if (
          array.findIndex(item => item.toLowerCase() === computedFontArray[i].toLowerCase().replace('"', '\'')) ===
          -1) {
        array.push(computedFontArray[i].replace(/"/g, ''));
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
    if (value.charAt(0) === '\'') {
      value = value.replace(/\'/g, '');
    } else if (value.charAt(0) === '\"') {
      value = value.replace(/\"/g, '');
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
    deleteButton.element.addEventListener(
        'keydown',
        /** @param {!Event} event */
        event => {
          if (isEnterKey(event)) {
            this._deleteFontSelector(fontSelectorObject);
            event.consume();
          }
        },
        false);
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
   * @return {!FontEditor.PropertyInfo}
   */
  _getPropertyInfo(name, regex) {
    // Check what happens if match doesn't work
    const value = this._propertyMap.get(name);
    if (value && value.value) {
      const valueString = value.value;
      const match = valueString.match(regex);
      if (match) {
        return {value: match[1], units: match[2] ? match[2] : '', isOverloaded: value.isOverloaded};
      }
      return {value: valueString, units: null, isOverloaded: value.isOverloaded};
    }
    return {value: null, units: null, isOverloaded: null};
  }

  /**
   * @param {Element} field
   * @param {string} label
   * @param {!Array<Map<string, !Array<string>>>} options
   * @param {string} currentValue
   * @return {!FontEditor.FontSelectorObject}
   */
  _createSelector(field, label, options, currentValue) {
    /** @type {!HTMLInputElement} */
    const selectInput = UI.UIUtils.createSelect(label, options);
    if (this._isFontFamilyOverloaded) {
      // selectInput.classList.add('warning-input');
    }
    selectInput.value = currentValue;
    const selectLabel = UI.UIUtils.createLabel(label, 'shadow-editor-label', selectInput);
    selectInput.addEventListener('input', this._onFontSelectorChanged.bind(this), false);
    selectInput.addEventListener(
        'keydown',
        /** @param {!Event} event */
        event => {
          if (isEnterKey(event)) {
            event.consume();
          }
        },
        false);
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
      this._createFontSelector(ls`Fallback`);
      this._resizePopout();
    }
    this._updatePropertyValue('font-family', value);
  }

  /**
   * @param {string} propertyName
   * @param {string} value
   */
  _updatePropertyValue(propertyName, value) {
    this.dispatchEventToListeners(Events.FontChanged, {propertyName, value});
  }

  _resizePopout() {
    this.dispatchEventToListeners(Events.FontEditorResized);
  }
}
/**
 * @typedef {{name: string, slider: !HTMLInputElement, textInput: !HTMLInputElement, unitInput: HTMLInputElement | undefined, units: string | undefined}}
 */
FontEditor.PropertyInputs;

/**
 * @typedef {{value: ?string, units: ?string, isOverloaded: ?boolean}}
 */
FontEditor.PropertyInfo;

/**
 * @typedef {{label: !Element, input: !HTMLInputElement}}
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
   * @param {!RegExp} regex
   * @param {function} updateCallback
   * @param {function} resizeCallback
   * @param {!CssOverviewModule.CSSOverviewModel} model
   * @param {boolean=} hasUnits
   */
  constructor(
      propertyName, label, field, propertyInfo, rangeMap, regex, updateCallback, resizeCallback, model, hasUnits) {
    this._showSliderMode = true;
    const propertyField = field.createChild('div', 'shadow-editor-field shadow-editor-flex-field');
    this._errorText = field.createChild('div', 'error-text');
    this._errorText.textContent = ls`* Please enter a valid value for ${propertyName} text input`;
    this._errorText.hidden = true;
    UI.ARIAUtils.markAsAlert(this._errorText);
    this._propertyInfo = propertyInfo;
    this._model = model;
    this._propertyName = propertyName;
    const propertyUnitMap = unitMap.get(propertyName);
    const defaultUnits = propertyUnitMap ? propertyUnitMap[0] : '';

    // Unit handling
    this._hasUnits = hasUnits;
    if (this._hasUnits) {
      this._units = propertyInfo.units !== null ? propertyInfo.units : defaultUnits;
    } else {
      this._units = '';
    }
    this._rangeMap = rangeMap;
    if (this._hasUnits) {
      if (propertyUnitMap) {
        this._addedUnit = propertyUnitMap.includes(this._units) ? undefined : this._units;
      }
    }
    this._range = this._getUnitRange();
    this._regex = regex;

    this._boundUpdateCallback = updateCallback;
    this._boundResizeCallback = resizeCallback;
    this._selectedNode = self.UI.context.flavor(SDK.DOMModel.DOMNode);
    this._sliderInput = this._createSliderInput(propertyField, label);
    this._textInput = this._createTextInput(propertyField);
    this._unitInput = this._createUnitInput(propertyField);
    this._selectorInput = this._createSelectorInput(propertyField);
    this._createTypeToggle(propertyField);
    this._checkSelectorValueAndToggle();
  }

  _setInvalidTextInput(invalid) {
    if (invalid) {
      this._textInput.classList.add('error-input');
      this._errorText.hidden = false;
      this._boundResizeCallback();
    } else {
      this._textInput.classList.remove('error-input');
      this._errorText.hidden = true;
      this._boundResizeCallback();
    }
  }

  /**
   * @return {boolean}
   */
  _checkSelectorValueAndToggle() {
    const valuesArray = selectorInputValuesMap.get(this._propertyName);
    if (valuesArray && this._propertyInfo.value !== null && (valuesArray.indexOf(this._propertyInfo.value) !== -1)) {
      this._toggleInputType();
      return true;
    }
    return false;
  }

  /**
   * @return {!Array<number>}
   */
  _getUnitRange() {
    let min = 0;
    let max = 100;
    let step = 1;
    if (this._propertyInfo.value !== null && /\d/.test(this._propertyInfo.value)) {
      if (this._rangeMap.get(this._units)) {
        const unitRangeMap = this._rangeMap.get(this._units);
        if (unitRangeMap) {
          min = Math.min(unitRangeMap.min, parseFloat(this._propertyInfo.value));
          max = Math.max(unitRangeMap.max, parseFloat(this._propertyInfo.value));
          step = unitRangeMap.step;
        }
      } else {
        const unitRangeMap = this._rangeMap.get('px');
        if (unitRangeMap) {
          min = Math.min(unitRangeMap.min, parseFloat(this._propertyInfo.value));
          max = Math.max(unitRangeMap.max, parseFloat(this._propertyInfo.value));
          step = unitRangeMap.step;
        }
      }
    } else {
      const unitRangeMap = this._rangeMap.get(this._units);
      if (unitRangeMap) {
        min = unitRangeMap.min;
        max = unitRangeMap.max;
        step = unitRangeMap.step;
      }
    }
    return [min, max, step];
  }

  /**
   * @param {!Element} field
   * @param {string} label
   * @return {!HTMLInputElement}
   */
  _createSliderInput(field, label) {
    const min = this._range[0];
    const max = this._range[1];
    const step = this._range[2];

    /** @type {!HTMLInputElement} */
    const slider = UI.UIUtils.createSlider(min, max, -1);
    slider.sliderElement.step = step;
    slider.sliderElement.tabIndex = 0;
    const sliderLabel = UI.UIUtils.createLabel(label, 'shadow-editor-label', slider);
    if (this._propertyInfo.value) {
      slider.value = this._propertyInfo.value;
    } else {
      const newValue = (min + max) / 2;
      slider.value = newValue.toString();
    }
    slider.addEventListener(
        'input',
        /** @param {!Event} event */
        event => {
          this._onSliderInput(event, /** apply= */ false);
        });

    slider.addEventListener(
        'mouseup',
        /** @param {!Event} event */
        event => {
          this._onSliderInput(event, /** apply= */ true);
        });
    slider.addEventListener(
        'keydown',
        /** @param {!Event} event */
        event => {
          if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' ||
              event.key === 'ArrowRight') {
            this._onSliderInput(event, /** apply= */ true);
          }
        });
    field.appendChild(sliderLabel);
    field.appendChild(slider);
    UI.ARIAUtils.setAccessibleName(slider.sliderElement, ls`${this._propertyName} slider`);
    return slider;
  }

  /**
   * @param {!Element} field
   * @return {!HTMLInputElement}
   */
  _createTextInput(field) {
    /** @type {!HTMLInputElement} */
    const textInput = UI.UIUtils.createInput('shadow-editor-text-input', 'number');
    if (this._propertyInfo.isOverloaded) {
      // textInput.classList.add('warning-input');
    }

    textInput.step = this._range[2];
    textInput.classList.add('font-editor-text-input');
    if (this._propertyInfo.value !== null) {
      textInput.value = this._propertyInfo.value;
    }
    textInput.step = 'any';
    textInput.addEventListener('input', this._onTextInput.bind(this), false);
    field.appendChild(textInput);
    UI.ARIAUtils.setAccessibleName(textInput, ls`${this._propertyName} Text Input`);
    return textInput;
  }

  /**
   * @param {!Element} field
   * @return {!HTMLInputElement}
   */
  _createUnitInput(field) {
    let unitInput;
    if (this._hasUnits) {
      const currentValue = this._propertyInfo.units;
      const options = unitMap.get(this._propertyName);
      if (!options) {
        throw new Error(ls`Unknown property name: ${this._propertyName}`);
      }
      unitInput = UI.UIUtils.createSelect(ls`Units`, options);
      unitInput.classList.add('font-editor-select');
      if (this._propertyInfo.isOverloaded) {
        // unitInput.classList.add('warning-input');
      }
      if (this._addedUnit && currentValue) {
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
    unitInput.addEventListener(
        'keydown',
        /** @param {!Event} event */
        event => {
          if (isEnterKey(event)) {
            event.consume();
          }
        },
        false);
    field.appendChild(unitInput);
    UI.ARIAUtils.setAccessibleName(unitInput, ls`${this._propertyName} Unit Input`);

    return unitInput;
  }

  /**
   * @param {!Element} field
   * @return {!HTMLInputElement}
   */
  _createSelectorInput(field) {
    const options = selectorInputValuesMap.get(this._propertyName);
    if (!options) {
      throw new Error(ls`Unknown property name: ${this._propertyName}`);
    }
    /** @type {!HTMLInputElement} */
    const selectInput = UI.UIUtils.createSelect(ls`${this._propertyName} Selector Values`, options);
    if (this._propertyInfo.isOverloaded) {
      // selectInput.classList.add('warning-input');
    }
    selectInput.classList.add('font-selector-input');
    if (this._propertyInfo.value) {
      selectInput.value = this._propertyInfo.value.toString();
    }
    selectInput.addEventListener('input', this._onSelectorInput.bind(this), false);
    selectInput.addEventListener(
        'keydown',
        /** @param {!Event} event */
        event => {
          if (isEnterKey(event)) {
            event.consume();
          }
        },
        false);
    field.appendChild(selectInput);
    selectInput.hidden = true;
    return selectInput;
  }

  /**
   * @param {!Event} event
   */
  _onSelectorInput(event) {
    if (event.currentTarget) {
      const value = event.currentTarget.value;
      this._textInput.value = '';
      const newValue = (parseFloat(this._sliderInput.min) + parseFloat(this._sliderInput.max)) / 2;
      this._sliderInput.value = newValue.toString();
      this._setInvalidTextInput(false);
      this._boundUpdateCallback(this._propertyName, value);
    }
  }

  /**
   * @param {!Event} event
   * @param {boolean} apply
   */
  _onSliderInput(event, apply) {
    if (event.currentTarget) {
      const value = event.currentTarget.value;
      this._textInput.value = value;
      this._selectorInput.value = '';
      const valueString = this._hasUnits ? value + this._unitInput.value : value;
      this._setInvalidTextInput(false);
      if (apply) {
        this._boundUpdateCallback(this._propertyName, valueString);
      }
    }
  }

  /**
   * @param {!Event} event
   */
  _onTextInput(event) {
    if (event.currentTarget) {
      const value = event.currentTarget.value;
      const units = value === '' ? '' : this._unitInput.value;
      const valueString = value + units;
      if (this._regex.test(valueString) || (value === '' && !event.currentTarget.validationMessage.length)) {
        if (parseFloat(value) > parseFloat(this._sliderInput.sliderElement.max)) {
          this._sliderInput.sliderElement.max = value;
        } else if (parseFloat(value) < parseFloat(this._sliderInput.sliderElement.min)) {
          this._sliderInput.sliderElement.min = value;
        }
        this._sliderInput.value = value;
        this._selectorInput.value = '';
        this._setInvalidTextInput(false);
        this._boundUpdateCallback(this._propertyName, valueString);
      } else {
        this._setInvalidTextInput(true);
      }
    }
  }

  /**
   * @param {!Event} event
   */
  async _onUnitInput(event) {
    /** @type {!HTMLInputElement} */
    const unitInput = event.currentTarget;
    const hasFocus = unitInput.hasFocus();
    const newUnit = unitInput.value;
    unitInput.disabled = true;
    const prevUnit = this._units;
    const conversionMultiplier = await this._getNumConversionMultiplier(1, prevUnit, newUnit);
    this._setInputUnits(conversionMultiplier, newUnit);
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
   */
  _createTypeToggle(field) {
    /** @type {!HTMLElement} */
    const displaySwitcher = field.createChild('div', 'spectrum-switcher');
    appendSwitcherIcon(displaySwitcher);
    displaySwitcher.tabIndex = 0;
    self.onInvokeElement(displaySwitcher, this._toggleInputType.bind(this));
    UI.ARIAUtils.setAccessibleName(displaySwitcher, ls`Toggle Input Type`);
    UI.ARIAUtils.markAsButton(displaySwitcher);

    /** @param {!HTMLElement} parentElement */
    function appendSwitcherIcon(parentElement) {
      const icon = parentElement.createSVGChild('svg');
      icon.setAttribute('height', '16');
      icon.setAttribute('width', '16');
      const path = icon.createSVGChild('path');
      path.setAttribute('d', 'M5,6 L11,6 L8,2 Z M5,10 L11,10 L8,14 Z');
      return icon;
    }
  }

  /**
   * @param {Event=} event
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
   * @return {!Promise<number>}
   */
  async _getNumConversionMultiplier(baseMultiplier, prevUnit, newUnit) {
    // If either prevUnit or newUnit is an unsupported unit type, we treat it as 'px'
    const isFontSizeProperty = this._propertyName === 'font-size';
    if (prevUnit === 'px') {
      if (newUnit === 'px') {
        return baseMultiplier;
      }
      if (newUnit === 'em' || (this._propertyName === 'line-height' && newUnit === '')) {
        let currentFontSize;
        if (this._selectedNode.nodeName() !== 'HTML') {
          const fontSizeNodeId = isFontSizeProperty ? this._selectedNode.parentNode.id : this._selectedNode.id;
          currentFontSize = await this._model.getComputedStyleForNode(fontSizeNodeId)
                                .then(
                                    /** @param {!Array<Object<string, string>>} computedArray */
                                    computedArray => {
                                      if (computedArray[computedArrayFontSizeIndex].name !== 'font-size') {
                                        for (let i = 0; i < computedArray.length; i++) {
                                          if (computedArray[i].name === 'font-size') {
                                            computedArrayFontSizeIndex = i;
                                            break;
                                          }
                                        }
                                      }
                                      return computedArray[computedArrayFontSizeIndex].value;
                                    });
        } else {
          currentFontSize = '16px';
        }
        currentFontSize = currentFontSize.replace(/[a-z]/g, '');
        return baseMultiplier / currentFontSize;
      }
      if (newUnit === 'rem') {
        const htmlNode = this._findHtmlNode();
        let rootFontSize = await this._model.getComputedStyleForNode(htmlNode.id)
                               .then(
                                   /** @param {!Array<Object<string, string>>} computedArray */
                                   computedArray => {
                                     if (computedArray[computedArrayFontSizeIndex].name !== 'font-size') {
                                       for (let i = 0; i < computedArray.length; i++) {
                                         if (computedArray[i].name === 'font-size') {
                                           computedArrayFontSizeIndex = i;
                                           break;
                                         }
                                       }
                                     }
                                     return computedArray[computedArrayFontSizeIndex].value;
                                   });
        rootFontSize = rootFontSize.replace(/[a-z]/g, '');
        return baseMultiplier / rootFontSize;
      }
      if (newUnit === '%') {
        const fontSizeNodeId = isFontSizeProperty ? this._selectedNode.parentNode.id : this._selectedNode.id;
        let currentFontSize = await this._model.getComputedStyleForNode(fontSizeNodeId)
                                  .then(
                                      /** @param {!Array<Object<string, string>>} computedArray */
                                      computedArray => {
                                        if (computedArray[computedArrayFontSizeIndex].name !== 'font-size') {
                                          for (let i = 0; i < computedArray.length; i++) {
                                            if (computedArray[i].name === 'font-size') {
                                              computedArrayFontSizeIndex = i;
                                              break;
                                            }
                                          }
                                        }
                                        return computedArray[computedArrayFontSizeIndex].value;
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
      let currentFontSize;
      if (this._selectedNode.nodeName() !== 'HTML') {
        const fontSizeNodeId = isFontSizeProperty ? this._selectedNode.parentNode.id : this._selectedNode.id;
        currentFontSize = await this._model.getComputedStyleForNode(fontSizeNodeId)
                              .then(
                                  /** @param {!Array<Object<string, string>>} computedArray */
                                  computedArray => {
                                    if (computedArray[computedArrayFontSizeIndex].name !== 'font-size') {
                                      for (let i = 0; i < computedArray.length; i++) {
                                        if (computedArray[i].name === 'font-size') {
                                          computedArrayFontSizeIndex = i;
                                          break;
                                        }
                                      }
                                    }
                                    return computedArray[computedArrayFontSizeIndex].value;
                                  });
      } else {
        currentFontSize = '16px';
      }
      currentFontSize = currentFontSize.replace(/[a-z]/g, '');
      const emToPxValue = currentFontSize;
      return await this._getNumConversionMultiplier(emToPxValue, 'px', newUnit);
    }
    if (prevUnit === 'rem') {
      const htmlNode = this._findHtmlNode();
      let rootFontSize = await this._model.getComputedStyleForNode(htmlNode.id)
                             .then(
                                 /** @param {!Array<Object<string, string>>} computedArray */
                                 computedArray => {
                                   if (computedArray[computedArrayFontSizeIndex].name !== 'font-size') {
                                     for (let i = 0; i < computedArray.length; i++) {
                                       if (computedArray[i].name === 'font-size') {
                                         computedArrayFontSizeIndex = i;
                                         break;
                                       }
                                     }
                                   }
                                   return computedArray[computedArrayFontSizeIndex].value;
                                 });
      rootFontSize = rootFontSize.replace(/[a-z]/g, '');
      const remToPxValue = rootFontSize;
      return await this._getNumConversionMultiplier(remToPxValue, 'px', newUnit);
    }
    if (prevUnit === '%') {
      const fontSizeNodeId = isFontSizeProperty ? this._selectedNode.parentNode.id : this._selectedNode.id;
      let currentFontSize = await this._model.getComputedStyleForNode(fontSizeNodeId)
                                .then(
                                    /** @param {!Array<Object<string, string>>} computedArray */
                                    computedArray => {
                                      if (computedArray[computedArrayFontSizeIndex].name !== 'font-size') {
                                        for (let i = 0; i < computedArray.length; i++) {
                                          if (computedArray[i].name === 'font-size') {
                                            computedArrayFontSizeIndex = i;
                                            break;
                                          }
                                        }
                                      }
                                      return computedArray[computedArrayFontSizeIndex].value;
                                    });
      currentFontSize = currentFontSize.replace(/[a-z]/g, '');
      const percentToPxValue = currentFontSize / 100;
      return await this._getNumConversionMultiplier(percentToPxValue, 'px', newUnit);
    }
    if (prevUnit === 'vh') {
      const pageLayout = await this._selectedNode.domModel().target().pageAgent().invoke_getLayoutMetrics({});
      const viewportHeight = pageLayout.visualViewport.clientHeight;
      const vhToPxValue = viewportHeight / 100;
      return await this._getNumConversionMultiplier(vhToPxValue, 'px', newUnit);
    }
    if (prevUnit === 'vw') {
      const pageLayout = await this._selectedNode.domModel().target().pageAgent().invoke_getLayoutMetrics({});
      const viewportWidth = pageLayout.visualViewport.clientWidth;
      const vwToPxValue = viewportWidth / 100;
      return await this._getNumConversionMultiplier(vwToPxValue, 'px', newUnit);
    }
    if (prevUnit === 'vmin') {
      const pageLayout = await this._selectedNode.domModel().target().pageAgent().invoke_getLayoutMetrics({});
      const viewportWidth = pageLayout.visualViewport.clientWidth;
      const viewportHeight = pageLayout.visualViewport.clientHeight;
      const minViewportSize = Math.min(viewportWidth, viewportHeight);
      const vminToPxValue = minViewportSize / 100;
      return await this._getNumConversionMultiplier(vminToPxValue, 'px', newUnit);
    }
    if (prevUnit === 'vmax') {
      const pageLayout = await this._selectedNode.domModel().target().pageAgent().invoke_getLayoutMetrics({});
      const viewportWidth = pageLayout.visualViewport.clientWidth;
      const viewportHeight = pageLayout.visualViewport.clientHeight;
      const maxViewportSize = Math.max(viewportWidth, viewportHeight);
      const vmaxToPxValue = maxViewportSize / 100;
      return await this._getNumConversionMultiplier(vmaxToPxValue, 'px', newUnit);
    }
    if (prevUnit === 'cm') {
      const cmToPxMultiplier = 37.795;
      return await this._getNumConversionMultiplier(cmToPxMultiplier, 'px', newUnit);
    }
    if (prevUnit === 'mm') {
      const mmToPxMultiplier = 3.7795;
      return await this._getNumConversionMultiplier(mmToPxMultiplier, 'px', newUnit);
    }
    if (prevUnit === 'in') {
      const inToPxMultiplier = 96;
      return await this._getNumConversionMultiplier(inToPxMultiplier, 'px', newUnit);
    }
    if (prevUnit === 'pt') {
      const ptToPxMultiplier = 1.333;
      return await this._getNumConversionMultiplier(ptToPxMultiplier, 'px', newUnit);
    }
    if (prevUnit === 'pc') {
      const pcToPxMultiplier = 16;
      return await this._getNumConversionMultiplier(pcToPxMultiplier, 'px', newUnit);
    }
    return 1;
  }

  /**
   * @param {number} multiplier
   * @param {string} newUnit
   */
  _setInputUnits(multiplier, newUnit) {
    let rangeObject = this._rangeMap.get(this._units);
    const newRangeMap = this._rangeMap.get(newUnit);
    const newStep = newRangeMap ? newRangeMap.step : 1;
    let hasValue = false;
    if (!rangeObject) {
      rangeObject = this._rangeMap.get('px');
    }
    const roundingPrecision = this._getRoundingPrecision(newStep);
    let newValue = (parseFloat(this._sliderInput.min) + parseFloat(this._sliderInput.max)) / 2;
    if (this._textInput.value) {
      hasValue = true;
      newValue = parseFloat((parseFloat(this._textInput.value) * multiplier).toFixed(roundingPrecision));
    }
    this._sliderInput.sliderElement.min = Math.min(newValue, newRangeMap.min);
    this._sliderInput.sliderElement.max = Math.max(newValue, newRangeMap.max);
    this._sliderInput.sliderElement.step = newStep;
    this._textInput.step = newStep;
    if (hasValue) {
      this._textInput.value = newValue.toString();
    }
    this._sliderInput.value = newValue.toString();
  }

  _getRoundingPrecision(step) {
    switch (step) {
      case 1:
        return 0;
      case .1:
        return 1;
      case .01:
        return 2;
      case .001:
        return 3;
      default:
        return 0;
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
