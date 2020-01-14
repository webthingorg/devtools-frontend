// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @implements {SDK.SDKModelObserver<!WebAudio.WebAudioModel>}
 */
export class WebAudioView extends UI.ThrottledWidget {
  constructor() {
    super(true, 1000);
    this.element.classList.add('web-audio-drawer');
    this.registerRequiredCSS('web_audio/webAudio.css');

    // Creates the toolbar container.
    const toolbarContainer = this.contentElement.createChild(
      'div', 'web-audio-toolbar-container vbox');

    // Creates a SplitWidget to hold detail (sidebar) and graph (main)
    this._splitWidgetContainer =
        this.contentElement.createChild('div', 'web-audio-split-widget-container vbox flex-auto');
    this._splitWidget =
        new UI.SplitWidget(true /* vertical */, false /* sidebar on left */, 'webaudio.sidebar.width', 184);
    // Attach widget to the container.
    this._splitWidget.show(this._splitWidgetContainer);

    // Creates the toolbar widget.
    this._contextSelector = new WebAudio.AudioContextSelector();
    const toolbar = new UI.Toolbar('web-audio-toolbar', toolbarContainer);
    toolbar.appendToolbarItem(UI.Toolbar.createActionButtonForId('components.collect-garbage'));
    toolbar.appendSeparator();
    toolbar.appendToolbarItem(this._splitWidget.createShowHideSidebarButton('WebAudio sidebar'));
    toolbar.appendSeparator();
    toolbar.appendToolbarItem(this._contextSelector.toolbarItem());

    // Creates the detail view  widget as the sidebar.
    // this._detailViewContainer = this.contentElement.createChild('div', 'vbox flex-auto');
    this._detailViewWidget = new UI.VBox();
    // Set minimum width and height of sidebar.
    this._detailViewWidget.setMinimumSize(150, 25);
    this._splitWidget.setSidebarWidget(this._detailViewWidget);
    // Detect the resize of siderbar to resize the canvas.
    this._splitWidget.addEventListener(UI.SplitWidget.Events.SidebarSizeChanged, () => {
      this._onSidebarResize();
    });

    // Creates the graph visualizer.
    this.registerRequiredCSS('web_audio/graph_visualizer/graphVisualizer.css');
    this._graphWidget = new UI.VBox();
    // Creates the canvas that will be used to render graph.
    const graphCanvas = /** @type {!HTMLCanvasElement} */
        (this._graphWidget.contentElement.createChild('canvas', 'root-canvas'));
    this._graphRenderer = new WebAudio.GraphVisualizer.GraphRenderer(graphCanvas, null);
    // Adds a button to fit the whole graph into viewport
    const lowerLeftMenu = this._graphWidget.contentElement.createChild('div', 'web-audio-whole-graph-button');
    this._buttonImage = lowerLeftMenu.createChild('img', 'resize-to-fit-button');
    this._buttonImage.setAttribute('src', 'Images/seeWholeGraph.svg');
    this._buttonImage.setAttribute('alt', 'Resize to fit');
    this._buttonImage.setAttribute('title', 'Resize to fit');
    this._buttonImage.addEventListener('click', () => {
      this._graphRenderer.zoomToFitAll();
    });
    this._splitWidget.setMainWidget(this._graphWidget);

    this._graphManager = new WebAudio.GraphVisualizer.GraphManager();
    this._graphManager.addEventListener(
        WebAudio.GraphVisualizer.GraphView.Events.ShouldRedraw, this._renderGraphIfSelected, this);

    // Creates the landing page.
    this._landingPage = new UI.VBox();
    this._landingPage.contentElement.classList.add('web-audio-landing-page', 'fill');
    this._landingPage.contentElement.appendChild(UI.html`
      <div>
        <p>${ls`Open a page that uses Web Audio API to start monitoring.`}</p>
      </div>
    `);
    this._landingPage.show(this._splitWidgetContainer);

    // Creates the summary bar.
    this._summaryBarContainer = this.contentElement.createChild('div', 'web-audio-summary-container');

    this._contextSelector.addEventListener(WebAudio.AudioContextSelector.Events.ContextSelected, event => {
      const context =
          /** @type {!Protocol.WebAudio.BaseAudioContext} */ (event.data);
      this._switchContext(context.contextId);
      this._updateDetailView(context);
      this.doUpdate();
      // Resize canvas after the context is switched (because the summary bar may be
      // toggled when switching between realtime context and offline context).
      setTimeout(() => {
        this._doResizeCanvas();
      }, 0);
    });

    SDK.targetManager.observeModels(WebAudio.WebAudioModel, this);
  }

  /**
   * @override
   */
  onResize() {
    this._doResizeCanvas();
  }

