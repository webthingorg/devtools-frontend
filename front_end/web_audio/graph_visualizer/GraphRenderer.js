// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// TODO: fabric is still not ESM. So this needs to be fixed.
import {fabric} from '../../third_party/fabricjs/fabric.js';

import {EdgeView} from './EdgeView.js';
import {draw as drawGraph} from './GraphRendererUtility.js';
import {GraphStyle} from './GraphStyle.js';
import {GraphView} from './GraphView.js';
import {NodeView} from './NodeView.js';

// A class that layouts and renders a graph on the canvas.
// It throttles requests for layouts and renders if the previous one is still in progress.
export class GraphRenderer {
  /**
   * @param {!HTMLCanvasElement} canvasElement - The canvas to render objects on.
   * @param {?GraphView} graph - The model of graph.
   */
  constructor(canvasElement, graph) {
    this.canvas = new fabric.Canvas(canvasElement, {selection: false});
    this.graph = graph;
    this._size = {width: 0, height: 0};

    this._isRequestPending = false;
    this._isLayouting = false;

    this._bind_relayout = this._relayout.bind(this);
    this._bind_render = this._render.bind(this);

    this.initialize();
  }

  /**
   * @param {?GraphView} graph
   */
  setGraph(graph) {
    this.graph = graph;
  }

  removeGraph() {
    this.graph = null;
  }

  /** Initialize the event listener and enable pan-zoom */
  initialize() {
    enablePanZoom(this.canvas);
  }

  /**
   * Resize the canvas.
   * @param {!WebAudio.GraphVisualizer.Size} size
   */
  resize(size) {
    if (size.width === this._size.width && size.height === this._size.height) {
      return;
    }

    this._size = size;
    this._setCanvasSize(size);
    this.requestRedraw();
  }

  zoomToFitAll() {
    if (!this.graph) {
      return;
    }

    // Get bounding box of all objects in the canvas.
    // https://github.com/fabricjs/fabric.js/issues/2471
    // Note that the values have been transformed.
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    this.canvas.forEachObject(canvasObject => {
      const boundingBox = canvasObject.getBoundingRect();
      if (boundingBox.left < minX) {
        minX = boundingBox.left;
      }
      if (boundingBox.top < minY) {
        minY = boundingBox.top;
      }
      const x = boundingBox.left + boundingBox.width;
      if (x > maxX) {
        maxX = x;
      }
      const y = boundingBox.top + boundingBox.height;
      if (y > maxY) {
        maxY = y;
      }
    });

    // Use the ratio of canvas size to graph size to determine the zoomLevel.
    const width = maxX - minX;
    const height = maxY - minY;
    const zoom = this.canvas.getZoom();
    const originalWidth = width / zoom;
    const originalHeight = height / zoom;
    // Add extra margin to four sides of the graph, which can be done by
    // subtracting the margin from the canvas size.
    const margin = GraphStyle.GraphMargin;
    const zoomLevel =
        Math.min((this._size.width - margin) / originalWidth, (this._size.height - margin) / originalHeight);

    // Reset the minZoomLevel to be half of the current zoomLevel, which prevents
    // the graph being too small.
    // TODO: this doesn't work. changing imported global sounds horrible.
    // WebAudio.GraphVisualizer.minZoomLevel = Math.min(WebAudio.GraphVisualizer.defaultMinZoomLevel, zoomLevel / 2);

    // Reset the pan to put the graph in the center.
    // Note that when we compute the layout of the graph (@see this._relayout),
    // we have added a padding to the left and top side of the graph.
    // In order to truly place the graph in
    // the center, we need to subtract that padding.
    const zoomedWidth = originalWidth * zoomLevel;
    const zoomedHeight = originalHeight * zoomLevel;
    const zoomedPadding = GraphStyle.GraphPadding * zoomLevel;
    const left = Math.floor((this._size.width - zoomedWidth) / 2) - zoomedPadding;
    const top = Math.floor((this._size.height - zoomedHeight) / 2) - zoomedPadding;
    this.canvas.viewportTransform[4] = left;
    this.canvas.viewportTransform[5] = top;
    this.canvas.zoomToPoint({x: left, y: top}, zoomLevel);
  }

