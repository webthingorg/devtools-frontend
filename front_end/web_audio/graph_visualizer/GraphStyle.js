// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Some settings that control the shape of the graph (in pixels).
WebAudio.GraphVisualizer.GraphStyles = {
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

WebAudio.GraphVisualizer.GraphStyles.TotalInputPortHeight =
    WebAudio.GraphVisualizer.GraphStyles.InputPortRadius * 2 + WebAudio.GraphVisualizer.GraphStyles.PortPadding;

WebAudio.GraphVisualizer.GraphStyles.TotalOutputPortHeight = WebAudio.GraphVisualizer.GraphStyles.TotalInputPortHeight;

WebAudio.GraphVisualizer.GraphStyles.TotalParamPortHeight =
    WebAudio.GraphVisualizer.GraphStyles.AudioParamRadius * 2 + WebAudio.GraphVisualizer.GraphStyles.PortPadding;

WebAudio.GraphVisualizer.GraphStyles.NodeLabelFontStyle = '14px Segoe UI, Arial';
WebAudio.GraphVisualizer.GraphStyles.ParamLabelFontStyle = '12px Segoe UI, Arial';

/**
 * Computes the color that should be used to visualize an AudioNode.
 * @param {string} nodeType The type of the node. With the Node suffix removed.
 * @param {?boolean=} isOffline Whether this node pertains to an
 *     OfflineAudioContext.
 * @return {string} The hex color used to visualize the AudioNode.
 */
WebAudio.GraphVisualizer.computeNodeColor = function(nodeType, isOffline) {
  // To make the label concise, remove the suffix "Node" from the nodeType.
  if (nodeType.endsWith('Node'))
    {nodeType = nodeType.slice(0, nodeType.length - 4);}

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
    case 'ScriptProcessor':  // Deprecated.
      return '#e0e0e0';
    case 'AudioWorklet':
      return '#9fa8da';
    case 'Listener':
      return '#bcaaa4';
    default:
      // Nothing matched. Odd. Highlight this node in dark red.
      console.warn(`Unknown nodeType: ${nodeType}`);
      return '#C62828';
  }
};

WebAudio.GraphVisualizer.textColor = '#263238';
WebAudio.GraphVisualizer.paramTextColor = '#303942';
WebAudio.GraphVisualizer.inputPortColor = '#455a63';
WebAudio.GraphVisualizer.outputPortColor = '#455a63';
WebAudio.GraphVisualizer.edgeColor = '#455a63';
WebAudio.GraphVisualizer.paramPortColor = '#ffa726';
WebAudio.GraphVisualizer.unconnectedPortColor = '#fff';
