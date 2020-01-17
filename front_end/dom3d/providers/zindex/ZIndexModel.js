// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/** All the logic needed by the ZIndexSideView */
Dom3d.ZIndexModel = class {
  /**
   * @param {!Dom3d.ZIndexSideView} panel
   * @param {!Dom3d.RendererModel} rendererModel
   */
  constructor(panel, rendererModel) {
    this._panel = panel;
    this._rendererModel = rendererModel;

    /** @typedef {!SDK.DOMModel} */
    this._sdkDomModel = null;
    // This is used to highlight nodes in the screen (Overlay agent) and in the Elements panel

    /** @typedef {!SDK.ScreenCaptureModel} */
    this._screenCaptureModel = null;
    // This is used to get the metrics of the current viewport

    // isDirty is set to true when the sdkDomModel has been updated but the
    // Scene hasn't been re calculated, this happens when a user navigates to a new page
    // but the view was not active
    this._isDirty = false;

    this._updateThrottler = new Common.Throttler(500);

    // See the capabilities for each target here:
    // https://cs.chromium.org/chromium/src/third_party/blink/renderer/devtools/front_end/sdk/Target.js
  }

  /**
   * @param {!SDK.Target} target
   * @param {boolean} isPaused
   */
  targetAdded(target, isPaused) {
    if (target && target.type() === SDK.Target.Type.Frame && !target.parentTarget()) {
      const sdkDomModel = target.model(SDK.DOMModel) || null;
      this._screenCaptureModel = target.model(SDK.ScreenCaptureModel) || null;
      this.documentUpdatedEvent(sdkDomModel, isPaused);
    }
  }

  /**
   * @param {!SDK.Target} target
   * @param {boolean} isPaused
   */
  targetRemoved(target, isPaused) {
    if (this._sdkDomModel && this._sdkDomModel.target() !== target) {
      this._sdkDomModel = null;
      this._screenCaptureModel = null;
    }
  }

  /**
   * Called when the side view panel for the ZIndex scene is shown
   */
  wasShown() {
    if (this._isDirty && this._sdkDomModel) {
      // If the panel is shown but the model is dirty we re calculate the scene
      this.makeSnapshot();
    }
  }

  /**
   * Called by ZIndexSideView
   *
   * @param {?SDK.DOMModel} sdkDomModel
   * @param {boolean} isPaused
   */
  documentUpdatedEvent(sdkDomModel, isPaused) {
    if (sdkDomModel && sdkDomModel.target() && sdkDomModel.target().type() === SDK.Target.Type.Frame &&
        !sdkDomModel.target().parentTarget()) {
      this._updateSdkDomModel(sdkDomModel, isPaused);
    }
  }

  /**
   * Handles the logic of getting a new sdkDomModel
   * set the status as dirty if the scene is paused while the update happens
   *
   * @param {!SDK.DOMModel} domModel
   * @param {boolean} isPaused
   */
  _updateSdkDomModel(domModel, isPaused) {
    if (domModel) {
      domModel.requestDocument();
      this._sdkDomModel = domModel;
      this._screenCaptureModel = domModel.target().model(SDK.ScreenCaptureModel) || null;
      if (isPaused) {
        // We don't create a new scene if the panel is paused
        // we just signal that a future scene update is needed by setting isDirty to true
        this._isDirty = true;
      } else {
        this._updateThrottler.schedule(this.makeSnapshot());
      }
    }
  }

  /**
   * @returns {!SDK.DOMModel}
   */
  sdkDomModel() {
    return this._sdkDomModel;
  }

  /**
   * @returns boolean
   */
  isValidDomModel() {
    return this._sdkDomModel && this._sdkDomModel.existingDocument() && this._sdkDomModel.existingDocument().body;
  }

  /**
   * @returns {!Promise<!Dom3d.ScreenMetrics>}
   */
  async getLayoutMetrics() {
    let metrics = {
      viewportX: 0,
      viewportY: 0,
      viewportScale: 0,
      contentWidth: 0,
      contentHeight: 0,
    };
    if (this._screenCaptureModel) {
      metrics = await this._screenCaptureModel.fetchLayoutMetrics();
    }
    return metrics;
  }

  /**
   * @param {!Dom3d.DOMSnapshot} snapshot
   * @returns {?Dom3d.ElementWithStyles}
   */
  createContentFromSnapshot(snapshot) {
    // We need this index to find what node of the snapshot is the one representing the <body /> element
    const bodyNodeIndex = snapshot.domNodes.findIndex(node => node.nodeName === 'BODY');
    return this._getElementWithStyles(snapshot, bodyNodeIndex);
  }

  /**
   * Parse a node from the snapshot into a ElementWithStyles
   * Recursively populate the children property creating new ElementWithStyles for each of its children
   * @param {!Dom3d.DOMSnapshot} snapshot
   * @param {number} nodeIndex
   * @returns {?Dom3d.ElementWithStyles}
   */
  _getElementWithStyles(snapshot, nodeIndex) {
    /** @private {!Dom3d.ElementWithStyles} */
    const elementWithStyles = {
      id: 0,
      name: '',
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      children: [],
      backgroundColor: '50,50,55',
      properties: {},
      paintOrder: 0
    };

    if (snapshot.domNodes[nodeIndex] === undefined) {
      return elementWithStyles;
    }

    const backendNodeId = snapshot.domNodes[nodeIndex].backendNodeId;
    const nodeType = snapshot.domNodes[nodeIndex].nodeType;
    const childrenIndexes = snapshot.domNodes[nodeIndex].childNodeIndexes || [];
    const layoutNodeIndex = snapshot.domNodes[nodeIndex].layoutNodeIndex;
    let computedStyleIndex = 0;
    let boundingBox = {};
    let paintOrder = 0;
    let isStackingContext = false;

    // We are not interested in DOM elements without a layout Node since we
    // wouldn't have enough information to position them in the screen
    if (nodeType === 1 && layoutNodeIndex && layoutNodeIndex >= 0) {
      computedStyleIndex = snapshot.layoutTreeNodes[layoutNodeIndex].styleIndex || 0;
      boundingBox = snapshot.layoutTreeNodes[layoutNodeIndex].boundingBox;
      paintOrder = snapshot.layoutTreeNodes[layoutNodeIndex].paintOrder;
      isStackingContext = snapshot.layoutTreeNodes[layoutNodeIndex].isStackingContext;
    }

    // There is only one property white-listed, the background color so we can assume index 0 has its value
    const backgroundColor = snapshot.computedStyles[computedStyleIndex].properties[0].value || '';

    const childrenWithStyles = [];
    for (const childIndex of childrenIndexes) {
      const cws = this._getElementWithStyles(snapshot, childIndex);
      if (cws && cws.width) {
        childrenWithStyles.push(cws);
      }
    }

    elementWithStyles.backgroundColor = backgroundColor;
    elementWithStyles.id = backendNodeId;
    elementWithStyles.name = backendNodeId;
    elementWithStyles.width = boundingBox.width;
    elementWithStyles.height = boundingBox.height;
    elementWithStyles.x = boundingBox.x;
    elementWithStyles.y = boundingBox.y;
    elementWithStyles.children = childrenWithStyles;
    elementWithStyles.paintOrder = paintOrder;
    elementWithStyles.isStackingContext = isStackingContext;
    elementWithStyles.properties = snapshot.computedStyles[computedStyleIndex].properties;

    return elementWithStyles;
  }

  /**
   * An async function that gets the DOM snapshot via CDP and parses it,
   * after parsing it it initializes the scene with the corresponding data
   */
  async makeSnapshot() {
    if (this.isValidDomModel()) {
      // Only wait for the layout metrics
      const metrics = await this.getLayoutMetrics();

      this._rendererModel.createZIndexSceneModel(this.sdkDomModel(), metrics);
      this._isDirty = false;

      // https://chromedevtools.github.io/devtools-protocol/tot/DOMSnapshot/
      this._rendererModel
          .sendOverProtocol('DOMSnapshot.getSnapshot', {
            computedStyleWhitelist: ['background-color', 'z-index'],
            includePaintOrder: true,
            includeUserAgentShadowTree: true,
          })
          .then(snapshots => {
            /** @typedef {!Array<!Dom3d.DOMSnapshot>} */
            const snapshot = snapshots[0];
            const content = this.createContentFromSnapshot(snapshot);
            if (content && content.children && content.children.length) {
              this._rendererModel.getZIndexSceneModel().initializeScene(content);
            }
          });
    }
  }
};
