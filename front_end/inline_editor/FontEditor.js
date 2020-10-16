// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

import * as FontEditorUnitConverter from './FontEditorUnitConverter.js';
import * as FontEditorUtils from './FontEditorUtils.js';

/**
 * @unrestricted
 */
export class FontEditor extends UI.Widget.VBox {
  /**
   * @param {!Map<string, string>} propertyMap
   */
  constructor(propertyMap) {
    super(true);
    this.registerRequiredCSS('inline_editor/fontEditor.css');
    this._selectedNode = UI.Context.Context.instance().flavor(SDK.DOMModel.DOMNode);

    this._propertyMap = propertyMap;
    this.contentElement.tabIndex = 0;
    this.setDefaultFocusedElement(this.contentElement);

    // Font Selector Section
    this._fontSelectorSection = this.contentElement.createChild('div');
    this._fontSelectorSection.setAttribute('style', 'overflow-y: auto; padding-bottom: 10px;');
    this._fontSelectorSection.createChild('h2', 'font-section-header').textContent = ls`Font Family`;

    /** @type {!Array<FontEditor.FontSelectorObject>} */
    this._fontSelectors = [];

    /** @type {string | undefined} */
    const propertyValue = this._propertyMap.get('font-family');

    this._createFontSelectorSection(propertyValue);

    //  CSS Font Property Section
    const cssPropertySection = this.contentElement.createChild('div', 'font-section');
    cssPropertySection.createChild('h2', 'font-section-header').textContent = ls`CSS Properties`;

    const fontSizePropertyInfo = this._getPropertyInfo('font-size', FontEditorUtils.FontSizeStaticParams.regex);

    const lineHeightPropertyInfo = this._getPropertyInfo('line-height', FontEditorUtils.LineHeightStaticParams.regex);

    const fontWeightPropertyInfo = this._getPropertyInfo('font-weight', FontEditorUtils.FontWeightStaticParams.regex);

    const letterSpacingPropertyInfo =
        this._getPropertyInfo('letter-spacing', FontEditorUtils.LetterSpacingStaticParams.regex);

    new FontPropertyInputs(
        'font-size', ls`Font Size`, cssPropertySection, fontSizePropertyInfo, FontEditorUtils.FontSizeStaticParams,
        this._updatePropertyValue.bind(this), this._resizePopout.bind(this), /** hasUnits= */ true);
    new FontPropertyInputs(
        'line-height', ls`Line Height`, cssPropertySection, lineHeightPropertyInfo,
        FontEditorUtils.LineHeightStaticParams, this._updatePropertyValue.bind(this), this._resizePopout.bind(this),
        /** hasUnits= */ true);
    new FontPropertyInputs(
        'font-weight', ls`Font Weight`, cssPropertySection, fontWeightPropertyInfo,
        FontEditorUtils.FontWeightStaticParams, this._updatePropertyValue.bind(this), this._resizePopout.bind(this),
        /** hasUnits= */ false);
    new FontPropertyInputs(
        'letter-spacing', ls`Spacing`, cssPropertySection, letterSpacingPropertyInfo,
        FontEditorUtils.LetterSpacingStaticParams, this._updatePropertyValue.bind(this), this._resizePopout.bind(this),
        /** hasUnits= */ true);
  }

