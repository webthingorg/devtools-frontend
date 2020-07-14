// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as UI from '../ui/ui.js';

import {CSSLength, CSSShadowModel} from './CSSShadowModel.js';  // eslint-disable-line no-unused-vars

const fontSizeRegex = /([0-9]+)(px|em|rem|%|vh|vw)/;
const lineHeightRegex = /([0-9.]+)(px|em|rem|%|vh|vw|)/;
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
   * @param {!Map<string, !Object>} propertyMap
   */
  constructor(propertyMap) {
    super(true);
    this.registerRequiredCSS('inline_editor/fontEditor.css');
    this._propertyMap = propertyMap;
    this.contentElement.tabIndex = 0;
    this.setDefaultFocusedElement(this.contentElement);

    // Font Selector Section
    const fontSelectorSection = this.contentElement.createChild('div');
    fontSelectorSection.createChild('h2', 'font-section-header').textContent = ls`Font`;
    const selectorField = fontSelectorSection.createChild('div', 'shadow-editor-field shadow-editor-flex-field');

    this._fontSelectorInitialValue, this._fallbackOneInitialValue, this._fallbackTwoInitialValue = '';
    if (this._propertyMap.has('font-family')) {
      const splitValue = this._propertyMap.get('font-family').split(',');
      this._fontSelectorInitialValue = splitValue[0].trim();
      if (splitValue[1]) {
        this._fallbackOneInitialValue = splitValue[1].trim();
        if (splitValue[2]) {
          this._fallbackTwoInitialValue = splitValue[2].trim();
        }
      }
    }

    this._fontSelector = this._createSelector(
        selectorField, ls`Font Selector`,
        [
          '', {text: 'Arial', value: '\'Arial\''}, {text: 'Comic Sans MS', value: '\'Comic Sans MS\''},
          {text: 'Courier New', value: '\'Courier New\''}, {text: 'Helvetica', value: '\'Helvetica\''},
          {text: 'Impact', value: '\'Impact\''}, {text: 'Times New Roman', value: '\'Times New Roman\''},
          {text: 'Verdana', value: '\'Verdana\''}
        ],
        this._fontSelectorInitialValue);
    const fallbackField1 = fontSelectorSection.createChild('div', 'shadow-editor-field shadow-editor-flex-field');
    this._fallback1 = this._createSelector(
        fallbackField1, ls`Fallback 1`,
        [
          '', {text: 'Arial', value: '\'Arial\''}, {text: 'Comic Sans MS', value: '\'Comic Sans MS\''},
          {text: 'Courier New', value: '\'Courier New\''}, {text: 'Helvetica', value: '\'Helvetica\''},
          {text: 'Impact', value: '\'Impact\''}, {text: 'Times New Roman', value: '\'Times New Roman\''},
          {text: 'Verdana', value: '\'Verdana\''}
        ],
        this._fallbackOneInitialValue);
    const fallbackField2 = fontSelectorSection.createChild('div', 'shadow-editor-field shadow-editor-flex-field');
    this._fallback2 = this._createSelector(
        fallbackField2, ls`Fallback 2`,
        [
          '', {text: 'Arial', value: '\'Arial\''}, {text: 'Comic Sans MS', value: '\'Comic Sans MS\''},
          {text: 'Courier New', value: '\'Courier New\''}, {text: 'Helvetica', value: '\'Helvetica\''},
          {text: 'Impact', value: '\'Impact\''}, {text: 'Times New Roman', value: '\'Times New Roman\''},
          {text: 'Verdana', value: '\'Verdana\''}
        ],
        this._fallbackTwoInitialValue);
    if (this._fontSelector.value === '') {
      this._fallback1.disabled = true;
      this._fallback2.disabled = true;
    } else if (this._fallback1.value === '') {
      this._fallback2.disabled = true;
    }

    //  CSS Font Property Section
    const cssPropertySection = this.contentElement.createChild('div', 'font-section');
    cssPropertySection.createChild('h2', 'font-section-header').textContent = ls`CSS Properties`;
    const fontSizeInitialValue = this._getPropertyValue('font-size', fontSizeRegex);
    let fontSizeNumericValue, fontSizeUnitValue;
    if (fontSizeInitialValue) {
      fontSizeNumericValue = fontSizeInitialValue[1];
      fontSizeUnitValue = fontSizeInitialValue[2];
    } else {
      fontSizeUnitValue = 'px';
    }

    const lineHeightInitialValue = this._getPropertyValue('line-height', lineHeightRegex);
    let lineHeightNumericValue, lineHeightUnitValue;
    if (lineHeightInitialValue) {
      lineHeightNumericValue = lineHeightInitialValue[1];
      lineHeightUnitValue = lineHeightInitialValue[2];
    }

    const fontWeightInitialValue = this._propertyMap.has('font-weight') ? this._propertyMap.get('font-weight') : '';

    const letterSpacingInitialValue = this._getPropertyValue('letter-spacing', letterSpacingRegex);
    let letterSpacingNumericValue, letterSpacingUnitValue;
    if (letterSpacingInitialValue) {
      letterSpacingNumericValue = letterSpacingInitialValue[1];
      letterSpacingUnitValue = letterSpacingInitialValue[2];
    }
    const fontSizeField = cssPropertySection.createChild('div', 'shadow-editor-field shadow-editor-flex-field');

    /** @type {FontEditor.PropertyInputs} */
    this._fontSizeInputs = {
      slider: this._createSlider(fontSizeField, ls`Font Size`, 0, 100, fontSizeNumericValue, fontSizeStep),
      textInput: this._createTextInput(fontSizeField, 0, 100, fontSizeNumericValue, fontSizeStep),
      unitInput: this._createUnitInput(fontSizeField, fontSizeUnitValue, fontSizeUnits),
      initialValue: fontSizeNumericValue,
      initialUnits: fontSizeUnitValue
    };

    const lineHeightField = cssPropertySection.createChild('div', 'shadow-editor-field shadow-editor-flex-field');
    /** @type {FontEditor.PropertyInputs} */
    this._lineHeightInputs = {
      slider: this._createSlider(lineHeightField, ls`Line Height`, 0, 2, lineHeightNumericValue, lineHeightStep),
      textInput: this._createTextInput(lineHeightField, 0, 2, lineHeightNumericValue, lineHeightStep),
      unitInput: this._createUnitInput(lineHeightField, lineHeightUnitValue, lineHeightUnits),
      initialValue: lineHeightNumericValue,
      initialUnits: lineHeightUnitValue
    };

    const fontWeightField = cssPropertySection.createChild('div', 'shadow-editor-field shadow-editor-flex-field');
    /** @type {FontEditor.PropertyInputs} */
    this._fontWeightInputs = {
      slider: this._createSlider(fontWeightField, ls`Font Weight`, 100, 1000, fontWeightInitialValue, fontWeightStep),
      textInput: this._createTextInput(fontWeightField, 100, 1000, fontWeightInitialValue, fontWeightStep),
      initialValue: fontWeightInitialValue
    };

    const letterSpacingField = cssPropertySection.createChild('div', 'shadow-editor-field shadow-editor-flex-field');
    /** @type {FontEditor.PropertyInputs} */
    this._letterSpacingInputs = {
      slider:
          this._createSlider(letterSpacingField, ls`Spacing`, -10, 10, letterSpacingNumericValue, letterSpacingStep),
      textInput: this._createTextInput(letterSpacingField, -10, 10, letterSpacingNumericValue, letterSpacingStep),
      unitInput: this._createUnitInput(letterSpacingField, letterSpacingUnitValue, letterSpacingUnits),
      initialValue: letterSpacingNumericValue,
      initialUnits: letterSpacingUnitValue
    };

    // // Font Properties Section
    // const fontPropertySection = this.contentElement.createChild('div', 'font-section');
    // fontPropertySection.createChild('h2', 'font-section-header').textContent = ls`Font Properties (Coming Soon!)`;

    // const filler1Field = fontPropertySection.createChild('div', 'shadow-editor-field shadow-editor-flex-field');
    // this._createSlider(filler1Field, ls`Variable1`, 0, 100, fontSizeNumericValue, fontSizeStep);
    // this._createTextInput(filler1Field, 0, 100, fontSizeNumericValue, fontSizeStep);
    // this._createUnitInput(filler1Field, fontSizeUnitValue, fontSizeUnits);

    // const filler2Field = fontPropertySection.createChild('div', 'shadow-editor-field shadow-editor-flex-field');
    // this._createSlider(filler2Field, ls`Variable2`, 0, 100, fontSizeNumericValue, fontSizeStep);
    // this._createTextInput(filler2Field, 0, 100, fontSizeNumericValue, fontSizeStep);
    // this._createUnitInput(filler2Field, fontSizeUnitValue, fontSizeUnits);

    // const filler3Field = fontPropertySection.createChild('div', 'shadow-editor-field shadow-editor-flex-field');
    // this._createSlider(filler3Field, ls`Variable3`, 0, 100, fontSizeNumericValue, fontSizeStep);
    // this._createTextInput(filler3Field, 0, 100, fontSizeNumericValue, fontSizeStep);

    // Reset Button
    // const resetButtonSection = this.contentElement.createChild('div', 'font-section');
    // const resetButton = UI.UIUtils.createTextButton('Reset', this._reset.bind(this), 'font-reset-button', true);
    // resetButtonSection.appendChild(resetButton);
    // this.contentElement.appendChild(resetButtonSection);
  }

  setPropertyMap(propertyMap) {
    this._propertyMap = propertyMap;
  }

  _resetSelectors() {
    this._fontSelector.value = this._fontSelectorInitialValue;
    this._fallback1.value = this._fallbackOneInitialValue;
    this._fallback2.value = this._fallbackTwoInitialValue;
    if (!this._fontSelector.value) {
      this._fallback1.disabled = true;
      this._fallback2.disabled = true;
    } else {
      this._fallback1.disabled = false;
      if (!this._fallback1.value) {
        this._fallback2.disabled = true;
      } else {
        this._fallback2.disabled = false;
      }
    }
  }

  _resetToOriginalValue(propertyInput) {
    propertyInput.slider.value = propertyInput.initialValue;
    propertyInput.textInput.value = propertyInput.initialValue;
    if (propertyInput.initialUnits && propertyInput.unitInput) {
      propertyInput.unitInput.value = propertyInput.initialUnits;
    }
  }

  _reset() {
    this._resetToOriginalValue(this._fontSizeInputs);
    this._resetToOriginalValue(this._lineHeightInputs);
    this._resetToOriginalValue(this._fontWeightInputs);
    this._resetToOriginalValue(this._letterSpacingInputs);
    this._resetSelectors();
    this.dispatchEventToListeners(Events.FontReset);
  }

  _getPropertyValue(name, regex) {
    if (this._propertyMap.has(name)) {
      const value = this._propertyMap.get(name);
      const match = value.match(regex);
      return match;
    }
  }

  _createSelector(field, label, options, current) {
    const selectInput = UI.UIUtils.createSelect(label, options);
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
   * @param {string} current
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
   * @param {string} current
   * @param {number} stepSize
   * @return {!Element}
   */
  _createTextInput(field, min, max, current, stepSize) {
    const textInput = UI.UIUtils.createInput('shadow-editor-text-input', 'number');
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

  _createUnitInput(field, current, options) {
    const unitInput = UI.UIUtils.createSelect(ls`Units`, options);
    unitInput.classList.add('font-editor-select');
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
  _onSelectorChanged(event) {
    const eventValue = event.currentTarget.value;
    let value = '';
    switch (event.currentTarget) {
      case this._fontSelector:
        value = eventValue;
        if (eventValue) {
          this._fallback1.disabled = false;
          if (this._fallback1.value) {
            value += ', ' + this._fallback1.value;
          }
          if (this._fallback2.value) {
            value += ', ' + this._fallback2.value;
          }
        } else {
          this._fallback1.disabled = true;
          this._fallback1.value = '';
          this._fallback2.disabled = true;
          this._fallback2.value = '';
        }
        this.dispatchEventToListeners(Events.FontChanged, {propertyName: 'font-family', value});
        break;
      case this._fallback1:
        if (eventValue) {
          this._fallback2.disabled = false;
          value = this._fontSelector.value + ', ' + eventValue;
          if (this._fallback2.value) {
            value += ', ' + this._fallback2.value;
          }
          this.dispatchEventToListeners(Events.FontChanged, {propertyName: 'font-family', value});
        } else {
          this._fallback2.disabled = true;
          this._fallback2.value = '';
          this.dispatchEventToListeners(
              Events.FontChanged, {propertyName: 'font-family', value: this._fontSelector.value});
        }
        break;
      case this._fallback2:
        if (eventValue !== '') {
          this.dispatchEventToListeners(Events.FontChanged, {
            propertyName: 'font-family',
            value: this._fontSelector.value + ', ' + this._fallback1.value + ', ' + eventValue
          });
        } else {
          this.dispatchEventToListeners(
              Events.FontChanged,
              {propertyName: 'font-family', value: this._fontSelector.value + ', ' + this._fallback1.value});
        }
        break;
    }
  }

  /**
   * @param {!Event} event
   */
  _onSliderInput(event) {
    const value = event.currentTarget.value;
    switch (event.currentTarget) {
      case this._fontSizeInputs.slider:
        this._fontSizeInputs.textInput.value = value;
        this.dispatchEventToListeners(
            Events.FontChanged, {propertyName: 'font-size', value: value + this._fontSizeInputs.unitInput.value});
        break;
      case this._fontWeightInputs.slider:
        this._fontWeightInputs.textInput.value = value;
        this.dispatchEventToListeners(Events.FontChanged, {propertyName: 'font-weight', value});
        break;
      case this._lineHeightInputs.slider:
        this._lineHeightInputs.textInput.value = value;
        this.dispatchEventToListeners(
            Events.FontChanged, {propertyName: 'line-height', value: value + this._lineHeightInputs.unitInput.value});
        break;
      case this._letterSpacingInputs.slider:
        this._letterSpacingInputs.textInput.value = value;
        this.dispatchEventToListeners(
            Events.FontChanged,
            {propertyName: 'letter-spacing', value: value + this._letterSpacingInputs.unitInput.value});
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
        this.dispatchEventToListeners(Events.FontChanged, {propertyName: 'font-size', value: value + units});
        break;
      case this._fontWeightInputs.textInput:
        this._fontWeightInputs.slider.value = value;
        this.dispatchEventToListeners(Events.FontChanged, {propertyName: 'font-weight', value});
        break;
      case this._lineHeightInputs.textInput:
        this._lineHeightInputs.slider.value = value;
        units = value === '' ? '' : this._lineHeightInputs.unitInput.value;
        this.dispatchEventToListeners(Events.FontChanged, {propertyName: 'line-height', value: value + units});
        break;
      case this._letterSpacingInputs.textInput:
        this._letterSpacingInputs.slider.value = value;
        units = value === '' ? '' : this._letterSpacingInputs.unitInput.value;
        this.dispatchEventToListeners(Events.FontChanged, {propertyName: 'letter-spacing', value: value + units});
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
          this.dispatchEventToListeners(
              Events.FontChanged, {propertyName: 'font-size', value: this._fontSizeInputs.textInput.value + value});
        }
        break;
      case this._lineHeightInputs.unitInput:
        if (this._lineHeightInputs.textInput.value) {
          this.dispatchEventToListeners(
              Events.FontChanged, {propertyName: 'line-height', value: this._lineHeightInputs.textInput.value + value});
        }
        break;
      case this._letterSpacingInputs.unitInput:
        if (this._letterSpacingInputs.textInput.value) {
          this.dispatchEventToListeners(
              Events.FontChanged,
              {propertyName: 'letter-spacing', value: this._letterSpacingInputs.textInput.value + value});
        }
        break;
    }
  }

  /**
   * @param {!Event} event
   */
  _onKeyDown(event) {
    let increment = 0;
    if (event.key === 'ArrowUp') {
      increment = 1;
    } else if (event.key === 'ArrowDown') {
      increment = -1;
    }
    if (increment !== 0) {
      let newValue;
      switch (event.currentTarget) {
        case this._fontSizeInputs.textInput:
          event.consume(true);
          newValue = Number(this._fontSizeInputs.textInput.value) + fontSizeStep * increment;
          this._fontSizeInputs.textInput.value = newValue;
          this._fontSizeInputs.slider.value = newValue;
          this.dispatchEventToListeners(
              Events.FontChanged, {propertyName: 'font-size', value: newValue + this._fontSizeInputs.unitInput.value});
          break;
        case this._lineHeightInputs.textInput:
          event.consume(true);
          newValue = Number(this._lineHeightInputs.textInput.value) + lineHeightStep * increment;
          this._lineHeightInputs.textInput.value = newValue;
          this._lineHeightInputs.slider.value = newValue;
          this.dispatchEventToListeners(
              Events.FontChanged,
              {propertyName: 'font-size', value: newValue + this._lineHeightInputs.unitInput.value});
          break;
        case this._fontWeightInputs.textInput:
          event.consume(true);
          newValue = Number(this._fontWeightInputs.textInput.value) + fontWeightStep * increment;
          this._fontWeightInputs.textInput.value = newValue;
          this._fontWeightInputs.slider.value = newValue;
          this.dispatchEventToListeners(Events.FontChanged, {propertyName: 'font-size', value: newValue});
          break;
      }
    }
  }
}

/**
 * @typedef {{name: string, slider: !Element, textInput: !Element, unitInput: Element | undefined, initialValue: number | undefined, initialUnits: string | undefined}}
 */
FontEditor.PropertyInputs;

/** @enum {symbol} */
export const Events = {
  FontChanged: Symbol('FontChanged'),
  FontReset: Symbol('FontReset')
};
