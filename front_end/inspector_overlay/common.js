// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// @ts-nocheck
// TODO(crbug.com/1011811): Enable TypeScript compiler checks

/** @typedef {!{minX: number, maxX: number, minY: number, maxY: number, width?: number, height?: number}} */
export let Bounds;  // eslint-disable-line no-unused-vars

/** @typedef {!{name: String, bounds: Bounds}} */
export let AreaBounds;  // eslint-disable-line no-unused-vars

export class Overlay {
  constructor(window) {
    this.viewportSize = {width: 800, height: 600};
    this.deviceScaleFactor = 1;
    this.emulationScaleFactor = 1;
    this.pageScaleFactor = 1;
    this.pageZoomFactor = 1;
    this.scrollX = 0;
    this.scrollY = 0;
    this.window = window;
    this.document = window.document;
  }

  setCanvas(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
  }

  reset(resetData) {
    if (resetData) {
      this.viewportSize = resetData.viewportSize;
      this.deviceScaleFactor = resetData.deviceScaleFactor;
      this.pageScaleFactor = resetData.pageScaleFactor;
      this.pageZoomFactor = resetData.pageZoomFactor;
      this.emulationScaleFactor = resetData.emulationScaleFactor;
      this.window.scrollX = this.scrollX = Math.round(resetData.scrollX);
      this.window.scrollY = this.scrollY = Math.round(resetData.scrollY);
    }
    this.resetCanvas();
  }

  resetCanvas() {
    if (!this.canvas) {
      return;
    }

    this.canvas.width = this.deviceScaleFactor * this.viewportSize.width;
    this.canvas.height = this.deviceScaleFactor * this.viewportSize.height;
    this.canvas.style.width = this.viewportSize.width + 'px';
    this.canvas.style.height = this.viewportSize.height + 'px';

    this.context.scale(this.deviceScaleFactor, this.deviceScaleFactor);

    this.canvasWidth = this.viewportSize.width;
    this.canvasHeight = this.viewportSize.height;
  }

  setPlatform(platform) {
    this.platform = platform;
    this.document.body.classList.add('platform-' + platform);
  }

  dispatch(message) {
    const functionName = message.shift();
    this[functionName].apply(this, message);
  }

  eventHasCtrlOrMeta(event) {
    return this.window.platform === 'mac' ? (event.metaKey && !event.ctrlKey) : (event.ctrlKey && !event.metaKey);
  }
}

Element.prototype.createChild = function(tagName, className) {
  const element = createElement(tagName, className);
  element.addEventListener('click', function(e) {
    e.stopPropagation();
  }, false);
  this.appendChild(element);
  return element;
};

Element.prototype.createTextChild = function(text) {
  const element = document.createTextNode(text);
  this.appendChild(element);
  return element;
};

Element.prototype.removeChildren = function() {
  if (this.firstChild) {
    this.textContent = '';
  }
};

export function createElement(tagName, className) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  return element;
}

String.prototype.trimEnd = function(maxLength) {
  if (this.length <= maxLength) {
    return String(this);
  }
  return this.substr(0, maxLength - 1) + '\u2026';
};

/**
 * @param {number} num
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
Number.constrain = function(num, min, max) {
  if (num < min) {
    num = min;
  } else if (num > max) {
    num = max;
  }
  return num;
};
