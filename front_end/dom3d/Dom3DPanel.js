// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/*
  This is the UI for the 3D View module. It is made of a Panel with a sidebar.

  In the Main View of the panel we have a canvas where the render engine will display the Babylon.js scene.
  The Sidebar contains a tab control which hosts 2 side views, DomSideView and ZIndexSideView.
  When a new tab is selected it triggers a scene swap via the renderer model.
  ____________________________________________________
  | PanelWithSidebar                                  |
  |  ________________________________________________ |
  | | SideViewTab            |  MainView            | |
  | |   __________________   |   _________________  | |
  | |  | TabbedPane       |  |  | Canvas          | | |
  | |  |__________________|  |  |_________________| | |
  | |________________________|______________________| |
  |___________________________________________________|
 */
Dom3d.Dom3dPanel = class extends UI.PanelWithSidebar {
  constructor() {
    super('Dom3d', 285);
    // Renderer model for 3D scene
    this._rendererModel = new Dom3d.RendererModel();

    // Create ui for main and side view
    this._mainView = new Dom3d.MainView(this._rendererModel);
    this._sideView = new Dom3d.SideViewTab(this._rendererModel);

    // Add views to panel
    this.splitWidget().setMainWidget(this._mainView);
    this.splitWidget().setSidebarWidget(this._sideView);
  }

  /**
   * Returns the main view
   * @returns Dom3d.MainView
   */
  mainView() {
    return this._mainView;
  }

  /**
   * Returns the side view
   * @returns Dom3d.SideView
   */
  sideView() {
    return this._sideView.getActiveSideView();
  }
};


Dom3d.MainView = class extends UI.VBox {
  /**
   * @param {!Dom3d.RendererModel} rendererModel
   */
  constructor(rendererModel) {
    super(true);
    this.registerRequiredCSS('dom3d/styles.css');
    this.setMinimumSize(200, 100);

    this._rendererModel = rendererModel;

    // UI
    this.contentElement.classList.add('Dom3d-main-view');
    this._canvas = createElementWithClass('canvas', 'Dom3d-canvas');

    // Show the empty page message as default
    this.showCanvas();
  }

  /**
  * @override
  */
  wasShown() {
    // Executed when the widget is shown
    this._rendererModel.onParentShow(this._canvas, this.contentElement);
  }

  showCanvas() {
    this._canvas.height = this.contentElement.clientHeight;
    this._canvas.width = this.contentElement.clientWidth;
    this.contentElement.appendChild(this._canvas);
  }

  /**
   *@override
   */
  onResize() {
    if (this._rendererModel) {
      this._rendererModel.onParentResized();
    }
    super.onResize();
  }
};

Dom3d.SideViewTab = class extends UI.VBox {
  constructor(rendererModel) {
    super(true);

    /** @typedef {Dom3d.RendererModel}*/
    this._rendererModel = rendererModel;
    /** @typedef {UI.TabbedPane} */
    this._tabbedPane = new UI.TabbedPane();

    this._ZIndexTabView = new Dom3d.ZIndexSideView(this._rendererModel);
    this._DOMTabView = new Dom3d.DOMSideView(this._rendererModel);

    this._tabbedPane.appendTab(Dom3d.SideViewTabs.ZIndex, ls`Z-index`, this._ZIndexTabView);
    this._tabbedPane.appendTab(Dom3d.SideViewTabs.DOMModel, ls`DOM`, this._DOMTabView);

    this._tabbedPane.addEventListener(UI.TabbedPane.Events.TabSelected, this._onTabSelected, this);

    this._tabbedPane.show(this.contentElement);

    this.activeTab = Dom3d.SideViewTabs.ZIndex;
  }

  /**
   * @override
   */
  wasShown() {
    super.wasShown();
  }

  getActiveSideView() {
    switch (this.activeTab) {
      case Dom3d.SideViewTabs.DOMModel:
        return this._DOMTabView;
      case Dom3d.SideViewTabs.ZIndex:
        return this._ZIndexTabView;
      default:
        return this._DOMTabView;
    }
  }

  /**
   * @param {!Common.Event} event
   */
  _onTabSelected(event) {
    switch (event.data.tabId) {
      case Dom3d.SideViewTabs.DOMModel:
        this.activeTab = Dom3d.SideViewTabs.DOMModel;
        this.showDOM();
        break;
      case Dom3d.SideViewTabs.ZIndex:
        this.activeTab = Dom3d.SideViewTabs.ZIndex;
        this.showZIndex();
        break;
    }
  }

  showDOM() {
    this._ZIndexTabView.pauseScene();
    this._DOMTabView.resumeScene();
    this._rendererModel.showDOM();
  }

  showZIndex() {
    this._DOMTabView.pauseScene();
    this._ZIndexTabView.resumeScene();
    this._rendererModel.showZIndex();
  }
};

Dom3d.SideViewTabs = {
  DOMModel: 'domModel',
  ZIndex: 'zIndex'
};