  _doResizeCanvas() {
    const size = {
      width: this._graphWidget.contentElement.clientWidth,
      height: this._graphWidget.contentElement.clientHeight,
    };
    this._graphRenderer.resize(size);
  }

  _onSidebarResize() {
    this._doResizeCanvas();
  }

  /**
   * @override
   */
  wasShown() {
    super.wasShown();
    for (const model of SDK.targetManager.models(WebAudio.WebAudioModel)) {
      this._addEventListeners(model);
    }
  }

  /**
   * @override
   */
  willHide() {
    for (const model of SDK.targetManager.models(WebAudio.WebAudioModel)) {
      this._removeEventListeners(model);
    }
  }

  /**
   * @override
   * @param {!WebAudio.WebAudioModel} webAudioModel
   */
  modelAdded(webAudioModel) {
    if (this.isShowing()) {
      this._addEventListeners(webAudioModel);
    }
  }

  /**
   * @override
   * @param {!WebAudio.WebAudioModel} webAudioModel
   */
  modelRemoved(webAudioModel) {
    this._removeEventListeners(webAudioModel);
  }

  /**
   * @override
   * @return {!Promise<?>}
   */
  async doUpdate() {
    await this._pollRealtimeData();
    this.update();
  }

  /**
   * @param {!WebAudio.WebAudioModel} webAudioModel
   */
  _addEventListeners(webAudioModel) {
    webAudioModel.ensureEnabled();
    webAudioModel.addEventListener(WebAudio.WebAudioModel.Events.ContextCreated, this._contextCreated, this);
    webAudioModel.addEventListener(WebAudio.WebAudioModel.Events.ContextDestroyed, this._contextDestroyed, this);
    webAudioModel.addEventListener(WebAudio.WebAudioModel.Events.ContextChanged, this._contextChanged, this);
    webAudioModel.addEventListener(WebAudio.WebAudioModel.Events.ModelReset, this._reset, this);
    webAudioModel.addEventListener(WebAudio.WebAudioModel.Events.ModelSuspend, this._suspendModel, this);
    webAudioModel.addEventListener(
        WebAudio.WebAudioModel.Events.AudioListenerCreated, this._audioListenerCreated, this);
    webAudioModel.addEventListener(
        WebAudio.WebAudioModel.Events.AudioListenerWillBeDestroyed, this._audioListenerWillBeDestroyed, this);
    webAudioModel.addEventListener(WebAudio.WebAudioModel.Events.AudioNodeCreated, this._audioNodeCreated, this);
    webAudioModel.addEventListener(
        WebAudio.WebAudioModel.Events.AudioNodeWillBeDestroyed, this._audioNodeWillBeDestroyed, this);
    webAudioModel.addEventListener(WebAudio.WebAudioModel.Events.AudioParamCreated, this._audioParamCreated, this);
    webAudioModel.addEventListener(
        WebAudio.WebAudioModel.Events.AudioParamWillBeDestroyed, this._audioParamWillBeDestroyed, this);
    webAudioModel.addEventListener(WebAudio.WebAudioModel.Events.NodesConnected, this._nodesConnected, this);
    webAudioModel.addEventListener(WebAudio.WebAudioModel.Events.NodesDisconnected, this._nodesDisconnected, this);
    webAudioModel.addEventListener(WebAudio.WebAudioModel.Events.NodeParamConnected, this._nodeParamConnected, this);
    webAudioModel.addEventListener(
        WebAudio.WebAudioModel.Events.NodeParamDisconnected, this._nodeParamDisconnected, this);
  }

