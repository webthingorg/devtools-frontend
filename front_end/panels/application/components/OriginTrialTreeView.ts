// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Protocol from '../../../generated/protocol.js';
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as TreeOutline from '../../../ui/components/tree_outline/tree_outline.js';
import * as TreeOutlineUtils from '../../../ui/components/tree_outline/TreeOutlineUtils.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

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
  badgeContent: string;
  style: 'error'|'success'|'secondary';
}

class Badge extends HTMLElement {
  readonly litTagName = 'devtools-resources-origin-trial-tree-view-badge';
  private readonly shadow = this.attachShadow({mode: 'open'});

  set data(data: BadgeData) {
    this.render(data);
  }

  private render(data: BadgeData): void {
    LitHtml.render(
        LitHtml.html`
      <style>
        .badge {
          display: inline-block;
          padding: 0.25em 0.4em;
          font-size: 75%;
          font-weight: 700;
          line-height: 1;
          text-align: center;
          white-space: nowrap;
          vertical-align: baseline;
          border-radius: 0.25rem;
          color: var(--color-background);
        }

        .secondary {
          background-color: var(--color-text-secondary);
        }

        .error {
          background-color: var(--color-red);
        }

        .success {
          background-color: var(--color-accent-green);
        }
      </style>
      <span class="badge ${data.style}">
        ${data.badgeContent}
      </span>
    `,
        this.shadow);
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-resources-origin-trial-tree-view-badge', Badge);

type TreeNode<DataType> = TreeOutlineUtils.TreeNode<DataType>;

// The Origin Trial Tree has 4 levels of content:
// - Origin Trial (has multiple Origin Trial tokens)
// - Origin Trial Token (has only 1 raw token text)
// - Fields in Origin Trial Token
// - Raw Origin Trial Token text (folded because the content is long)
type OriginTrialTreeNodeData = Protocol.Page.OriginTrial|Protocol.Page.OriginTrialTokenWithStatus|string;

function constructOriginTrialTree(originTrial: Protocol.Page.OriginTrial): TreeNode<OriginTrialTreeNodeData> {
  const tokenCountBadge = new Badge();
  const statusBadge = new Badge();

  return {
    treeNodeData: originTrial,
    children: async () => originTrial.tokensWithStatus.length > 1 ?
        originTrial.tokensWithStatus.map(constructTokenNode) :
        constructTokenDetailsNodes(originTrial.tokensWithStatus[0]),
    renderer: (node: TreeNode<OriginTrialTreeNodeData>): LitHtml.TemplateResult => {
      const trial = node.treeNodeData as Protocol.Page.OriginTrial;
      tokenCountBadge.data = {badgeContent: `${trial.tokensWithStatus.length} tokens`, style: 'secondary'};
      statusBadge.data = {
        badgeContent: trial.status,
        style: trial.status === Protocol.Page.OriginTrialStatus.Enabled ? 'success' : 'error',
      };
      return LitHtml.html`
        ${trial.trialName}
        ${statusBadge}
        ${trial.tokensWithStatus.length > 1 ? tokenCountBadge : LitHtml.nothing}
      `;
    },
  };
}

function constructTokenNode(token: Protocol.Page.OriginTrialTokenWithStatus): TreeNode<OriginTrialTreeNodeData> {
  const statusBadge = new Badge();
  return {
    treeNodeData: token.status,
    children: async () => constructTokenDetailsNodes(token),
    renderer: (node: TreeNode<OriginTrialTreeNodeData>, state: {isExpanded: boolean}): LitHtml.TemplateResult => {
      const tokenStatus = node.treeNodeData as string;
      statusBadge.data = {
        badgeContent: tokenStatus,
        style: tokenStatus === Protocol.Page.OriginTrialTokenStatus.Success ? 'success' : 'error',
      };
      // Only display token status for convenience when the node is not expanded.
      return LitHtml.html`Token ${state.isExpanded ? LitHtml.nothing : statusBadge}`;
    },
  };
}

function constructTokenDetailsNodes(token: Protocol.Page.OriginTrialTokenWithStatus):
    TreeNode<OriginTrialTreeNodeData>[] {
  const statusBadge = new Badge();
  const parsedTokenDetailNode = {
    treeNodeData: token,
    renderer: (node: TreeNode<OriginTrialTreeNodeData>): LitHtml.TemplateResult => {
      const tokenWithStatus = node.treeNodeData as Protocol.Page.OriginTrialTokenWithStatus;
      const status = tokenWithStatus.status;
      statusBadge.data = {
        badgeContent: status,
        style: status === Protocol.Page.OriginTrialTokenStatus.Success ? 'success' : 'error',
      };

      const renderTokenField = (fieldValue: string, hasError?: boolean): LitHtml.TemplateResult => LitHtml.html`
        <div class="${LitHtml.Directives.ifDefined(hasError ? 'error-text' : undefined)}">
          ${fieldValue}
        </div>`;

      const parsedToken = tokenWithStatus.parsedToken;
      const parsedTokenDetails: [string, LitHtml.TemplateResult][] = parsedToken ?
          [
            [
              UIStrings.origin,
              renderTokenField(parsedToken.origin, status === Protocol.Page.OriginTrialTokenStatus.WrongOrigin),
            ],
            [
              UIStrings.expiryTime,
              renderTokenField(
                  new Date(parsedToken.expiryTime * 1000).toLocaleString(),
                  status === Protocol.Page.OriginTrialTokenStatus.Expired),
            ],
            [UIStrings.usageRestriction, renderTokenField(parsedToken.usageRestriction)],
            [UIStrings.isThirdParty, renderTokenField(parsedToken.isThirdParty.toString())],
            [UIStrings.matchSubDomains, renderTokenField(parsedToken.matchSubDomains.toString())],
          ] :
          [];

      const tokenDetails: [string, LitHtml.TemplateResult][] = [
        [UIStrings.status, LitHtml.html`${statusBadge}`],
        ...parsedTokenDetails,
      ];

      const tokenDetailRows = tokenDetails.map((kvPair: [string, LitHtml.TemplateResult]): LitHtml.TemplateResult => {
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

        .error-text {
          color: var(--color-red);
          font-weight: bold;
        }
      </style>
      <div class="content">
        ${tokenDetailRows}
      </div>
    `;
    },
  };

  return [
    parsedTokenDetailNode,
    constructRawTokenTextNode(token.rawTokenText),
  ];
}

function constructRawTokenTextNode(tokenText: string): TreeNode<OriginTrialTreeNodeData> {
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
      },
    }],
  };
}

function defaultRenderer(node: TreeNode<OriginTrialTreeNodeData>): LitHtml.TemplateResult {
  return LitHtml.html`${String(node.treeNodeData)}`;
}

interface OriginTrialTreeViewData {
  trials: Protocol.Page.OriginTrial[];
}

export class OriginTrialTreeView extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private readonly originTrialTreeComponent = new TreeOutline.TreeOutline.TreeOutline<OriginTrialTreeNodeData>();

  set data(data: OriginTrialTreeViewData) {
    this.render(data.trials);
  }

  private render(trials: Protocol.Page.OriginTrial[]): void {
    if (!trials.length) {
      return;
    }

    this.originTrialTreeComponent.data = {
      tree: trials.map(constructOriginTrialTree),
      defaultRenderer,
    };

    LitHtml.render(
        LitHtml.html`
      <style>
        :host {
          /* Disable default blue background on origin trial tree */
          --legacy-selection-bg-color: transparent;
        }
      </style>
      ${this.originTrialTreeComponent}
    `,
        this.shadow);
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-resources-origin-trial-tree-view', OriginTrialTreeView);
