// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Create a group to hold the curve and arrow head.
 * @param {!Fabric.Canvas} canvas
 * @param {!WebAudio.GraphVisualizer.EdgeView} edge
 * @param {!WebAudio.GraphVisualizer.GraphView} graph
 * @param {?Object=} option
 * @return {!Fabric.Group}
 */
export const draw = (canvas, edge, graph, option) => {
  const {path, arrowHead} = createPathAndArrowHead(graph, edge, canvas, option);

  const group = new fabric.Group([path, arrowHead], {
    id: edge.id,
    hasRotatingPoint: false,
    hasControls: false,
    hasBorders: false,
    // Should not use `selectable=false` to allow event propagation.
    // Instead, use `evented=false` to truly allow event propagation so that
    // users can click on the any Node that is shadowed by the Edge.
    evented: false,
  });

  canvas.add(group);
  return group;
};

/**
 * Update an existing edge group.
 * @param {!Fabric.Group} edgeGroup
 * @param {!WebAudio.GraphVisualizer.EdgeView} edge
 * @param {!WebAudio.GraphVisualizer.GraphView} graph
 * @return {!Fabric.Group}
 */
export const update = (edgeGroup, edge, graph) => {
  // Remove the old path, add new path into the group.
  // @see https://stackoverflow.com/questions/35436344/fabricjs-the-bounding-box-of-a-path-not-get-update-when-i-change-path-coordinat
  edgeGroup.forEachObject(obj => {
    edgeGroup.remove(obj);
  });

  const {path, arrowHead} = createPathAndArrowHead(graph, edge);

  edgeGroup.addWithUpdate(path);
  edgeGroup.addWithUpdate(arrowHead);

  return edgeGroup;
};

/**
 * @param {!WebAudio.GraphVisualizer.GraphView} graph
 * @param {!WebAudio.GraphVisualizer.EdgeView} edge
 * @param {?Fabric.Canvas=} canvas
 * @param {?Object=} option
 */
const createPathAndArrowHead = (graph, edge, canvas, option) => {
  const controlPoints = edge.points;

  // Remove the first and last point.
  const middlePoints = controlPoints ? controlPoints.slice(1, controlPoints.length - 1) : [];
  // Specify our own source and destination points.
  const {sourcePoint, destinationPoint} = findConnectionPoints(graph, edge, middlePoints);

  const pathD = createRoundedPath(sourcePoint, destinationPoint, middlePoints);
  const arrowHeadPathD = createArrowHeadPath(sourcePoint, destinationPoint, middlePoints);

  const path = new fabric.Path(pathD, {
    fill: '',
    stroke: WebAudio.GraphVisualizer.edgeColor,
    strokeWidth: 1.5,
    selectable: false,
  });

  const arrowHead = new fabric.Path(arrowHeadPathD, {
    fill: WebAudio.GraphVisualizer.edgeColor,
    selectable: false,
  });

  return {path, arrowHead, sourcePoint, destinationPoint};
};

/**
 * Find the intersection point between the port and the link.
 * @param {!WebAudio.GraphVisualizer.GraphView} graph
 * @param {!WebAudio.GraphVisualizer.EdgeView} edge
 * @param {?Array<!WebAudio.GraphVisualizer.Point>} route - Middle points
 * @return {!Object}
 */
