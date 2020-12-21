// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/*
 * Copyright (C) 2007 Apple Inc.  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Computer, Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import * as Common from '../common/common.js';
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

import {ElementsSidebarPane} from './ElementsSidebarPane.js';

export class MetricsSidebarPane extends ElementsSidebarPane {
  originalPropertyData: SDK.CSSProperty.CSSProperty|null;
  previousPropertyDataCandidate: SDK.CSSProperty.CSSProperty|null;
  _inlineStyle: SDK.CSSStyleDeclaration.CSSStyleDeclaration|null;
  _highlightMode: string;
  _boxElements: {element: HTMLElement; name: string; backgroundColor: string;}[];
  _isEditingMetrics: (boolean|undefined)|undefined;
  constructor() {
    super();
    this.registerRequiredCSS('elements/metricsSidebarPane.css', {enableLegacyPatching: true});

    this.originalPropertyData = null;
    this.previousPropertyDataCandidate = null;
    this._inlineStyle = null;
    this._highlightMode = '';
    this._boxElements = [];
  }

  /**
   * @override
   * @protected
   */
  doUpdate(): Promise<any> {
    // "style" attribute might have changed. Update metrics unless they are being edited
    // (if a CSS property is added, a StyleSheetChanged event is dispatched).
    if (this._isEditingMetrics) {
      return Promise.resolve();
    }

    // FIXME: avoid updates of a collapsed pane.
    const node = this.node();
    const cssModel = this.cssModel();
    if (!node || node.nodeType() !== Node.ELEMENT_NODE || !cssModel) {
      this.contentElement.removeChildren();
      this.element.classList.add('collapsed');
      return Promise.resolve();
    }

    function callback(this: MetricsSidebarPane, style: Map<string, string>|null) {
      if (!style || this.node() !== node) {
        return;
      }
      this._updateMetrics(style);
    }

    if (!node.id) {
      return Promise.resolve();
    }

    const promises = [
      cssModel.computedStylePromise(node.id).then(callback.bind(this)),
      cssModel.inlineStylesPromise(node.id).then((inlineStyleResult: SDK.CSSModel.InlineStyleResult|null) => {
        if (inlineStyleResult && this.node() === node) {
          this._inlineStyle = inlineStyleResult.inlineStyle;
        }
      }),
    ];
    return Promise.all(promises);
  }

  onCSSModelChanged() {
    this.update();
  }

  /**
   * Toggle the visibility of the Metrics pane. This toggle allows external
   * callers to control the visibility of this pane, but toggling this on does
   * not guarantee the pane will always show up, because the pane's visibility
   * is also controlled by the internal condition that style cannot be empty.
   */
  toggleVisibility(isVisible: boolean) {
    this.element.classList.toggle('invisible', !isVisible);
  }

  _getPropertyValueAsPx(style: Map<string, string>, propertyName: string): number {
    const propertyValue = style.get(propertyName);
    if (!propertyValue) {
      return 0;
    }
    return Number(propertyValue.replace(/px$/, '') || 0);
  }

  _getBox(computedStyle: Map<string, string>, componentName: string) {
    const suffix = componentName === 'border' ? '-width' : '';
    const left = this._getPropertyValueAsPx(computedStyle, componentName + '-left' + suffix);
    const top = this._getPropertyValueAsPx(computedStyle, componentName + '-top' + suffix);
    const right = this._getPropertyValueAsPx(computedStyle, componentName + '-right' + suffix);
    const bottom = this._getPropertyValueAsPx(computedStyle, componentName + '-bottom' + suffix);
    return {left, top, right, bottom};
  }

  _highlightDOMNode(showHighlight: boolean, mode: string, event: Event) {
    event.consume();
    const node = this.node();
    if (showHighlight && node) {
      if (this._highlightMode === mode) {
        return;
      }
      this._highlightMode = mode;
      node.highlight(mode);
    } else {
      this._highlightMode = '';
      SDK.OverlayModel.OverlayModel.hideDOMNodeHighlight();
    }

    for (const {element, name, backgroundColor} of this._boxElements) {
      if (!node || mode === 'all' || name === mode) {
        element.style.backgroundColor = backgroundColor;
      } else {
        element.style.backgroundColor = '';
      }
    }
  }

