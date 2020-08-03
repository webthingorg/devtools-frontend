// Copyright (c) 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Bindings from '../bindings/bindings.js';
import * as ColorPicker from '../color_picker/color_picker.js';
import * as Common from '../common/common.js';
import * as InlineEditor from '../inline_editor/inline_editor.js';
import * as UI from '../ui/ui.js';

import {StylePropertyTreeElement} from './StylePropertyTreeElement.js';  // eslint-disable-line no-unused-vars

/**
 * @unrestricted
 */
export class BezierPopoverIcon {
  /**
   * @param {!StylePropertyTreeElement} treeElement
   * @param {!InlineEditor.SwatchPopoverHelper.SwatchPopoverHelper} swatchPopoverHelper
   * @param {!InlineEditor.ColorSwatch.BezierSwatch} swatch
   */
  constructor(treeElement, swatchPopoverHelper, swatch) {
    this._treeElement = treeElement;
    this._swatchPopoverHelper = swatchPopoverHelper;
    this._swatch = swatch;

    this._swatch.iconElement().title = Common.UIString.UIString('Open cubic bezier editor.');
    this._swatch.iconElement().addEventListener('click', this._iconClick.bind(this), false);
    this._swatch.iconElement().addEventListener('mousedown', event => event.consume(), false);

    this._boundBezierChanged = this._bezierChanged.bind(this);
    this._boundOnScroll = this._onScroll.bind(this);
  }

  /**
   * @param {!Event} event
   */
  _iconClick(event) {
    event.consume(true);
    if (this._swatchPopoverHelper.isShowing()) {
      this._swatchPopoverHelper.hide(true);
      return;
    }

    this._bezierEditor = new InlineEditor.BezierEditor.BezierEditor();
    let cubicBezier = UI.Geometry.CubicBezier.parse(this._swatch.bezierText());
    if (!cubicBezier) {
      cubicBezier =
          /** @type {!UI.Geometry.CubicBezier} */ (UI.Geometry.CubicBezier.parse('linear'));
    }
    this._bezierEditor.setBezier(cubicBezier);
    this._bezierEditor.addEventListener(InlineEditor.BezierEditor.Events.BezierChanged, this._boundBezierChanged);
    this._swatchPopoverHelper.show(this._bezierEditor, this._swatch.iconElement(), this._onPopoverHidden.bind(this));
    this._scrollerElement = this._swatch.enclosingNodeOrSelfWithClass('style-panes-wrapper');
    if (this._scrollerElement) {
      this._scrollerElement.addEventListener('scroll', this._boundOnScroll, false);
    }

    this._originalPropertyText = this._treeElement.property.propertyText;
    this._treeElement.parentPane().setEditingStyle(true);
    const uiLocation = Bindings.CSSWorkspaceBinding.CSSWorkspaceBinding.instance().propertyUILocation(
        this._treeElement.property, false /* forName */);
    if (uiLocation) {
      Common.Revealer.reveal(uiLocation, true /* omitFocus */);
    }
  }

  /**
   * @param {!Common.EventTarget.EventTargetEvent} event
   */
  _bezierChanged(event) {
    this._swatch.setBezierText(/** @type {string} */ (event.data));
    this._treeElement.applyStyleText(this._treeElement.renderedPropertyText(), false);
  }

  /**
   * @param {!Event} event
   */
  _onScroll(event) {
    this._swatchPopoverHelper.reposition();
  }

  /**
   * @param {boolean} commitEdit
   */
  _onPopoverHidden(commitEdit) {
    if (this._scrollerElement) {
      this._scrollerElement.removeEventListener('scroll', this._boundOnScroll, false);
    }

    this._bezierEditor.removeEventListener(InlineEditor.BezierEditor.Events.BezierChanged, this._boundBezierChanged);
    delete this._bezierEditor;

    const propertyText = commitEdit ? this._treeElement.renderedPropertyText() : this._originalPropertyText;
    this._treeElement.applyStyleText(propertyText, true);
    this._treeElement.parentPane().setEditingStyle(false);
    delete this._originalPropertyText;
  }
}

/**
 * @unrestricted
 */
export class ColorSwatchPopoverIcon {
  /**
   * @param {!StylePropertyTreeElement} treeElement
   * @param {!InlineEditor.SwatchPopoverHelper.SwatchPopoverHelper} swatchPopoverHelper
   * @param {!InlineEditor.ColorSwatch.ColorSwatch} swatch
   */
  constructor(treeElement, swatchPopoverHelper, swatch) {
    this._treeElement = treeElement;
    this._treeElement[ColorSwatchPopoverIcon._treeElementSymbol] = this;
    this._swatchPopoverHelper = swatchPopoverHelper;
    this._swatch = swatch;

    const shiftClickMessage = Common.UIString.UIString('Shift + Click to change color format.');
    this._swatch.iconElement().title = Common.UIString.UIString('Open color picker. %s', shiftClickMessage);
    this._swatch.iconElement().addEventListener('click', this._iconClick.bind(this));
    this._swatch.iconElement().addEventListener('mousedown', event => event.consume(), false);
    this._contrastInfo = null;

    this._boundSpectrumChanged = this._spectrumChanged.bind(this);
    this._boundOnScroll = this._onScroll.bind(this);
  }