  /**
   * Set canvas size based on window size.
   * @param {!WebAudio.GraphVisualizer.Size} size
   */
  _setCanvasSize(size) {
    this.canvas.setWidth(size.width);
    this.canvas.setHeight(size.height);
  }

  requestRedraw() {
    // There is no graph to render. Skip.
    if (!this.graph) {
      return;
    }

    if (this._isRequestPending) {
      // An rAF is already pending, do not request again.
      return;
    }

    if (this._isLayouting) {
      return;
    }

    this._isRequestPending = true;

    requestAnimationFrame(this._bind_relayout);
  }

  // Layout graph.
  // Subsequent relayout requests are skipped if the current one is incomplete.
  _relayout() {
    this._isRequestPending = false;

    // Check the graph again because graph might be cleared when _relayout
    // is called.
    if (!this.graph) {
      return;
    }

    // Prevent sending to Worker when the previous one does not return.
    if (this._isLayouting) {
      return;
    }

    this._isLayouting = true;


    // If graph is not dirty, just render it without relayouting.
    if (!this.graph.isDirty()) {
      this._render({contextId: this.graph.contextId});
      return;
    }

    // All the changes up to now will be sent to layout, so mark the graph
    // dirty to false; any future changes will make the graph dirty again.
    this.graph.setDirty(false);

    WebAudio.GraphVisualizer
        .computeLayout(this.graph, {
          // Add some padding to the left and top side of the graph such that
          // the leftmost and topmost nodes will not be overlapped with
          // the left and top border of the canvas.
          marginX: GraphStyle.GraphPadding,
          marginY: GraphStyle.GraphPadding,
          useWorker: true,
        })
        .then(this._bind_render);
  }

  /**
   * Render graph if layout successfully.
   * @param {!WebAudio.GraphVisualizer.LayoutMetadata} layoutMetadata
   */
  _render(layoutMetadata) {
    this._isLayouting = false;

    if (layoutMetadata.contextId !== this.graph.contextId) {
      // AudioContext is switched before rendering the layouted results.
      // Redraw the new graph instead.
      this.requestRedraw();
      return;
    }

    requestAnimationFrame(() => {
      if (!this.graph) {
        this.canvas.clear();
        return;
      }

      // If any updates are made during the layouting, request another redraw.
      if (this.graph.isDirty()) {
        this.requestRedraw();
      }

      drawGraph(this.canvas, this.graph);
    });
  }
}

/**
 * Compute layout by first converting the graph into Dagre-friendly graph.
 * After layouting, use the layouted graph to set the position/points
 * of the original graph.
 * @param {!GraphView} graph
 * @param {?WebAudio.GraphVisualizer.LayoutOption} option
 * @return {!Promise<!WebAudio.GraphVisualizer.LayoutMetadata>}
 */
export const computeLayout = (graph, option) => {
  // The attribute names of Dagre are all in lowercase.
  const glLabel = {
    // Graph is layouted from left to right.
    rankdir: 'LR',
    marginx: option.marginX || 0,
    marginy: option.marginY || 0,
  };

  const glGraph = convertToGraphlib(graph, {directed: true});

  glGraph.setGraph(glLabel);

  return new Promise(resolve => {
    if (option.useWorker) {
      const myWorker = WebAudio.GraphVisualizer.getLayoutWorker();
      // Should reset handler every time, otherwise it will use the old handler
      // that may refer to the wrong graph.
      myWorker.setHandler(glGraph => {
        convertBackToGraph(glGraph, graph);
        resolve(getLayoutMetadata(glGraph, graph, option));
      });

      myWorker.postMessage(glGraph);
    } else {
      dagre.layout(glGraph, {debugTiming: false});
      convertBackToGraph(glGraph, graph);
      resolve(getLayoutMetadata(glGraph, graph, option));
    }
  });
};