const findConnectionPoints = (graph, edge, route) => {
  const sourceNode = graph.getNodeById(edge.sourceId);
  const sourcePort = sourceNode.getPortById(edge.sourcePortId);
  const sourceCenterPos = sourceNode.position;
  const sourceSize = sourceNode.size;
  // The source port is on the right-side border of the source node.
  const sourcePos = {
    x: sourceCenterPos.x + sourceSize.width / 2,
    y: sourceCenterPos.y - sourceSize.height / 2 + sourcePort.y,
  };

  const destinationNode = graph.getNodeById(edge.destinationId);
  const destinationPort = destinationNode.getPortById(edge.destinationPortId);
  const destinationCenterPos = destinationNode.position;
  const destinationSize = destinationNode.size;
  // The destination port is on the left-side border of the destination node.
  const destinationPos = {
    x: destinationCenterPos.x - destinationSize.width / 2,
    y: destinationCenterPos.y - destinationSize.height / 2 + destinationPort.y,
  };

  let control1;
  let control2;
  if (route && route.length > 0) {
    control1 = route[0];
    control2 = route[route.length - 1];
  } else {
    control1 = destinationPos;
    control2 = sourcePos;
  }

  // Find the intersection between the line from source to next
  // and the circle of source port.
  const point1 = WebAudio.GraphVisualizer.getPointByDistance(
      sourcePos, control1, WebAudio.GraphVisualizer.GraphStyles.InputPortRadius);
  // Determine radius by destinationPort.type.
  const radius = destinationPort.type === WebAudio.GraphVisualizer.PortTypes.In ?
      WebAudio.GraphVisualizer.GraphStyles.InputPortRadius :
      WebAudio.GraphVisualizer.GraphStyles.AudioParamRadius;
  const point2 = WebAudio.GraphVisualizer.getPointByDistance(destinationPos, control2, radius);
  return {
    sourcePoint: WebAudio.GraphVisualizer.roundPoint(point1),
    destinationPoint: WebAudio.GraphVisualizer.roundPoint(point2),
  };
};

const createArrowHeadPath = (sourcePoint, destinationPoint, route) => {
  const lastMiddlePoint = route && route.length ? route[route.length - 1] : sourcePoint;

  const angle = WebAudio.GraphVisualizer.calculateAngleRadian(lastMiddlePoint, destinationPoint);
  const segments = [];
  let segment;

  segment = createSegment('M', destinationPoint);
  segments.push(segment);

  segment = createSegment('L', {
    x: destinationPoint.x - WebAudio.GraphVisualizer.GraphStyles.ArrowHeadSize * Math.cos(-angle - Math.PI / 6),
    y: destinationPoint.y - WebAudio.GraphVisualizer.GraphStyles.ArrowHeadSize * Math.sin(-angle - Math.PI / 6),
  });
  segments.push(segment);

  segment = createSegment('L', {
    x: destinationPoint.x - WebAudio.GraphVisualizer.GraphStyles.ArrowHeadSize * Math.cos(-angle + Math.PI / 6),
    y: destinationPoint.y - WebAudio.GraphVisualizer.GraphStyles.ArrowHeadSize * Math.sin(-angle + Math.PI / 6),
  });
  segments.push(segment);

  segments.push('Z');

  return segments.join(' ');
};

/**
 * Create a path from source to destination. For better look, round the path.
 * Credit: modified on https://github.com/clientIO/joint/blob/master/src/connectors/rounded.mjs
 * @param {!WebAudio.GraphVisualizer.Point} sourcePoint
 * @param {!WebAudio.GraphVisualizer.Point} destinationPoint
 * @param {!Array<!WebAudio.GraphVisualizer.Point>} route - Middle points
 * @return {string} - The path, the same as SVG path.d attribute
 */
const createRoundedPath = (sourcePoint, destinationPoint, route) => {
  // const offset = 10;
  const segments = [];
  let segment;

  segment = createSegment('M', sourcePoint);
  segments.push(segment);

  const _13 = 1 / 3;
  const _23 = 2 / 3;

  let curr;
  let prev;
  let next;
  let roundedStart;
  let roundedEnd;
  let control1;
  let control2;

  for (let index = 0, n = route.length; index < n; index++) {
    curr = route[index];

    prev = route[index - 1] || sourcePoint;
    next = route[index + 1] || destinationPoint;

    roundedStart = getMiddle(prev, curr);
    roundedEnd = getMiddle(curr, next);

    control1 = {x: (_13 * roundedStart.x) + (_23 * curr.x), y: (_23 * curr.y) + (_13 * roundedStart.y)};
    control2 = {x: (_13 * roundedEnd.x) + (_23 * curr.x), y: (_23 * curr.y) + (_13 * roundedEnd.y)};

    segment = createSegment('L', roundedStart);
    segments.push(segment);

    segment = createCurve([control1, control2, roundedEnd]);
    segments.push(segment);
  }

  segment = createSegment('L', destinationPoint);
  segments.push(segment);

  return segments.join(' ');
};

