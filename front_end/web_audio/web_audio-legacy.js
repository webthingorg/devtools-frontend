// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as WebAudioModule from './web_audio.js';

self.WebAudio = self.WebAudio || {};
WebAudio = WebAudio || {};

/**
 * @constructor
 */
WebAudio.ContextDetailBuilder = WebAudioModule.AudioContextContentBuilder.ContextDetailBuilder;

/**
 * @constructor
 */
WebAudio.AudioContextSummaryBuilder = WebAudioModule.AudioContextContentBuilder.AudioContextSummaryBuilder;

/**
 * @constructor
 */
WebAudio.AudioContextSelector = WebAudioModule.AudioContextSelector.AudioContextSelector;

/** @enum {symbol} */
WebAudio.AudioContextSelector.Events = WebAudioModule.AudioContextSelector.Events;

/**
 * @constructor
 */
WebAudio.WebAudioModel = WebAudioModule.WebAudioModel.WebAudioModel;

/** @enum {symbol} */
WebAudio.WebAudioModel.Events = WebAudioModule.WebAudioModel.Events;

/**
 * @constructor
 */
WebAudio.WebAudioView = WebAudioModule.WebAudioView.WebAudioView;