/**
 * Return the bounding box of the graph after the layout.
 * @param {!Dagre.Graphlib.Graph} glGraph
 * @param {!GraphView} graph
 * @param {?Object} option
 * @return {!Object}
 */
const getLayoutMetadata = (glGraph, graph, option) => {
  const glLabel = glGraph.graph();
  return {
    width: Math.abs(glLabel.width - 2 * (option.marginX || 0)),
    height: Math.abs(glLabel.height - 2 * (option.marginY || 0)),
    contextId: graph.contextId,
  };
};

/**
 * Create a label for a node.
 * A label is an object used by Dagre to receive settings
 * and save layout results.
 * Here, we pass the node's width and height.
 * @param {!NodeView} node
 * @return {!Dagre.Label}
 */
const createNodeLabel = node => {
  const {width, height} = node.size;
  return {width, height};
};

/**
 * Create a label for an edge.
 * A label is an object used by Dagre to receive settings
 * and save layout results.
 * @param {!EdgeView} edge
 * @return {!Dagre.Label}
 */
const createEdgeLabel = edge => {
  return {};
};

/**
 * Convert the graph into Dagre-friendly graph.
 * @param {!GraphView} graph
 * @param {?{directed: (boolean|undefined), compound: (boolean|undefined), multigraph: (boolean|undefined)}} option
 * @return {!Dagre.Graphlib.Graph};
 */
const convertToGraphlib = (graph, option) => {
  const glGraph = new dagre.graphlib.Graph(option);

  graph.getNodes().forEach(node => {
    glGraph.setNode(node.id, createNodeLabel(node));
  });

  // If two edges connect to different ports of the same two nodes,
  // they will be treated as the same edge.
  graph.getEdges().forEach(edge => {
    glGraph.setEdge(edge.sourceId, edge.destinationId, createEdgeLabel(edge));
  });

  return glGraph;
};

/**
 * Use the layouted graph to set the original graph.
 * @param {!Dagre.Graphlib.Graph} glGraph
 * @param {!GraphView} graph
 */
const convertBackToGraph = (glGraph, graph) => {
  glGraph.nodes().forEach(nodeId => {
    const node = graph.getNodeById(nodeId);
    // This happens when the node is destroyed before layout is done.
    if (!node) {
      return;
    }

    const nodeLabel = glGraph.node(nodeId);
    // By default, the node position of dagre layout is the center position.
    node.position = {
      x: nodeLabel.x,
      y: nodeLabel.y,
    };
  });

  glGraph.edges().forEach(glEdge => {
    const edgeLabel = glGraph.edge(glEdge);
    // Note that there might be multiple edges between the same source and destination nodes.
    const edgeIds = graph.getEdgeIdsBetweenNodes(glEdge.v, glEdge.w);
    edgeIds.forEach(edgeId => {
      const edge = graph.getEdgeById(edgeId);
      // This happens when the edge is destroyed before layout is done.
      if (!edge) {
        return;
      }

      // Save the control points of curve.
      edge.points = edgeLabel.points;
    });
  });
};

// A wrapper around Common.Worker that helps serialize and deserialize the graph data.
class LayoutWorker {
  /**
   * @param {?Function=} handler
   */
  constructor(handler) {
    // Could use new Common.Worker() if we make the worker as a separate app.
    // @see formatter_worker, audits_worker.
    // For now, use the url directly.
    this.worker = new Common.Worker('web_audio_worker');
    this.worker.onmessage = this._onmessage.bind(this);
    this.worker.onerror = this._onerror.bind(this);
    this._handler = handler;
  }

  postMessage(glGraph) {
    // Serialize the graph as string and send to worker.
    // Might consider use Transferable Object, but it requires us to convert
    // glGraph into Typed Array.
    this.worker.postMessage(dagre.graphlib.json.write(glGraph));
  }

  /**
   * @this {!LayoutWorker}
   * @param {!Function} handler
   */
  setHandler(handler) {
    this._handler = handler;
  }

  _onmessage(event) {
    // Restore the graph from serialized string.
    const glGraph = dagre.graphlib.json.read(event.data);
    this._handler && this._handler(glGraph);
  }