  /**
   * @return {!ColorPicker.Spectrum.Palette}
   */
  _generateCSSVariablesPalette() {
    const matchedStyles = this._treeElement.matchedStyles();
    const style = this._treeElement.property.ownerStyle;
    const cssVariables = matchedStyles.availableCSSVariables(style);
    const colors = [];
    const colorNames = [];
    for (const cssVariable of cssVariables) {
      if (cssVariable === this._treeElement.property.name) {
        continue;
      }
      const value = matchedStyles.computeCSSVariable(style, cssVariable);
      if (!value) {
        continue;
      }
      const color = Common.Color.Color.parse(value);
      if (!color) {
        continue;
      }
      colors.push(value);
      colorNames.push(cssVariable);
    }
    return {title: 'CSS Variables', mutable: false, matchUserFormat: true, colors: colors, colorNames: colorNames};
  }

  /**
   * @param {!ColorPicker.ContrastInfo.ContrastInfo} contrastInfo
   */
  setContrastInfo(contrastInfo) {
    this._contrastInfo = contrastInfo;
  }

  /**
   * @param {!Event} event
   */
  _iconClick(event) {
    event.consume(true);
    this.showPopover();
  }

  showPopover() {
    if (this._swatchPopoverHelper.isShowing()) {
      this._swatchPopoverHelper.hide(true);
      return;
    }

    const color = this._swatch.color();
    let format = this._swatch.format();
    if (format === Common.Color.Format.Original) {
      format = color.format();
    }
    this._spectrum = new ColorPicker.Spectrum.Spectrum(this._contrastInfo);
    this._spectrum.setColor(color, format);
    this._spectrum.addPalette(this._generateCSSVariablesPalette());

    this._spectrum.addEventListener(ColorPicker.Spectrum.Events.SizeChanged, this._spectrumResized, this);
    this._spectrum.addEventListener(ColorPicker.Spectrum.Events.ColorChanged, this._boundSpectrumChanged);
    this._swatchPopoverHelper.show(this._spectrum, this._swatch.iconElement(), this._onPopoverHidden.bind(this));
    this._scrollerElement = this._swatch.enclosingNodeOrSelfWithClass('style-panes-wrapper');
    if (this._scrollerElement) {
      this._scrollerElement.addEventListener('scroll', this._boundOnScroll, false);
    }

    this._originalPropertyText = this._treeElement.property.propertyText;
    this._treeElement.parentPane().setEditingStyle(true);
    const uiLocation = Bindings.CSSWorkspaceBinding.CSSWorkspaceBinding.instance().propertyUILocation(
        this._treeElement.property, false /* forName */);
    if (uiLocation) {
      Common.Revealer.reveal(uiLocation, true /* omitFocus */);
    }
  }

  /**
   * @param {!Common.EventTarget.EventTargetEvent} event
   */
  _spectrumResized(event) {
    this._swatchPopoverHelper.reposition();
  }

  /**
   * @param {!Common.EventTarget.EventTargetEvent} event
   */
  _spectrumChanged(event) {
    const color = Common.Color.Color.parse(/** @type {string} */ (event.data));
    if (!color) {
      return;
    }
    this._swatch.setColor(color);
    const colorName = this._spectrum.colorName();
    if (colorName && colorName.startsWith('--')) {
      this._swatch.setText(`var(${colorName})`);
    }

    this._treeElement.applyStyleText(this._treeElement.renderedPropertyText(), false);
  }

  /**
   * @param {!Event} event
   */
  _onScroll(event) {
    this._swatchPopoverHelper.reposition();
  }

  /**
   * @param {boolean} commitEdit
   */
  _onPopoverHidden(commitEdit) {
    if (this._scrollerElement) {
      this._scrollerElement.removeEventListener('scroll', this._boundOnScroll, false);
    }

    this._spectrum.removeEventListener(ColorPicker.Spectrum.Events.ColorChanged, this._boundSpectrumChanged);
    delete this._spectrum;

    const propertyText = commitEdit ? this._treeElement.renderedPropertyText() : this._originalPropertyText;
    this._treeElement.applyStyleText(propertyText, true);
    this._treeElement.parentPane().setEditingStyle(false);
    delete this._originalPropertyText;
  }
}

ColorSwatchPopoverIcon._treeElementSymbol = Symbol('ColorSwatchPopoverIcon._treeElementSymbol');