  /**
   * @param {string=} propertyValue
   */
  async _createFontSelectorSection(propertyValue) {
    if (propertyValue) {
      const splitValue = propertyValue.split(',');
      await this._createFontSelector(splitValue[0], true);
      if (!FontEditorUtils.GlobalValues.includes(splitValue[0])) {
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
    const computedFontArray = await FontEditorUtils.generateComputedFontArray();
    const computedMap = new Map();
    const splicedArray = this._splitComputedFontArray(computedFontArray);

    computedMap.set('Computed Fonts', splicedArray);
    const systemMap = new Map();
    systemMap.set('System Fonts', FontEditorUtils.SystemFonts);
    systemMap.set('Generic Families', FontEditorUtils.GenericFonts);

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
      const globalValuesMap = new Map([['Global Values', FontEditorUtils.GlobalValues]]);
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
    const value = this._propertyMap.get(name);
    if (value) {
      const valueString = value;
      const match = valueString.match(regex);
      if (match) {
        return {value: match[1], units: match[2] ? match[2] : ''};
      }
      return {value: valueString, units: null};
    }
    return {value: null, units: null};
  }

  /**
   * @param {Element} field
   * @param {string} label
   * @param {!Array<Map<string, !Array<string>>>} options
   * @param {string} currentValue
   * @return {!FontEditor.FontSelectorObject}
   */
  _createSelector(field, label, options, currentValue) {
    /** @type {!HTMLSelectElement} */
    const selectInput = /** @type {!HTMLSelectElement} */ (UI.UIUtils.createSelect(label, options));
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
    const isGlobalValue = FontEditorUtils.GlobalValues.includes(this._fontSelectors[0].input.value);

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
 * @typedef {{value: ?string, units: ?string}}
 */
FontEditor.PropertyInfo;

/**
 * @typedef {{label: !Element, input: !HTMLSelectElement}}
 */
FontEditor.FontSelectorObject;

/**
 * @typedef {{min: number, max: number, step: number}}
 */
FontEditor.PropertyRange;

/**
 * @typedef {{regex: !RegExp, unitsArray: ?Array<string>, valueArray: !Array<string>, rangeMap: !Map<string, FontEditor.PropertyRange>}}
 */
FontEditor.FontPropertyInputStaticParams;

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
   * @param {!FontEditor.FontPropertyInputStaticParams} staticParams
   * @param {function} updateCallback
   * @param {function} resizeCallback
   * @param {boolean=} hasUnits
   */
  constructor(propertyName, label, field, propertyInfo, staticParams, updateCallback, resizeCallback, hasUnits) {
    this._showSliderMode = true;
    const propertyField = field.createChild('div', 'shadow-editor-field shadow-editor-flex-field');
    /** @type {!HTMLElement} */
    this._errorText = /** @type {!HTMLElement} */ (field.createChild('div', 'error-text'));
    this._errorText.textContent = ls`* Please enter a valid value for ${propertyName} text input`;
    this._errorText.hidden = true;
    UI.ARIAUtils.markAsAlert(this._errorText);
    this._propertyInfo = propertyInfo;
    this._propertyName = propertyName;
    this._staticParams = staticParams;

    // Unit handling
    this._hasUnits = hasUnits;
    if (this._hasUnits && this._staticParams.unitsArray) {
      const defaultUnits = this._staticParams.unitsArray[0];
      this._units = propertyInfo.units !== null ? propertyInfo.units : defaultUnits;
    } else {
      this._units = '';
    }
    if (this._hasUnits) {
      if (this._staticParams.unitsArray) {
        this._addedUnit = this._staticParams.unitsArray.includes(this._units) ? undefined : this._units;
      }
    }
    this._initialRange = this._getUnitRange();

    this._boundUpdateCallback = updateCallback;
    this._boundResizeCallback = resizeCallback;
    this._selectedNode = UI.Context.Context.instance().flavor(SDK.DOMModel.DOMNode);
    this._sliderInput = this._createSliderInput(propertyField, label);
    this._textInput = this._createTextInput(propertyField);
    this._unitInput = this._createUnitInput(propertyField);
    this._selectorInput = this._createSelectorInput(propertyField);
    this._createTypeToggle(propertyField);
    this._checkSelectorValueAndToggle();
  }

  /**
   * @param {boolean} invalid
   */
  _setInvalidTextInput(invalid) {
    if (invalid) {
      if (this._errorText.hidden) {
        this._errorText.hidden = false;
        this._textInput.classList.add('error-input');
        this._boundResizeCallback();
      }
    } else {
      if (!this._errorText.hidden) {
        this._errorText.hidden = true;
        this._textInput.classList.remove('error-input');
        this._boundResizeCallback();
      }
    }
  }

  /**
   * @return {boolean}
   */
  _checkSelectorValueAndToggle() {
    if (this._staticParams.valueArray && this._propertyInfo.value !== null &&
        (this._staticParams.valueArray.indexOf(this._propertyInfo.value) !== -1)) {
      this._toggleInputType();
      return true;
    }
    return false;
  }

  /**
   * @return {!{min: number, max: number, step: number}}
   */
  _getUnitRange() {
    let min = 0;
    let max = 100;
    let step = 1;
    if (this._propertyInfo.value !== null && /\d/.test(this._propertyInfo.value)) {
      if (this._staticParams.rangeMap.get(this._units)) {
        const unitRangeMap = this._staticParams.rangeMap.get(this._units);
        if (unitRangeMap) {
          min = Math.min(unitRangeMap.min, parseFloat(this._propertyInfo.value));
          max = Math.max(unitRangeMap.max, parseFloat(this._propertyInfo.value));
          step = unitRangeMap.step;
        }
      } else {
        const unitRangeMap = this._staticParams.rangeMap.get('px');
        if (unitRangeMap) {
          min = Math.min(unitRangeMap.min, parseFloat(this._propertyInfo.value));
          max = Math.max(unitRangeMap.max, parseFloat(this._propertyInfo.value));
          step = unitRangeMap.step;
        }
      }
    } else {
      const unitRangeMap = this._staticParams.rangeMap.get(this._units);
      if (unitRangeMap) {
        min = unitRangeMap.min;
        max = unitRangeMap.max;
        step = unitRangeMap.step;
      }
    }
    return {min, max, step};
  }

  /**
   * @param {!Element} field
   * @param {string} label
   * @return {!UI.UIUtils.DevToolsSlider}
   */
  _createSliderInput(field, label) {
    const min = this._initialRange.min;
    const max = this._initialRange.max;
    const step = this._initialRange.step;

    /** @type {!UI.UIUtils.DevToolsSlider} */
    const slider = /** @type {!UI.UIUtils.DevToolsSlider} */ (UI.UIUtils.createSlider(min, max, -1));
    slider.sliderElement.step = step.toString();
    slider.sliderElement.tabIndex = 0;
    const sliderLabel = UI.UIUtils.createLabel(label, 'shadow-editor-label', slider);
    if (this._propertyInfo.value) {
      slider.value = parseFloat(this._propertyInfo.value);
    } else {
      const newValue = (min + max) / 2;
      slider.value = newValue;
    }
    slider.addEventListener('input', event => {
      this._onSliderInput(event, /** apply= */ false);
    });

    slider.addEventListener('mouseup', event => {
      this._onSliderInput(event, /** apply= */ true);
    });
    slider.addEventListener('keydown', event => {
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

    textInput.step = this._initialRange.step.toString();
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
   * @return {!HTMLSelectElement}
   */
  _createUnitInput(field) {
    /** @type {HTMLSelectElement} */
    let unitInput;
    if (this._hasUnits) {
      const currentValue = this._propertyInfo.units;
      const options = this._staticParams.unitsArray;
      if (!options) {
        throw new Error(ls`Unknown property name: ${this._propertyName}`);
      }
      unitInput = UI.UIUtils.createSelect(ls`Units`, options);
      unitInput.classList.add('font-editor-select');
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
   * @return {!HTMLSelectElement}
   */
  _createSelectorInput(field) {
    /** @type {!HTMLSelectElement} */
    const selectInput =
        UI.UIUtils.createSelect(ls`${this._propertyName} Selector Values`, this._staticParams.valueArray);
    selectInput.classList.add('font-selector-input');
    if (this._propertyInfo.value) {
      selectInput.value = this._propertyInfo.value;
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
      const value = /** @type {!HTMLInputElement} */ (event.currentTarget).value;
      this._textInput.value = '';
      const newValue =
          (parseFloat(this._sliderInput.sliderElement.min) + parseFloat(this._sliderInput.sliderElement.max)) / 2;
      this._sliderInput.value = newValue;
      this._setInvalidTextInput(false);
      this._boundUpdateCallback(this._propertyName, value);
    }
  }

  /**
   * @param {!Event} event
   * @param {boolean} apply
   */
  _onSliderInput(event, apply) {
    /** @type {?HTMLInputElement} */
    const target = /** @type {HTMLInputElement} */ (event.currentTarget);
    if (target) {
      const value = target.value;
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
    /** @type {?HTMLInputElement} */
    const target = /** @type {HTMLInputElement} */ (event.currentTarget);
    if (target) {
      const value = target.value;
      const units = value === '' ? '' : this._unitInput.value;
      const valueString = value + units;
      if (this._staticParams.regex.test(valueString) || (value === '' && !target.validationMessage.length)) {
        if (parseFloat(value) > parseFloat(this._sliderInput.sliderElement.max)) {
          this._sliderInput.sliderElement.max = value;
        } else if (parseFloat(value) < parseFloat(this._sliderInput.sliderElement.min)) {
          this._sliderInput.sliderElement.min = value;
        }
        this._sliderInput.value = parseFloat(value);
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
    const unitInput = /** @type {HTMLInputElement} */ (event.currentTarget);
    const hasFocus = unitInput.hasFocus();
    const newUnit = unitInput.value;
    unitInput.disabled = true;
    const prevUnit = this._units;
    const conversionMultiplier = await FontEditorUnitConverter.getUnitConversionMultiplier(
        prevUnit, newUnit, this._propertyName === 'font-size');
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
    const displaySwitcher = /** @type {HTMLElement} */ (field.createChild('div', 'spectrum-switcher'));
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
   * @param {number} multiplier
   * @param {string} newUnit
   */
  _setInputUnits(multiplier, newUnit) {
    const newRangeMap = this._staticParams.rangeMap.get(newUnit);
    let newMin, newMax, newStep;
    if (newRangeMap) {
      newMin = newRangeMap.min;
      newMax = newRangeMap.max;
      newStep = newRangeMap.step;
    } else {
      newMin = 0;
      newMax = 100;
      newStep = 1;
    }
    let hasValue = false;
    const roundingPrecision = this._getRoundingPrecision(newStep);
    let newValue =
        (parseFloat(this._sliderInput.sliderElement.min) + parseFloat(this._sliderInput.sliderElement.max)) / 2;
    if (this._textInput.value) {
      hasValue = true;
      newValue = parseFloat((parseFloat(this._textInput.value) * multiplier).toFixed(roundingPrecision));
    }
    this._sliderInput.sliderElement.min = Math.min(newValue, newMin).toString();
    this._sliderInput.sliderElement.max = Math.max(newValue, newMax).toString();
    this._sliderInput.sliderElement.step = newStep.toString();
    this._textInput.step = newStep.toString();
    if (hasValue) {
      this._textInput.value = newValue.toString();
    }
    this._sliderInput.value = newValue;
  }

  /**
   * @param {number} step
   */
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
}
