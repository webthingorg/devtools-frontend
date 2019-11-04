// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/*
  BaseScene - Shared code for all the 3D views
*/
Dom3d.BaseScene = class {
  constructor(engine, canvas, contentElement, domModel) {
    /** @typedef {BABYLON.Engine} */
    this._engine = engine;
    /** @typedef {!Element} */
    this._canvas = canvas;
    /** @typedef {!Element} */
    this._contentElement = contentElement;
    /** @typedef {!SDK.DOMModel} */
    this.domModel = domModel;
    /** @typedef {BABYLON.Scene} */
    this.scene = null;
    this._content = null;
    /** @typedef {BABYLON.EnvironmentHelper} */
    this._environmentHelper = null;
    /** @typedef {BABYLON.GUI} */
    this.gui = null;
    /** @typedef {BABYLON.Mesh} */
    this.bodyBox = null;
    /** @typedef {BABYLON.Mesh} */
    this.helperBox = null;
    this._bodyWidth = 0;
    this._bodyHeight = 0;
    this._cameraZPos = -1000;
    this.boxDepth = 15;  // Pixels (Same for all boxes)
    this.boxMargin = 5;  // Pixels (Distance between two stack levels)
    this._maxNestingLevel = 1;
    /** @typedef {Array<*>} */
    this.allUIControls = [];

    this.retakeSnapshotParentFunc = null;
    this.meshTreeIndexByName = {};  // Keys are box names and item is the actual object reference in this._boxTree

    this.colorHelper = new Dom3d.ColorHelper();
  }

  /**
 * Creates a new scene with only a environment
 * that is big enough to hold all its content
 * This wont have any boxes inside yet, you need to call
 * initializeScene with the content.
 *
 * @param {*} domModel
 * @returns  BABYLON.Scene
 */

  createScene(domModel) {
    this.domModel = domModel;

    // Create a new scene
    this.scene = new BABYLON.Scene(this._engine);
    this.scene.clearColor = new BABYLON.Color3(0, 0, 0);
    this.scene.autoClear = false;
    this.scene.autoClearDepthAndStencil = false;
    this.scene.blockMaterialDirtyMechanism = true;

    // Add a camera
    this.addCamera();

    // Add camera animation
    this.addCameraAnimation();

    // Create a dummy so the skyBox helper can resize
    this.createHelperMesh();

    this.createOrUpdateEnvironmentHelper();

    this.createMainUI();

    return this.scene;
  }

  createMainUI() {
    this.gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI', true, this.scene);
    this.gui.useInvalidateRectOptimization = false;

    const button = BABYLON.GUI.Button.CreateSimpleButton('resetCam', 'Reset camera');
    button.width = '100px';
    button.height = '30px';
    button.color = '#FFFFFF';
    button.background = '#2b2b2b';
    button.left = '10px';
    button.top = '10px';
    button.fontSize = '12px';
    button.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    button.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    button.onPointerClickObservable.add(this.resetCameraButtonClicked.bind(this));
    this.gui.addControl(button);

    const button2 = BABYLON.GUI.Button.CreateSimpleButton('retakeSnapshot', 'Retake snapshot');
    button2.width = '100px';
    button2.height = '30px';
    button2.color = '#FFFFFF';
    button2.background = '#2b2b2b';
    button2.left = '120px';
    button2.top = '10px';
    button2.fontSize = '12px';
    button2.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    button2.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    button2.onPointerClickObservable.add(this.retakeSnapshotButtonClicked.bind(this));
    this.gui.addControl(button2);
  }

  resetCameraButtonClicked(e) {
    this.resetCamera();
  }

  retakeSnapshotButtonClicked(e) {
    if (this.retakeSnapshotParentFunc) {
      this.retakeSnapshotParentFunc();
    }
  }

  createOrUpdateEnvironmentHelper() {
    const skyboxColor = new BABYLON.Color3(.42, .41, .43);
    if (this._environmentHelper) {
      this._environmentHelper.updateOptions({sizeAuto: true, skyboxColor: skyboxColor});
    } else {
      // An environment helper that creates a auto-size skyBox
      this._environmentHelper = this.scene.createDefaultEnvironment({createGround: false});
      this._environmentHelper.setMainColor(skyboxColor);
      this._environmentHelper.sizeAuto = true;

      if (this._environmentHelper.skybox) {
        this._environmentHelper.skybox.name = 'skybox';
        this._environmentHelper.skybox.actionManager = new BABYLON.ActionManager(this.scene);

        this._environmentHelper.skybox.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnDoublePickTrigger, evt => {
              this.resetView();
            }));
      }
    }
  }

  /**
   * Creates a low weight tree to easily find parent-children
   * relationships between nodes
   *
   * @param {!Dom3d.ElementWithStyles} element
   * @param {?Dom3d.DomNameTreeElement} parent
   * @returns {Dom3d.DomNameTreeElement}
   */
  createNameTree(element, parent = null) {
    const allChildren = [];
    const item = {name: element.name, children: allChildren, parent: parent};

    for (const child of element.children) {
      allChildren.push(this.createNameTree(child, item));
    }

    this.meshTreeIndexByName[element.name] = item;

    return item;
  }

  setMeshEnabled(mesh, enabled = true) {
    // here for linter purposes, implemented in the DomScene and ZindexScene class
  }
  addCameraAnimation() {
    // Camera animation
    const positionAnimation = new BABYLON.Animation(
        'cameraTilt', 'alpha', 30 /* frames per second */, BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    const keys1 =
        [{frame: 0, value: -Math.PI / 2}, {frame: 20, value: -Math.PI / 2}, {frame: 70, value: -Math.PI / 2 - 0.6}];

    positionAnimation.setKeys(keys1);
    this.scene.activeCamera.animations.push(positionAnimation);
  }

  animateCamera() {
    if (this.scene) {
      this.scene.beginAnimation(this.scene.activeCamera, 0, 70, false, 1);
    }
  }

  /**
   * Adds the camera to the scene
   */
  addCamera() {
    // We use an arc rotate camera
    // https://doc.babylonjs.com/babylon101/cameras
    const camera = new BABYLON.ArcRotateCamera(
        'Camera', Math.PI / 2 /* alpha */, -Math.PI / 2 /* beta */, this._bodyHeight * 4 /* radius */,
        new BABYLON.Vector3(0, this._bodyHeight, 0) /* target */, this.scene);
    camera.attachControl(this._canvas, true, true);
    camera.lowerBetaLimit = 0;
    camera.upperBetaLimit = (Math.PI);
    // Some heuristics for camera settings that allows us to see the websites
    const largestSide = Math.max(this._bodyHeight, this._bodyWidth);
    this.scene.activeCamera.maxZ = largestSide * 50;
    this.scene.activeCamera.lowerRadiusLimit = 100;
    this.scene.activeCamera.upperRadiusLimit = Math.max(5000, largestSide);
    this.scene.activeCamera.panningSensibility = (2000 / largestSide) * 5;
    this.scene.activeCamera.wheelPrecision = (2000 / largestSide) * 0.1;
  }

  createHelperMesh() {
    // Creates an initial helper mesh so the sky box auto sizes correctly
    const boxOptions = {height: this._bodyHeight, width: this._bodyWidth, depth: this.boxDepth};
    this.helperBox = BABYLON.MeshBuilder.CreateBox('helper', boxOptions, this.scene);
    this.helperBox.position.y = -(this._bodyHeight / 2);

    this.scene.activeCamera.setTarget(this.helperBox.position.clone());
  }

  /**
   * @param {!BABYLON.Mesh} box
   * @returns {!Array<BABYLON.SubMesh>}
   */
  getBoxSubMeshesForMultiMaterial(box) {
    // For multi-materials we need to assign subMeshes to the box after it is created
    // https://doc.babylonjs.com/api/classes/babylon.submesh
    // SubMesh(materialIndex: number, verticesStart: number, verticesCount: number, indexStart: number, indexCount: number, mesh: AbstractMesh, renderingMesh?: Mesh, createBoundingBox?: boolean):

    // const verticesCount = box.getTotalVertices();
    // verticesCount for a box is 24, we can use the constant and avoid computing this again

    let subMeshes = [];
    if (box) {
      subMeshes = [
        new BABYLON.SubMesh(0, 0, 24, 0, 36, box),  // BoxColor material
        new BABYLON.SubMesh(1, 1, 24, 6, 6, box)    // Texture material
      ];
    }

    return subMeshes;
  }

  /**
   * Prevents the scene to keep listening to the camera controls,
   * like mouse drag or key press
   */
  detachScene() {
    this.scene.activeCamera.detachControl(this._canvas);
    if (this.gui) {
      this.gui.dispose();
    }
    this.allUIControls = [];
  }

  attachScene() {
    this.resetCamera();
    this.createMainUI();
    this.resetGUIElements();
  }

  /**
 * Enables all the meshes in the scene
 */
  enableAllElements() {
    // Before doing any update on the meshes we need to unfreeze them
    this.scene.unfreezeActiveMeshes();
    for (const mesh of this.scene.meshes) {
      if (mesh.name !== 'skybox' && mesh.name !== 'BackgroundHelper') {
        this.setMeshEnabled(mesh);
      }
    }
    this.scene.freezeActiveMeshes();
  }

  resetCamera() {
    this.scene.activeCamera.attachControl(this._canvas, true, true);
    if (this.bodyBox) {
      this.scene.activeCamera.setTarget(this.bodyBox.position.clone());
    }
    this.scene.activeCamera.alpha = -Math.PI / 2;
    this.scene.activeCamera.beta = 1.2;
    this.scene.activeCamera.radius = this.scene.activeCamera.upperRadiusLimit || this._bodyHeight * 4;
  }

  reAdjustCamera() {
    // The initial default heuristics may not be enough to encompass all the elements for a large complex website
    let largestSide = Math.max(this._bodyHeight, this._bodyWidth);
    const zAxisSize = (this._maxNestingLevel * (this.boxDepth + this.boxMargin));
    largestSide = Math.max(largestSide, zAxisSize);

    this.scene.activeCamera.maxZ = largestSide * 50;
    this.scene.activeCamera.lowerRadiusLimit = 100;
    this.scene.activeCamera.upperRadiusLimit = Math.max(5000, largestSide);
    this.scene.activeCamera.panningSensibility = (2000 / largestSide) * 5;
    this.scene.activeCamera.wheelPrecision = (2000 / largestSide) * 0.1;

    this.createOrUpdateEnvironmentHelper();
  }

  resetView() {
    this.reAdjustCamera();
    this.resetCamera();
    this.enableAllElements();
    this.animateCamera();
  }

  resetGUIElements() {
    // implementation on DomScene and ZIndexScene
  }
};