/**
 * @unrestricted
 */
export class ShadowSwatchPopoverHelper {
  /**
   * @param {!StylePropertyTreeElement} treeElement
   * @param {!InlineEditor.SwatchPopoverHelper.SwatchPopoverHelper} swatchPopoverHelper
   * @param {!InlineEditor.ColorSwatch.CSSShadowSwatch} shadowSwatch
   */
  constructor(treeElement, swatchPopoverHelper, shadowSwatch) {
    this._treeElement = treeElement;
    this._treeElement[ShadowSwatchPopoverHelper._treeElementSymbol] = this;
    this._swatchPopoverHelper = swatchPopoverHelper;
    this._shadowSwatch = shadowSwatch;
    this._iconElement = shadowSwatch.iconElement();

    this._iconElement.title = Common.UIString.UIString('Open shadow editor.');
    this._iconElement.addEventListener('click', this._iconClick.bind(this), false);
    this._iconElement.addEventListener('mousedown', event => event.consume(), false);

    this._boundShadowChanged = this._shadowChanged.bind(this);
    this._boundOnScroll = this._onScroll.bind(this);
  }

  /**
   * @param {!Event} event
   */
  _iconClick(event) {
    event.consume(true);
    this.showPopover();
  }

  showPopover() {
    if (this._swatchPopoverHelper.isShowing()) {
      this._swatchPopoverHelper.hide(true);
      return;
    }

    this._cssShadowEditor = new InlineEditor.CSSShadowEditor.CSSShadowEditor();
    this._cssShadowEditor.setModel(this._shadowSwatch.model());
    this._cssShadowEditor.addEventListener(InlineEditor.CSSShadowEditor.Events.ShadowChanged, this._boundShadowChanged);
    this._swatchPopoverHelper.show(this._cssShadowEditor, this._iconElement, this._onPopoverHidden.bind(this));
    this._scrollerElement = this._iconElement.enclosingNodeOrSelfWithClass('style-panes-wrapper');
    if (this._scrollerElement) {
      this._scrollerElement.addEventListener('scroll', this._boundOnScroll, false);
    }

    this._originalPropertyText = this._treeElement.property.propertyText;
    this._treeElement.parentPane().setEditingStyle(true);
    const uiLocation = Bindings.CSSWorkspaceBinding.CSSWorkspaceBinding.instance().propertyUILocation(
        this._treeElement.property, false /* forName */);
    if (uiLocation) {
      Common.Revealer.reveal(uiLocation, true /* omitFocus */);
    }
  }

  /**
   * @param {!Common.EventTarget.EventTargetEvent} event
   */
  _shadowChanged(event) {
    this._shadowSwatch.setCSSShadow(/** @type {!InlineEditor.CSSShadowModel.CSSShadowModel} */ (event.data));
    this._treeElement.applyStyleText(this._treeElement.renderedPropertyText(), false);
  }

  /**
   * @param {!Event} event
   */
  _onScroll(event) {
    this._swatchPopoverHelper.reposition();
  }

  /**
   * @param {boolean} commitEdit
   */
  _onPopoverHidden(commitEdit) {
    if (this._scrollerElement) {
      this._scrollerElement.removeEventListener('scroll', this._boundOnScroll, false);
    }

    this._cssShadowEditor.removeEventListener(
        InlineEditor.CSSShadowEditor.Events.ShadowChanged, this._boundShadowChanged);
    delete this._cssShadowEditor;

    const propertyText = commitEdit ? this._treeElement.renderedPropertyText() : this._originalPropertyText;
    this._treeElement.applyStyleText(propertyText, true);
    this._treeElement.parentPane().setEditingStyle(false);
    delete this._originalPropertyText;
  }
}

ShadowSwatchPopoverHelper._treeElementSymbol = Symbol('ShadowSwatchPopoverHelper._treeElementSymbol');

/**
 * @unrestricted
 */
export class FontSwatchPopoverIcon {
  /**
   * @param {!InlineEditor.SwatchPopoverHelper} swatchPopoverHelper
   * @param {!Object} section
   */
  constructor(swatchPopoverHelper, section) {
    /** @type {!Map<string, !StylePropertyTreeElement>} */
    this._propertyMap = new Map();
    this._originalMap = new Map();
    this._swatchPopoverHelper = swatchPopoverHelper;
    this._section = section;

    this._boundFontValueChanged = this._fontValueChanged.bind(this);
    // this._boundFontUnitChanged = this._fontUnitChanged.bind(this);
    this._boundOnScroll = this._onScroll.bind(this);
    this._boundResized = this._fontEditorResized.bind(this);
  }

