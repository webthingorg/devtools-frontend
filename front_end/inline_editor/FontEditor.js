// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {CSSLength, CSSShadowModel} from './CSSShadowModel.js';  // eslint-disable-line no-unused-vars

const fontSizeRegex = /([0-9]+)(px|em|rem|%|vh|vw)/;
const fontWeightRegex = /([0-9]+)/;
const lineHeightRegex = /([0-9.]+)(px|em|rem|%|vh|vw|)/;

const fontSizeUnits = ['px', 'em', 'rem', '%', 'vh', 'vw'];
const lineHeightUnits = ['', 'px', 'em', '%'];

const fontSizeStep = 1;
const lineHeightStep = .1;
const fontWeightStep = 100;

/**
 * @unrestricted
 */
export class FontEditor extends UI.VBox {
  /**
   * @param {!Map<string, !Object>} propertyMap
   */
  constructor(propertyMap) {
    super(true);
    this.registerRequiredCSS('inline_editor/fontEditor.css');
    this._propertyMap = propertyMap;
    this.contentElement.tabIndex = 0;
    this.setDefaultFocusedElement(this.contentElement);


    const fontSizeInitialValue = this._getFontSize();
    let fontSizeNumericValue, fontSizeUnitValue;
    if (fontSizeInitialValue) {
      fontSizeNumericValue = fontSizeInitialValue[1];
      fontSizeUnitValue = fontSizeInitialValue[2];
    } else {
      fontSizeUnitValue = 'px';
    }

    const lineHeightInitialValue = this._getLineHeight();
    let lineHeightNumericValue, lineHeightUnitValue;
    if (lineHeightInitialValue) {
      lineHeightNumericValue = lineHeightInitialValue[1];
      lineHeightUnitValue = lineHeightInitialValue[2];
    }

    const fontWeightInitialValue = this._getFontWeight();

    const fontSizeField = this.contentElement.createChild('div', 'shadow-editor-field shadow-editor-flex-field');

    /** @type {FontEditor.PropertyInputs} */
    this._fontSizeInputs = {
      name: 'font-size',
      slider: this._createSlider(fontSizeField, ls`Font Size`, 0, 100, fontSizeNumericValue, fontSizeStep),
      textInput: this._createTextInput(fontSizeField, 0, 100, fontSizeNumericValue, fontSizeStep),
      unitInput: this._createUnitInput(fontSizeField, fontSizeUnitValue, fontSizeUnits),
      initialValue: fontSizeNumericValue,
      initialUnits: fontSizeUnitValue
    };

    const lineHeightField = this.contentElement.createChild('div', 'shadow-editor-field shadow-editor-flex-field');
    /** @type {FontEditor.PropertyInputs} */
    this._lineHeightInputs = {
      name: 'line-height',
      slider: this._createSlider(lineHeightField, ls`Line Height`, 0, 2, lineHeightNumericValue, lineHeightStep),
      textInput: this._createTextInput(lineHeightField, 0, 2, lineHeightNumericValue, lineHeightStep),
      unitInput: this._createUnitInput(lineHeightField, lineHeightUnitValue, lineHeightUnits),
      initialValue: lineHeightNumericValue,
      initialUnits: lineHeightUnitValue
    };

    const fontWeightField = this.contentElement.createChild('div', 'shadow-editor-field shadow-editor-flex-field');
    /** @type {FontEditor.PropertyInputs} */
    this._fontWeightInputs = {
      name: 'font-weight',
      slider: this._createSlider(fontWeightField, ls`Font Weight`, 100, 1000, fontWeightInitialValue, fontWeightStep),
      textInput: this._createTextInput(fontWeightField, 100, 1000, fontWeightInitialValue, fontWeightStep),
      initialValue: fontWeightInitialValue
    };

    const resetButton = UI.createTextButton('Reset', this._reset.bind(this), undefined, true);
    this.contentElement.appendChild(resetButton);
  }

  setPropertyMap(propertyMap) {
    this._propertyMap = propertyMap;
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
    this.dispatchEventToListeners(Events.FontReset);
  }

  _getFontSize() {
    if (this._propertyMap.has('font-size')) {
      const value = this._propertyMap.get('font-size');
      const match = value.match(fontSizeRegex);
      return match;
    }
  }

  _getFontWeight() {
    if (this._propertyMap.has('font-weight')) {
      const value = this._propertyMap.get('font-weight');
      const match = value.match(fontWeightRegex);
      return match[1];
    }
  }

  _getLineHeight() {
    if (this._propertyMap.has('line-height')) {
      const value = this._propertyMap.get('line-height');
      const match = value.match(lineHeightRegex);
      return match;
    }
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
    const slider = UI.createSlider(min, max, -1);
    slider.sliderElement.step = stepSize;
    const fontSizeLabel = UI.createLabel(label, 'shadow-editor-label', slider);
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
    const textInput = UI.createInput('shadow-editor-text-input', 'number');
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
    // textInput.addEventListener('keydown', this._onKeyDown.bind(this), false);
    field.appendChild(textInput);
    return textInput;
  }

  _createUnitInput(field, current, options) {
    const unitInput = UI.createSelect(ls`Units`, options);
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
