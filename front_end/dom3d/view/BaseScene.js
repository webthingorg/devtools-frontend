// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * BaseScene - Shared code for all the 3D views
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
    this._initialCameraRadius = 100;
    this._maxCameraRadius = 5000;
    this._minCameraRadius = 100;
    this._guiSlider = null;
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

    this.scene.onAfterRenderObservable.add(this._onAfterRender.bind(this));

    return this.scene;
  }

  /**
   * Executed every animation frame after the scene is rendered
   */
  _onAfterRender() {
    if (this.scene.activeCamera && this._guiSlider) {
      // Update the camera control zoom slider value
      // so it reflect the current radius of the camera
      this._guiSlider.value = this.scene.activeCamera.radius;
    }
  }

  createMainUI() {
    this.gui =
        BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI', true, this.scene, BABYLON.Texture.NEAREST_NEAREST);
    this.gui.rootContainer.scaleX = window.devicePixelRatio;
    this.gui.rootContainer.scaleY = window.devicePixelRatio;
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

    // Create controls for camera
    this.createCameraControls();

    // Create information ui
    this._createInfoButton();
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

  addCameraAnimation() {
    // Camera animation
    // More examples here: https://doc.babylonjs.com/babylon101/animations
    // We animate the 'alpha' property of the camera
    // From frame 0 to 20 it stays on the same place
    // From frame 20 to 70 it goes to -Math.PI / 2 - 0.6
    const positionAnimation = new BABYLON.Animation(
        'cameraTilt', 'alpha', 30 /* frames per second */, BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    const keys1 =
        [{frame: 0, value: -Math.PI / 2}, {frame: 20, value: -Math.PI / 2}, {frame: 60, value: -Math.PI / 2 - 0.6}];

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
    this._initialCameraRadius = this._bodyHeight * 4;
    const camera = new BABYLON.ArcRotateCamera(
        'Camera', Math.PI / 2 /* alpha */, -Math.PI / 2 /* beta */, this._initialCameraRadius /* radius */,
        new BABYLON.Vector3(0, this._bodyHeight, 0) /* target */, this.scene);
    camera.attachControl(this._canvas, true, true);
    camera.lowerBetaLimit = 0;
    camera.upperBetaLimit = (Math.PI);
    // Some heuristics for camera settings that allows us to see the websites
    const largestSide = Math.max(this._bodyHeight, this._bodyWidth);
    this.scene.activeCamera.maxZ = largestSide * 50;
    this.scene.activeCamera.lowerRadiusLimit = this._minCameraRadius;
    this.scene.activeCamera.upperRadiusLimit = Math.max(this._maxCameraRadius, largestSide);
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

  setMeshEnabled(mesh, enabled = true) {
    // here for linter purposes, implemented on DomScene and ZindexScene
  }

  /**
 * Create GUI elements to control the camera
 * A slider for zoom and buttons for panning
 */
  createCameraControls() {
    const container = new BABYLON.GUI.Rectangle();
    container.width = '80px';
    container.height = '250px';
    container.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    container.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    container.isPointerBlocker = true;
    container.left = -20;
    container.top = -20;
    container.thickness = 0;  // To avoid having a border

    const slider = new BABYLON.GUI.Slider();
    slider.minimum = this._minCameraRadius;
    slider.maximum = this._maxCameraRadius;
    slider.value = 100;
    slider.height = '150px';
    slider.width = '15px';
    slider.color = '#0088FF';
    slider.background = '#D3D3D3';
    slider.thumbWidth = '10px';
    slider.isVertical = true;
    slider.top = -50;
    this._guiSlider = slider;
    container.addControl(slider);

    const left_button = this._createCameraPanButton('left_button', '⯇');
    left_button.left = -25;
    left_button.top = 75;
    container.addControl(left_button);

    const right_button = this._createCameraPanButton('right_button', '⯈');
    right_button.left = 25;
    right_button.top = 75;
    container.addControl(right_button);

    const top_button = this._createCameraPanButton('top_button', '⯅');
    top_button.top = 75 - 25;
    container.addControl(top_button);

    const down_button = this._createCameraPanButton('down_button', '⯆');
    down_button.top = 75 + 25;
    container.addControl(down_button);

    left_button.onPointerDownObservable.add(
        this._cameraControlMouseDown.bind(this, Dom3d.CameraGUIPanningButtons.Left));
    right_button.onPointerDownObservable.add(
        this._cameraControlMouseDown.bind(this, Dom3d.CameraGUIPanningButtons.Right));
    top_button.onPointerDownObservable.add(this._cameraControlMouseDown.bind(this, Dom3d.CameraGUIPanningButtons.Top));
    down_button.onPointerDownObservable.add(
        this._cameraControlMouseDown.bind(this, Dom3d.CameraGUIPanningButtons.Down));

    slider.onValueChangedObservable.add(this._updateCameraRadius.bind(this));

    this.gui.addControl(container);
  }

  /**
   * Callback function for the GUI buttons to control panning
   * @param {string} buttonName
   */
  _cameraControlMouseDown(buttonName) {
    let newX = 0;
    let newY = 0;
    switch (buttonName) {
      case Dom3d.CameraGUIPanningButtons.Left:
        newX = -100;
        break;
      case Dom3d.CameraGUIPanningButtons.Right:
        newX = 100;
        break;
      case Dom3d.CameraGUIPanningButtons.Top:
        newY = -100;
        break;
      case Dom3d.CameraGUIPanningButtons.Down:
        newY = 100;
        break;
    }

    this.scene.activeCamera.target = this.scene.activeCamera.target.addInPlaceFromFloats(newX, newY, 0);
  }

  /**
   * Callback function for the GUI zoom slider control
   * @param {number} value
   */
  _updateCameraRadius(value) {
    this.scene.activeCamera.radius = value;
  }

  /**
   * Creates a button for the GUI panning controls
   * @param {string} name
   * @param {string} text
   */
  _createCameraPanButton(name, text) {
    const button = BABYLON.GUI.Button.CreateSimpleButton(name, text);
    button.width = '20px';
    button.height = '20px';
    button.color = 'white';
    button.background = '#555555';
    button.fontSize = 12;
    return button;
  }

  _createInfoButton() {
    const button = BABYLON.GUI.Button.CreateSimpleButton('button', 'ⓘ');
    button.top = '10px';
    button.left = '-10px';
    button.width = '30px';
    button.height = '30px';
    button.cornerRadius = 0;
    button.thickness = 0;
    button.fontSize = '22px';
    button.fontWeight = 'normal';
    button.color = '#FFFFFF';
    button.background = '#2b2b2b';
    button.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    button.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;

    const rectangle = new BABYLON.GUI.Rectangle('rect');
    rectangle.background = '#2b2b2b';
    rectangle.color = '#EFEFEF';
    rectangle.width = '250px';
    rectangle.height = '80px';
    rectangle.top = '10px';
    rectangle.left = '-50px';
    rectangle.isVisible = false;
    rectangle.thickness = 0;
    rectangle.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    rectangle.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;

    this.gui.addControl(button);
    this.gui.addControl(rectangle);

    const text1 = this._createInfoText(ls`Rotate camera:`);
    const text2 = this._createInfoText(ls`Right click + drag / Arrow keys`);

    const text3 = this._createInfoText(ls`Pan camera:`);
    const text4 = this._createInfoText(ls`Left click + drag / Ctrl + Arrow keys`);

    text1.top = '-25px';
    text2.top = '-10px';
    text3.top = '10px';
    text4.top = '25px';

    rectangle.addControl(text1);
    rectangle.addControl(text2);
    rectangle.addControl(text3);
    rectangle.addControl(text4);

    button.onPointerEnterObservable.add(function() {
      rectangle.isVisible = true;
    });

    button.onPointerOutObservable.add(function() {
      rectangle.isVisible = false;
    });
  }

  _createInfoText(content) {
    const text = new BABYLON.GUI.TextBlock();
    text.text = content;
    text.color = 'white';
    text.fontSize = '12px';
    text.background = '#FFFF00';
    text.paddingLeft = '5px';
    text.textWrapping = true;
    text.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;

    return text;
  }

  /**
   * Verify that the unit is a valid number and greater than 0
   * @param {number} unit
   * @returns boolean
   */
  static isValidNumberGreaterThanZero(unit) {
    const parsed = parseInt(unit, 10);
    return !isNaN(parsed) && parsed > 0;
  }
};
