// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @extends {Dom3d.BaseScene}
 */

Dom3d.Scene = class extends Dom3d.BaseScene {
  constructor(engine, canvas, contentElement, domModel, updateNestingLevelParentFunc, retakeSnapshotParentFunc) {
    super(engine, canvas, contentElement, domModel);

    this._maxHeight = 10000;

    this._updateNestingLevelParentFunc = updateNestingLevelParentFunc;
    this.retakeSnapshotParentFunc = retakeSnapshotParentFunc;

    this._texture = null;
    this._screenshotHeight = 0;
    this._screenshotWidth = 0;
    this._maxNumberOfBoxes = 2000;
    this._currentNumberOfBoxes = 0;
    this._levelCreationDelay = 50;  // Milliseconds
    // Different highlight color for the front and the sides of the mesh
    /** @typedef {BABYLON.Color3} */
    this._highlightColorSide = new BABYLON.Color3.FromInts(10, 255, 255);
    /** @typedef {BABYLON.Color3} */
    this._highlightColorFront = new BABYLON.Color3.FromInts(0, 234, 255);
    // normal color used for the sides of the box when a texture is applied
    /** @typedef {BABYLON.Color3} */
    this._normalColor = new BABYLON.Color3.FromInts(25, 56, 82);
    /** @typedef {BABYLON.StandardMaterial} */
    this._boxTextureMaterial = null;
    /** @typedef {BABYLON.StandardMaterial} */
    this._boxColorHighlightMaterialSide = null;
    /** @typedef {BABYLON.StandardMaterial} */
    this._boxColorHighlightMaterialFront = null;
    this._multiMaterial = null;
    this._multiMaterialHighlighted = null;
    /** @typedef {BABYLON.StandardMaterial} */
    this._boxColorMaterial = null;

    // Mesh mapping
    this._mapBoxesByLevel = {};  // a map of all the boxes, keys are the level, value is an array of all boxes
    /** @typedef {?Dom3d.DomNameTreeElement} */
    this._boxNameTree = null;
    this._texturesReady = false;

    this._currentSelectedMeshName = '';
    /** @typedef {BABYLON.Mesh} */
    this._currentSelectedMesh = null;

    this._updateThrottler = new Common.Throttler(100);
  }

  /**
  * Adds content to the scene
  *
  * @param {!Dom3d.ElementWithStyles} content
  */
  initializeScene(content) {
    if (!content) {
      return;
    }
    this._content = content;

    // Remove helper box
    if (this.helperBox) {
      this.helperBox.dispose();
      this.helperBox = null;
    }

    this._boxNameTree = this.createNameTree(this._content);

    // Create the color and texture materials
    this._initializeMaterials();

    this.createAllBoxes();

    if (this.bodyBox) {
      this.scene.activeCamera.setTarget(this.bodyBox.position.clone());
    }
  }

  _initializeMaterials() {
    this._boxColorMaterial = this._initializeColorMaterial('bcMat', this._normalColor);
    this._boxColorHighlightMaterialSide = this._initializeColorMaterial('bhcMatSide', this._highlightColorSide);
    this._boxColorHighlightMaterialFront = this._initializeColorMaterial('bhcMatFront', this._highlightColorFront);

    // Create texture material just once
    if (!this._boxTextureMaterial) {
      this._boxTextureMaterial = new BABYLON.StandardMaterial('boxTextureMaterial', this.scene);
      this._boxTextureMaterial.disableLighting = true;
    }
  }

  /**
   * Initialize a color material if it doesn't exist yet
   *
   * @param {string} materialName
   * @param {!BABYLON.Color3.FromInts} emissiveColor
   */
  _initializeColorMaterial(materialName, emissiveColor) {
    const material = new BABYLON.StandardMaterial(materialName, this.scene);
    material.emissiveColor = emissiveColor;
    material.alpha = 1.0;
    material.disableLighting = true;  // So that the color stays true and don't blend
    material.freeze();
    return material;
  }

  /**
   * Initialize textures
   * @param {string} imageData base64 image
   */
  initializeTexture(imageData) {
    // If there is image data create the texture
    if (imageData) {
      const name = this.domModel.existingDocument().baseURL || 'texture';
      this._texture = BABYLON.Texture.CreateFromBase64String(imageData, name, this.scene);
      this._texture.wrapU = BABYLON.Constants.TEXTURE_CLAMP_ADDRESSMODE;
      this._texture.wrapV = BABYLON.Constants.TEXTURE_CLAMP_ADDRESSMODE;
      if (this._boxTextureMaterial) {
        this._boxTextureMaterial.emissiveTexture = this._texture;
        this._boxTextureMaterial.freeze();
        this._texturesReady = true;
      }
    }
  }

  dispose() {
    this._mapBoxesByLevel = null;
    this.domModel = null;
    this._texture = null;
    this._content = null;
    this._boxTextureMaterial = null;
    this._multiMaterial = null;
    this._multiMaterialHighlighted = null;

    if (this.helperBox) {
      this.helperBox.dispose();
      this.helperBox = null;
    }

    if (this.scene) {
      this.scene.dispose();
      this.scene = null;
    }

    if (this.gui) {
      this.gui.dispose();
    }
  }

  /**
   * Given a nodeId, find the corresponding mesh on the scene and
   * change its material to highlight it.
   *
   * This is triggered when a Node on the Elements panel is selected.
   *
   * @param {string} nodeId
   */
  highlightNode(nodeId) {
    if (nodeId) {
      const mesh = this.scene.getMeshByName(nodeId);
      if (mesh) {
        if (mesh.name !== this._currentSelectedMeshName) {
          mesh.previousMaterial = mesh.material;
          mesh.material = this.getMultiMaterialHighlighted();
          this._setSelectedMesh(mesh);
        }
      } else {
        // if the node doesn't exist as a mesh
        // Un highlight currently selected mesh
        if (this._currentSelectedMesh) {
          this._currentSelectedMesh.material = this._currentSelectedMesh.previousMaterial;
        }
        this._currentSelectedMeshName = '';
      }
    }
  }

  /**
   * Change the color scheme of the scene
   * This applies materials of different colors to all the boxes
   * @param {string} colorSchemeType
   */
  changeColorScheme(colorSchemeType) {
    this.scene.unfreezeActiveMeshes();

    const newColorMaterial = new BABYLON.StandardMaterial('newColorMaterial', this.scene);

    // Each key is an int referring to a level
    for (const levelStr in this._mapBoxesByLevel) {
      const level = parseInt(levelStr, 10) || 0;
      const boxes = this._mapBoxesByLevel[level] || [];
      let rgb, color, materialForThisLevel;

      switch (colorSchemeType) {
        case Dom3d.ColorSchemeTypes.Screen:
          if (this._texturesReady) {
            for (const box of boxes) {
              box.material = this.getMultiMaterial();
            }
          }
          break;
        case Dom3d.ColorSchemeTypes.Background:
          // Color the boxes with the background color given to the dom element
          rgb = [0, 0, 0];
          for (const box of boxes) {
            // Use background color for element if present
            if (box.backgroundColor) {
              rgb = box.backgroundColor.replace(/rgb.*\(/, '').replace(')', '').split(',');
              rgb[0] = parseInt(rgb[0], 10);
              rgb[1] = parseInt(rgb[1], 10);
              rgb[2] = parseInt(rgb[2], 10);
            }

            if (rgb[0] === 0 && rgb[1] === 0 && rgb[2] === 0) {
              rgb = [200, 200, 200];
            }

            color = new BABYLON.Color3.FromInts(rgb[0], rgb[1], rgb[2]);
            box.material = newColorMaterial.clone();
            box.material.emissiveColor = color;
            box.previousMaterial = null;
          }
          break;
        case Dom3d.ColorSchemeTypes.Gradient:
          const colorRainbowGradient = this.colorHelper.makeRainbowGradient(this._maxNestingLevel + 1);
          rgb = colorRainbowGradient[level];
          color = new BABYLON.Color3.FromInts(rgb[0], rgb[1], rgb[2]);
          materialForThisLevel = newColorMaterial.clone();
          materialForThisLevel.emissiveColor = color;
          for (const box of boxes) {
            box.material = materialForThisLevel;
            box.previousMaterial = null;
          }
          break;
        default:
          // Give all boxes in the same level the same color of the heatmap
          // This is for option 'blue' and 'purple'
          let colorIteratorForHeatMap = this.colorHelper.defaultHeatmapColor();
          if (colorSchemeType === Dom3d.ColorSchemeTypes.Blue) {
            colorIteratorForHeatMap = this.colorHelper.blueToYellow();
          } else {
            colorIteratorForHeatMap = this.colorHelper.purpleToWhiteToPink();
          }
          rgb = colorIteratorForHeatMap.getColorForLevel(level);
          color = new BABYLON.Color3.FromInts(rgb[0], rgb[1], rgb[2]);
          materialForThisLevel = newColorMaterial.clone();
          materialForThisLevel.emissiveColor = color;
          for (const box of boxes) {
            box.material = materialForThisLevel;
            box.previousMaterial = null;
          }
          break;
      }
    }

    this.scene.freezeActiveMeshes();
  }

  /**
   * @param {number} selectedLevel
   */
  levelSliderChanged(selectedLevel) {
    this.scene.unfreezeActiveMeshes();
    for (const levelStr in this._mapBoxesByLevel) {
      // Each key is an int referring to a level
      const level = parseInt(levelStr, 10) || 0;
      const boxes = this._mapBoxesByLevel[level] || [];
      for (const box of boxes) {
        // If the level is higher than the selected level we can hide the box
        if (level > selectedLevel) {
          this.setMeshEnabled(box, false);
        } else {
          this.setMeshEnabled(box, true);
        }
      }
    }
    this.scene.freezeActiveMeshes();
  }

  /**
   * Starts the recursive call to createBoxForDepth with the correct params to
   * make all the boxes from the initial <body /> node
   */
  createAllBoxes() {
    this.createBoxForDepth(this._content, 0 /* depthLevel */, true /* includeChildren  */);
  }

  /**
   * A helper function that returns true if the element should be added to the scene
   *
   * @param {!Dom3d.ElementWithStyles} element
   * @returns {boolean}
   */
  isElementAllowedInScene(element) {
    return Dom3d.BaseScene.isValidNumberGreaterThanZero(element.width) &&
        Dom3d.BaseScene.isValidNumberGreaterThanZero(element.height) && element.y < this._maxHeight;
  }

  /**
   * Creates a mesh for the element. Sets its material, position and size
   *
   * @param {?Dom3d.ElementWithStyles} element
   * @param {number} [depthLevel=0]
   * @param {boolean} [includeChildren=false]
   * @returns
   */
  createBoxForDepth(element, depthLevel = 0, includeChildren = false) {
    if (!element || this._currentNumberOfBoxes >= this._maxNumberOfBoxes) {
      return;
    }

    if (depthLevel > this._maxNestingLevel) {
      this.updateMaxNestingLevel(depthLevel);
    }

    if (this._mapBoxesByLevel && this._mapBoxesByLevel[depthLevel] === undefined) {
      this._mapBoxesByLevel[depthLevel] = [];
    }

    if (this._mapBoxesByLevel && this.isElementAllowedInScene(element)) {
      const id = element.name;

      const {x, y, width, height} = this.calculateBoxPositionAndSize(element);

      // Create FaceUV
      const faceUV = this.createFaceUVForElement(element, width, height);
      // Add the faceUV to the box options for the constructor of the mesh
      const boxOptions = {height: height, width: width, depth: this.boxDepth, faceUV: faceUV, updatable: true};

      // Create the box
      const box = BABYLON.MeshBuilder.CreateBox(id, boxOptions, this.scene);
      box.position.x = x;
      box.position.z = -(this.boxDepth + this.boxMargin) * depthLevel;
      box.position.y = y;

      // Check for intersections with other boxes on the same level
      let intersects = false;
      const boxes = this._mapBoxesByLevel[depthLevel] || [];
      for (const otherBox of boxes) {
        if (box.intersectsMesh(otherBox, false)) {
          intersects = true;
          break;
        }
      }
      // If it intersects we slightly move it forward to avoid texture glitches on scene rotation
      if (intersects) {
        box.position.z -= 1;
      }

      const rgb = this.colorHelper.defaultHeatmapColor().getColorForLevel(depthLevel);
      const color = new BABYLON.Color3.FromInts(rgb[0], rgb[1], rgb[2]);
      box.material = this._boxColorMaterial.clone();
      box.material.emissiveColor = color;

      // This is just to keep a property with the value so we can use it later, has no impact on the render, what actually gives the color is the material
      box.backgroundColor = element.backgroundColor;

      // Update current number of boxes
      this._currentNumberOfBoxes++;

      // For multi-materials we need to assign subMeshes to the box after it is created
      // const verticesCount = box.getTotalVertices();
      // verticesCount for a box is 24, we can use the constant and avoid computing this again
      // https://doc.babylonjs.com/api/classes/babylon.submesh
      // SubMesh(materialIndex: number, verticesStart: number, verticesCount: number, indexStart: number, indexCount: number, mesh: AbstractMesh, renderingMesh?: Mesh, createBoundingBox?: boolean):
      box.subMeshes = [
        new BABYLON.SubMesh(0, 0, 24, 0, 36, box),  // BoxColor material
        new BABYLON.SubMesh(1, 1, 24, 6, 6, box)    // Texture material
      ];

      // Optimizations
      box.freezeWorldMatrix();
      box.alwaysSelectAsActiveMesh = true;
      box.doNotSyncBoundingInfo = true;
      box.convertToUnIndexedMesh();

      if (this.bodyBox === null) {
        this.bodyBox = box;
      }

      this.addBoxActions(box);
      this._mapBoxesByLevel[depthLevel].push(box);
    }

    if (includeChildren && element.children && element.children.length > 0) {
      const nd = depthLevel + 1;
      // Delay creation of next level
      setTimeout(() => {
        for (const child of element.children) {
          this.createBoxForDepth(child, nd, includeChildren);
        }
      }, this._levelCreationDelay || 100);
    }
  }

  /**
     * Takes the elements position and size and remaps it to the position where the box should be in the 3d space,
     * respect to the center of the scene. Caps the height to the max allowed.
     *
     * @param {!Dom3d.ElementWithStyles} element
     * @returns {{x,y,width, height}}
     */
  calculateBoxPositionAndSize(element) {
    let width = Math.ceil(element.width || 1);
    let height = Math.ceil((element.height > this._maxHeight) ? this._maxHeight : element.height);
    let x = element.x;
    let y = element.y;

    if (y + height > this._maxHeight) {
      // For long elements that start inside the allowed body area but grow pass it
      // Cap the element height to the _maxHeight
      if (y > height) {
        height = y - height;
      } else {
        height = height - y;
      }
    }

    if (x < 0 && width > this._bodyWidth) {
      width = this._bodyWidth;
    }

    // Center and position boxes, translate form x,y being in bottom left corner to be in the center as babylon requires
    x = -(this._bodyWidth / 2) - (-(width / 2) - x);
    y = -(this._bodyHeight / 2) + (-(height / 2) - y);

    x = Math.ceil(x);
    y = Math.ceil(y);

    return {x: x, y: y, width: width, height: height};
  }

  /**
     * Returns an array with the faceUV coordinates specific for the element
     * so that the texture from the common multi-material
     * can be shown in the correct size and position
     *
     * We use width, heigh instead of element.height since the box might have been capped to the max size
     * @param {!Dom3d.ElementWithStyles} element
     * @param {number} height
     * @returns {Array<BABYLON.Vector4>}
     */
  createFaceUVForElement(element, width, height) {
    // Use faceUV to manage the correct coordinates of the texture used in the face of each box
    // example: https://www.babylonjs-playground.com/#20OAV9#25
    // faceUV[1] = new BABYLON.Vector4(Ubottom_left, Vbottom_left, Utop_right, Vtop_right);
    const faceUV = new Array(6);
    const left = (element.x / this._screenshotWidth);
    const bottom = 1 - ((element.y + height) / this._screenshotHeight);
    const right = (element.x + width) / this._screenshotWidth;
    const top = 1 - (element.y / this._screenshotHeight);
    const uv4 = new BABYLON.Vector4(left, bottom, right, top);
    faceUV[1] = uv4;  // index 1 corresponds to the front face of the box in our scene

    return faceUV;
  }

  setScreenMetrics(bodyWidth, bodyHeight, screenshotWidth, screenshotHeight) {
    this._bodyWidth = bodyWidth;
    this._bodyHeight = bodyHeight;

    this._screenshotWidth = screenshotWidth;
    this._screenshotHeight = screenshotHeight;
  }

  /**
     * Creates an action manager for the mesh and
     * sets the behavior for mouse click, mouse over and mouse out
     */
  addBoxActions(mesh) {
    mesh.actionManager = new BABYLON.ActionManager(this.scene);

    mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, evt => {
      // Highlight the mesh on mouse over by changing its materials
      /** @typedef {{meshUnderPointer: !Function}} */
      const selectedMesh = evt.meshUnderPointer || null;
      if (selectedMesh && selectedMesh.name !== this._currentSelectedMeshName) {
        selectedMesh.previousMaterial = selectedMesh.material.clone();
        selectedMesh.material = this.getMultiMaterialHighlighted().clone();
      }
    }));

    mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, evt => {
      // Remove highlight on mouse out
      const selectedMesh = evt.source;
      if (selectedMesh && selectedMesh.name !== this._currentSelectedMeshName && selectedMesh.previousMaterial) {
        selectedMesh.material = selectedMesh.previousMaterial.clone();
      }
    }));

    mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, evt => {
      const selectedMesh = evt.source;

      // Set the new selected mesh
      this._setSelectedMesh(selectedMesh);
      // Signal highlight node in browser overlay
      const backendNodeId = parseInt(selectedMesh.name, 10);
      if (this.domModel) {
        this._updateThrottler.schedule(this.domModel.overlayModel().inspectNodeRequested(backendNodeId));
      }

      // Set camera target
      this.scene.activeCamera.setTarget(selectedMesh.position.clone());
    }));
  }

  _setSelectedMesh(mesh) {
    // Avoid re selecting a currently selected mesh
    if (mesh && mesh.name && mesh.name !== this._currentSelectedMeshName) {
      // Remove the previous selected mesh
      if (this._currentSelectedMesh && this._currentSelectedMesh.previousMaterial) {
        this._currentSelectedMesh.material = this._currentSelectedMesh.previousMaterial.clone();
      }

      // Assign new mesh selection
      this._currentSelectedMeshName = mesh.name;
      this._currentSelectedMesh = mesh;
    }
  }

  /**
   * Hides all elements in the screen except for the currentSelectedMeshName
   * If showChildren is true it also enables all the children meshes from the currentSelectedMeshName
   * If showParents is true it also enables all the parent meshes from the currentSelectedMeshName until <body />
   * @param {boolean} showChildren
   * @param {boolean} showParents
   */
  isolateElement(showChildren, showParents) {
    this.scene.unfreezeActiveMeshes();
    if (this._currentSelectedMeshName) {
      // Hide all elements except the selected one
      this.hideAllButThisName(this._currentSelectedMeshName);

      if (showChildren) {
        this.showChildrenOfThisName(this._currentSelectedMeshName);
      }
      // Show the ancestry
      if (showParents) {
        this.showParentsOfThisName(this._currentSelectedMeshName);
      }

      // Set the camera target to focus on the isolated mesh
      const mesh = this.scene.getMeshByName(this._currentSelectedMeshName);
      if (mesh) {
        this.scene.activeCamera.setTarget(mesh.position.clone());
      }
    }
    this.scene.freezeActiveMeshes();
  }

  /**
   * Enable the parent chain for this element
   *
   * @param {string} name
   */
  showParentsOfThisName(name) {
    let selected = this.meshTreeIndexByName[name];
    const parentNames = [];
    // Iteratively get the chain of parents for this mesh
    while (selected.parent !== null) {
      parentNames.push(selected.parent.name);
      selected = selected.parent;
    }

    for (const parentName of parentNames) {
      const mesh = this.scene.getMeshByName(parentName || '');
      this.setMeshEnabled(mesh);
    }
  }

  /**
   * Makes visible the children of the mesh
   *
   * @param {string} meshName
   */
  showChildrenOfThisName(meshName) {
    const childrenNames = this.getChildrenNames(meshName);
    for (const name of childrenNames) {
      const mesh = this.scene.getMeshByName(name || '');
      this.setMeshEnabled(mesh);
    }
  }

  /**
   * Makes a list with the names of all the children of the mesh
   *
   * @param {string} meshName
   * @returns {!Array<string>}
   */
  getChildrenNames(meshName) {
    const children = [];
    const selected = this.meshTreeIndexByName[meshName];
    for (const child of selected.children) {
      children.push(child.name);
      children.push(...this.getChildrenNames(child.name));
    }

    return children;
  }

  /**
   * Hides all the meshes in the scene except for the one that matches the name
   *
   * @param {*} name
   */
  hideAllButThisName(name) {
    // Hide all meshes
    for (const mesh of this.scene.meshes) {
      if (mesh.name !== 'skybox' && mesh.name !== 'BackgroundHelper') {
        this.setMeshEnabled(mesh, false);
      }
    }
    // Show the wanted mesh
    if (name && name !== '') {
      const meshToKeep = this.scene.getMeshByName(name);
      this.setMeshEnabled(meshToKeep, true);
    }
  }

  /**
   * Enables or disables a mesh
   *
   * @param {!BABYLON.Mesh} mesh
   * @param {boolean} [enabled=true]
   * @override
   */
  setMeshEnabled(mesh, enabled = true) {
    if (mesh) {
      mesh.setEnabled(enabled);
    }
  }

  setMeshEnabledByName(name, enabled = true) {
    const m = this.scene.getMeshByName(name);
    if (m) {
      m.setEnabled(enabled);
    }
  }

  /**
   * Gets the singleton instance of multimaterial used for all the boxes,
   * creates it if it doesn't exist yet.
   */
  getMultiMaterial() {
    // We need a multi material to have the texture on the front and color on the sides
    // Only create one instance and use it for every box.
    if (!this._multiMaterial) {
      this._multiMaterial = new BABYLON.MultiMaterial('multiMaterial', this.scene);
      this._multiMaterial.subMaterials.push(this._boxColorMaterial);
      this._multiMaterial.subMaterials.push(this._boxTextureMaterial);
      this._multiMaterial.freeze();
    }
    return this._multiMaterial;
  }

  getMultiMaterialHighlighted() {
    if (!this._multiMaterialHighlighted) {
      this._multiMaterialHighlighted = new BABYLON.MultiMaterial('multiMaterialHighlighted', this.scene);
      this._multiMaterialHighlighted.subMaterials.push(this._boxColorHighlightMaterialSide);
      this._multiMaterialHighlighted.subMaterials.push(this._boxColorHighlightMaterialFront);
      this._multiMaterialHighlighted.freeze();
    }

    return this._multiMaterialHighlighted;
  }

  /**
   * Updates the maximum nesting level, represents how deep is the DOM tree is
   * @param {number} depthLevel
   */
  updateMaxNestingLevel(depthLevel) {
    this._maxNestingLevel = depthLevel;
    this._updateNestingLevelParentFunc(this._maxNestingLevel);
  }
};
