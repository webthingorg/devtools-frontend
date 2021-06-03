// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../../../ui/lit-html/lit-html.js';
import * as Protocol from '../../../generated/protocol.js';
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as TreeOutline from '../../../ui/components/tree_outline/tree_outline.js';
import * as TreeOutlineUtils from '../../../ui/components/tree_outline/TreeOutlineUtils.js';

const UIStrings = {
  /**
  *@description Text for the origin of something
  */
  origin: 'Origin',
  /**
   *@description Label for `expiryTime` field in a parsed Origin Trial Token.
   */
  expiryTime: 'Expiry Time',
  /**
   *@description Label for `usageRestriction` field in a parsed Origin Trial Token.
   */
  usageRestriction: 'Usage Restriction',
  /**
   *@description Label for `isThirdParty` field in a parsed Origin Trial Token.
   */
  isThirdParty: 'Third Party',
  /**
   *@description Label for `matchSubDomains` field in a parsed Origin Trial Token.
   */
  matchSubDomains: 'Match Sub-Domains',
  /**
   *@description Label for `rawTokenText` field in an Origin Trial Token.
   */
  rawTokenText: 'Raw Token Text',
  /**
   *@description Label for `status` field in an Origin Trial Token.
   */
  status: 'Status',
};

interface BadgeData {
  badgeContent : string;
}

class Badge extends HTMLElement {
  private readonly shadow = this.attachShadow({ mode: 'open' });
  private computeStyle: (status: string) => LitHtml.TemplateResult;
  constructor(computeStyle : (status: string) => LitHtml.TemplateResult) {
    super();
    this.computeStyle = computeStyle;
  }

  set data(data: BadgeData) {
    this.render(data.badgeContent);
  }

  private render(badgeContent: string) : void {
    const style = this.computeStyle(badgeContent);
    LitHtml.render(LitHtml.html`
      ${style}
      <span class="badge">
        ${badgeContent}
      </span>
    `, this.shadow);
  }

  static defaultStyle = LitHtml.html`
    <style>
      .badge {
        display: inline-block;
        padding: .25em .4em;
        font-size: 75%;
        font-weight: 700;
        line-height: 1;
        text-align: center;
        white-space: nowrap;
        vertical-align: baseline;
        border-radius: .25rem;
      }
    </style>
  `;

  static successStyle = LitHtml.html`
    <style>
      .badge {
        color: #fff;
        background-color: #28a745;
      }
    </style>
    ${Badge.defaultStyle}
  `;

  static failureStyle = LitHtml.html`
    <style>
      .badge {
        color: #fff;
        background-color: #dc3545;
      }
    </style>
    ${Badge.defaultStyle}
  `;

  static secondaryStyle = LitHtml.html`
    <style>
      .badge {
        color: #fff;
        background-color: #6c757d;
      }
    </style>
    ${Badge.defaultStyle}
  `;
}

ComponentHelpers.CustomElements.defineComponent(
  'devtools-resources-origin-trial-tree-view-badge', Badge);

type TreeNode<DataType> = TreeOutlineUtils.TreeNode<DataType>;

// The Origin Trial Tree has 4 levels of content:
// - Origin Trial (has multiple Origin Trial tokens)
// - Origin Trial Token (has only 1 raw token text)
// - Fields in Origin Trial Token
// - Raw Origin Trial Token text (folded because the content is long)
type OriginTrialTreeNodeData =
  Protocol.Page.OriginTrial | Protocol.Page.OriginTrialTokenWithStatus | [string, string][] | string;

function constructOriginTrialTree(originTrial: Protocol.Page.OriginTrial): TreeNode<OriginTrialTreeNodeData> {
  const tokenCountBadge = new Badge((): LitHtml.TemplateResult =>
    Badge.secondaryStyle
  );
  const statusBadge = new Badge((status: string) : LitHtml.TemplateResult =>
    status == Protocol.Page.OriginTrialStatus.Enabled ?
      Badge.successStyle : Badge.failureStyle
  );

  return {
    treeNodeData: originTrial,
    children: async () => originTrial.tokensWithStatus.length > 1 ?
      originTrial.tokensWithStatus.map(constructTokenNode) :
      constructTokenDetailsNodes(originTrial.tokensWithStatus[0]),
    renderer: (node: TreeNode<OriginTrialTreeNodeData>): LitHtml.TemplateResult => {
      const trial = node.treeNodeData as Protocol.Page.OriginTrial;
      tokenCountBadge.data = { badgeContent: `${trial.tokensWithStatus.length} tokens` };
      statusBadge.data = { badgeContent: trial.status };
      return LitHtml.html`
        ${trial.trialName}
        ${statusBadge}
        ${trial.tokensWithStatus.length ? tokenCountBadge : LitHtml.nothing}
      `;
    }
  };
}

