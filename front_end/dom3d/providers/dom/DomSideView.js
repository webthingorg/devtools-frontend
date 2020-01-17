// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
* @implements {SDK.TargetManager.Observer}
* /

/** All the ui for the DomSideView */
Dom3d.DOMSideView = class extends UI.Widget {
  /**
   * @param {!Dom3d.RendererModel} rendererModel
   */
  constructor(rendererModel) {
    super(true);
    /** @typedef {!Dom3d.RendererModel}  */
    this._rendererModel = rendererModel;
    /** @typedef {!Dom3d.DOMModel} */
    this._DOMModel = new Dom3d.DOMModel(this, this._rendererModel);  // Has all the logic
    /** @typedef {boolean} */
    this._isPaused = false;

    // UI
    this._slider = null;
    this._sliderValue = 0;
    this._defaultColor = null;
    this._includeChildrenCheckbox = null;
    this._includeParentsCheckbox = null;

    this.registerRequiredCSS('dom3d/styles.css');
    this.contentElement.classList.add('Dom3d-side-view');

    SDK.targetManager.observeTargets(this);
    SDK.targetManager.addModelListener(
        SDK.DOMModel, SDK.DOMModel.Events.DocumentUpdated, this._documentUpdatedEvent, this);
    UI.context.addFlavorChangeListener(SDK.DOMNode, this._nodeSelectionChanged, this);

    // Body UI
    const bodyContainer = this._createBodyContainer();
    // Add everything to the Widget content element
    this.contentElement.appendChild(bodyContainer);

    this._rendererModel.addEventListener(Dom3d.DOMSideViewEvents.updateLevelSlider, this.setNestingLevelMax.bind(this));
    this._rendererModel.addEventListener(Dom3d.DOMSideViewEvents.retakeSnapshot, this._retakeSnapshot.bind(this));
  }

  _nodeSelectionChanged() {
    const node = UI.context.flavor(SDK.DOMNode);
    if (node && !this._isPaused && this._rendererModel && this._rendererModel.getDomSceneModel()) {
      this._rendererModel.getDomSceneModel().highlightNode(node.backendNodeId());
    }
  }

  /**
   * Creates the ui for the body
   *
   * @returns {!Element}
   */
  _createBodyContainer() {
    const bodyContainer = createElementWithClass('div', 'body');
    bodyContainer.appendChild(this._createIsolateElementContent());
    bodyContainer.appendChild(this._createShowAllElementsContent());
    bodyContainer.appendChild(this._createNestingLevelContent());
    bodyContainer.appendChild(this._createColorContent());
    return bodyContainer;
  }

  /**
 * @override
 * @param {!SDK.Target} target
 */
  targetAdded(target) {
    this._DOMModel.targetAdded(target, this._isPaused);
    this.resetAllInputsToDefault();
  }

  /**
   * @override
   * @param {!SDK.Target} target
   */
  targetRemoved(target) {
    this._DOMModel.targetRemoved(target, this._isPaused);
  }

  pauseScene() {
    this._isPaused = true;
  }

  resumeScene() {
    this._isPaused = false;
  }

  /**
  * @override
  */
  wasShown() {
    super.wasShown();
    this._DOMModel.wasShown();
  }

  /**
   * @override
   */
  willHide() {
    super.willHide();
  }

  /**
   * Executed every time the document updates
   * Listener function for SDK.DOMModel.Events.DocumentUpdated event
   * @param {!Common.Event} event
   */
  _documentUpdatedEvent(event) {
    const sdkDomModel = /** @type {!SDK.DOMModel} */ (event.data);
    if (sdkDomModel) {
      this._DOMModel.documentUpdatedEvent(sdkDomModel, this._isPaused);
    }
    this.resetAllInputsToDefault();
  }

  /**
   * @returns {!Element}
   */
  _createShowAllElementsContent() {
    const showAllElementsButton = UI.createTextButton(
        ls`Show all elements`, this._onShowAllButtonClicked.bind(this), 'Dom3d-show-all', false /* primary */);
    const showAllElementsContainer = createElementWithClass('div', 'Dom3d-section');
    showAllElementsContainer.appendChild(showAllElementsButton);
    return showAllElementsContainer;
  }

  /**
   * @returns {!Element}
   */
  _createNestingLevelContent() {
    const sliderContainer = createElementWithClass('div', 'Dom3d-nest-level Dom3d-section');

    this._slider = createElementWithClass('input', 'slider');
    this._slider.setAttribute('aria-level', ls`Nesting level for page`);
    this._slider.setAttribute('type', 'range');
    this._slider.setAttribute('min', 1);
    this._slider.setAttribute('max', 1);
    this._slider.setAttribute('step', 1);
    this._slider.addEventListener('input', this._onNestingLevelSliderChanged.bind(this), false);
    this._sliderValue = createElementWithClass('span', 'slider-value');
    this._sliderValue.textContent = '0';

    const p = createElementWithClass('p', '');
    p.appendChild(UI.formatLocalized('Nesting level for page: %s', [this._sliderValue]));

    sliderContainer.appendChild(p);
    sliderContainer.appendChild(this._slider);

    return sliderContainer;
  }

  /**
   * @returns {!Element}
   */
  _createColorContent() {
    const colorControlsContainer = createElementWithClass('div', 'Dom3d-section');
    UI.ARIAUtils.markAsRadioGroup(colorControlsContainer);
    colorControlsContainer.setAttribute('aria-level', ls`Color type`);

    const screenTexture = this._createColorRadioElement(ls`Use screen texture`, 'screen');
    const bgColor = this._createColorRadioElement(ls`Use background color`, 'bg');
    const heatMapGradient = this._createColorRadioElement(ls`Heatmap - Rainbow`, 'gradient');
    const heatMapBlue = this._createColorRadioElement(ls`Heatmap - Blue to Yellow`, 'blue');
    const heatMapPurple = this._createColorRadioElement(ls`Heatmap - Purple to White`, 'purple', true /* checked */);

    const sectionTitle = createElementWithClass('p', 'title');
    sectionTitle.textContent = ls`Color type`;

    this._defaultColor = heatMapPurple;

    colorControlsContainer.appendChild(sectionTitle);
    colorControlsContainer.appendChild(screenTexture);
    colorControlsContainer.appendChild(heatMapPurple);
    colorControlsContainer.appendChild(heatMapBlue);
    colorControlsContainer.appendChild(heatMapGradient);
    colorControlsContainer.appendChild(bgColor);

    return colorControlsContainer;
  }

  /**
   * @returns {!Element}
   */
  _createColorRadioElement(name, id, checked = false) {
    const radioContainer = createElementWithClass('div', '');
    const radioLabel = UI.createRadioLabel('', name);
    const optionElement = radioLabel.radioElement;
    optionElement.name = 'colorType';
    optionElement.checked = checked || false;
    optionElement.addEventListener('change', this._onColorRadioButtonChanged.bind(this, id), false);
    radioContainer.appendChild(radioLabel);
    return radioContainer;
  }

  /**
   * @returns {!Element}
   */
  _createIsolateElementContent() {
    const includeChildrenCheckbox = UI.CheckboxLabel.create(ls`Include children`, true /* checked */);
    this._includeChildrenCheckbox = includeChildrenCheckbox.checkboxElement;

    const includeParentsCheckbox = UI.CheckboxLabel.create(ls`Include parents`, true /* checked */);
    this._includeParentsCheckbox = includeParentsCheckbox.checkboxElement;

    const isolateBoxButton = UI.createTextButton(
        ls`Isolate selected element`, this._onIsolateButtonClicked.bind(this), 'Dom3d-isolate-element',
        false /* primary */);
    const isolateElementContainer = createElementWithClass('div', 'Dom3d-section');

    const ch1div = createElementWithClass('div', '');
    ch1div.appendChild(includeChildrenCheckbox);

    const ch2div = createElementWithClass('div', '');
    ch2div.appendChild(includeParentsCheckbox);

    isolateElementContainer.appendChild(isolateBoxButton);
    isolateElementContainer.appendChild(ch1div);
    isolateElementContainer.appendChild(ch2div);

    return isolateElementContainer;
  }

  /**
   * @param {{data:*}} event
   */
  setNestingLevelMax(event) {
    // Called by renderModel to update ui
    if (event && event.data) {
      const maxNestLevel = '' + event.data;
      if (this._sliderValue && this._slider) {
        this._sliderValue.textContent = maxNestLevel;
        this._slider.setAttribute('max', maxNestLevel);
        this._slider.setAttribute('value', maxNestLevel);
        this._slider.value = maxNestLevel;
      }
    }
  }

  _retakeSnapshot() {
    this._DOMModel.makeSnapshot();
    this.resetAllInputsToDefault();
  }

  resetAllInputsToDefault() {
    // This will set all the input controls to their default value
    this.setNestingLevelMax({data: '0'});
    if (this._defaultColor && this._defaultColor.children[0] && this._defaultColor.children[0].radioElement) {
      this._defaultColor.children[0].radioElement.checked = true;
    }

    if (this._includeChildrenCheckbox && this._includeParentsCheckbox) {
      this._includeChildrenCheckbox.checked = true;
      this._includeParentsCheckbox.checked = true;
    }
  }

  /* UI action listeners */

  /**
   * Called when the refresh button is clicked
   */
  _onRefreshButtonClicked() {
    this._retakeSnapshot();
  }

  /**
   * Called when the reset button is clicked
   */
  _onResetButtonClicked() {
    if (this._rendererModel) {
      this._rendererModel.getDomSceneModel().resetView();
    }
  }

  /**
   * Called when the radio buttons for Color change
   * @param {string} type
   */
  _onColorRadioButtonChanged(type) {
    if (this._rendererModel) {
      this._rendererModel.getDomSceneModel().changeColorScheme(type);
    }
  }

  /**
   * Called when the nesting level slider change
   * @param {*} event
   */
  _onNestingLevelSliderChanged(event) {
    const newSliderValue = event.srcElement.value;
    this._sliderValue.textContent = newSliderValue;

    if (this._rendererModel) {
      this._rendererModel.getDomSceneModel().levelSliderChanged(newSliderValue);
    }
  }

  /**
   * Called when the isolate element button is clicked
   */
  _onIsolateButtonClicked() {
    const includeChildren = this._includeChildrenCheckbox.checked || false;
    const includeParents = this._includeParentsCheckbox.checked || false;

    if (this._rendererModel) {
      this._rendererModel.getDomSceneModel().isolateElement(includeChildren, includeParents);
    }
  }

  _onShowAllButtonClicked() {
    if (this._rendererModel) {
      this._rendererModel.getDomSceneModel().enableAllElements();
    }

    const max = this._slider.getAttribute('max');
    this.setNestingLevelMax({data: max});
  }
};

Dom3d.DOMSideViewEvents = {
  updateLevelSlider: 'updateLevelSlider',
  retakeSnapshot: 'retakeSnapshot'
};
