/*
 * Copyright (C) 2007 Apple Inc.  All rights reserved.
 * Copyright (C) 2014 Google Inc. All rights reserved.
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
 * 3.  Neither the name of Apple Computer, Inc. ('Apple') nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS 'AS IS' AND ANY
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
/**
 * @unrestricted
 */

Elements.FontsWidget = class extends UI.ThrottledWidget {
  constructor() {
    super(true /* isWebComponent */);
    // this._stackLocation = UI.viewManager.createStackLocation();
    // this._fontsUsedPane = new UI.SimpleView(ls`Fonts Families`);
    // this._stackLocation.showView(this._fontsUsedPane);
    // this._stackLocation.widget().show(this.contentElement);
    this._systemFonts = [
      'Arial', 'Comic Sans MS', 'Courier New', 'Impact', 'Lucida Sans Unicode', 'Malgun Gothic', 'Nirmala UI', 'SimSun',
      'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana'
    ];

    this.registerRequiredCSS('elements/fontsWidget.css');
    this._currentNode = UI.context.flavor(SDK.DOMNode);
    const resourceTreeModel = this._currentNode._domModel.cssModel() ?
        this._currentNode._domModel.cssModel().target().model(SDK.ResourceTreeModel) :
        null;
    this._render();
    this._pageRefreshed = false;
    this._fontFaceArray = [];

    resourceTreeModel.addEventListener(SDK.ResourceTreeModel.Events.MainFrameNavigated, this._onNavigate, this);
    this._currentNode._domModel.cssModel().addEventListener(
        SDK.CSSModel.Events.FontsUpdated, this._fontFaceUpdated, this);
    UI.context.addFlavorChangeListener(SDK.DOMNode, this._update, this);
  }

  _render() {
    this._mainContainer = this.contentElement.createChild('div', 'fonts-start-view');

    // Fonts Used Section
    this._fontsUsedSection = this._mainContainer.createChild('div', 'fonts-div-section fonts-used');
    // this._fontsUsedSection = createElementWithClass('div', 'fonts-div-section fonts-used');
    this._fontsUsedSection.createChild('h2').innerHTML = ls`Font Families`;
    this._fontsUsedDiv = this._fontsUsedSection.createChild('div');

    // Creating Font Selection Section
    this._fontSelectionSection = this._mainContainer.createChild('div', 'fonts-div-section');
    this._fontSelectionLabel = this._fontSelectionSection.createChild('div');
    this._fontSelector = this._fontSelectionSection.createChild('select', 'fonts-input chrome-select');

    this._fontSelectionLabel.innerHTML = ls`Select Font`;
    this._addSystemFonts();

    // Creating Sliders
    this._sizeValue = this._createSliderDivSection(ls`Size`, 1, 100, 50, 1);
    this._lineHeightValue = this._createSliderDivSection(ls`Line Height`, 0, 2, 1, .1);
    this._weightValue = this._createSliderDivSection(ls`Weight`, 100, 1000, 100, 100);
    this._italicsValue = this._createItalicsCheckbox();

    // Creating Preview Text Section
    this._textPreviewSection = this._mainContainer.createChild('div', 'fonts-div-section');
    this._textPreview = this._textPreviewSection.createChild('div');
    this._textPreviewInput = this._textPreviewSection.createChild('input', 'fonts-input');
    this._previewText = this._mainContainer.createChild('p', 'preview-text');

    this._previewText.innerHTML = ls`Preview Text`;
    this._textPreview.innerHTML = ls`Sample Text`;
    this._textPreviewInput.type = 'text';
    this._textPreviewInput.oninput = function() {
      this._previewText.innerHTML = this._textPreviewInput.value;
    }.bind(this);

    this._fontSelector.oninput = function() {
      this._currentNode._domModel.cssModel()
          .setEffectivePropertyValueForNode(this._currentNode.id, 'font-family', this._fontSelector.value)
          .then(this._updateFontsUsed.bind(this));
      this._previewText.style.fontFamily = this._fontSelector.value;
      this._allFontsDiv.removeChildren();
      this._allFontsButton.textContent = ls`Show All Fonts`;
      this._allFontsArray = undefined;
    }.bind(this);

    // Create Show All Fonts
    this._allFontsButton =
        UI.createTextButton(ls`Show All Fonts`, () => this._showFonts(), 'fonts-start-button', true /* primary */);

    this._mainContainer.appendChild(this._allFontsButton);
    this._allFontsSection = this._mainContainer.createChild('div', 'fonts-div-section fonts-used');
    this._allFontsDiv = this._allFontsSection.createChild('div');
    this._onNavigate().then(this._update.bind(this));
  }

  _createSliderDivSection(title, min, max, defaultValue, stepSize) {
    const divSection = this._mainContainer.createChild('div', 'fonts-div-section');
    const divTitle = divSection.createChild('div', 'fonts-icon-label');
    // let divSlider = divSection.createChild('input');
    const divSlider = divSection.createChild('input', 'slider fonts-input');
    const divValue = divSection.createChild('input', 'input-box');

    divTitle.innerHTML = title;
    divSlider.setAttribute('type', 'range');
    divSlider.min = min;
    divSlider.max = max;
    divSlider.value = defaultValue;
    divSlider.step = stepSize;
    divValue.type = 'number';
    divValue.value = defaultValue;
    divValue.step = stepSize;

    switch (title) {
      case 'Size':
        divSlider.oninput = function() {
          this._currentNode._domModel.cssModel().setEffectivePropertyValueForNode(
              this._currentNode.id, 'font-size', divSlider.value + 'px');
          this._previewText.style.fontSize = divSlider.value + 'px';
          divValue.value = divSlider.value;
        }.bind(this);
        divValue.oninput = function() {
          this._currentNode._domModel.cssModel().setEffectivePropertyValueForNode(
              this._currentNode.id, 'font-size', divValue.value + 'px');
          this._previewText.style.fontSize = divValue.value + 'px';
          divSlider.value = divValue.value;
        }.bind(this);
        break;
      case 'Line Height':
        divSlider.oninput = function() {
          this._currentNode._domModel.cssModel().setEffectivePropertyValueForNode(
              this._currentNode.id, 'line-height', divSlider.value);
          this._previewText.style.lineHeight = divSlider.value;
          divValue.value = divSlider.value;
        }.bind(this);
        divValue.oninput = function() {
          this._currentNode._domModel.cssModel().setEffectivePropertyValueForNode(
              this._currentNode.id, 'line-height', divValue.value);
          this._previewText.style.lineHeight = divValue.value;
          divSlider.value = divValue.value;
        }.bind(this);
        break;
      case 'Weight':
        divSlider.oninput = function() {
          this._currentNode._domModel.cssModel().setEffectivePropertyValueForNode(
              this._currentNode.id, 'font-weight', divSlider.value);
          this._previewText.style.fontWeight = divSlider.value;
          divValue.value = divSlider.value;
        }.bind(this);
        divValue.oninput = function() {
          this._currentNode._domModel.cssModel().setEffectivePropertyValueForNode(
              this._currentNode.id, 'font-weight', divValue.value);
          this._previewText.style.fontWeight = divValue.value;
          divSlider.value = divValue.value;
        }.bind(this);
        break;
    }


    return [divValue, divSlider];
  }

  _createItalicsCheckbox() {
    const divSection = this._mainContainer.createChild('div', 'fonts-div-section');
    const divTitle = divSection.createChild('div', 'fonts-icon-label');
    const divCheckbox = divSection.createChild('input', 'fonts-input');
    divCheckbox.type = 'checkbox';

    divTitle.innerHTML = ls`Italicize`;

    divCheckbox.onchange = function() {
      if (divCheckbox.checked) {
        this._previewText.style.fontStyle = 'italic';
        this._currentNode._domModel.cssModel().setEffectivePropertyValueForNode(
            this._currentNode.id, 'font-style', 'italic');
      } else {
        this._previewText.style.fontStyle = 'normal';
        this._currentNode._domModel.cssModel().setEffectivePropertyValueForNode(
            this._currentNode.id, 'font-style', 'normal');
      }
    }.bind(this);

    return divCheckbox;
  }

  _addSystemFonts() {
    this._systemFonts.forEach(function(font) {
      const option = this._fontSelector.createChild('option');
      option.value = font;
      option.text = font;
    }.bind(this));
  }

  async _showFonts() {
    if (this._allFontsButton.textContent == 'Show All Fonts') {
      if (!this._allFontsArray) {
        const parentNode = this._findParentNode(this._currentNode);
        this._allFontsArray = await this._currentNode._domModel.cssModel().platformFontsPromise(parentNode.id, -1);
      }
      for (let i = 0; i < this._allFontsArray.length; i++) {
        if (this._allFontsArray[i] !== '') {
          const fontListItem = this._allFontsDiv.createChild('h3', 'fonts-list');
          const fontListSource = this._allFontsDiv.createChild('div');

          fontListItem.innerHTML = this._allFontsArray[i].familyName;
          if (!this._allFontsArray[i].isCustomFont) {
            const fontListSystemSource = this._allFontsDiv.createChild('span', 'fonts-list');
            fontListSystemSource.innerHTML = 'System';
          } else {
            let inFontFaceArray = false;
            let fontFaceInfo;
            for (const fontFace of this._fontFaceArray) {
              if (fontFace.platformFontFamily === this._allFontsArray[i].familyName) {
                inFontFaceArray = true;
                fontFaceInfo = fontFace;
                break;
              }
            }
            const fontListSource = createElementWithClass('span', 'font-face-div');
            if (inFontFaceArray) {
              this._fontFaceButton = UI.createTextButton(ls`Show @FontFace`, () => {
                this._displayFontFaceInfo(fontFaceInfo, fontListSource);
              }, 'fonts-start-button', true /* primary */);
              this._allFontsDiv.appendChild(this._fontFaceButton);
            } else {
              fontListSource.innerHTML = 'Custom';
            }
            this._allFontsDiv.appendChild(fontListSource);
          }
        }
      }
      // console.log(this._fontFaceArray);
      // for (const fontFace of this._fontFaceArray) {
      //   let fontListItem = this._allFontsDiv.createChild('h3', 'fonts-list');
      //   fontListItem.innerHTML = fontFace.family;
      //   let fontListSource = this._allFontsDiv.createChild('span', 'fonts-list');
      //   fontListSource.innerHTML = "aaaa";
      //   //this._fontsUsedDiv.createChild()
      // }

      this._allFontsButton.textContent = ls`Hide All Fonts`;
    } else {
      this._allFontsDiv.removeChildren();
      this._allFontsButton.textContent = ls`Show All Fonts`;
    }
  }

  async _onNavigate() {
    this._allFontsDiv.removeChildren();
    this._allFontsButton.textContent = ls`Show All Fonts`;
    this._allFontsArray = undefined;
  }

  _findParentNode(node) {
    let parentNode = node;
    while (parentNode.parentNode != null) {
      parentNode = parentNode.parentNode;
    }
    return parentNode;
  }

  async _update() {
    this._currentNode = UI.context.flavor(SDK.DOMNode);
    if (this._currentNode != null) {
      this._updateSliders();
      this._updateFontsUsed();
    }
  }

  async _updateFontsUsed() {
    // Update Logic Here
    this._fontsUsedDiv.removeChildren();
    const fontArray = await this._currentNode._domModel.cssModel().platformFontsPromise(this._currentNode.id, -1);
    if (fontArray) {
      if (fontArray.length == 0) {
        const fontListItem = this._fontsUsedDiv.createChild('h3', 'fonts-list');
        fontListItem.innerHTML = ls`No fonts used in this container.`;
        return;
      }
      for (let i = 0; i < fontArray.length; i++) {
        if (!fontArray[i].isCustomFont) {
          const fontListItem = this._fontsUsedDiv.createChild('h3', 'fonts-list');
          fontListItem.innerHTML = fontArray[i].familyName;
          const fontListSource = this._fontsUsedDiv.createChild('span', 'fonts-list');
          fontListSource.innerHTML = ls`System`;
        } else {
          // Add font face expandable
          const fontListItem = this._fontsUsedDiv.createChild('h3', 'fonts-list');
          fontListItem.innerHTML = fontArray[i].familyName;
          const fontListSource = this._fontsUsedDiv.createChild('span', 'fonts-list');
          fontListSource.innerHTML = ls`Custom`;
        }
      }
    }
  }

  async _updateSliders() {
    try {
      const payload = await this._currentNode._domModel.cssModel().computedStylePromise(this._currentNode.id);
      let fontValue = payload.get('font-family');
      fontValue = fontValue.replace(/'/g, '');
      let sizeValue = payload.get('font-size');
      sizeValue = sizeValue.replace('px', '');
      let lineHeightValue = payload.get('line-height');
      lineHeightValue = lineHeightValue.replace('px', '');
      if (lineHeightValue === 'normal') {
        lineHeightValue = sizeValue;
      }
      const weightValue = payload.get('font-weight');
      const italicsValue = payload.get('font-style');

      this._setSliderValue(fontValue, sizeValue, lineHeightValue, weightValue, italicsValue);
    } catch (e) {
    }
  }

  _setSliderValue(fontValue, sizeValue, lineHeightValue, weightValue, italicsValue) {
    this._fontSelector.value = fontValue;
    this._sizeValue[0].value = sizeValue;
    this._sizeValue[1].value = sizeValue;
    this._lineHeightValue[0].value = lineHeightValue / sizeValue;
    this._lineHeightValue[1].value = lineHeightValue / sizeValue;
    this._weightValue[0].value = weightValue;
    this._weightValue[1].value = weightValue;
    if (italicsValue === 'normal') {
      this._italicsValue.checked = false;
    } else {
      this._italicsValue.checked = true;
    }

    // Setting Preview Text
    this._previewText.style.fontSize = sizeValue + 'px';
    this._previewText.style.lineHeight = lineHeightValue / sizeValue;
    this._previewText.style.fontWeight = weightValue;
    this._previewText.style.fontStyle = italicsValue;
    this._previewText.style.fontFamily = fontValue;
  }

  /**
   * @param {!Common.Event} event
   */
  _fontFaceUpdated(event) {
    if (event.data) {
      this._fontFaceArray.push(event.data);
      // info.fontFamily = Roboto
      // info.fontStretch = normal
      // info.fontStyle = italic
      // info.fontVariant = normal
      // info.fontWeight = 400
      // info.platformFontFamily = Roboto
      // info.src = www.sourceurl.com
    }
  }

  _createFontFace(button, section) {
    // const fontFaceInfo = this._fontFaceList[0];

    // let fontFaceHeader = section.createChild('div');
    // fontFaceHeader.innerHTML = '@font face {';
    // let fontFamily = section.createChild('div');
    // fontFamily.innerHTML = '  font-family: ' + fontFaceInfo.fontFamily;
    // let source = section.createChild('div');
    // source.innerHTML = '  src: ' + fontFaceInfo.src;
    // let fontStyle = section.createChild('div');
    // fontStyle.innerHTML = '  font-style: ' + fontFaceInfo.fontStyle;
    // let fontWeight = section.createChild('div');
    // fontWeight.innerHTML = '  font-weight: ' + fontFaceInfo.fontWeight;
    // let unicodeRange = section.createChild('div');
    // unicodeRange.innerHTML = '  unicode-range: ' + fontFaceInfo.unicodeRange;
    // let fontFaceEnd = section.createChild('div');
    // fontFaceEnd.innerHTML = '}';
    if (button.textContent == 'Show @FontFace') {
      const fontFaceHeader = section.createChild('div');
      fontFaceHeader.innerHTML = '@font face {';
      const fontFamily = section.createChild('div');
      fontFamily.innerHTML = '  font-family: ';
      const source = section.createChild('div');
      source.innerHTML = '  src: ';
      const fontStyle = section.createChild('div');
      fontStyle.innerHTML = '  font-style: ';
      const fontWeight = section.createChild('div');
      fontWeight.innerHTML = '  font-weight: ';
      const unicodeRange = section.createChild('div');
      unicodeRange.innerHTML = '  unicode-range: ';
      const fontFaceEnd = section.createChild('div');
      fontFaceEnd.innerHTML = '}';
      button.textContent = ls`Hide @FontFace`;
    } else {
      section.removeChildren();
      button.textContent = ls`Show @FontFace`;
    }
  }

  _displayFontFaceInfo(fontFaceInfo, section) {
    if (this._fontFaceButton.textContent == 'Show @FontFace') {
      const fontFaceHeader = section.createChild('div');
      fontFaceHeader.innerHTML = '@font face {';
      const fontFamily = section.createChild('div', 'font-face');
      fontFamily.innerHTML = 'font-family: ' + fontFaceInfo.fontFamily;
      const source = section.createChild('div', 'font-face');
      source.innerHTML = 'src: ' + fontFaceInfo.src;
      const fontStyle = section.createChild('div', 'font-face');
      fontStyle.innerHTML = 'font-style: ' + fontFaceInfo.fontStyle;
      const fontWeight = section.createChild('div', 'font-face');
      fontWeight.innerHTML = 'font-weight: ' + fontFaceInfo.fontWeight;
      const unicodeRange = section.createChild('div', 'font-face');
      unicodeRange.innerHTML = 'unicode-range: ' + fontFaceInfo.unicodeRange;
      const fontFaceEnd = section.createChild('div');
      fontFaceEnd.innerHTML = '}';
      this._fontFaceButton.textContent = ls`Hide @FontFace`;
    } else {
      section.removeChildren();
      this._fontFaceButton.textContent = ls`Show @FontFace`;
    }
  }
};
