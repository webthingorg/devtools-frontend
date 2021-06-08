// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Protocol from '../../../../../../front_end/generated/protocol.js';
import * as OriginTrialTreeView from '../../../../../../front_end/panels/application/components/OriginTrialTreeView.js';
import * as Coordinator from '../../../../../../front_end/ui/components/render_coordinator/render_coordinator.js';
import * as TreeOutline from '../../../../../../front_end/ui/components/tree_outline/tree_outline.js';
import {assertShadowRoot, getCleanTextContentFromElements, getElementWithinComponent, renderElementIntoDOM} from '../../../helpers/DOMHelpers.js';

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

async function renderOriginTrialTreeView(
    data: OriginTrialTreeView.OriginTrialTreeViewData,
    ): Promise<{
  component: OriginTrialTreeView.OriginTrialTreeView,
  shadowRoot: ShadowRoot,
}> {
  const component = new OriginTrialTreeView.OriginTrialTreeView();
  component.data = data;
  renderElementIntoDOM(component);
  assertShadowRoot(component.shadowRoot);
  await coordinator.done();
  return {
    component,
    shadowRoot: component.shadowRoot,
  };
}

type OriginTrialTreeOutline = TreeOutline.TreeOutline.TreeOutline<OriginTrialTreeView.OriginTrialTreeNodeData>;

/**
 * Extract `TreeOutline` component from `OriginTrialTreeView` for inspection.
 */
async function renderOriginTrialTreeViewTreeOutline(
    data: OriginTrialTreeView.OriginTrialTreeViewData,
    ): Promise<{
  component: OriginTrialTreeOutline,
  shadowRoot: ShadowRoot,
}> {
  const {component} = await renderOriginTrialTreeView(data);
  const treeOutline: OriginTrialTreeOutline =
      getElementWithinComponent<OriginTrialTreeView.OriginTrialTreeView, OriginTrialTreeOutline>(
          component, 'devtools-tree-outline', TreeOutline.TreeOutline.TreeOutline);
  assertShadowRoot(treeOutline.shadowRoot);
  return {
    component: treeOutline,
    shadowRoot: treeOutline.shadowRoot,
  };
}

describe('OriginTrialTreeView', () => {
  it('renders trial names as root tree nodes',
     async () => {

     });

  it('renders token with status when there are more than 1 tokens',
     async () => {

     });

  it('skips token with status when there is only 1 token',
     async () => {

     });

  it('renders token details',
     async () => {

     });

  it('renders raw token text',
     async () => {

     });

  it('shows token count when there are more than 1 tokens in a trial',
     async () => {

     });

  it('shows trial status',
     async () => {

     });

  it('shows token status, when token with status node not expanded',
     async () => {

     });
});
