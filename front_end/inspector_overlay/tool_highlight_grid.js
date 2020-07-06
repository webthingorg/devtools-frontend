// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// @ts-nocheck
// TODO(crbug.com/1011811): Enable TypeScript compiler checks

import {dispatch, reset, setPlatform} from './common.js';
import {doReset, drawGridHighlight} from './tool_highlight_grid_impl.js';

const style = `
/* Grid row and column labels */
.grid-label-content {
  position: absolute;
  z-index: 10;
  -webkit-user-select: none;
}

.grid-label-content {
  background-color: #1A73E8;
  padding: 2px;
  font-family: Menlo, monospace;
  font-size: 10px;
  min-width: 10px;
  min-height: 15px;
  color: #FFFFFF;
  border: 1px solid white;
  border-radius: 2px;
  box-sizing: border-box;
  z-index: 1;
  background-clip: padding-box;
  will-change: transform;
  pointer-events: none;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  --inner-corner-avoid-distance: 15px;
}

.grid-label-content.top-left.inner-shared-corner,
.grid-label-content.top-right.inner-shared-corner {
  transform: translateY(var(--inner-corner-avoid-distance));
}

.grid-label-content.bottom-left.inner-shared-corner,
.grid-label-content.bottom-right.inner-shared-corner {
  transform: translateY(calc(var(--inner-corner-avoid-distance) * -1));
}

.grid-label-content.left-top.inner-shared-corner,
.grid-label-content.left-bottom.inner-shared-corner {
  transform: translateX(var(--inner-corner-avoid-distance));
}

.grid-label-content.right-top.inner-shared-corner,
.grid-label-content.right-bottom.inner-shared-corner {
  transform: translateX(calc(var(--inner-corner-avoid-distance) * -1));
}

.grid-label-content::before {
  position: absolute;
  z-index: 1;
  pointer-events: none;
  content: "";
  background: #1A73E8;
  width: 3px;
  height: 3px;
  border: 1px solid white;
  border-width: 0 1px 1px 0;
}

.grid-label-content.bottom-mid::before {
  transform: translateY(-1px) rotate(45deg);
  top: 100%;
}

.grid-label-content.top-mid::before {
  transform: translateY(-3px) rotate(-135deg);
  top: 0%;
}

.grid-label-content.left-mid::before {
  transform: translateX(-3px) rotate(135deg);
  left: 0%
}

.grid-label-content.right-mid::before {
  transform: translateX(3px) rotate(-45deg);
  right: 0%;
}

.grid-label-content.right-top::before {
  transform: translateX(3px) translateY(-1px) rotate(-90deg) skewY(30deg);
  right: 0%;
  top: 0%;
}

.grid-label-content.right-bottom::before {
  transform: translateX(3px) translateY(-3px) skewX(30deg);
  right: 0%;
  top: 100%;
}

.grid-label-content.bottom-right::before {
  transform:  translateX(1px) translateY(-1px) skewY(30deg);
  right: 0%;
  top: 100%;
}

.grid-label-content.bottom-left::before {
  transform:  translateX(-1px) translateY(-1px) rotate(90deg) skewX(30deg);
  left: 0%;
  top: 100%;
}

.grid-label-content.left-top::before {
  transform: translateX(-3px) translateY(-1px) rotate(180deg) skewX(30deg);
  left: 0%;
  top: 0%;
}

.grid-label-content.left-bottom::before {
  transform: translateX(-3px) translateY(-3px) rotate(90deg) skewY(30deg);
  left: 0%;
  top: 100%;
}

.grid-label-content.top-right::before {
  transform:  translateX(1px) translateY(-3px) rotate(-90deg) skewX(30deg);
  right: 0%;
  top: 0%;
}

.grid-label-content.top-left::before {
  transform:  translateX(-1px) translateY(-3px) rotate(180deg) skewY(30deg);
  left: 0%;
  top: 0%;
}

@media (forced-colors: active) {
  :root, body {
      background-color: transparent;
      forced-color-adjust: none;
  }
  .grid-label-content {
      border-color: Highlight;
      background-color: Canvas;
      color: Text;
      forced-color-adjust: none;
  }
  .grid-label-content::before {
    background-color: Canvas;
    border-color: Highlight;
  }
}`;


window.setPlatform = function(platform) {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = style;
  document.head.append(styleTag);

  document.body.classList.add('fill');

  const canvas = document.createElement('canvas');
  canvas.id = 'canvas';
  canvas.classList.add('fill');
  document.body.append(canvas);

  const gridLabels = document.createElement('div');
  gridLabels.id = 'grid-label-container';
  document.body.append(gridLabels);

  setPlatform(platform);
};

window.reset = function(data) {
  reset(data);
  doReset(data);
};
window.drawGridHighlight = drawGridHighlight;
window.dispatch = dispatch;
