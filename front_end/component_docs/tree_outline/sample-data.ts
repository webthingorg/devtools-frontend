// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Components from '../../ui/components/components.js';
export const officesAndProductsData: Components.TreeOutlineUtils.TreeNode<string>[] = [
  {
    treeNodeData: 'Offices',
    children: () => Promise.resolve([
      {
        key: 'Europe',
        children: () => Promise.resolve([
          {
            key: 'UK',
            children: () => Promise.resolve([
              {
                key: 'LON',
                children: () => Promise.resolve([{key: '6PS'}, {key: 'CSG'}, {key: 'BEL'}]),
              },
            ]),
          },
          {
            key: 'Germany',
            children: () => Promise.resolve([
              {key: 'MUC'},
              {key: 'BER'},
            ]),
          },
        ]),
      },
    ]),
  },
  {
    treeNodeData: 'Products',
    children: () => Promise.resolve([
      {
        key: 'Chrome',
      },
      {
        key: 'YouTube',
      },
      {
        key: 'Drive',
      },
      {
        key: 'Calendar',
      },
    ]),
  },
];