const createSegment = (action, point) => {
  return action + ' ' + point.x + ' ' + point.y;
};

const createCurve = points => {
  if (points.length !== 3) {
    console.error(`Should be 3 points but got: ${points.length}`);
    return;
  }
  const parts = [];
  parts.push('C');
  points.forEach(point => {
    parts.push(point.x);
    parts.push(point.y);
  });
  return parts.join(' ');
};

const getMiddle = (p1, p2) => {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
};

/**
 * Round a number to a given precision.
 * @param {number} x
 * @param {number=} precision - The number of decimal digits. Round to integer
 *     by default.
 * @return {number}
 */
const round = (x, precision) => {
  const f = Math.pow(10, precision || 0);
  return Math.round(x * f) / f;
};

/**
 * Round a point to a given precision.
 * @param {!WebAudio.GraphVisualizer.Point} point
 * @param {number=} precision - The number of decimal digits. Round to integer
 *     by default.
 * @return {!WebAudio.GraphVisualizer.Point}
 */
const roundPoint = (point, precision) => {
  const f = Math.pow(10, precision || 0);
  point.x = Math.round(point.x * f) / f;
  point.y = Math.round(point.y * f) / f;
  return point;
};

/**
 * Calculate angle in radians.
 * @param {!WebAudio.GraphVisualizer.Point} from
 * @param {!WebAudio.GraphVisualizer.Point} to
 * @return {number}
 */
const calculateAngleRadian = (from, to) => {
  // Inverse y-axis.
  const dy = -(to.y - from.y);
  const dx = to.x - from.x;
  return Math.atan2(dy, dx);
};

/**
 * Get distance between two points.
 * @param {!WebAudio.GraphVisualizer.Point} p1
 * @param {!WebAudio.GraphVisualizer.Point} p2
 * @return {number}
 */
const calculateDistance = (p1, p2) => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Find the point on the line from `from` to `to`, in which
 * the distance to the `from` is `distance`.
 * @param {!WebAudio.GraphVisualizer.Point} from
 * @param {!WebAudio.GraphVisualizer.Point} to
 * @param {number} distance - The distance to the `from`.
 * @return {!WebAudio.GraphVisualizer.Point}
 */
const getPointByDistance = (from, to, distance) => {
  const length = WebAudio.GraphVisualizer.calculateDistance(from, to);
  if (length === 0) {
    if (distance !== 0)
      {console.error(`"from" should not be the same as "to"`);}

    return from;
  }
  const ratio = distance / length;
  return WebAudio.GraphVisualizer.getPointByRatio(from, to, ratio);
};

/**
 * Find the point on the line from `from` to `to`, in which
 * the ratio is the distance to the `from` over the total length.
 * @param {!WebAudio.GraphVisualizer.Point} from
 * @param {!WebAudio.GraphVisualizer.Point} to
 * @param {number} ratio - The ratio of the distance to
 *    the `from` over the total length.
 * @return {!WebAudio.GraphVisualizer.Point}
 */
const getPointByRatio = (from, to, ratio) => {
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
  };
};

/* Legacy exported object */
self.WebAudio = self.WebAudio || {};

/* Legacy exported object */
WebAudio = WebAudio || {};

/* Legacy exported object */
WebAudio.GraphVisualizer = WebAudio.GraphVisualizer || {};

WebAudio.GraphVisualizer.round = round;
WebAudio.GraphVisualizer.roundPoint = roundPoint;
WebAudio.GraphVisualizer.calculateAngleRadian = calculateAngleRadian;
WebAudio.GraphVisualizer.calculateDistance = calculateDistance;
WebAudio.GraphVisualizer.getPointByDistance = getPointByDistance;
WebAudio.GraphVisualizer.getPointByRatio = getPointByRatio;

/* Legacy exported object */
WebAudio.GraphVisualizer.EdgeRendererUtility = WebAudio.GraphVisualizer.EdgeRendererUtility || {};

WebAudio.GraphVisualizer.EdgeRendererUtility.draw = draw;
WebAudio.GraphVisualizer.EdgeRendererUtility.update = update;
