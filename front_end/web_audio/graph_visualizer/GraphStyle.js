// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Some settings that control the shape of the graph (in pixels).
export const GraphStyles = {
  PortPadding: 4,
  InputPortRadius: 10,
  AudioParamRadius: 5,
  LeftMarginOfText: 12,
  RightMarginOfText: 30,
  LeftSideTopPadding: 5,
  BottomPaddingWithoutParam: 6,
  BottomPaddingWithParam: 8,
  ArrowHeadSize: 12,
  // GraphPadding is used to add extra space for the layouted graph.
  GraphPadding: 20,
  GraphMargin: 20,
};

export const TotalInputPortHeight = GraphStyles.InputPortRadius * 2 + GraphStyles.PortPadding;
export const TotalOutputPortHeight = GraphStyles.TotalInputPortHeight;
export const TotalParamPortHeight = GraphStyles.AudioParamRadius * 2 + GraphStyles.PortPadding;

export const NodeLabelFontStyle = '14px Segoe UI, Arial';
export const ParamLabelFontStyle = '12px Segoe UI, Arial';


/* Legacy exported object */
self.WebAudio = self.WebAudio || {};

/* Legacy exported object */
WebAudio = WebAudio || {};

/* Legacy exported object */
WebAudio.GraphVisualizer = WebAudio.GraphVisualizer || {};

WebAudio.GraphVisualizer.GraphStyles = GraphStyles;

WebAudio.GraphVisualizer.GraphStyles.TotalInputPortHeight = TotalInputPortHeight;
WebAudio.GraphVisualizer.GraphStyles.TotalOutputPortHeight = TotalOutputPortHeight;
WebAudio.GraphVisualizer.GraphStyles.TotalParamPortHeight = TotalParamPortHeight;
WebAudio.GraphVisualizer.GraphStyles.NodeLabelFontStyle = NodeLabelFontStyle;
WebAudio.GraphVisualizer.GraphStyles.ParamLabelFontStyle = ParamLabelFontStyle;