  _updateMetrics(style: Map<string, string>) {
    // Updating with computed style.
    const metricsElement = document.createElement('div');
    metricsElement.className = 'metrics';
    const self = this;

    function createBoxPartElement(
        this: MetricsSidebarPane, style: Map<string, string>, name: string, side: string, suffix: string) {
      const element = document.createElement('div');
      element.className = side;

      const propertyName = (name !== 'position' ? name + '-' : '') + side + suffix;
      let value: '‒'|string|(string | undefined) = style.get(propertyName);
      if (value === undefined) {
        return element;
      }

      if (value === '' || (name !== 'position' && value === '0px')) {
        value = '\u2012';
      } else if (name === 'position' && value === 'auto') {
        value = '\u2012';
      }
      value = value.replace(/px$/, '');
      value = Number.toFixedIfFloating(value);

      element.textContent = value;
      element.addEventListener('dblclick', this.startEditing.bind(this, element, name, propertyName, style), false);
      return element;
    }

    function getContentAreaWidthPx(style: Map<string, string>): string {
      let width: string|(string | undefined) = style.get('width');
      if (!width) {
        return '';
      }
      width = width.replace(/px$/, '');
      const widthValue = Number(width);
      if (!isNaN(widthValue) && style.get('box-sizing') === 'border-box') {
        const borderBox = self._getBox(style, 'border');
        const paddingBox = self._getBox(style, 'padding');

        width = (widthValue - borderBox.left - borderBox.right - paddingBox.left - paddingBox.right).toString();
      }

      return Number.toFixedIfFloating(width);
    }

    function getContentAreaHeightPx(style: Map<string, string>): string {
      let height: string|(string | undefined) = style.get('height');
      if (!height) {
        return '';
      }
      height = height.replace(/px$/, '');
      const heightValue = Number(height);
      if (!isNaN(heightValue) && style.get('box-sizing') === 'border-box') {
        const borderBox = self._getBox(style, 'border');
        const paddingBox = self._getBox(style, 'padding');

        height = (heightValue - borderBox.top - borderBox.bottom - paddingBox.top - paddingBox.bottom).toString();
      }

      return Number.toFixedIfFloating(height);
    }

    // Display types for which margin is ignored.
    const noMarginDisplayType = new Set<string>([
      'table-cell',
      'table-column',
      'table-column-group',
      'table-footer-group',
      'table-header-group',
      'table-row',
      'table-row-group',
    ]);

    // Display types for which padding is ignored.
    const noPaddingDisplayType = new Set<string>([
      'table-column',
      'table-column-group',
      'table-footer-group',
      'table-header-group',
      'table-row',
      'table-row-group',
    ]);

    // Position types for which top, left, bottom and right are ignored.
    const noPositionType = new Set<string>(['static']);

    const boxes = ['content', 'padding', 'border', 'margin', 'position'];
    const boxColors = [
      Common.Color.PageHighlight.Content,
      Common.Color.PageHighlight.Padding,
      Common.Color.PageHighlight.Border,
      Common.Color.PageHighlight.Margin,
      Common.Color.Color.fromRGBA([0, 0, 0, 0]),
    ];
    const boxLabels = [
      Common.UIString.UIString('content'),
      Common.UIString.UIString('padding'),
      Common.UIString.UIString('border'),
      Common.UIString.UIString('margin'),
      Common.UIString.UIString('position'),
    ];
    let previousBox: HTMLDivElement|null = null;
    this._boxElements = [];
    for (let i = 0; i < boxes.length; ++i) {
      const name = boxes[i];
      const display = style.get('display');
      const position = style.get('position');
      if (!display || !position) {
        continue;
      }
      if (name === 'margin' && noMarginDisplayType.has(display)) {
        continue;
      }
      if (name === 'padding' && noPaddingDisplayType.has(display)) {
        continue;
      }
      if (name === 'position' && noPositionType.has(position)) {
        continue;
      }

      const boxElement = (document.createElement('div') as HTMLDivElement);
      boxElement.className = name;
      const backgroundColor = boxColors[i].asString(Common.Color.Format.RGBA) || '';
      boxElement.style.backgroundColor = backgroundColor;
      boxElement.addEventListener(
          'mouseover', this._highlightDOMNode.bind(this, true, name === 'position' ? 'all' : name), false);
      this._boxElements.push({element: boxElement, name, backgroundColor});

      if (name === 'content') {
        const widthElement = document.createElement('span');
        widthElement.textContent = getContentAreaWidthPx(style);
        widthElement.addEventListener(
            'dblclick', this.startEditing.bind(this, widthElement, 'width', 'width', style), false);

        const heightElement = document.createElement('span');
        heightElement.textContent = getContentAreaHeightPx(style);
        heightElement.addEventListener(
            'dblclick', this.startEditing.bind(this, heightElement, 'height', 'height', style), false);

        boxElement.appendChild(widthElement);
        UI.UIUtils.createTextChild(boxElement, ' × ');
        boxElement.appendChild(heightElement);
      } else {
        const suffix = (name === 'border' ? '-width' : '');

        const labelElement = document.createElement('div');
        labelElement.className = 'label';
        labelElement.textContent = boxLabels[i];
        boxElement.appendChild(labelElement);

        boxElement.appendChild(createBoxPartElement.call(this, style, name, 'top', suffix));
        boxElement.appendChild(document.createElement('br'));
        boxElement.appendChild(createBoxPartElement.call(this, style, name, 'left', suffix));

        if (previousBox) {
          boxElement.appendChild(previousBox);
        }

        boxElement.appendChild(createBoxPartElement.call(this, style, name, 'right', suffix));
        boxElement.appendChild(document.createElement('br'));
        boxElement.appendChild(createBoxPartElement.call(this, style, name, 'bottom', suffix));
      }

      previousBox = boxElement;
    }

    metricsElement.appendChild((previousBox as HTMLDivElement));
    metricsElement.addEventListener('mouseover', this._highlightDOMNode.bind(this, false, 'all'), false);
    metricsElement.addEventListener('mouseleave', this._highlightDOMNode.bind(this, false, 'all'), false);
    this.contentElement.removeChildren();
    this.contentElement.appendChild(metricsElement);
    this.element.classList.remove('collapsed');
  }