  _onerror(error) {
    console.error(error);
  }
}

/**
 * Track all created workers.
 * @type {!Array<!LayoutWorker>}
 */
const workers = [];

/**
 * Create new or reuse created worker.
 * @return {!LayoutWorker}
 */
export const getLayoutWorker = () => {
  // So far, just use one worker.
  if (workers.length > 0) {
    return workers[0];
  }

  const myWorker = new LayoutWorker();
  workers.push(myWorker);
  return myWorker;
};

// The minimum zoom level, by default 0.1.
// It prevents users to zoom out too much that cannot see anything.
// However, the zoom level might be improper for a large graph in which users cannot
// zoom out to see the whole graph. So, when users choose to fit the whole graph, we
// reset it.
export const minZoomLevel = 0.1;
export const maxZoomLevel = 20;
export const defaultMinZoomLevel = 0.1;

/**
 * Enable Pan Zoom by drag and mousewheel
 * Credit: modified on http://fabricjs.com/fabric-intro-part-5
 * @param {!Fabric.Canvas} canvas
 */
// eslint-disable-next-line no-unused-vars
const enablePanZoom = canvas => {
  canvas.on('mouse:down', function(opt) {
    const event = opt.e;
    canvas.isDragging = true;
    canvas.selection = false;
    canvas.lastPosX = event.clientX;
    canvas.lastPosY = event.clientY;
  });

  canvas.on('mouse:move', function(opt) {
    if (canvas.isDragging) {
      const event = opt.e;
      canvas.viewportTransform[4] += event.clientX - canvas.lastPosX;
      canvas.viewportTransform[5] += event.clientY - canvas.lastPosY;
      canvas.requestRenderAll();
      canvas.lastPosX = event.clientX;
      canvas.lastPosY = event.clientY;
    }
  });

  canvas.on('mouse:up', function(opt) {
    canvas.isDragging = false;
    canvas.selection = true;

    // TODO: Show detail of the clicked node with id = `opt.target.id`
    // if (opt.target && opt.target.id) {
    // }

    // After panning, we have to setCoords in order to select objects.
    // Credit: https://stackoverflow.com/a/49850382
    canvas.forEachObject(obj => {
      obj.setCoords();
    });
    canvas.requestRenderAll();
  });

  // Double click to zoom in.
  canvas.on('mouse:dblclick', function(opt) {
    let zoom = canvas.getZoom();
    zoom *= 2;
    zoom = Math.min(zoom, WebAudio.GraphVisualizer.maxZoomLevel);
    zoom = Math.max(zoom, WebAudio.GraphVisualizer.minZoomLevel);
    canvas.zoomToPoint({x: opt.e.offsetX, y: opt.e.offsetY}, zoom);
  });

  canvas.on('mouse:wheel', function(opt) {
    let delta = opt.e.deltaY;
    const mouseWheelZoomSpeed = 1 / 300;

    // Make the zoom out smoother by using smaller delta.
    let zoom = canvas.getZoom();
    if (delta > 0) {
      // Zoom out.
      if (zoom < 1) {
        delta = Math.min(delta, 150);
        const ratio = delta * mouseWheelZoomSpeed;
        if (zoom < 0.2) {
          // When zoom level is very small, make the delta smaller
          zoom = zoom - Math.pow(ratio, 4);
        } else {
          zoom = zoom - Math.pow(ratio, 3);  // cubic
        }
      } else {
        delta = Math.min(delta, 60);
        zoom = zoom - (delta * mouseWheelZoomSpeed);
      }
    } else {
      // Zoom in.
      delta = Math.max(delta, -100);
      zoom = zoom - (delta * mouseWheelZoomSpeed);
    }

    zoom = Math.min(zoom, WebAudio.GraphVisualizer.maxZoomLevel);
    zoom = Math.max(zoom, WebAudio.GraphVisualizer.minZoomLevel);
    canvas.zoomToPoint({x: opt.e.offsetX, y: opt.e.offsetY}, zoom);
    opt.e.preventDefault();
    opt.e.stopPropagation();
  });
};
