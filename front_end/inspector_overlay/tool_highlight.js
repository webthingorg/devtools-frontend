// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// @ts-nocheck
// TODO(crbug.com/1011811): Enable TypeScript compiler checks

import './tool_highlight.css';
import {dispatch, reset, setPlatform} from './common.js';
import {doReset, drawHighlight} from './tool_highlight_impl.js';

window.setPlatform = function(platform) {
  document.body.classList.add('fill');

  const canvas = document.createElement('canvas');
  canvas.id = 'canvas';
  canvas.classList.add('fill');
  document.body.append(canvas);

  const tooltip = document.createElement('div');
  tooltip.id = 'tooltip-container';
  document.body.append(tooltip);

  const gridLabels = document.createElement('div');
  gridLabels.id = 'grid-label-container';
  document.body.append(gridLabels);

  setPlatform(platform);
};

window.reset = function(data) {
  reset(data);
  doReset(data);
};
window.drawHighlight = drawHighlight;
window.dispatch = dispatch;