  startEditing(targetElement: Element, box: string, styleProperty: string, computedStyle: Map<string, string>) {
    if (UI.UIUtils.isBeingEdited(targetElement)) {
      return;
    }

    /** @type {!{box: string, styleProperty: string, computedStyle: !Map.<string, string>, keyDownHandler: function(!Event):void}} */
    const context = {box, styleProperty, computedStyle, keyDownHandler: () => {}};
    const boundKeyDown = this._handleKeyDown.bind(this, context);
    context.keyDownHandler = boundKeyDown;
    targetElement.addEventListener('keydown', boundKeyDown, false);

    this._isEditingMetrics = true;

    const config =
        new UI.InplaceEditor.Config(this._editingCommitted.bind(this), this.editingCancelled.bind(this), context);
    UI.InplaceEditor.InplaceEditor.startEditing(targetElement, (config as UI.InplaceEditor.Config<any>));

    const selection = targetElement.getComponentSelection();
    selection && selection.selectAllChildren(targetElement);
  }

  _handleKeyDown(
      context: {
        box: string; styleProperty: string; computedStyle: Map<string, string>; keyDownHandler: (arg0: Event) => void;
      },
      event: Event) {
    const element = (event.currentTarget as Element);

    function finishHandler(this: MetricsSidebarPane, originalValue: string, replacementString: string) {
      this._applyUserInput(element, replacementString, originalValue, context, false);
    }

    function customNumberHandler(prefix: string, number: number, suffix: string): string {
      if (context.styleProperty !== 'margin' && number < 0) {
        number = 0;
      }
      return prefix + number + suffix;
    }

    UI.UIUtils.handleElementValueModifications(
        event, element, finishHandler.bind(this), undefined, customNumberHandler);
  }

