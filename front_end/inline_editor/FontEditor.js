// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as UI from '../ui/ui.js';

import {CSSLength, CSSShadowModel} from './CSSShadowModel.js';  // eslint-disable-line no-unused-vars

const fontSizeRegex = /([0-9]+)(px|em|rem|%|vh|vw)/;
const lineHeightRegex = /([0-9.]+)(px|em|rem|%|vh|vw|)/;
const fontWeightRegex = /([0-9.]+)/;
const letterSpacingRegex = /([\-0-9.]+)(em|rem|px)/;

const fontSizeUnits = ['px', 'em', 'rem', '%', 'vh', 'vw'];
const lineHeightUnits = ['', 'px', 'em', '%'];
const letterSpacingUnits = ['px', 'em', 'rem'];

const fontSizeStep = 1;
const lineHeightStep = .1;
const fontWeightStep = 100;
const letterSpacingStep = .1;

/**
 * @unrestricted
 */
export class FontEditor extends UI.Widget.VBox {
  /**
   * @param {!Map<string, object>} propertyMap
   * @param {!Array<string>} computedFontArray
   */
  constructor(propertyMap, computedFontArray) {
    super(true);
    this.registerRequiredCSS('inline_editor/fontEditor.css');
    this._propertyMap = propertyMap;
    this.contentElement.tabIndex = 0;
    this.setDefaultFocusedElement(this.contentElement);
    this._fontsMap = new Map();
    this._isFontFamilyOverloaded = false;

    const computedMap = new Map();
    const splicedArray = this._splitComputedFontArray(computedFontArray);

    computedMap.set('Computed Fonts', splicedArray);
    const systemMap = new Map();
    systemMap.set('System Fonts', [
      'Arial', {text: 'Comic Sans MS', value: '\'Comic Sans MS\''}, {text: 'Courier New', value: '\'Courier New\''},
      'Helvetica', 'Impact', {text: 'Times New Roman', value: '\'Times New Roman\''}, 'Verdana'
    ]);

    /** @type {!Array<any>} */
    this._fontsList = [''];
    this._fontsList.push(computedMap);
    this._fontsList.push(systemMap);

    // Font Selector Section
    this._fontSelectorSection = this.contentElement.createChild('div');
    this._fontSelectorSection.setAttribute('style', 'overflow-y: auto');
    this._fontSelectorSection.createChild('h2', 'font-section-header').textContent = ls`Font Family`;
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

    const fontSizeField = cssPropertySection.createChild('div', 'shadow-editor-field shadow-editor-flex-field');

    /** @type {FontEditor.PropertyInputs} */
    this._fontSizeInputs = {
      slider: this._createSlider(fontSizeField, ls`Font Size`, 0, 100, fontSizePropertyInfo.value, fontSizeStep),
      textInput: this._createTextInput(
          fontSizeField, 0, 100, fontSizePropertyInfo.value, fontSizeStep, fontSizePropertyInfo.isOverloaded),
      unitInput: this._createUnitInput(
          fontSizeField, fontSizePropertyInfo.units ? fontSizePropertyInfo.units : 'px', fontSizeUnits,
          fontSizePropertyInfo.isOverloaded)
    };

    const lineHeightField = cssPropertySection.createChild('div', 'shadow-editor-field shadow-editor-flex-field');
    /** @type {FontEditor.PropertyInputs} */
    this._lineHeightInputs = {
      slider: this._createSlider(lineHeightField, ls`Line Height`, 0, 2, lineHeightPropertyInfo.value, lineHeightStep),
      textInput: this._createTextInput(
          lineHeightField, 0, 2, lineHeightPropertyInfo.value, lineHeightStep, lineHeightPropertyInfo.isOverloaded),
      unitInput: this._createUnitInput(
          lineHeightField, lineHeightPropertyInfo.units, lineHeightUnits, lineHeightPropertyInfo.isOverloaded)
    };

    const fontWeightField = cssPropertySection.createChild('div', 'shadow-editor-field shadow-editor-flex-field');
    /** @type {FontEditor.PropertyInputs} */
    this._fontWeightInputs = {
      slider:
          this._createSlider(fontWeightField, ls`Font Weight`, 100, 1000, fontWeightPropertyInfo.value, fontWeightStep),
      textInput: this._createTextInput(
          fontWeightField, 100, 1000, fontWeightPropertyInfo.value, fontWeightStep, fontWeightPropertyInfo.isOverloaded)
    };

    const letterSpacingField = cssPropertySection.createChild('div', 'shadow-editor-field shadow-editor-flex-field');
    /** @type {FontEditor.PropertyInputs} */
    this._letterSpacingInputs = {
      slider: this._createSlider(
          letterSpacingField, ls`Spacing`, -10, 10, letterSpacingPropertyInfo.value, letterSpacingStep),
      textInput: this._createTextInput(
          letterSpacingField, -10, 10, letterSpacingPropertyInfo.value, letterSpacingStep,
          letterSpacingPropertyInfo.isOverloaded),
      unitInput: this._createUnitInput(
          letterSpacingField, letterSpacingPropertyInfo.units, letterSpacingUnits,
          letterSpacingPropertyInfo.isOverloaded)
    };
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

  _createFontSelector(value, label) {
    value = value ? value : '';
    label = label ? label : ls`Fallback`;
    const selectorField = this._fontSelectorSection.createChild('div', 'shadow-editor-field shadow-editor-flex-field');
    const fontSelector = this._createSelector(selectorField, label, this._fontsList, value.trim());
    this._fontSelectors.push(fontSelector);
    return fontSelector;
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
      const propertyInfo = {value: match[1], units: match[2], isOverloaded: value.isOverloaded};
      return propertyInfo;
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
   * @param {!Element} field
   * @param {string} label
   * @param {number} min
   * @param {number} max
   * @param {string=} current
   * @param {number} stepSize
   * @return {!Element}
   */
  _createSlider(field, label, min, max, current, stepSize) {
    const slider = UI.UIUtils.createSlider(min, max, -1);
    slider.sliderElement.step = stepSize;
    const fontSizeLabel = UI.UIUtils.createLabel(label, 'shadow-editor-label', slider);
    if (current) {
      slider.value = current;
    } else {
      slider.value = (min + max) / 2;
    }
    slider.addEventListener('input', this._onSliderInput.bind(this), false);
    field.appendChild(fontSizeLabel);
    field.appendChild(slider);
    return slider;
  }

  /**
   * @param {!Element} field
   * @param {number} min
   * @param {number} max
   * @param {string=} current
   * @param {number} stepSize
   * @param {boolean=} isOverloaded
   * @return {!Element}
   */
  _createTextInput(field, min, max, current, stepSize, isOverloaded) {
    const textInput = UI.UIUtils.createInput('shadow-editor-text-input', 'number');
    if (isOverloaded) {
      textInput.classList.add('error-input');
    }
    textInput.min = min;
    textInput.max = max;
    textInput.classList.add('font-editor-text-input');
    if (current) {
      textInput.value = current;
    }
    if (stepSize) {
      textInput.step = stepSize;
    }
    textInput.addEventListener('input', this._onTextInput.bind(this), false);
    field.appendChild(textInput);
    return textInput;
  }

  _createUnitInput(field, current, options, isOverloaded) {
    const unitInput = UI.UIUtils.createSelect(ls`Units`, options);
    unitInput.classList.add('font-editor-select');
    if (isOverloaded) {
      unitInput.classList.add('error-input');
    }
    if (current) {
      unitInput.value = current;
    }
    unitInput.addEventListener('change', this._onUnitInput.bind(this), false);
    field.appendChild(unitInput);
    return unitInput;
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
    this._updateProperty('font-family', value);
  }

  /**
   * @param {!Event} event
   */
  _onSliderInput(event) {
    const value = event.currentTarget.value;
    switch (event.currentTarget) {
      case this._fontSizeInputs.slider:
        this._fontSizeInputs.textInput.value = value;
        this._updateProperty('font-size', value + this._fontSizeInputs.unitInput.value);
        break;
      case this._fontWeightInputs.slider:
        this._fontWeightInputs.textInput.value = value;
        this._updateProperty('font-weight', value);
        break;
      case this._lineHeightInputs.slider:
        this._lineHeightInputs.textInput.value = value;
        this._updateProperty('line-height', value + this._lineHeightInputs.unitInput.value);
        break;
      case this._letterSpacingInputs.slider:
        this._letterSpacingInputs.textInput.value = value;
        this._updateProperty('letter-spacing', value + this._letterSpacingInputs.unitInput.value);
        break;
    }
  }

  /**
   * @param {!Event} event
   */
  _onTextInput(event) {
    const value = event.currentTarget.value;
    let units;
    switch (event.currentTarget) {
      case this._fontSizeInputs.textInput:
        this._fontSizeInputs.slider.value = value;
        units = value === '' ? '' : this._fontSizeInputs.unitInput.value;
        this._updateProperty('font-size', value + units);
        break;
      case this._fontWeightInputs.textInput:
        this._fontWeightInputs.slider.value = value;
        this._updateProperty('font-weight', value);
        break;
      case this._lineHeightInputs.textInput:
        this._lineHeightInputs.slider.value = value;
        units = value === '' ? '' : this._lineHeightInputs.unitInput.value;
        this._updateProperty('line-height', value + units);
        break;
      case this._letterSpacingInputs.textInput:
        this._letterSpacingInputs.slider.value = value;
        units = value === '' ? '' : this._letterSpacingInputs.unitInput.value;
        this._updateProperty('letter-spacing', value + units);

        break;
    }
  }

  /**
   * @param {!Event} event
   */
  _onUnitInput(event) {
    const value = event.currentTarget.value;
    switch (event.currentTarget) {
      case this._fontSizeInputs.unitInput:
        if (this._fontSizeInputs.textInput.value) {
          this._updateProperty('font-size', this._fontSizeInputs.textInput.value + value);
        }
        break;
      case this._lineHeightInputs.unitInput:
        if (this._lineHeightInputs.textInput.value) {
          this._updateProperty('line-height', value + this._lineHeightInputs.textInput.value + value);
        }
        break;
      case this._letterSpacingInputs.unitInput:
        if (this._letterSpacingInputs.textInput.value) {
          this._updateProperty('letter-spacing', this._letterSpacingInputs.textInput.value + value);
        }
        break;
    }
  }

  _updateProperty(propertyName, value) {
    this.dispatchEventToListeners(Events.FontChanged, {propertyName: propertyName, value: value});
  }

  // _unitConversion(start, end, currentValue, isFontSizeInput) {
  //   // Do we even want font conversion?
  //   const fontSizeValue = isFontSizeInput ? this._baseFontSize : this._fontSizeInputs.textInput.value;
  //   if (start === 'px') {
  //     if (end === 'em') {
  //       return currentValue / fontSizeValue;
  //     }
  //     if (end === 'rem') {
  //       return currentValue / this._rootFontSize;
  //     }
  //     if (end === '%') {
  //       return currentValue / fontSizeValue * 100;
  //     }
  //   } else if (start === 'em') {
  //     if (end === 'px') {
  //       return currentValue * fontSizeValue;
  //     }
  //     if (end === 'rem') {
  //       return currentValue * fontSizeValue / this._rootFontSize;
  //     }
  //     if (end === '%') {
  //       return currentValue * 100;
  //     }
  //   }
  //   if (start === 'rem') {
  //     if (end === 'px') {
  //       return currentValue * this._rootFontSize;
  //     }
  //     if (end === 'em') {
  //       return currentValue * this._rootFontSize / fontSizeValue;
  //     }
  //     if (end === '%') {
  //       return currentValue * this._rootFontSize / fontSizeValue * 100;
  //     }
  //   }
  //   return -1;
  // }

  // _generateConversionHelper(baseFontSize, rootFontSize) {
  //   // const fontSizeUnits = ['px', 'em', 'rem', '%', 'vh', 'vw'];

  //   const conversionHelper = {
  //     px: {
  //       em: 1 / baseFontSize,
  //       rem: 1 / rootFontSize,
  //       percent: 100 / baseFontSize,
  //     },
  //     em: {
  //       px: baseFontSize,
  //       rem: baseFontSize / rootFontSize,
  //       percent: 100
  //     },
  //     rem: {
  //       px: rootFontSize,
  //       em: rootFontSize / baseFontSize,
  //       percent: 100 * rootFontSize / baseFontSize
  //     },
  //     percent: {
  //       px: baseFontSize / 100,
  //       em: .01,
  //       rem: baseFontSize / (100 * rootFontSize)
  //     }
  //   };
  //   return conversionHelper;
  // }
}
/**
 * @typedef {{name: string, slider: !Element, textInput: !Element, unitInput: Element | undefined}}
 */
FontEditor.PropertyInputs;

/**
 * @typedef {{value: string, units: string|undefined, isOverloaded: boolean}}
 */
FontEditor.PropertyInfo;

/** @enum {symbol} */
export const Events = {
  FontChanged: Symbol('FontChanged'),
  FontEditorResized: Symbol('FontEditorResized'),
};
