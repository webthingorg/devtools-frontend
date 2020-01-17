// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @extends {Dom3d.BaseScene}
 */
Dom3d.ZIndexScene = class extends Dom3d.BaseScene {
  constructor(engine, canvas, contentElement, domModel, retakeSnapshotParentFunc) {
    super(engine, canvas, contentElement, domModel);

    this.retakeSnapshotParentFunc = retakeSnapshotParentFunc;

    this._maxHeight = 10000;
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
    /** @typedef {?BABYLON.StandardMaterial} */
    this._boxColorHighlightMaterialSide = null;
    /** @typedef {?BABYLON.StandardMaterial} */
    this._boxColorHighlightMaterialFront = null;
    /** @typedef {?BABYLON.StandardMaterial} */
    this._multiMaterialHighlighted = null;
    /** @typedef {?BABYLON.StandardMaterial} */
    this._boxColorMaterial = null;

    // Member variables for UI controls
    this._keepOnlyCtxParents = false;
    this._showAllParents = true;
    this._highlightStackingContext = true;
    this._hideElementsWithSamePaintOrder = true;

    // Mesh mapping
    this._mapBoxesByLevel =
        {};  // a map of all the boxes by stack level, keys are the level (int), value is an array of boxes
    /** @typedef {?Dom3d.DomNameTreeElement} */
    this._boxNameTree = null;
    this.meshTreeIndexByName = {};  // Keys are box names and item is the actual object reference in this._boxNameTree
    this._mapBoxesWithStackingCtxByPaintOrder = {};
    this._currentSelectedMeshName = '';
    /** @typedef {?BABYLON.Mesh} */
    this._currentSelectedMesh = null;
    this._allStackingContexts = [];
    this._allHoveredMeshes = {};
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

    // This structure will help us to find parent-children relationships
    // between meshes in the future when we try to isolate an element
    this._boxNameTree = this.createNameTree(this._content);

    // Create the materials
    this._initializeMaterials();

    this.createAllBoxes();
    // Make sure the camera is looking at the right place
    if (this.bodyBox) {
      this.scene.activeCamera.setTarget(this.bodyBox.position.clone());
    }
  }


  /**
   * Initializes the materials for this scene
   */
  _initializeMaterials() {
    this._boxColorMaterial = this._initializeColorMaterial('bcMat', this._normalColor);
    this._boxColorHighlightMaterialSide = this._initializeColorMaterial('bhcMatSide', this._highlightColorSide);
    this._boxColorHighlightMaterialFront = this._initializeColorMaterial('bhcMatFront', this._highlightColorFront);
  }

  /**
   * Generic function to initialize a color material if it doesn't exist yet
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

  dispose() {
    this._mapBoxesByLevel = null;
    this._mapBoxesWithStackingCtxByPaintOrder = null;
    this.domModel = null;
    this._content = null;
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

  /* -- ACTIONS -- */
  // This section contains handlers for actions triggered on the side view

  /**
   * Given a backendNodeId, find the corresponding mesh on the scene and
   * change its material to highlight it.
   *
   * This is triggered when a Node on the Elements panel is selected.
   *
   * @param {?string} backendNodeId
   */
  highlightNode(backendNodeId) {
    if (backendNodeId) {
      const mesh = this.scene.getMeshByName(backendNodeId);
      if (mesh) {
        if (mesh.name !== this._currentSelectedMeshName && this._allHoveredMeshes[mesh.name] === undefined) {
          // We only want to highlight the node if
          // it is not one of the nodes hovered by the mouse
          mesh.previousMaterial = mesh.material;
          mesh.material = this.getMultiMaterialHighlighted();
          this._setSelectedMesh(mesh);
        }
        // Remove node from the list now the we received this callback
        delete this._allHoveredMeshes[mesh.name];
      } else {
        // if the node doesn't exist as a mesh
        // Un highlight currently selected mesh
        if (this._currentSelectedMesh) {
          this._currentSelectedMesh.material = this._currentSelectedMesh.previousMaterial;
          this._currentSelectedMesh = null;
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
      let rgb = [];
      let color = null;
      let materialForThisLevel = null;

      switch (colorSchemeType) {
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
   * Enables or disables the stacking context highlight (ui controls and box edges)
   *
   * @param {boolean} [value=false]
   */
  highlightStackContext(value = false) {
    this._highlightStackingContext = value;
    // Hide all ui controls
    this.allUIControls.map(control => control.isVisible = false);

    this.scene.unfreezeActiveMeshes();
    for (const mesh of this.scene.meshes) {
      if (mesh.isStackingContext && mesh.isEnabled()) {
        // Go through all the meshes in the scene, if it is
        // a stacking context mesh and it is currently enabled
        if (this._highlightStackingContext) {
          // Enable its edges rendering and its ui controls
          mesh.enableEdgesRendering();
          mesh.uiControls.map(control => control.isVisible = true);
        } else {
          mesh.disableEdgesRendering();
        }
      }
    }
    this.scene.freezeActiveMeshes();
  }

  /**
   * Enables or disables the hiding of children elements with same paint order as their parents
   * This helps prevent box overlapping on the final visualization
   *
   * @param {boolean} [value=true]
   */
  hideElementsWithSamePaintOrder(value = true) {
    this._hideElementsWithSamePaintOrder = value;
    this.recreateAllBoxes();
  }

  /**
   * Keeps only the meshes that correspond to a node with a stacking context
   * Hide all the meshes and then enable the ones that meet the requirement,
   * trigger an animation that changes their position to
   * collapse the space gaps in between left by all the hidden meshes
   */
  showStackingContextOnly() {
    this.scene.unfreezeActiveMeshes();

    // 1) Hide all the elements
    this.hideAllButThisName('');

    // 2) Take the map of all boxes with stacking context and make an ordered list
    const paintOrdersFromStackCtx = [];
    for (const paintOrderStr in this._mapBoxesWithStackingCtxByPaintOrder) {
      // Each key is an int referring to a level
      const paintOrder = parseInt(paintOrderStr, 10) || 0;
      paintOrdersFromStackCtx.push(paintOrder);
    }
    // collapse stacking contexts so they have an ordered level from 0 to n
    const orderedBoxesWithStackingCtx = paintOrdersFromStackCtx.sort((a, b) => {
      return a - b;
    });

    // 3) enable the boxes and move their position to avoid having giant gaps
    let newPaintOrder = 0;
    for (const paintOrder of orderedBoxesWithStackingCtx) {
      const boxes = this._mapBoxesWithStackingCtxByPaintOrder[paintOrder] || [];
      for (const box of boxes) {
        // Change z position to be the one corresponding to the level
        this.setMeshEnabled(box, true);
        const newZPos = -(this.boxDepth + this.boxMargin) * newPaintOrder;
        BABYLON.Animation.CreateAndStartAnimation(
            'boxpos', box, 'position.z', 30, 30, box.position.z, newZPos, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
      }
      newPaintOrder++;
    }
    this.scene.freezeActiveMeshes();
  }

  /**
   * Action triggered by the ui control
   * If true, next time an element is isolated only the parents
   * with stacking context will be kept.
   * @param {boolean} value
   */
  isolateStackContextKeepOnlyCtx(value) {
    this._keepOnlyCtxParents = value || false;
  }

  /**
   * Action triggered by the ui control
   * If true, next time an element is isolated all its parents will be kept
   * @param {boolean} value
   */
  isolateStackContextShowParents(value) {
    this._showAllParents = value || false;
  }

  // -- End: Actions

  /**
   * Starts the recursive call to createBoxForDepth with the correct params to
   * make all the boxes from the initial <body /> node
   */
  createAllBoxes() {
    this.createBoxForDepth(this._content, 0 /* depthLevel */);
  }

  /**
   * Cleans up the scene and recreates all the meshes
   */
  recreateAllBoxes() {
    // 1) Remove all current meshes of the scene
    const allMeshes = this.scene.meshes.slice(0);
    for (const mesh of allMeshes) {
      if (mesh.name !== 'skybox' && mesh.name !== 'BackgroundHelper') {
        mesh.dispose(false, true);
      }
    }

    // 2) Remove all UI Controls
    for (const c of this.allUIControls) {
      this.gui.removeControl(c);
    }

    // 3) Reset
    this._mapBoxesByLevel = {};
    this._mapBoxesWithStackingCtxByPaintOrder = {};
    this._currentNumberOfBoxes = 0;
    this.allUIControls = [];
    this._allStackingContexts = [];

    // 4) Create all the boxes
    this.scene.unfreezeActiveMeshes();
    this.createAllBoxes();
  }

  /**
   * A helper function that returns true if the element should be added to the scene
   * if it has a valid width and height, for example we don't want to create <style> or <script> nodes
   * that have no size and are not rendered in the webpage.
   *
   * @param {!Dom3d.ElementWithStyles} element
   * @param {number} depthLevel
   * @param {number} parentDepthLevel
   * @returns {boolean}
   */
  isElementAllowedInScene(element, depthLevel, parentDepthLevel) {
    const hasValidDimensions = Dom3d.BaseScene.isValidNumberGreaterThanZero(element.width) &&
        Dom3d.BaseScene.isValidNumberGreaterThanZero(element.height) && element.y < this._maxHeight;

    return hasValidDimensions && (this._hideElementsWithSamePaintOrder ? (parentDepthLevel !== depthLevel) : true);
  }

  /**
   * Creates a mesh for the element. Sets its material, position and size
   *
   * @param {?Dom3d.ElementWithStyles} element
   * @param {number} [depthLevel=0]
   * @returns
   */
  createBoxForDepth(element, depthLevel = 0, parentDepthLevel = -1) {
    // Do not create a new box if we have reach the limit
    if (!element || this._currentNumberOfBoxes >= this._maxNumberOfBoxes) {
      return;
    }

    // Update the max nesting level
    if (depthLevel > this._maxNestingLevel) {
      this._maxNestingLevel = depthLevel;
    }

    // Initialize the map
    if (this._mapBoxesByLevel && this._mapBoxesByLevel[depthLevel] === undefined) {
      this._mapBoxesByLevel[depthLevel] = [];
    }

    if (this._mapBoxesByLevel && this.isElementAllowedInScene(element, depthLevel, parentDepthLevel)) {
      // do not add the child if the setting is set to true
      // and the child has the same paint order as the parent
      const id = element.name;
      const {x, y, width, height} = this.calculateBoxPositionAndSize(element);
      const boxOptions = {height: height, width: width, depth: this.boxDepth, updatable: true};

      // Create the box
      const box = BABYLON.MeshBuilder.CreateBox(id, boxOptions, this.scene);
      box.position.x = x;
      box.position.z = -(this.boxDepth + this.boxMargin) * depthLevel;
      box.position.y = y;
      box.isStackingContext = element.isStackingContext;
      box.uiControls = [];

      const rgb = this.colorHelper.defaultHeatmapColor().getColorForLevel(depthLevel);
      box.material = this._boxColorMaterial.clone();
      box.material.emissiveColor = new BABYLON.Color3.FromInts(rgb[0], rgb[1], rgb[2]);
      box.previousMaterial = box.material.clone();

      // This is just to keep a property with the value so we can use it later, has no impact on the render, what actually gives the color is the material
      box.backgroundColor = element.backgroundColor;

      // Show a highlight around the edges of the boxes that are represent a node with a stacking context
      if (element.isStackingContext) {
        box.enableEdgesRendering();
        box.edgesWidth = 250.0;
        box.edgesColor = new BABYLON.Color4(1, 0.6, 0, 1);
        if (!this._highlightStackingContext) {
          box.disableEdgesRendering();
        }

        let zindex = '';
        for (const p of element.properties) {
          if (p.name === 'z-index') {
            zindex = p.value;
          }
        }

        this._allStackingContexts.push({mesh: box, zindex: zindex});
        if (this._mapBoxesWithStackingCtxByPaintOrder &&
            this._mapBoxesWithStackingCtxByPaintOrder[depthLevel] === undefined) {
          this._mapBoxesWithStackingCtxByPaintOrder[depthLevel] = [];
        }
        this._mapBoxesWithStackingCtxByPaintOrder[depthLevel].push(box);
        this.createGUIControls(box, zindex);
      }

      // Update current number of boxes
      this._currentNumberOfBoxes++;

      // For multi-materials we need to assign subMeshes to the box after it is created
      // const verticesCount = box.getTotalVertices();
      // verticesCount for a box is 24, we can use the constant and avoid computing this again
      // https://doc.babylonjs.com/api/classes/babylon.submesh
      // SubMesh(materialIndex: number, verticesStart: number, verticesCount: number, indexStart: number, indexCount: number, mesh: AbstractMesh, renderingMesh?: Mesh, createBoundingBox?: boolean):
      box.subMeshes = [
        new BABYLON.SubMesh(0, 0, 24, 0, 36, box),  // BoxColor material
        new BABYLON.SubMesh(1, 1, 24, 6, 6, box)    // Texture or front material
      ];

      // Optimizations
      // box.freezeWorldMatrix();
      box.alwaysSelectAsActiveMesh = true;
      box.doNotSyncBoundingInfo = true;
      // box.convertToUnIndexedMesh();

      if (this.bodyBox === null) {
        this.bodyBox = box;
      }

      this.addBoxActions(box);
      this._mapBoxesByLevel[depthLevel].push(box);
    }

    if (element.children && element.children.length > 0) {
      // Delay creation of next level
      setTimeout(() => {
        const orderedChildren = element.children.sort((a, b) => {
          return a.paintOrder - b.paintOrder;
        });

        for (const child of orderedChildren) {
          const nd = child.paintOrder;
          this.createBoxForDepth(child, nd, depthLevel);
        }
      }, this._levelCreationDelay || 100);
    }
  }

  /**
  * Since the gui texture gets disposed every time the scene is swapped we need to re create the labels
  * for this visualization
  * @override
  */
  resetGUIElements() {
    this._allStackingContexts.map(item => {
      this.createGUIControls(item.mesh, item.zindex);
    });
  }

  /**
   * Creates GUI controls for a box
   *
   * @param {!BABYLON.Mesh} box
   * @param {string} zindex
   */
  createGUIControls(box, zindex) {
    // Create the GUI labels for all the stacking contexts
    const rect1 = new BABYLON.GUI.Rectangle();
    // Actually add the control to the BABYLON.GUI.AdvancedDynamicTexture
    this.gui.addControl(rect1);
    rect1.width = '100px';
    rect1.height = '20px';
    rect1.cornerRadius = 2;
    rect1.color = 'orange';
    rect1.thickness = 1;
    rect1.background = 'white';
    rect1.linkWithMesh(box);
    rect1.linkOffsetY = -100;
    rect1.linkOffsetX = -100;
    rect1.onPointerClickObservable.add(this._setSelectedMeshAndTriggerOverlay.bind(this, box));
    rect1.hoverCursor = 'pointer';
    rect1.isPointerBlocker = true;

    rect1.onPointerEnterObservable.add(() => {
      rect1.background = 'orange';
    });

    rect1.onPointerOutObservable.add(() => {
      rect1.background = 'white';
    });

    const label = new BABYLON.GUI.TextBlock();
    label.text = 'z-index: ' + zindex;
    label.color = 'black';
    label.fontSize = 12;
    rect1.addControl(label);
    const line = new BABYLON.GUI.Line();
    line.lineWidth = 2;
    line.color = 'orange';
    this.gui.addControl(line);
    line.linkWithMesh(box);
    line.connectedControl = rect1;
    line.x2 = 50;

    // Save a reference to the main control so we can manipulate them later (i.e. Hide all)
    this.allUIControls.push(rect1);
    this.allUIControls.push(label);
    this.allUIControls.push(line);

    // To selectively show and hide controls as we show and hide boxes (i.e. isolation of element)
    // We need to keep track of the controls linked by each box
    box.uiControls.push(rect1);
    box.uiControls.push(label);
    box.uiControls.push(line);

    // Only make the ui controls visible if the user has selected that option
    rect1.isVisible = this._highlightStackingContext;
    label.isVisible = this._highlightStackingContext;
    line.isVisible = this._highlightStackingContext;
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
    let height = Math.ceil(Math.min(element.height, this._maxHeight));
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

  setScreenMetrics(bodyWidth, bodyHeight) {
    this._bodyWidth = bodyWidth;
    this._bodyHeight = bodyHeight;
  }

  /**
   * Creates an action manager for the mesh and
   * sets the behavior for mouse click, mouse over and mouse out
   */
  addBoxActions(mesh) {
    mesh.actionManager = new BABYLON.ActionManager(this.scene);

    mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, event => {
          // Highlight the mesh on mouse over by changing its materials
          /** @typedef {{meshUnderPointer: !Function}} */
          const selectedMesh = event.meshUnderPointer || null;
          if (selectedMesh && selectedMesh.name !== this._currentSelectedMeshName) {
            selectedMesh.material = this.getMultiMaterialHighlighted().clone();
            const backendNodeId = parseInt(selectedMesh.name, 10);
            this._allHoveredMeshes[selectedMesh.name] = selectedMesh.name;
            this._highlightNode(backendNodeId);
          }
        }));

    mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, event => {
          // Remove highlight on mouse out
          const selectedMesh = event.source;
          if (selectedMesh && selectedMesh.name !== this._currentSelectedMeshName) {
            if (selectedMesh.previousMaterial) {
              selectedMesh.material = selectedMesh.previousMaterial.clone();
            }
          }
          SDK.OverlayModel.hideDOMNodeHighlight();
        }));

    mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, event => {
      const selectedMesh = event.source;
      this._setSelectedMeshAndTriggerOverlay(selectedMesh);
    }));
  }

  /**
   * @param {!BABYLON.Mesh} selectedMesh
   */
  _setSelectedMeshAndTriggerOverlay(selectedMesh) {
    // Set the new selected mesh
    this._setSelectedMesh(selectedMesh);
    // Highlight node
    const backendNodeId = parseInt(selectedMesh.name, 10);
    const deferredNode = new SDK.DeferredDOMNode(this.domModel.target(), backendNodeId);
    deferredNode.resolvePromise().then(node => {
      if (node) {
        Common.Revealer.reveal(node, false /* omit focus */);
      }
    });

    // Set camera target
    this.scene.activeCamera.setTarget(selectedMesh.position.clone());
  }

  /**
   * Highlight node in browser overlay and in Elements tree
   * @param {number} backendNodeId
   */
  _highlightNode(backendNodeId) {
    const deferredNode = new SDK.DeferredDOMNode(this.domModel.target(), backendNodeId);
    deferredNode.resolvePromise().then(node => {
      if (node) {
        // For the elements tree
        this.domModel.overlayModel().nodeHighlightRequested(node.id);
        // For the Overlay layer
        this.domModel.overlayModel().highlightInOverlay({deferredNode: deferredNode}, 'all', true /* show info */);
      }
    });
  }

  /**
   * If mesh exists it is highlighted and it's name is set as the current selected mesh
   * Remove previous selection
   *
   * @param {!BABYLON.Mesh} mesh
   */
  _setSelectedMesh(mesh) {
    // Avoid re selecting a currently selected mesh
    if (mesh && mesh.name && mesh.name !== this._currentSelectedMeshName) {
      // Remove the previous selected mesh
      if (this._currentSelectedMesh && this._currentSelectedMesh.previousMaterial) {
        this._currentSelectedMesh.material = this._currentSelectedMesh.previousMaterial;
      }

      // Assign new mesh selection
      this._currentSelectedMeshName = mesh.name;
      this._currentSelectedMesh = mesh;
    }
  }

  /**
   * Hides all elements in the screen except for the currentSelectedMeshName
   * If _showAllParents is true it also enables all the parent meshes from the currentSelectedMeshName until <body />
   */
  isolateCurrentSelectedElement() {
    this.scene.unfreezeActiveMeshes();
    if (this._currentSelectedMeshName) {
      // Hide all elements except the selected one
      this.hideAllButThisName(this._currentSelectedMeshName);

      // Show the ancestry
      if (this._showAllParents) {
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
   * if _keepOnlyCtxParents is set to true, then only parents that are stacking context will be enabled
   * @param {string} name
   */
  showParentsOfThisName(name) {
    let selected = this.meshTreeIndexByName[name];
    if (!selected) {
      return;
    }
    const parents = [];
    // Iteratively get the chain of parents for this mesh
    while (selected.parent !== null) {
      parents.push(selected.parent);
      selected = selected.parent;
    }

    for (const parent of parents) {
      if (parent.name) {
        const mesh = this.scene.getMeshByName(parent.name);
        let showMesh = true;
        if (this._keepOnlyCtxParents) {
          showMesh = mesh.isStackingContext || false;
        }
        this.setMeshEnabled(mesh, showMesh);
      }
    }
  }

  /**
   * Hides all the meshes in the scene except for the one that matches the name
   *
   * @param {*} name
   */
  hideAllButThisName(name) {
    for (const mesh of this.scene.meshes) {
      if (mesh.name !== 'skybox' && mesh.name !== 'BackgroundHelper') {
        this.setMeshEnabled(mesh, false);
      }
    }

    if (name && name !== '') {
      const meshToKeep = this.scene.getMeshByName(name);
      this.setMeshEnabled(meshToKeep, true);
    }
  }

  /**
   * Enables or disables a mesh and its corresponding ui controls
   *
   * @param {!BABYLON.Mesh} mesh
   * @param {boolean} [enabled=true]
   * @override
   */
  setMeshEnabled(mesh, enabled = true) {
    if (mesh) {
      mesh.setEnabled(enabled);
      for (const control of mesh.uiControls) {
        // Only show controls if the user has decided to highlight stacking context
        control.isVisible = enabled && this._highlightStackingContext;
      }
    }
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
};
