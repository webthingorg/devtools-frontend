// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Render graph on canvas.
 * @param {!Fabric.Canvas} canvas
 * @param {!WebAudio.GraphVisualizer.GraphView} graph
 */
export const draw = (canvas, graph) => {
  const renderedNodeIds = new Set();
  const renderedEdgeIds = new Set();
  // Update existing node/edge or remove it if no longer exists.
  // Use canvas.getObjects to get a clone of the objects then call canvas.remove.
  // Should not use canvas.forEachObject, see
  // https://github.com/fabricjs/fabric.js/issues/3527
  canvas.getObjects().forEach(canvasObject => {
    const objectId = canvasObject.id;
    if (graph.getNodeById(objectId)) {
      // Update existing node.
      renderedNodeIds.add(objectId);
      WebAudio.GraphVisualizer.NodeRendererUtility.update(
          /** @type {!Fabric.Group} */ (canvasObject),
          /** @type {!WebAudio.GraphVisualizer.NodeView} */ (graph.getNodeById(objectId)), graph);
    } else if (graph.getEdgeById(objectId)) {
      // Update existing edge.
      renderedEdgeIds.add(objectId);
      WebAudio.GraphVisualizer.EdgeRendererUtility.update(
          /** @type {!Fabric.Group} */ (canvasObject),
          /** @type {!WebAudio.GraphVisualizer.EdgeView} */ (graph.getEdgeById(objectId)), graph);
    } else {
      // The object is no longer existing. Remove.
      canvas.remove(canvasObject);
    }
  });

  const nodes = graph.getNodes();
  const edges = graph.getEdges();
  // Add new nodes.
  nodes.forEach(node => {
    if (renderedNodeIds.has(node.id))
      {return;}

    // Note that new nodes may belong to current batch or
    // next batch. The difference is that nodes in current batch go through
    // layouting and have position calculated, while nodes in next batch
    // do not.
    if (node.shouldRender())
      {WebAudio.GraphVisualizer.NodeRendererUtility.draw(canvas, node, graph);}
  });

  // Add new edges.
  edges.forEach(edge => {
    if (renderedEdgeIds.has(edge.id))
      {return;}

    // Similar to new nodes above, these new edges may belong to current batch
    // or next batch. Only edges in the current batch have points calculated
    // via layouting.
    if (edge.shouldRender())
      {WebAudio.GraphVisualizer.EdgeRendererUtility.draw(canvas, edge, graph);}
  });

  canvas.requestRenderAll();
};

/* Legacy exported object */
self.WebAudio = self.WebAudio || {};

/* Legacy exported object */
WebAudio = WebAudio || {};

/* Legacy exported object */
WebAudio.GraphVisualizer = WebAudio.GraphVisualizer || {};

WebAudio.GraphVisualizer.GraphRendererUtility = WebAudio.GraphVisualizer.GraphRendererUtility || {};

WebAudio.GraphVisualizer.GraphRendererUtility.draw = draw;
