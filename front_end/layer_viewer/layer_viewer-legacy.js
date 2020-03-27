// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LayerViewerModule from './layer_viewer.js';

self.LayerViewer = self.LayerViewer || {};
LayerViewer = LayerViewer || {};

/**
 * @constructor
 */
LayerViewer.LayerTreeElement = LayerViewerModule.LayerTreeOutline.LayerTreeElement;

LayerViewer.LayerTreeElement._symbol = LayerViewerModule.LayerTreeOutline.layerSymbol;

/**
 * @constructor
 */
LayerViewer.Layers3DView = LayerViewerModule.Layers3DView.Layers3DView;

/**
 * @enum {string}
 */
LayerViewer.Layers3DView.OutlineType = LayerViewerModule.Layers3DView.OutlineType;
