// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/** All the logic needed by the DomSideView */
Dom3d.DOMModel = class {
  /**
   * @param {!Dom3d.DOMSideView} panel
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
    // This is used to get a screenshot of the current viewport

    this._maxScreenshotHeight = 3000;

    // isDirty is set to true when the sdkDomModel has been updated but the
    // Scene hasn't been re calculated, this happens when a user navigates to a new page
    // but the view was not active
    this._isDirty = false;

    this._updateThrottler = new Common.Throttler(500);
  }

  /**
   * See the capabilities for each target here:
   * https://cs.chromium.org/chromium/src/third_party/blink/renderer/devtools/front_end/sdk/Target.js
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
    if (!this._sdkDomModel || this._sdkDomModel.target() !== target) {
      return;
    }
    this._sdkDomModel = null;
    this._screenCaptureModel = null;
  }

  /**
   * Called when the side view panel for the DOM scene is shown
   */
  wasShown() {
    if (this._isDirty && this._sdkDomModel) {
      // If the panel is shown but the model is dirty we recalculate the scene
      this.makeSnapshot();
    }
  }

  /**
   * Called by DomSideView, it receives the new sdkDomModel
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
   * @returns {!Promise<!Dom3d.MetricsAndClip>}
   */
  async getLayoutMetricsAndClip() {
    // Create a clip for our screenshot
    /** @typedef {Dom3d.ScreenshotClip} */
    const clip = {x: 0, y: 0, width: 10, height: 10, scale: 1};
    let metrics = null;

    if (this._screenCaptureModel) {
      metrics = await this._screenCaptureModel.fetchLayoutMetrics();
      clip.width = metrics ? metrics.contentWidth : 10,
      clip.height = Math.min(this._maxScreenshotHeight, metrics.contentHeight);  // Cap the height
    }

    return {metrics: metrics, clip: clip};
  }

  /**
  * Gets a fullscreen image of the webpage page
  * @param {!Dom3d.ScreenshotClip} clip
  */
  async getScreenshot(clip) {
    const screenshotQuality = 90;  // Doesn't really affect png
    const screenshotFormat = 'png';
    let imageData = null;
    if (this._screenCaptureModel) {
      imageData = await this._screenCaptureModel.captureScreenshot(screenshotFormat, screenshotQuality, clip);
      imageData = 'data:image/png;base64,' + imageData;
    }
    return imageData;
  }

  /**
   * @param {!Dom3d.DOMSnapshot} snapshot
   * @returns {?Dom3d.ElementWithStyles}
   */
  createContentFromSnapshot(snapshot) {
    // We need this index to find what node of the snapshot is the one representing the <body /> element
    let bodyNodeIndex = -1;
    for (let i = 0; i < snapshot.domNodes.length; i++) {
      if (snapshot.domNodes[i].nodeName === 'BODY') {
        bodyNodeIndex = i;
        break;
      }
    }

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
    const elementWithStyles =
        {id: 0, name: '', width: 0, height: 0, x: 0, y: 0, children: [], backgroundColor: '50,50,55'};

    const backendNodeId = snapshot.domNodes[nodeIndex].backendNodeId;
    const childrenIndexes = snapshot.domNodes[nodeIndex].childNodeIndexes || [];
    const layoutNodeIndex = snapshot.domNodes[nodeIndex].layoutNodeIndex;
    let computedStyleIndex = 0;
    let boundingBox = {};

    // We are not interested in DOM elements without a layout Node since we
    // wouldn't have enough information to position them in the screen
    if (layoutNodeIndex && layoutNodeIndex >= 0) {
      boundingBox = snapshot.layoutTreeNodes[layoutNodeIndex].boundingBox;
      computedStyleIndex = snapshot.layoutTreeNodes[layoutNodeIndex].styleIndex || 0;
    }

    // There is only one property white-listed, the background color so we can assume index 0 has its value
    const bg = snapshot.computedStyles[computedStyleIndex].properties[0].value || '';

    const childrenWithStyles = [];
    for (const childIndex of childrenIndexes) {
      const cws = this._getElementWithStyles(snapshot, childIndex);
      if (cws) {
        childrenWithStyles.push(cws);
      }
    }

    elementWithStyles.backgroundColor = bg;
    elementWithStyles.id = backendNodeId;
    elementWithStyles.name = backendNodeId;
    elementWithStyles.width = boundingBox.width;
    elementWithStyles.height = boundingBox.height;
    elementWithStyles.x = boundingBox.x;
    elementWithStyles.y = boundingBox.y;
    elementWithStyles.children = childrenWithStyles;

    return elementWithStyles;
  }


  /**
   * An async function that gets the DOM snapshot via CDP and parses it
   */
  async makeSnapshot() {
    if (this.isValidDomModel()) {
      // Only wait for the layout metrics
      const {metrics, clip} = await this.getLayoutMetricsAndClip();

      this._rendererModel.createDOMSceneModel(this.sdkDomModel(), metrics, clip);
      this._isDirty = false;

      // https://chromedevtools.github.io/devtools-protocol/tot/DOMSnapshot/
      this._rendererModel
          .sendOverProtocol('DOMSnapshot.getSnapshot', {
            computedStyleWhitelist: ['background-color'],
            includeUserAgentShadowTree: true,
          })
          .then(snapshots => {
            /** @typedef {!Array<!Dom3d.DOMSnapshot>} */
            const snapshot = snapshots[0];
            const content = this.createContentFromSnapshot(snapshot);
            if (content && content.children && content.children.length) {
              this._rendererModel.getDomSceneModel().initializeScene(content);
            }
          });

      // Get the screenshot without blocking execution
      this.getScreenshot(clip).then(imageData => {
        this._rendererModel.getDomSceneModel().initializeTexture(imageData);
      });
    }
  }
};
