// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
  * @typedef {{
    *     backgroundColor: string,
    *     id: number,
    *     name: string,
    *     width: number,
    *     height: number,
    *     x: number,
    *     y: number,
    *     children: !Array<Dom3d.ElementWithStyles>
    * }}
    */
Dom3d.ElementWithStyles;

/**
    * @typedef {{
    *     name: string,
    *     children: !Array<Dom3d.DomNameTreeElement>,
    *     parent: ?Dom3d.DomNameTreeElement
    * }}
    */
Dom3d.DomNameTreeElement;

/**
    * @typedef {{
    *     width: number,
    *     height: number,
    *     x: number,
    *     y: number,
    *     scale: number,
    * }}
    */
Dom3d.ScreenshotClip;

/**
    * @typedef {{
    *     viewportX: number,
    *     viewportY: number,
    *     viewportScale: number,
    *     contentWidth: number,
    *     contentHeight: number,
    * }}
    */
Dom3d.ScreenMetrics;

/**
    * @typedef {{
    *     metrics: !Dom3d.ScreenMetrics,
    *     clip: !Dom3d.ScreenshotClip,
    * }}
    */
Dom3d.MetricsAndClip;

// https://chromedevtools.github.io/devtools-protocol/tot/DOMSnapshot/
/**
    * @typedef {{
    *     domNodes: ?Array<*>,
    *     layoutTreeNodes: ?Array<*>,
    *     computedStyles: ?Array<*>,
    * }}
    */
Dom3d.DOMSnapshot;

Dom3d.ColorSchemeTypes = {
  Purple: 'purple',
  Blue: 'blue',
  Screen: 'screen',
  Background: 'bg',
  Gradient: 'gradient'
};

Dom3d.CameraGUIPanningButtons = {
  Top: 'top',
  Down: 'down',
  Right: 'right',
  Left: 'left'
};
