// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Utility functions to render nodes onto Canvas using Fabric.js.

import fabric from '../../third_party/fabricjs/fabric.js';

import * as GraphStyle from './GraphStyle.js';
import {GraphView} from './GraphView.js';
import {buildPortsConnectionInfo} from './NodeRendererUtility.js';
import {NodeView, PortTypes} from './NodeView.js';

/**
 * Calculate the x, y value of input port.
 * Input ports are placed near the top of the left-side border.
 * @param {number} portIndex
 * @return {!WebAudio.GraphVisualizer.Point}
 */
export const calculateInputPortXY = portIndex => {
  const y = GraphStyle.InputPortRadius + GraphStyle.LeftSideTopPadding + portIndex * GraphStyle.TotalInputPortHeight;
  return {x: 0, y: y};
};

/**
 * Calculate the x, y value of output port.
 * Output ports are placed near the center of the right-side border.
 * @param {number} portIndex
 * @param {!WebAudio.GraphVisualizer.Size} nodeSize
 * @param {number} numberOfOutputs
 * @return {!WebAudio.GraphVisualizer.Point}
 */
export const calculateOutputPortXY = (portIndex, nodeSize, numberOfOutputs) => {
  const {width, height} = nodeSize;
  const outputPortY = (height / 2) + (2 * portIndex - numberOfOutputs + 1) * GraphStyle.TotalOutputPortHeight / 2;

  return {x: width, y: outputPortY};
};

/**
 * Calculate the x, y value of param port.
 * Param ports are placed near the bottom of the left-side border.
 * @param {number} portIndex
 * @param {number} offsetY
 * @return {!WebAudio.GraphVisualizer.Point}
 */
export const calculateParamPortXY = (portIndex, offsetY) => {
  const paramPortY = offsetY + GraphStyle.TotalParamPortHeight * (portIndex + 1) - GraphStyle.AudioParamRadius;
  return {x: 0, y: paramPortY};
};

/**
 * Use fabric.js to draw the node and text.
 * @param {!Fabric.Canvas} canvas
 * @param {!NodeView} node
 * @param {!GraphView} graph
 * @return {!Fabric.Group}
 */
export const draw = (canvas, node, graph) => {
  const pos = node.position;
  const size = node.size;

  const elements = [];

  const nodeBackground = new fabric.Rect({
    fill: GraphStyle.computeNodeColor(node.type),
    width: size.width,
    height: size.height,
  });
  elements.push(nodeBackground);

  const nodeLabelText = new fabric.Text(node.label, {
    fontSize: 14,
    fontFamily: 'Segoe UI, sans-serif',
    fill: GraphStyle.TextColor,
    left: GraphStyle.LeftMarginOfText,
    top: GraphStyle.LeftSideTopPadding + GraphStyle.PortPadding,
  });
  elements.push(nodeLabelText);

  const portsConnectionInfo = buildPortsConnectionInfo(graph, node);
  node.ports.forEach(port => {
    const isPortConnected = portsConnectionInfo.has(port.id);
    const portGroup = createPortElement(port, size, isPortConnected);
    if (portGroup) {
      elements.push(portGroup);
    }
  });

  const offsetX = getOffsetXDueToPorts(node);
  // Use a group to hold labels and ports,
  // so the position of children can be relative
  const group = new fabric.Group(elements, {
    id: node.id,
    // Round the position such that text will be not blurry.
    left: Math.round(pos.x - size.width / 2 - offsetX),
    top: Math.round(pos.y - size.height / 2),
    hasRotatingPoint: false,
    hasControls: false,
    // Draw a colored layer under the group when the group is selected.
    // Can set the color and padding.
    selectionBackgroundColor: 'orange',
    padding: 5,
    hoverCursor: 'pointer',
    // Prevent movement when dragging on the node group.
    // @see https://github.com/fabricjs/fabric.js/wiki/Preventing-object-modification-(movement)
    lockMovementX: true,
    lockMovementY: true,
  });
  canvas.add(group);

  return group;
};

/**
 * Update the existing group that contains node and text.
 * @param {!Fabric.Group} nodeGroup
 * @param {!NodeView} node
 * @param {!GraphView} graph
 * @return {!Fabric.Group}
 */
export const update = (nodeGroup, node, graph) => {
  const size = node.size;

  const offsetX = getOffsetXDueToPorts(node);

  // Round the position such that text will not be blurry.
  nodeGroup.set({
    left: Math.round(node.position.x - size.width / 2 - offsetX),
    top: Math.round(node.position.y - size.height / 2),
  });
  nodeGroup.setCoords();

  const portsConnectionInfo = buildPortsConnectionInfo(graph, node);

  const renderedPortIds = new Set();
  // Update the port's fill color based on port's connectivity.
  nodeGroup.forEachObject(portGroup => {
    // Not a port group, skip.
    if (typeof portGroup.portId === 'undefined') {
      return;
    }
    const port = node.getPortById(portGroup.portId);
    if (!port) {
      return;
    }

    renderedPortIds.add(port.id);

    // Port circle is the first element of port group.
    const portCircle = portGroup.item(0);
    const isPortConnected = portsConnectionInfo.has(port.id);

    let fill;
    if (!isPortConnected) {
      fill = GraphStyle.UnconnectedPortColor;
    } else if (port.type === PortTypes.Param) {
      fill = GraphStyle.paramPortColor;
    } else {
      fill = GraphStyle.inputPortColor;
    }

    if (fill !== portCircle.fill) {
      portCircle.setOptions({fill: fill});
    }
  });

  // There is a tiny chance that we draw a node before all ports have been added.
  // When we update this node, we need to add any new port into canvas.
  // Fortunately, this should be very rare and have no need to consider port removal.
  if (renderedPortIds.size !== node.ports.size) {
    node.ports.forEach(port => {
      if (renderedPortIds.has(port.id)) {
        return;
      }
      const isPortConnected = portsConnectionInfo.has(port.id);
      const portGroup = createPortElement(port, size, isPortConnected);
      if (portGroup) {
        nodeGroup.addWithUpdate(portGroup);
      }
    });
  }

  return nodeGroup;
};

