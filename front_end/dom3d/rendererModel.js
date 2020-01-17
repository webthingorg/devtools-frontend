// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Renderer Model
 * Orchestrates communication between the scenes and
 * their corresponding side panel.
 *
 * Takes care of creating the renderer engine and
 * swapping between scenes.
 */
Dom3d.RendererModel = class extends Dom3d.BaseRendererModel {
  constructor() {
    super();

    /** @typedef {!BABYLON.Scene} */
    this._domScene = null;
    /** @typedef {Dom3d.Scene} */
    this._domSceneModel = null;

    /** @typedef {!BABYLON.Scene} */
    this._zIndexScene = null;
    /** @typedef {Dom3d.ZIndexScene} */
    this._zIndexSceneModel = null;

    this._currentSelectedScene = '';
  }

  showDOM() {
    if (this._zIndexSceneModel) {
      this._zIndexSceneModel.detachScene();
    }

    if (this._domSceneModel) {
      this._domSceneModel.attachScene();
    }

    this.scene = this._domScene;
    this._currentSelectedScene = Dom3d.RendererModelScenes.DOMScene;
  }

  showZIndex() {
    if (this._domSceneModel) {
      this._domSceneModel.detachScene();
    }

    if (this._zIndexSceneModel) {
      this._zIndexSceneModel.attachScene();
    }

    this.scene = this._zIndexScene;
    this._currentSelectedScene = Dom3d.RendererModelScenes.ZIndexScene;
  }

  getDomSceneModel() {
    return this._domSceneModel;
  }

  getZIndexSceneModel() {
    return this._zIndexSceneModel;
  }

  /**
   * Communicate action of update nesting level to the panel UI
   * @param {string} [maxDepth='1']
   */
  updateNestingLevelUI(maxDepth = '1') {
    this.dispatchEventToListeners(Dom3d.DOMSideViewEvents.updateLevelSlider, maxDepth);
  }

  /**
  * Communicate action to retake snapshot to the panel UI
  */
  retakeDOMSnapshot() {
    this.dispatchEventToListeners(Dom3d.DOMSideViewEvents.retakeSnapshot);
  }


  /**
  * Communicate action to retake snapshot to the panel UI
  */
  retakeZIndexSnapshot() {
    this.dispatchEventToListeners(Dom3d.ZIndexSideViewEvents.retakeSnapshot);
  }


  /**
   * A function that creates the DOM Scene Model
   *
   * @param {!SDK.DOMModel} domModel
   * @param {!Dom3d.ScreenMetrics} metrics
   * @param {!Dom3d.ScreenshotClip} clip
   */
  createDOMSceneModel(domModel, metrics, clip) {
    if (domModel) {
      if (this._domSceneModel) {
        this._domSceneModel.dispose();
      }

      // Create scene
      this._domSceneModel = new Dom3d.Scene(
          this.engine, this.canvas, this.contentElement, domModel, this.updateNestingLevelUI.bind(this),
          this.retakeDOMSnapshot.bind(this));

      this._domSceneModel.setScreenMetrics(metrics.contentWidth, metrics.contentHeight, clip.width, clip.height);
      this._domScene = this._domSceneModel.createScene(domModel);

      this.scene = this._domScene;
    }
  }

  /**
   * A function that creates the Z Index Scene Model
   *
   * @param {!SDK.DOMModel} domModel
   * @param {!Dom3d.ScreenMetrics} metrics
   */
  createZIndexSceneModel(domModel, metrics) {
    if (domModel) {
      if (this._zIndexSceneModel) {
        this._zIndexSceneModel.dispose();
      }

      // Create scene
      this._zIndexSceneModel = new Dom3d.ZIndexScene(
          this.engine, this.canvas, this.contentElement, domModel, this.retakeZIndexSnapshot.bind(this));

      this._zIndexSceneModel.setScreenMetrics(metrics.contentWidth, metrics.contentHeight);
      this._zIndexScene = this._zIndexSceneModel.createScene(domModel);

      this.scene = this._zIndexScene;
    }
  }
};

Dom3d.RendererModelScenes = {
  DOMScene: 'DOMScene',
  ZIndexScene: 'ZIndexScene'
};