  /**
   * @param {!WebAudio.WebAudioModel} webAudioModel
   */
  _removeEventListeners(webAudioModel) {
    webAudioModel.removeEventListener(WebAudio.WebAudioModel.Events.ContextCreated, this._contextCreated, this);
    webAudioModel.removeEventListener(WebAudio.WebAudioModel.Events.ContextDestroyed, this._contextDestroyed, this);
    webAudioModel.removeEventListener(WebAudio.WebAudioModel.Events.ContextChanged, this._contextChanged, this);
    webAudioModel.removeEventListener(WebAudio.WebAudioModel.Events.ModelReset, this._reset, this);
    webAudioModel.removeEventListener(WebAudio.WebAudioModel.Events.ModelSuspend, this._suspendModel, this);
    webAudioModel.removeEventListener(
        WebAudio.WebAudioModel.Events.AudioListenerCreated, this._audioListenerCreated, this);
    webAudioModel.removeEventListener(
        WebAudio.WebAudioModel.Events.AudioListenerWillBeDestroyed, this._audioListenerWillBeDestroyed, this);
    webAudioModel.removeEventListener(WebAudio.WebAudioModel.Events.AudioNodeCreated, this._audioNodeCreated, this);
    webAudioModel.removeEventListener(
        WebAudio.WebAudioModel.Events.AudioNodeWillBeDestroyed, this._audioNodeWillBeDestroyed, this);
    webAudioModel.removeEventListener(WebAudio.WebAudioModel.Events.AudioParamCreated, this._audioParamCreated, this);
    webAudioModel.removeEventListener(
        WebAudio.WebAudioModel.Events.AudioParamWillBeDestroyed, this._audioParamWillBeDestroyed, this);
    webAudioModel.removeEventListener(WebAudio.WebAudioModel.Events.NodesConnected, this._nodesConnected, this);
    webAudioModel.removeEventListener(WebAudio.WebAudioModel.Events.NodesDisconnected, this._nodesDisconnected, this);
    webAudioModel.removeEventListener(WebAudio.WebAudioModel.Events.NodeParamConnected, this._nodeParamConnected, this);
    webAudioModel.removeEventListener(
        WebAudio.WebAudioModel.Events.NodeParamDisconnected, this._nodeParamDisconnected, this);
  }

  /**
   * @param {!Common.Event} event
   */
  _contextCreated(event) {
    const context = /** @type {!Protocol.WebAudio.BaseAudioContext} */ (event.data);
    this._graphManager.createContext(context.contextId);
    this._contextSelector.contextCreated(event);
  }

  /**
   * @param {!Common.Event} event
   */
  _contextDestroyed(event) {
    const contextId = /** @type {!Protocol.WebAudio.GraphObjectId} */ (event.data);
    this._graphManager.destroyContext(contextId);
    this._contextSelector.contextDestroyed(event);
  }

  /**
   * @param {!Common.Event} event
   */
  _contextChanged(event) {
    const context = /** @type {!Protocol.WebAudio.BaseAudioContext} */ (event.data);
    if (!this._graphManager.hasContext(context.contextId)) {
      return;
    }

    this._contextSelector.contextChanged(event);
  }

  /**
   * @param {!Protocol.WebAudio.GraphObjectId} contextId
   */
  _switchContext(contextId) {
    const graph = this._graphManager.getGraph(contextId);
    this._renderGraph(graph);
  }

  /**
   * @param {!Common.Event} event
   */
  _renderGraphIfSelected(event) {
    const graph = /** @type {!WebAudio.GraphVisualizer.GraphView} */ (event.data);
    const selectedContext = this._contextSelector.selectedContext();
    if (selectedContext && graph.contextId === selectedContext.contextId)
      {this._renderGraph(graph);}
  }

  /**
   * Request a redraw for the given graph.
   * If graph is null, it will clear the canvas.
   * @param {?WebAudio.GraphVisualizer.GraphView} graph
   */
  _renderGraph(graph) {
    this._graphRenderer.setGraph(graph);
    this._graphRenderer.requestRedraw();
  }

  _reset() {
    if (this._landingPage.isShowing()) {
      this._landingPage.detach();
    }
    this._contextSelector.reset();
    this._detailViewWidget.contentElement.removeChildren();
    this._landingPage.show(this._splitWidgetContainer);
    this._graphManager.clearGraphs();
  }

  _suspendModel() {
    this._graphManager.clearGraphs();
  }

  /**
   * @param {!Common.Event} event
   */
  _audioListenerCreated(event) {
    const listener = /** @type {!Protocol.WebAudio.AudioListener} */ (event.data);
    const graph = this._graphManager.getGraph(listener.contextId);
    if (!graph) {
      return;
    }
    graph.addNode({
      nodeId: listener.listenerId,
      nodeType: 'Listener',
      numberOfInputs: 0,
      numberOfOutputs: 0,
    });
  }

  /**
   * @param {!Common.Event} event
   */
  _audioListenerWillBeDestroyed(event) {
    const {contextId, listenerId} = event.data;
    const graph = this._graphManager.getGraph(contextId);
    if (!graph) {
      return;
    }
    graph.removeNode(listenerId);
  }

  /**
   * @param {!Common.Event} event
   */
  _audioNodeCreated(event) {
    const node = /** @type {!Protocol.WebAudio.AudioNode} */ (event.data);
    const graph = this._graphManager.getGraph(node.contextId);
    if (!graph) {
      return;
    }
    graph.addNode({
      nodeId: node.nodeId,
      nodeType: node.nodeType,
      numberOfInputs: node.numberOfInputs,
      numberOfOutputs: node.numberOfOutputs,
    });
  }

