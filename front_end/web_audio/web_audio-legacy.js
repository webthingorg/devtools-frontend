// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as WebAudioModule from './web_audio.js';

self.WebAudio = self.WebAudio || {};
WebAudio = WebAudio || {};
WebAudio.GraphVisualizer = WebAudio.GraphVisualizer || {};

/**
 * @constructor
 */
WebAudio.AudioContextSelector = WebAudioModule.AudioContextSelector.AudioContextSelector;

/**
 * @constructor
 */
WebAudio.WebAudioView = WebAudioModule.WebAudioView.WebAudioView;

/**
 * @constructor
 */
WebAudio.GraphVisualizer.GraphView = WebAudioModule.GraphView.GraphView;

/**
 * @constructor
 */
WebAudio.GraphVisualizer.NodeView = WebAudioModule.NodeView.NodeView;