/**
 * Use graph to count the edges connected to each port of the node.
 * @param {!GraphView} graph
 * @param {!NodeView} node
 * @return {!Map<string, boolean>}
 */
export const buildPortsConnectionInfo = (graph, node) => {
  const {inEdgeIds, outEdgeIds} = graph.getInOutEdgeIdsOfNode(node.id);

  const portsConnectionInfo = new Map();

  inEdgeIds.forEach(edgeId => {
    const edge = graph.getEdgeById(edgeId);
    portsConnectionInfo.set(edge.destinationPortId, true);
  });

  outEdgeIds.forEach(edgeId => {
    const edge = graph.getEdgeById(edgeId);
    portsConnectionInfo.set(edge.sourcePortId, true);
  });

  return portsConnectionInfo;
};

/**
 * @param {!NodeView} node
 * @return {number}
 */
const getOffsetXDueToPorts = node => {
  // Adding ports on the left side of the node will add some offset.
  // Since all the objects of the node are rendered as a group,
  // the position of the group should minus this offset to make
  // sure all the objects are still at the right position.
  let offsetX = 0;
  node.ports.forEach(port => {
    if (port.type === PortTypes.In) {
      offsetX = GraphStyle.InputPortRadius;
    } else if (port.type === PortTypes.Param && offsetX === 0) {
      offsetX = GraphStyle.AudioParamRadius;
    }
  });
  return offsetX;
};

/**
 * @param {!WebAudio.GraphVisualizer.Port} port
 * @param {!WebAudio.GraphVisualizer.Size} nodeSize
 * @param {boolean} isPortConnected
 * @return {?Fabric.Group}
 */
const createPortElement = (port, nodeSize, isPortConnected) => {
  let top;
  let left;
  let circle;
  let label;

  switch (port.type) {
    case PortTypes.In:
      // Converts the center position of port into top and left.
      top = port.y - GraphStyle.InputPortRadius;
      left = -GraphStyle.InputPortRadius;
      circle = createInOutPortCircle(top, left, isPortConnected);
      label = createInOutPortLabel(top, left, port.label);
      break;
    case PortTypes.Out:
      top = port.y - GraphStyle.InputPortRadius;
      left = nodeSize.width - GraphStyle.InputPortRadius;
      circle = createInOutPortCircle(top, left, isPortConnected);
      label = createInOutPortLabel(top, left, port.label);
      break;
    case PortTypes.Param:
      circle = new fabric.Circle({
        radius: GraphStyle.AudioParamRadius - 1,
        fill: isPortConnected ? GraphStyle.ParamPortColor : GraphStyle.UnconnectedPortColor,
        top: port.y - GraphStyle.AudioParamRadius,
        left: 0 - GraphStyle.AudioParamRadius,
        stroke: GraphStyle.ParamPortColor,
        strokeWidth: 1,
      });

      label = new fabric.Text(port.label, {
        fontSize: 12,
        fontFamily: 'Segoe UI, sans-serif',
        fill: GraphStyle.paramTextColor,
        left: GraphStyle.LeftMarginOfText,
        top: port.y - GraphStyle.AudioParamRadius - 2,
      });
      break;
    default:
      console.error(`Unknown PortType: ${port.type}`);
      return null;
  }

  return new fabric.Group([circle, label], {
    portId: port.id,
  });
};

const BASE_OFFSET = 6;
const DIGIT_WIDTH = 3;

/**
 * @param {number} top
 * @param {number} left
 * @param {string} label
 * @return {!Fabric.Text}
 */
const createInOutPortLabel = (top, left, label) => {
  const labelOffset = getPortLabelOffset(label);
  return new fabric.Text(label, {
    fontSize: 14,
    fontFamily: 'Segoe UI, sans-serif',
    fill: 'black',
    top: top + labelOffset.offsetY,
    left: left + labelOffset.offsetX,
  });

  /**
   * Get the offset of label with respect to the top-left corner.
   * The offsetX is affected by the digits of the label.
   * @param {string} label - The port label.
   * @return {!{offsetX: number, offsetY: number}}
   */
  function getPortLabelOffset(label) {
    const digits = label.length;
    if (digits > 2) {
      console.warn(`Cannot handle more than two digits yet.`);
    }

    return {
      offsetX: BASE_OFFSET - (digits - 1) * DIGIT_WIDTH,
      offsetY: GraphStyle.InputPortRadius / 4,
    };
  }
};

/**
 * @param {number} top
 * @param {number} left
 * @param {boolean} isPortConnected
 * @return {!Fabric.Circle}
 */
const createInOutPortCircle = (top, left, isPortConnected) => {
  const fill = isPortConnected ? GraphStyle.InputPortColor : GraphStyle.UnconnectedPortColor;
  const strokeWidth = 2;
  return new fabric.Circle({
    radius: GraphStyle.InputPortRadius - (strokeWidth / 2),
    fill: fill,
    top: top,
    left: left,
    stroke: GraphStyle.InputPortColor,
    strokeWidth: strokeWidth,
  });
};
