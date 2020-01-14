// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export const PortPadding = 4;
export const InputPortRadius = 10;
export const LeftMarginOfText = 12;
export const LeftSideTopPadding = 5;
export const BottomPaddingWithoutParam = 6;
export const BottomPaddingWithParam = 8;
export const ArrowHeadSize = 12;
// GraphPadding is used to add extra space for the graph layout.
export const GraphPadding = 20;
export const GraphMargin = 20;
export const TotalInputPortHeight = InputPortRadius * 2 + PortPadding;
export const TotalOutputPortHeight = TotalInputPortHeight;
export const TotalParamPortHeight = AudioParamRadius * 2 + PortPadding;

export const NodeLabelFontStyle = '14px Segoe UI, Arial';
export const ParamLabelFontStyle = '12px Segoe UI, Arial';

export const EdgeColor = '#455a63';
export const InputPortColor = '#455a63';
export const OutputPortColor = '#455a63';
export const ParamPortColor = '#ffa726';
export const ParamTextColor = '#303942';
export const TextColor = '#263238';
export const UnconnectedPortColor = '#ffffff';

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
