// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Protocol from '../../../../../../front_end/generated/protocol.js';
import * as OriginTrialTreeView from '../../../../../../front_end/panels/application/components/OriginTrialTreeView.js';
import * as Coordinator from '../../../../../../front_end/ui/components/render_coordinator/render_coordinator.js';
import * as TreeOutline from '../../../../../../front_end/ui/components/tree_outline/tree_outline.js';
import {assertShadowRoot, getCleanTextContentFromElements, getElementsWithinComponent, getElementWithinComponent, renderElementIntoDOM, stripLitHtmlCommentNodes} from '../../../helpers/DOMHelpers.js';

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

const {assert} = chai;

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

function getAllBadges(tree: OriginTrialTreeOutline): OriginTrialTreeView.BadgeData[] {
  return [
    ...getElementsWithinComponent(tree, 'devtools-resources-origin-trial-tree-view-badge', OriginTrialTreeView.Badge),
  ].map(badge => {
    assertShadowRoot(badge.shadowRoot);
    return badge.data;
  });
}


const tokenPlaceHolder = 'Origin Trial Token Placeholder';
const trialWithMultipleTokens: Protocol.Page.OriginTrial = {
  trialName: 'AppCache',
  status: Protocol.Page.OriginTrialStatus.Enabled,
  tokensWithStatus: [
    {
      status: Protocol.Page.OriginTrialTokenStatus.Success,
      rawTokenText: tokenPlaceHolder,
      parsedToken: {
        trialName: 'AppCache',
        origin: 'https://foo.com',
        expiryTime: 1000,
        usageRestriction: Protocol.Page.OriginTrialUsageRestriction.None,
        isThirdParty: false,
        matchSubDomains: false,
      },
    },
    {
      status: Protocol.Page.OriginTrialTokenStatus.Expired,
      rawTokenText: tokenPlaceHolder,
      parsedToken: {
        trialName: 'AppCache',
        origin: 'https://foo.com',
        expiryTime: 1000,
        usageRestriction: Protocol.Page.OriginTrialUsageRestriction.None,
        isThirdParty: false,
        matchSubDomains: false,
      },
    },
    {
      status: Protocol.Page.OriginTrialTokenStatus.WrongOrigin,
      rawTokenText: tokenPlaceHolder,
      parsedToken: {
        trialName: 'AppCache',
        origin: 'https://bar.com',
        expiryTime: 1000,
        usageRestriction: Protocol.Page.OriginTrialUsageRestriction.None,
        isThirdParty: false,
        matchSubDomains: false,
      },
    },
  ],
};

const trialWithSingleToken: Protocol.Page.OriginTrial = {
  trialName: 'AutoPictureInPicture',
  status: Protocol.Page.OriginTrialStatus.ValidTokenNotProvided,
  tokensWithStatus: [
    {
      status: Protocol.Page.OriginTrialTokenStatus.NotSupported,
      rawTokenText: tokenPlaceHolder,
      parsedToken: {
        trialName: 'AutoPictureInPicture',
        origin: 'https://foo.com',
        expiryTime: 1000,
        usageRestriction: Protocol.Page.OriginTrialUsageRestriction.None,
        isThirdParty: false,
        matchSubDomains: false,
      },
    },
  ],
};

const trialWithUnparsableToken: Protocol.Page.OriginTrial = {
  trialName: 'UNKNOWN',
  status: Protocol.Page.OriginTrialStatus.ValidTokenNotProvided,
  tokensWithStatus: [
    {
      status: Protocol.Page.OriginTrialTokenStatus.InvalidSignature,
      rawTokenText: tokenPlaceHolder,
    },
  ],
};

function nodeKeyInnerHTML(node: HTMLLIElement) {
  const keyNode = node.querySelector('[data-node-key]');
  if (!keyNode) {
    throw new Error('Found tree node without a key within it.');
  }
  return stripLitHtmlCommentNodes(keyNode.innerHTML);
}

interface VisibleTreeNodeFromDOM {
  renderedKey: string;
  children?: VisibleTreeNodeFromDOM[];
}

/**
 * Converts the nodes into a tree structure that we can assert against.
 */