  async _fontValueChanged(event) {
    const {propertyName, value} = event.data;
    const treeElement = this._propertyMap.get(propertyName);
    if (treeElement && treeElement.property.parsedOk) {
      let elementRemoved = false;
      treeElement.valueElement.textContent = value;
      treeElement.property.value = value;
      let styleText;
      const propertyName = treeElement.property.name;
      if (value.length) {
        styleText = treeElement.renderedPropertyText();
      } else {
        styleText = '';
        elementRemoved = true;
        this._fixIndex(treeElement.property.index);
      }
      this._propertyMap.set(propertyName, treeElement);
      await treeElement.applyStyleText(styleText, true);
      if (elementRemoved) {
        this._propertyMap.delete(propertyName);
        this._section.onpopulate();
      }
    } else if (value.length) {
      const newProperty = this._section.addNewBlankProperty();
      if (newProperty) {
        newProperty.property.name = propertyName;
        newProperty.property.value = value;
        newProperty.updateTitle();
        await newProperty.applyStyleText(newProperty.renderedPropertyText(), true);
        this._propertyMap.set(newProperty.property.name, newProperty);
      }
    }
  }

  _fontEditorResized() {
    this._swatchPopoverHelper.reposition();
  }

  async _removeAddedProperties() {
    for (const property of this._propertyMap.keys()) {
      if (!this._originalMap.has(property)) {
        const treeElement = this._propertyMap.get(property);
        const propertyName = treeElement.property.name;
        treeElement.swatch.setFontText('');
        await treeElement.applyStyleText('', true);
        this._propertyMap.delete(propertyName);
        this._section.onpopulate();
      }
    }
  }

  _fixIndex(removedIndex) {
    for (const treeElement of this._propertyMap.values()) {
      if (treeElement.property.index > removedIndex) {
        treeElement.property.index -= 1;
      }
    }
  }

  _storeOriginalValue(fontProperty) {
    if (fontProperty[1].property.value.length) {
      this._originalMap.set(
          fontProperty[0], {value: fontProperty[1].property.value, isOverloaded: fontProperty[1].overloaded()});
    } else {
      this._propertyMap.delete(fontProperty[0]);
    }
  }

  /**
   * @param {!StylePropertyTreeElement} treeElement
   */
  registerFontProperty(treeElement) {
    this._parentPane = treeElement.parentPane();
    this._propertyMap.set(treeElement.property.name, treeElement);
    treeElement[FontSwatchPopoverIcon._treeElementSymbol] = this;
  }

  /**
   * @param {!Event} event
   * @param {!StylePropertyTreeElement} treeElement
   */
  _iconClick(event, treeElement) {
    event.consume(true);
    this.showPopover(treeElement);
  }

  /**
   * @param {!Element} iconElement
   */
  async showPopover(iconElement, parentPane) {
    if (this._swatchPopoverHelper.isShowing()) {
      this._swatchPopoverHelper.hide(true);
      return;
    }
    this._originalMap.clear();
    for (const fontProperty of this._propertyMap) {
      this._storeOriginalValue(fontProperty);
    }

    // const fontConversionInfo = {parentFontSize, rootFontSize};
    this._fontEditor = new InlineEditor.FontEditor.FontEditor(this._originalMap);
    this._fontEditor.addEventListener(InlineEditor.FontEditor.Events.FontValueChanged, this._boundFontValueChanged);
    // this._fontEditor.addEventListener(InlineEditor.FontEditor.Events.FontUnitChanged, this._boundFontUnitChanged);
    this._fontEditor.addEventListener(InlineEditor.FontEditor.Events.FontEditorResized, this._boundResized);
    this._swatchPopoverHelper.show(this._fontEditor, iconElement, this._onPopoverHidden.bind(this));
    this._scrollerElement = iconElement.enclosingNodeOrSelfWithClass('style-panes-wrapper');
    if (this._scrollerElement) {
      this._scrollerElement.addEventListener('scroll', this._boundOnScroll, false);
    }

    parentPane.setEditingStyle(true);
  }

  /**
   * @param {!Event} event
   */
  _onScroll(event) {
    this._swatchPopoverHelper.reposition();
  }

  clear() {
    this._propertyMap.clear();
  }

  /**
   * @param {boolean} commitEdit
   */
  _onPopoverHidden(commitEdit) {
    if (this._scrollerElement) {
      this._scrollerElement.removeEventListener('scroll', this._boundOnScroll, false);
    }
    this._section.onpopulate();
    this._fontEditor.removeEventListener(InlineEditor.FontEditor.Events.FontValueChanged, this._boundFontValueChanged);
    delete this._fontEditor;

    // const propertyText = commitEdit ? this._treeElement.renderedPropertyText() : this._originalPropertyText;
    // this._treeElement.applyStyleText(propertyText, true);
    this._section._parentPane.setEditingStyle(false);
    // delete this._originalPropertyText;
  }
}

FontSwatchPopoverIcon._treeElementSymbol = Symbol('FontSwatchPopoverIcon._treeElementSymbol');