  editingEnded(element: Element, context: {keyDownHandler: (arg0: Event) => void;}) {
    this.originalPropertyData = null;
    this.previousPropertyDataCandidate = null;
    element.removeEventListener('keydown', context.keyDownHandler, false);
    delete this._isEditingMetrics;
  }

  editingCancelled(element: Element, context: {
    box: string; styleProperty: string; computedStyle: Map<string, string>; keyDownHandler: (arg0: Event) => void;
  }) {
    if (this._inlineStyle) {
      if (!this.originalPropertyData) {
        // An added property, remove the last property in the style.
        const pastLastSourcePropertyIndex = this._inlineStyle.pastLastSourcePropertyIndex();
        if (pastLastSourcePropertyIndex) {
          this._inlineStyle.allProperties()[pastLastSourcePropertyIndex - 1].setText('', false);
        }
      } else {
        this._inlineStyle.allProperties()[this.originalPropertyData.index].setText(
            this.originalPropertyData.propertyText || '', false);
      }
    }
    this.editingEnded(element, context);
    this.update();
  }

  _applyUserInput(
      element: Element, userInput: string, previousContent: string, context: {
        box: string; styleProperty: string; computedStyle: Map<string, string>; keyDownHandler: (arg0: Event) => void;
      },
      commitEditor: boolean) {
    if (!this._inlineStyle) {
      // Element has no renderer.
      return this.editingCancelled(element, context);  // nothing changed, so cancel
    }

    if (commitEditor && userInput === previousContent) {
      return this.editingCancelled(element, context);
    }  // nothing changed, so cancel

    if (context.box !== 'position' && (!userInput || userInput === '\u2012')) {
      userInput = '0px';
    } else if (context.box === 'position' && (!userInput || userInput === '\u2012')) {
      userInput = 'auto';
    }

    userInput = userInput.toLowerCase();
    // Append a "px" unit if the user input was just a number.
    if (/^\d+$/.test(userInput)) {
      userInput += 'px';
    }

    const styleProperty = context.styleProperty;
    const computedStyle = context.computedStyle;

    if (computedStyle.get('box-sizing') === 'border-box' && (styleProperty === 'width' || styleProperty === 'height')) {
      if (!userInput.match(/px$/)) {
        Common.Console.Console.instance().error(
            'For elements with box-sizing: border-box, only absolute content area dimensions can be applied');
        return;
      }

      const borderBox = this._getBox(computedStyle, 'border');
      const paddingBox = this._getBox(computedStyle, 'padding');
      let userValuePx = Number(userInput.replace(/px$/, ''));
      if (isNaN(userValuePx)) {
        return;
      }
      if (styleProperty === 'width') {
        userValuePx += borderBox.left + borderBox.right + paddingBox.left + paddingBox.right;
      } else {
        userValuePx += borderBox.top + borderBox.bottom + paddingBox.top + paddingBox.bottom;
      }

      userInput = userValuePx + 'px';
    }

    this.previousPropertyDataCandidate = null;

    const allProperties = this._inlineStyle.allProperties();
    for (let i = 0; i < allProperties.length; ++i) {
      const property = allProperties[i];
      if (property.name !== context.styleProperty || !property.activeInStyle()) {
        continue;
      }

      this.previousPropertyDataCandidate = property;
      property.setValue(userInput, commitEditor, true, callback.bind(this));
      return;
    }

    this._inlineStyle.appendProperty(context.styleProperty, userInput, callback.bind(this));

    function callback(this: MetricsSidebarPane, success: boolean) {
      if (!success) {
        return;
      }
      if (!this.originalPropertyData) {
        this.originalPropertyData = this.previousPropertyDataCandidate;
      }

      if (this._highlightMode) {
        const node = this.node();
        if (!node) {
          return;
        }
        node.highlight(this._highlightMode);
      }

      if (commitEditor) {
        this.update();
      }
    }
  }

  _editingCommitted(element: Element, userInput: string, previousContent: string, context: {
    box: string; styleProperty: string; computedStyle: Map<string, string>; keyDownHandler: (arg0: Event) => void;
  }) {
    this.editingEnded(element, context);
    this._applyUserInput(element, userInput, previousContent, context, true);
  }
}