function visibleNodesToTree(shadowRoot: ShadowRoot): VisibleTreeNodeFromDOM[] {
  const tree: VisibleTreeNodeFromDOM[] = [];

  function buildTreeNode(node: HTMLLIElement): VisibleTreeNodeFromDOM {
    const item: VisibleTreeNodeFromDOM = {
      renderedKey: nodeKeyInnerHTML(node),
    };

    if (node.getAttribute('aria-expanded') && node.getAttribute('aria-expanded') === 'true') {
      item.children = [];
      const childNodes = node.querySelectorAll<HTMLLIElement>(':scope > ul[role="group"]>li');
      for (const child of childNodes) {
        item.children.push(buildTreeNode(child));
      }
    }

    return item;
  }
  const rootNodes = shadowRoot.querySelectorAll<HTMLLIElement>('ul[role="tree"]>li');
  for (const root of rootNodes) {
    tree.push(buildTreeNode(root));
  }
  return tree;
}

/**
 * Wait for a certain number of children are rendered. We need this as the
 * component uses LitHtml's until directive, which is async and not within the
 * render coordinator's control.
 */
async function waitForRenderedTreeNodeCount(shadowRoot: ShadowRoot, expectedNodeCount: number): Promise<void> {
  const actualNodeCount = shadowRoot.querySelectorAll('li[role="treeitem"]').length;
  if (actualNodeCount === expectedNodeCount) {
    return;
  }

  await new Promise<void>(resolve => {
    requestAnimationFrame(async () => {
      await waitForRenderedTreeNodeCount(shadowRoot, expectedNodeCount);
      resolve();
    });
  });
}

describe('OriginTrialTreeView', () => {
  it('renders trial names as root tree nodes', async () => {
    const {shadowRoot} = await renderOriginTrialTreeViewTreeOutline({
      trials: [
        trialWithMultipleTokens,
        trialWithSingleToken,
        trialWithUnparsableToken,
      ],
    });
    const visibleItems = shadowRoot.querySelectorAll<HTMLLIElement>('li[role="treeitem"]');
    assert.lengthOf(visibleItems, 3);
    assert.include(nodeKeyInnerHTML(visibleItems[0]), trialWithMultipleTokens.trialName);
    assert.include(nodeKeyInnerHTML(visibleItems[1]), trialWithSingleToken.trialName);
    assert.include(nodeKeyInnerHTML(visibleItems[2]), trialWithUnparsableToken.trialName);
  });

  it('renders token with status when there are more than 1 tokens', async () => {
    const {component, shadowRoot} = await renderOriginTrialTreeViewTreeOutline({
      trials: [
        trialWithMultipleTokens,  // Node counts by level: 1/3/6/3
      ],
    });

    await component.expandRecursively(/* maxDepth= */ 0);
    await waitForRenderedTreeNodeCount(shadowRoot, 4);
    const visibleTree = visibleNodesToTree(shadowRoot);

    // When there are more than 1 tokens in a trial, second level nodes
    // should show token status.
    const tokenWithStatusNodes = visibleTree[0].children;
    assert.isDefined(tokenWithStatusNodes);
    if (tokenWithStatusNodes) {
      assert.lengthOf(tokenWithStatusNodes, 3);
      for (let i = 0; i < tokenWithStatusNodes.length; i++) {
        assert.include(tokenWithStatusNodes[i].renderedKey, trialWithMultipleTokens.tokensWithStatus[i].status);
      }
    }
  });

  it('skips token with status when there is only 1 token', async () => {
    const {component, shadowRoot} = await renderOriginTrialTreeViewTreeOutline({
      trials: [
        trialWithSingleToken,  // Node counts by level: 1/2/1
      ],
    });
    await component.expandRecursively(/* maxDepth= */ 1);
    await waitForRenderedTreeNodeCount(shadowRoot, 3);
    const visibleTree = visibleNodesToTree(shadowRoot);

    // When there is only 1 token, token with status level should be skipped.
    const tokenDetailNodes = visibleTree[0].children;
    assert.isDefined(tokenDetailNodes);
    if (tokenDetailNodes) {
      assert.lengthOf(tokenDetailNodes, 2);
    }
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

  it('shows trial status', async () => {
    const {shadowRoot, component} = await renderOriginTrialTreeViewTreeOutline({
      trials: [
        trialWithMultipleTokens,
        trialWithSingleToken,
        trialWithUnparsableToken,
      ],
    });
    const visibleItems = shadowRoot.querySelectorAll<HTMLLIElement>('li[role="treeitem"]');
    assert.lengthOf(visibleItems, 3);
    const badges = getAllBadges(component);
    assert.deepEqual(badges[0], {
      badgeContent: trialWithMultipleTokens.status,
      style: 'success',
    });
    assert.deepEqual(badges[1], {
      badgeContent: trialWithSingleToken.status,
      style: 'error',
    });
    assert.deepEqual(badges[2], {
      badgeContent: trialWithUnparsableToken.status,
      style: 'error',
    });
  });

  it('shows token status, when token with status node not expanded',
     async () => {

     });
});
