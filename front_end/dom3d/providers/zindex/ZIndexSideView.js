// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @implements {SDK.TargetManager.Observer}
 * /

/** All the ui for the ZIndexSideView */
Dom3d.ZIndexSideView = class extends UI.Widget {
  /**
   * @param {!Dom3d.RendererModel} rendererModel
   */
  constructor(rendererModel) {
    super(true);
    /** @typedef {!Dom3d.RendererModel}  */
    this._rendererModel = rendererModel;
    /** @typedef {!Dom3d.ZIndexModel} */
    this._ZIndexModel = new Dom3d.ZIndexModel(this, this._rendererModel);  // Has all the logic
    /** @typedef {boolean} */
    this._isPaused = true;

    this.registerRequiredCSS('dom3d/styles.css');
    this.contentElement.classList.add('Dom3d-side-view');

    SDK.targetManager.observeTargets(this);
    SDK.targetManager.addModelListener(
        SDK.DOMModel, SDK.DOMModel.Events.DocumentUpdated, this._documentUpdatedEvent, this);
    UI.context.addFlavorChangeListener(SDK.DOMNode, this._nodeSelectionChanged, this);

    // UI
    this._defaultColorRadioElement = null;
    this._isolateCheckboxShowParents = null;
    this._isolateCheckboxShowStackingContext = null;
    this._highlightCheckbox = null;
    this._hideCheckbox = null;

    // Body UI
    const bodyContainer = this._createBodyContainer();

    // Add everything to the Widget content element
    this.contentElement.appendChild(bodyContainer);

    this._rendererModel.addEventListener(Dom3d.ZIndexSideViewEvents.retakeSnapshot, this._retakeSnapshot.bind(this));
  }

  /**
   * Creates the ui for the body
   *
   * @returns {!Element}
   */
  _createBodyContainer() {
    const bodyContainer = createElementWithClass('div', 'body');
    // Interaction Elements
    bodyContainer.appendChild(this._createShowAllElementsContent());
    bodyContainer.appendChild(this._createIsolateElementContent());
    bodyContainer.appendChild(this._createColorContent());
    bodyContainer.appendChild(this._createHideChildrenWithSamePaintOrderContent());
    return bodyContainer;
  }

  /**
   * @override
   * @param {!SDK.Target} target
   */
  targetAdded(target) {
    this._ZIndexModel.targetAdded(target, this._isPaused);
    this.resetAllInputsToDefault();
  }

  /**
   * @override
   * @param {!SDK.Target} target
   */
  targetRemoved(target) {
    this._ZIndexModel.targetRemoved(target, this._isPaused);
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
    this._ZIndexModel.wasShown();
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
      this._ZIndexModel.documentUpdatedEvent(sdkDomModel, this._isPaused);
    }
    this.resetAllInputsToDefault();
  }

  /**
   * Triggered when a node is selected in the Elements panel
   */
  _nodeSelectionChanged() {
    const node = UI.context.flavor(SDK.DOMNode);
    if (node && !this._isPaused && this._rendererModel && this._rendererModel.getZIndexSceneModel()) {
      this._rendererModel.getZIndexSceneModel().highlightNode(node.backendNodeId());
    }
  }

  /**
   * @returns {?Element}
   */
  _createColorContent() {
    const colorControlsContainer = createElementWithClass('div', 'Dom3d-section');
    UI.ARIAUtils.markAsRadioGroup(colorControlsContainer);
    colorControlsContainer.setAttribute('aria-level', ls`Color type`);


    const bgColor = this._createColorRadioElement(ls`Background color`, 'bg');
    // const heatMapGradient = this._createColorRadioElement(ls`Heatmap - Rainbow`, 'gradient');
    // const heatMapBlue = this._createColorRadioElement(ls`Heatmap - Blue to Yellow`, 'blue');
    const heatMapPurple = this._createColorRadioElement(ls`Purple to White`, 'purple', true /* checked */);

    const sectionTitle = createElementWithClass('p', 'title');
    sectionTitle.textContent = ls`Color type`;

    this._defaultColorRadioElement = heatMapPurple;

    colorControlsContainer.appendChild(sectionTitle);
    colorControlsContainer.appendChild(heatMapPurple);
    // colorControlsContainer.appendChild(heatMapBlue);
    // colorControlsContainer.appendChild(heatMapGradient);
    colorControlsContainer.appendChild(bgColor);

    return colorControlsContainer;
  }

  /**
   * Creates a radio element for the color options
   *
   * @param {string} name
   * @param {string} id
   * @param {boolean} checked
   * @returns {?Element}
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
   * @returns {?Element}
   */
  _createIsolateElementContent() {
    const isolateCheckboxShowParents = UI.CheckboxLabel.create(ls`Keep parents`, true);
    this._isolateCheckboxShowParents = isolateCheckboxShowParents.checkboxElement;
    this._isolateCheckboxShowParents.addEventListener('change', e => {
      this._onIsolateShowParentChanged(e.target.checked);
    }, false);

    const isolateCheckboxKeepStackingCtx =
        UI.CheckboxLabel.create(ls`Keep only parents with new stacking context`, false);
    this._isolateCheckboxShowStackingContext = isolateCheckboxKeepStackingCtx.checkboxElement;
    this._isolateCheckboxShowStackingContext.addEventListener('change', e => {
      this._onIsolateKeepOnlyCtxChanged(e.target.checked);
    }, false);

    const isolateBoxButton = UI.createTextButton(
        ls`Isolate selected element`, this._onIsolateButtonClicked.bind(this), 'Dom3d-isolate-element', false);
    const isolateElementContainer = createElementWithClass('div', 'Dom3d-section');

    const ch1div = createElementWithClass('div', '');
    ch1div.appendChild(isolateCheckboxShowParents);

    const ch2div = createElementWithClass('div', '');
    ch2div.appendChild(isolateCheckboxKeepStackingCtx);

    isolateElementContainer.appendChild(isolateBoxButton);
    isolateElementContainer.appendChild(ch1div);
    // isolateElementContainer.appendChild(ch2div);

    return isolateElementContainer;
  }

  /**
   * @returns {?Element}
   */
  _createShowAllElementsContent() {
    const showAllElementsButton =
        UI.createTextButton(ls`Show all`, this._onShowAllButtonClicked.bind(this), 'Dom3d-show-all', false);
    const showAllElementsContainer = createElementWithClass('div', 'Dom3d-section');

    const showOnlyCtxButton = UI.createTextButton(
        ls`Show only stacking contexts`, this._onShowOnlyStackingCtxButtonClicked.bind(this), 'Dom3d-show-ctx', false);

    const highlightCheckbox = UI.CheckboxLabel.create(ls`Use labels`, true);
    this._highlightCheckbox = highlightCheckbox.checkboxElement;
    this._highlightCheckbox.addEventListener('change', e => {
      this._onHighlightChanged(e.target.checked);
    }, false);
    const ch1div = createElementWithClass('div', '');
    ch1div.appendChild(highlightCheckbox);

    showAllElementsContainer.appendChild(showAllElementsButton);
    showAllElementsContainer.appendChild(showOnlyCtxButton);
    showAllElementsContainer.appendChild(ch1div);

    return showAllElementsContainer;
  }

  /**
   * @returns {?Element}
   */
  _createHideChildrenWithSamePaintOrderContent() {
    const hideCheckbox = UI.CheckboxLabel.create(ls`Hide overlapping elements`, true);
    hideCheckbox.title = ls`Hide elements with the same paint order as their parent.`;
    this._hideCheckbox = hideCheckbox.checkboxElement;
    this._hideCheckbox.addEventListener('change', e => {
      this._onHideChanged(e.target.checked);
    }, false);

    const ch1div = createElementWithClass('div', '');
    ch1div.appendChild(hideCheckbox);
    const hideContainer = createElementWithClass('div', 'Dom3d-section');
    hideContainer.appendChild(ch1div);

    return hideContainer;
  }

  _retakeSnapshot() {
    this._ZIndexModel.makeSnapshot();
    this.resetAllInputsToDefault();
  }

  resetAllInputsToDefault() {
    // This will set all the input controls to their default value
    if (this._defaultColorRadioElement && this._defaultColorRadioElement.children[0] &&
        this._defaultColorRadioElement.children[0].radioElement) {
      this._defaultColorRadioElement.children[0].radioElement.checked = true;
    }

    if (this._isolateCheckboxShowParents) {
      this._isolateCheckboxShowParents.checked = true;
    }

    if (this._isolateCheckboxShowStackingContext) {
      this._isolateCheckboxShowStackingContext.checked = false;
    }

    if (this._highlightCheckbox) {
      this._highlightCheckbox.checked = true;
    }
  }

  /* UI action listeners */

  /**
   * Called when the refresh button is clicked
   */
  _onRefreshButtonClicked() {
    this._ZIndexModel.makeSnapshot();
    this.resetAllInputsToDefault();
  }

  /**
   * Called when the reset button is clicked
   */
  _onResetButtonClicked() {
    if (this._rendererModel) {
      this._rendererModel.getZIndexSceneModel().resetView();
    }
  }

  /**
   * Called when the radio buttons for Color change
   * @param {string} type
   */
  _onColorRadioButtonChanged(type) {
    if (this._rendererModel) {
      this._rendererModel.getZIndexSceneModel().changeColorScheme(type);
    }
  }

  /**
   * @param {boolean} value
   */
  _onIsolateShowParentChanged(value) {
    if (this._rendererModel) {
      this._rendererModel.getZIndexSceneModel().isolateStackContextShowParents(value);
    }
  }

  _onIsolateKeepOnlyCtxChanged(value) {
    if (this._rendererModel) {
      this._rendererModel.getZIndexSceneModel().isolateStackContextKeepOnlyCtx(value);
    }
  }

  _onHighlightChanged(value) {
    if (this._rendererModel) {
      this._rendererModel.getZIndexSceneModel().highlightStackContext(value);
    }
  }

  _onHideChanged(value) {
    if (this._rendererModel) {
      this._rendererModel.getZIndexSceneModel().hideElementsWithSamePaintOrder(value);
    }
  }

  /**
   * Called when the isolate element button is clicked
   */
  _onIsolateButtonClicked() {
    if (this._rendererModel) {
      this._rendererModel.getZIndexSceneModel().isolateCurrentSelectedElement();
    }
  }

  _onShowAllButtonClicked() {
    if (this._rendererModel) {
      this._rendererModel.getZIndexSceneModel().recreateAllBoxes();
    }
  }

  _onShowOnlyStackingCtxButtonClicked() {
    if (this._rendererModel) {
      this._rendererModel.getZIndexSceneModel().showStackingContextOnly();
    }
  }
};

Dom3d.ZIndexSideViewEvents = {
  retakeSnapshot: 'retakeZIndexSnapshot'
};
