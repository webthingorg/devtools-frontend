// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as FrontendHelpers from '../../../test/unittests/front_end/helpers/EnvironmentHelpers.js';
import * as ComponentHelpers from '../../component_helpers/component_helpers.js';
import * as LitHtml from '../../third_party/lit-html/lit-html.js';
import * as Components from '../../ui/components/components.js';

await ComponentHelpers.ComponentServerSetup.setup();
await FrontendHelpers.initializeGlobalVars();

interface TreeNodeData {
  cssProperty: string;
  cssValue: string;
}

function renderer(node: Components.TreeOutlineUtils.TreeNode<TreeNodeData>, state: {isExpanded: boolean}) {
  const {cssProperty, cssValue} = node.key;
  const valueStyles = LitHtml.Directives.styleMap({
    paddingLeft: '10px',
    fontStyle: 'italic',
    color: 'var(--color-syntax-1)',
  });
  return LitHtml.html`<code>${cssProperty}</code>:${
      state.isExpanded ? LitHtml.nothing : LitHtml.html`<code style=${valueStyles}>${cssValue}</code>`}`;
}

const data: Components.TreeOutline.TreeOutlineData<TreeNodeData> = {
  tree: [
    {
      key: {cssProperty: 'border', cssValue: '1px solid red'},
      renderer,
    },
    {
      key: {cssProperty: 'font-size', cssValue: '20px'},
      renderer,
    },
    {
      key: {cssProperty: 'margin', cssValue: '10px 5px'},
      async children() {
        return Promise.resolve<Components.TreeOutlineUtils.TreeNode<TreeNodeData>[]>([
          {key: {cssProperty: 'margin-left', cssValue: '5px'}, renderer},
          {key: {cssProperty: 'margin-right', cssValue: '5px'}, renderer},
          {key: {cssProperty: 'margin-top', cssValue: '10px'}, renderer},
          {key: {cssProperty: 'margin-bottom', cssValue: '10px'}, renderer},
        ]);
      },
      renderer,
    },
  ],
};

const component = new Components.TreeOutline.TreeOutline<TreeNodeData>();
component.data = data;

document.getElementById('container')?.appendChild(component);
document.getElementById('recursively-expand')?.addEventListener('click', () => {
  component.expandRecursively();
});
