// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const ArrowHeadSize = 12;
const AudioParamRadius = 5;
const BottomPaddingWithoutParam = 6;
const BottomPaddingWithParam = 8;
const GraphMargin = 20;
// GraphPadding is used to add extra space for the graph layout.
const GraphPadding = 20;
const InputPortRadius = 10;
const LeftMarginOfText = 12;
const LeftSideTopPadding = 5;
const PortPadding = 4;
const RightMarginOfText = 30;
const TotalInputPortHeight = InputPortRadius * 2 + PortPadding;
const TotalOutputPortHeight = TotalInputPortHeight;
const TotalParamPortHeight = AudioParamRadius * 2 + PortPadding;

const NodeLabelFontStyle = '14px Segoe UI, Arial';
const ParamLabelFontStyle = '12px Segoe UI, Arial';

const EdgeColor = '#455a63';
const InputPortColor = '#455a63';
const OutputPortColor = '#455a63';
const ParamPortColor = '#ffa726';
const ParamTextColor = '#303942';
const TextColor = '#263238';
const UnconnectedPortColor = '#ffffff';

/**
 * Computes the color that should be used to visualize an AudioNode.
 * @param {string} nodeType The type of the node. With the Node suffix removed.
 * @param {?boolean=} isOffline Whether this node pertains to an
 *     OfflineAudioContext.
 * @return {string} The hex color used to visualize the AudioNode.
 */
export function computeNodeColor(nodeType, isOffline) {
  // To make the label concise, remove the suffix "Node" from the nodeType.
  if (nodeType.endsWith('Node')) {
    nodeType = nodeType.slice(0, nodeType.length - 4);
  }

  // AudioNodes are grouped into color categories based on their purposes.
  switch (nodeType) {
    case 'AudioDestination':
      // The destination nodes of OfflineAudioContexts are brown. Those of
      // "non-offline" AudioContexts are a dark grey.
      return isOffline ? '#5D4037' : '#90a4ad';
    case 'AudioBufferSource':
    case 'Oscillator':
      return '#009688';
    case 'Gain':
    case 'BiquadFilter':
    case 'Convolver':
    case 'Delay':
    case 'DynamicsCompressor':
    case 'IIRFilter':
    case 'Panner':
    case 'StereoPanner':
    case 'ChannelMerger':
    case 'ChannelSplitter':
    case 'WaveShaper':
      return '#64b5f6';
    case 'Analyser':
      return '#f48fb1';
    case 'MediaElementAudioSource':
    case 'MediaStreamAudioDestination':
    case 'MediaStreamAudioSource':
      return '#ba68c8';
    case 'ScriptProcessor':
      return '#e0e0e0';
    case 'AudioWorklet':
      return '#9fa8da';
    case 'Listener':
      return '#bcaaa4';
    default:
      // Nothing matched. Highlight this node in dark red.
      console.warn(`Unknown nodeType: ${nodeType}`);
      return '#C62828';
  }
}

export const GraphStyles = {
  ArrowHeadSize,
  AudioParamRadius,
  BottomPaddingWithoutParam,
  BottomPaddingWithParam,
  EdgeColor,
  GraphMargin,
  GraphPadding,
  InputPortColor,
  InputPortRadius,
  LeftMarginOfText,
  LeftSideTopPadding,
  NodeLabelFontStyle,
  OutputPortColor,
  ParamLabelFontStyle,
  ParamPortColor,
  ParamTextColor,
  PortPadding,
  RightMarginOfText,
  TextColor,
  TotalInputPortHeight,
  TotalOutputPortHeight,
  TotalParamPortHeight,
  UnconnectedPortColor,
};

/* Legacy exported object */
self.WebAudio = self.WebAudio || {};

/* Legacy exported object */
WebAudio = WebAudio || {};

/* Legacy exported object */
WebAudio.GraphVisualizer = WebAudio.GraphVisualizer || {};

WebAudio.GraphVisualizer.GraphStyles = GraphStyles;
