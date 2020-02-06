// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {CSSLength, CSSShadowModel} from './CSSShadowModel.js';  // eslint-disable-line no-unused-vars

const fontSizeRegex = /([0-9]+)(px|em|rem|%|vh|vw)/;
const fontWeightRegex = /([0-9]+)/;
const lineHeightRegex = /([0-9]+)/;

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

    const fontSizeField = this.contentElement.createChild('div', 'shadow-editor-field shadow-editor-flex-field');
    this._fontSizeSlider = this._createSlider(fontSizeField, ls`Font Size`, 1, 0, 100, this._getFontSize());
    this._fontSizeTextInput = this._createTextInput(fontSizeField, this._getFontSize());

    const fontWeightField = this.contentElement.createChild('div', 'shadow-editor-field shadow-editor-flex-field');
    this._fontWeightSlider =
        this._createSlider(fontWeightField, ls`Font Weight`, 100, 100, 1000, this._getFontWeight());
    this._fontWeightTextInput = this._createTextInput(fontWeightField, this._getFontWeight());

    const lineHeightField = this.contentElement.createChild('div', 'shadow-editor-field shadow-editor-flex-field');
    this._lineHeightSlider = this._createSlider(lineHeightField, ls`Line Height`, .1, 0, 2, this._getLineHeight());
    this._lineHeightTextInput = this._createTextInput(lineHeightField, this._getLineHeight());

    this._fontSizeSlider.oninput = function() {
      let value = this._fontSizeSlider.value;
      value += 'px';
      this._fontSizeTextInput.value = value;
      this.dispatchEventToListeners(Events.FontChanged, {propertyName: 'font-size', value});
    }.bind(this);
    this._fontSizeTextInput.oninput = function() {
      let value = this._fontSizeTextInput.value;
      value += 'px';
      this._fontSizeSlider.value = value;
      this.dispatchEventToListeners(Events.FontChanged, {propertyName: 'font-size', value});
    }.bind(this);

    this._fontWeightSlider.oninput = function() {
      const value = this._fontWeightSlider.value;
      this._fontWeightTextInput.value = value;
      this.dispatchEventToListeners(Events.FontChanged, {propertyName: 'font-weight', value});
    }.bind(this);
    this._fontWeightTextInput.oninput = function() {
      const value = this._fontWeightTextInput.value;
      this._fontWeightSlider.value = value;
      this.dispatchEventToListeners(Events.FontChanged, {propertyName: 'font-weight', value});
    }.bind(this);


    this._lineHeightSlider.oninput = function() {
      const value = this._lineHeightSlider.value;
      this._lineHeightTextInput.value = value;
      this.dispatchEventToListeners(Events.FontChanged, {propertyName: 'line-height', value});
    }.bind(this);
    this._lineHeightTextInput.oninput = function() {
      const value = this._lineHeightTextInput.value;
      this._lineHeightSlider.value = value;
      this.dispatchEventToListeners(Events.FontChanged, {propertyName: 'line-height', value});
    }.bind(this);
  }

  _getFontSize() {
    if (this._propertyMap.has('font-size')) {
      const value = this._propertyMap.get('font-size').property.value;
      const match = value.match(fontSizeRegex);
      return match;
    }
  }

  _getFontWeight() {
    if (this._propertyMap.has('font-weight')) {
      const value = this._propertyMap.get('font-weight').property.value;
      const match = value.match(fontWeightRegex);
      return match;
    }
  }

  _getLineHeight() {
    if (this._propertyMap.has('line-height')) {
      const value = this._propertyMap.get('line-height').property.value;
      const match = value.match(lineHeightRegex);
      return match;
    }
  }

  /**
   * @param {!Element} field
   * @param {Object=} current
   * @return {!Element}
   */
  _createTextInput(field, current) {
    const textInput = UI.createInput('shadow-editor-text-input', 'text');
    if (current) {
      textInput.value = current[1];
    }
    field.appendChild(textInput);
    return textInput;
  }

  /**
   * @param {!Element} field
   * @param {string} label
   * @param {number} stepSize
   * @param {number} min
   * @param {number} max
   * @param {Object=} current
   * @return {!Element}
   */
  _createSlider(field, label, stepSize, min, max, current) {
    const slider = UI.createSlider(min, max, -1);
    slider.step = stepSize;
    const fontSizeLabel = UI.createLabel(label, 'shadow-editor-label', slider);
    if (current) {
      slider.value = current[1];
    } else {
      slider.value = (min + max) / 2;
    }
    slider.addEventListener('input', this._onSliderInput.bind(this), false);
    field.appendChild(fontSizeLabel);
    field.appendChild(slider);
    return slider;
  }

  /**
   * @param {!Event} event
   */
  _onSliderInput(event) {
    const value = event.currentTarget.value;
    switch (event.currentTarget) {
      case this._fontSizeSlider:
        this._fontSizeTextInput.value = value;
        this.dispatchEventToListeners(Events.FontChanged, {propertyName: 'font-size', value});
        break;
      case this._fontWeightSlider:
        this._fontWeightTextInput.value = value;
        this.dispatchEventToListeners(Events.FontChanged, {propertyName: 'font-weight', value});
        break;
      case this._lineHeightSlider:
        this._lineHeightSlider.value = this._fontSizeSlider.value;
        this.dispatchEventToListeners(Events.FontChanged, {propertyName: 'line-height', value});
        break;
    }
  }

  /**
   * @override
   */
  wasShown() {
    // this._updateUI();
  }

  /**
   * @param {!Event} event
   */
  _onButtonClick(event) {
  }

  /**
   * @param {!Event} event
   */
  _handleValueModification(event) {
  }

  /**
   * @param {!Event} event
   */
  _onTextInput(event) {
  }
}

/** @enum {symbol} */
export const Events = {
  FontChanged: Symbol('FontChanged')
};
