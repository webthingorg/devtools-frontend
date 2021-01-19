// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../sdk/sdk.js';

export interface AXNode {
  id: string;
  role: string|null;
  name: string|null;
  ignored: boolean;
  parent: AXNode|null;
  children: AXNode[];
  numChildren: number;
  hasOnlyUnloadedChildren: boolean;
}

export function SDKNodeToAXNode(parent: AXNode|null, sdkNode: SDK.AccessibilityModel.AccessibilityNode): AXNode {
  const axChildren: AXNode[] = [];
  const axNode = {
    id: sdkNode._id,  // getter in other branch
    role: sdkNode.role()?.value,
    name: sdkNode.name()?.value,
    ignored: sdkNode.ignored(),
    parent: parent,
    children: axChildren,
    numChildren: sdkNode.numChildren(),
    hasOnlyUnloadedChildren: sdkNode.hasOnlyUnloadedChildren(),
  };

  for (const child of sdkNode.children()) {
    axNode.children.push(SDKNodeToAXNode(axNode, child));
  }

  return axNode;
}
