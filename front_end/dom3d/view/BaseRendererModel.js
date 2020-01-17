// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

Dom3d.BaseRendererModel = class extends Common.Object {
  constructor() {
    super();
    /** @typedef {Element} */
    this.canvas = null;
    /** @typedef {Element} */
    this.contentElement = null;
    /** @typedef {!BABYLON.Engine} */
    this.engine = null;
    /** @typedef {!SDK.DOMModel} */
    this._domModel = null;
    /** @typedef {!BABYLON.Scene} */
    this.scene = null;
    this._firstAnimation = true;
  }

  onParentShow(canvasElement, contentElement) {
    this.canvas = canvasElement;
    this.contentElement = contentElement;
    this._firstAnimation = true;

    // Create render engine
    const engineOptions = {stencil: true, doNotHandleContextLost: true, preserveDrawingBuffer: false};
    this.engine = new BABYLON.Engine(this.canvas, true, engineOptions, true);
    this.engine.setHardwareScalingLevel(1 / window.devicePixelRatio);

    // Callback function for the render loop
    this.engine.runRenderLoop(() => {
      // As the document refreshes, or user navigates to a new page the _scene may be null, we don't want to render then
      if (this.scene) {
        this.scene.render();
      }
    });
  }

  onParentResized() {
    if (this.engine) {
      this.engine.resize();
    }
  }

  domModel() {
    return this._domModel;
  }

  sendOverProtocol(method, params) {
    return new Promise((resolve, reject) => {
      Protocol.test.sendRawMessage(method, params, (err, ...results) => {
        if (err) {
          return reject(err);
        }
        return resolve(results);
      });
    });
  }
};