function constructTokenNode(token: Protocol.Page.OriginTrialTokenWithStatus): TreeNode<OriginTrialTreeNodeData> {
  const statusBadge = new Badge((status: string): LitHtml.TemplateResult =>
    status == Protocol.Page.OriginTrialTokenStatus.Success ?
      Badge.successStyle : Badge.failureStyle
  );

  return {
    treeNodeData: token,
    children: async () => constructTokenDetailsNodes(token),
    renderer: (
      node: TreeNode<OriginTrialTreeNodeData>,
      state: { isExpanded: boolean }
    ): LitHtml.TemplateResult => {
      const tokenWithStatus = node.treeNodeData as Protocol.Page.OriginTrialTokenWithStatus;
      statusBadge.data = { badgeContent: tokenWithStatus.status };
      // Only display token status for convenience when the node is not expanded.
      return LitHtml.html`Token ${state.isExpanded ? LitHtml.nothing : statusBadge}`;
    }
  };
}

function constructTokenDetailsNodes(token: Protocol.Page.OriginTrialTokenWithStatus): TreeNode<OriginTrialTreeNodeData>[] {
  const parsedToken = token.parsedToken;
  const parsedTokenDetails = parsedToken ? [
    <[string, string]>[UIStrings.origin, parsedToken.origin],
    <[string, string]>[UIStrings.expiryTime, new Date(parsedToken.expiryTime * 1000).toLocaleString()],
    <[string, string]>[UIStrings.usageRestriction, parsedToken.usageRestriction],
    <[string, string]>[UIStrings.isThirdParty, parsedToken.isThirdParty.toString()],
    <[string, string]>[UIStrings.matchSubDomains, parsedToken.matchSubDomains.toString()],
  ] : [];

  const parsedTokenDetailNode = {
    treeNodeData: [
      <[string, string]>[UIStrings.status, token.status],
      ...parsedTokenDetails
    ],
    renderer: tokenDetailsRenderer
  };

  return [
    parsedTokenDetailNode,
    constructRawTokenTextNode(token.rawTokenText)
  ];
}

function constructRawTokenTextNode(tokenText: string) : TreeNode<OriginTrialTreeNodeData> {
  return {
    treeNodeData: UIStrings.rawTokenText,
    children: async () => [{
      treeNodeData: tokenText,
      renderer: (data: TreeNode<OriginTrialTreeNodeData>): LitHtml.TemplateResult => {
        const tokenText = data.treeNodeData as string;
        return LitHtml.html`
        <div style="overflow-wrap: break-word;">
          ${tokenText}
        </div>
        `;
      }
    }],
  };
}

function defaultRenderer(node: TreeNode<OriginTrialTreeNodeData>): LitHtml.TemplateResult {
  return LitHtml.html`${String(node.treeNodeData)}`;
}

function tokenDetailsRenderer(node: TreeNode<OriginTrialTreeNodeData>): LitHtml.TemplateResult {
  const tokenDetails = node.treeNodeData as [string, string][];
  const tokenDetailRows = tokenDetails.map(kvPair => {
    const [fieldName, fieldValue] = kvPair;
    return LitHtml.html`
      <div class="key">${fieldName}</div>
      <div class="value">${fieldValue}</div>
      `;
  });

  return LitHtml.html`
    <style>
      .content {
        display: grid;
        grid-template-columns: min-content 1fr;
      }

      .key {
        color: var(--color-text-secondary);
        padding: 0 6px;
        text-align: right;
        white-space: pre;
      }

      .value {
        color: var(--color-text-primary);
        margin-inline-start: 0;
        padding: 0 6px;
      }
    </style>
    <div class="content">
      ${tokenDetailRows}
    </div>
  `;
}

export class OriginTrialTreeView extends HTMLElement {
  private readonly shadow = this.attachShadow({mode : 'open'});
  private readonly originTrialTreeComponent =
    new TreeOutline.TreeOutline.TreeOutline<OriginTrialTreeNodeData>();

  set data(trials: Protocol.Page.OriginTrial[]) {
    this.render(trials);
  }

  private async render(trials: Protocol.Page.OriginTrial[]): Promise<void> {
    if (!trials.length) {
      return;
    }

    this.originTrialTreeComponent.data = {
      tree: trials.map(constructOriginTrialTree),
      defaultRenderer,
    };

    LitHtml.render(LitHtml.html`
      <style>
        :host {
          /* Disable default blue background on origin trial tree */
          --legacy-selection-bg-color: transparent;
        }
      </style>
      ${this.originTrialTreeComponent}
    `, this.shadow);
  }
}

ComponentHelpers.CustomElements.defineComponent(
  'devtools-resources-origin-trial-tree-view', OriginTrialTreeView);