  /**
   * @param {!Common.Event} event
   */
  _audioNodeWillBeDestroyed(event) {
    const {contextId, nodeId} = event.data;
    const graph = this._graphManager.getGraph(contextId);
    if (!graph) {
      return;
    }
    graph.removeNode(nodeId);
  }

  /**
   * @param {!Common.Event} event
   */
  _audioParamCreated(event) {
    const param = /** @type {!Protocol.WebAudio.AudioParam} */ (event.data);
    const graph = this._graphManager.getGraph(param.contextId);
    if (!graph) {
      return;
    }
    graph.addParam({
      paramId: param.paramId,
      paramType: param.paramType,
      nodeId: param.nodeId,
    });
  }

  /**
   * @param {!Common.Event} event
   */
  _audioParamWillBeDestroyed(event) {
    const {contextId, paramId} = event.data;
    const graph = this._graphManager.getGraph(contextId);
    if (!graph) {
      return;
    }
    graph.removeParam(paramId);
  }

  /**
   * @param {!Common.Event} event
   */
  _nodesConnected(event) {
    const {contextId, sourceId, destinationId, sourceOutputIndex, destinationInputIndex} = event.data;
    const graph = this._graphManager.getGraph(contextId);
    if (!graph) {
      return;
    }
    graph.addNodeToNodeConnection({
      sourceId,
      destinationId,
      sourceOutputIndex,
      destinationInputIndex,
    });
  }

  /**
   * @param {!Common.Event} event
   */
  _nodesDisconnected(event) {
    const {contextId, sourceId, destinationId, sourceOutputIndex, destinationInputIndex} = event.data;
    const graph = this._graphManager.getGraph(contextId);
    if (!graph) {
      return;
    }
    graph.removeNodeToNodeConnection({
      sourceId,
      destinationId,
      sourceOutputIndex,
      destinationInputIndex,
    });
  }

  /**
   * @param {!Common.Event} event
   */
  _nodeParamConnected(event) {
    const {contextId, sourceId, destinationId, sourceOutputIndex} = event.data;
    const graph = this._graphManager.getGraph(contextId);
    if (!graph) {
      return;
    }
    // Since the destinationId is AudioParamId, we need to find the nodeId as the
    // real destinationId.
    const nodeId = graph.getNodeIdByParamId(destinationId);
    if (!nodeId) {
      return;
    }
    graph.addNodeToParamConnection({
      sourceId,
      destinationId: nodeId,
      sourceOutputIndex,
      destinationParamId: destinationId,
    });
  }

  /**
   * @param {!Common.Event} event
   */
  _nodeParamDisconnected(event) {
    const {contextId, sourceId, destinationId, sourceOutputIndex} = event.data;
    const graph = this._graphManager.getGraph(contextId);
    if (!graph) {
      return;
    }
    // Since the destinationId is AudioParamId, we need to find the nodeId as the
    // real destinationId.
    const nodeId = graph.getNodeIdByParamId(destinationId);
    if (!nodeId) {
      return;
    }
    graph.removeNodeToParamConnection({
      sourceId,
      destinationId: nodeId,
      sourceOutputIndex,
      destinationParamId: destinationId,
    });
  }

  /**
   * @param {!Protocol.WebAudio.BaseAudioContext} context
   */
  _updateDetailView(context) {
    if (this._landingPage.isShowing()) {
      this._landingPage.detach();
    }
    const detailBuilder = new WebAudio.ContextDetailBuilder(context);
    this._detailViewWidget.contentElement.removeChildren();
    this._detailViewWidget.contentElement.appendChild(detailBuilder.getFragment());
  }

  /**
   * @param {!Protocol.WebAudio.GraphObjectId} contextId
   * @param {!Protocol.WebAudio.ContextRealtimeData} contextRealtimeData
   */
  _updateSummaryBar(contextId, contextRealtimeData) {
    const summaryBuilder =
        new WebAudio.AudioContextSummaryBuilder(contextId, contextRealtimeData);
    this._summaryBarContainer.removeChildren();
    this._summaryBarContainer.appendChild(summaryBuilder.getFragment());
  }

  _clearSummaryBar() {
    this._summaryBarContainer.removeChildren();
  }

  async _pollRealtimeData() {
    const context = this._contextSelector.selectedContext();
    if (!context) {
      this._clearSummaryBar();
      return;
    }

    for (const model of SDK.targetManager.models(WebAudio.WebAudioModel)) {
      // Display summary only for real-time context.
      if (context.contextType === 'realtime') {
        if (!this._graphManager.hasContext(context.contextId)) {
          continue;
        }
        const realtimeData = await model.requestRealtimeData(context.contextId);
        if (realtimeData) {
          this._updateSummaryBar(context.contextId, realtimeData);
        }
      } else {
        this._clearSummaryBar();
      }
    }
  }
}
