// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Bindings from '../bindings/bindings.js';  // eslint-disable-line no-unused-vars
import * as Common from '../common/common.js';
import * as SDK from '../sdk/sdk.js';
import * as Marked from '../third_party/marked/marked.js';
import * as Workspace from '../workspace/workspace.js';

import * as IssuesManager from './IssuesManager.js';
import {findTitleFromMarkdownAst, getMarkdownFileContent} from './MarkdownHelpers.js';


export class SourceFrameIssuesManager {
  private issuesManager: IssuesManager.IssuesManager;
  private locationPool = new Bindings.LiveLocation.LiveLocationPool();
  private issueMessages = new Array<IssueMessage>();

  constructor(issuesManager: IssuesManager.IssuesManager) {
    this.issuesManager = issuesManager;

    this.issuesManager.addEventListener(IssuesManager.Events.IssueAdded, this.onIssueAdded, this);
    this.issuesManager.addEventListener(IssuesManager.Events.FullUpdateRequired, this.onFullUpdateRequired, this);
  }

  private onIssueAdded(event: Common.EventTarget.EventTargetEvent) {
    const {issuesModel, issue} =
        /** @type {!{issuesModel: !SDK.IssuesModel.IssuesModel, issue: !SDK.Issue.Issue}} */ (event.data);
    this.addIssue(issue, issuesModel);
  }

  private addIssue(issue: SDK.Issue.Issue, issuesModel: SDK.IssuesModel.IssuesModel) {
    if (!this.isTrustedTypeIssue(issue) ||
        !(issue instanceof SDK.ContentSecurityPolicyIssue.ContentSecurityPolicyIssue)) {
      return;
    }
    const debuggerModel = issuesModel.target().model(SDK.DebuggerModel.DebuggerModel);
    const srcLocation = issue.details().sourceCodeLocation;
    if (srcLocation && debuggerModel) {
      const rawLocation =
          debuggerModel.createRawLocationByURL(srcLocation.url, srcLocation.lineNumber, srcLocation.columnNumber);
      if (rawLocation) {
        this.addIssueMessageToScript(issue, rawLocation);
      }
    }
  }

  private onFullUpdateRequired() {
    this.resetMessages();
    const issues = this.issuesManager.issues();
    for (const issue of issues) {
      if (this.isTrustedTypeIssue(issue) &&
          (issue instanceof SDK.ContentSecurityPolicyIssue.ContentSecurityPolicyIssue)) {
        this.addIssue(issue, issue.model());
      }
    }
  }

  private createIssueDescriptionFromMarkdown(description: SDK.Issue.MarkdownIssueDescription): string|null {
    const rawMarkdown = getMarkdownFileContent(description.file);
    const markdownAst = Marked.Marked.lexer(rawMarkdown);
    return findTitleFromMarkdownAst(markdownAst);
  }

  private addIssueMessageToScript(issue: SDK.Issue.Issue, rawLocation: SDK.DebuggerModel.Location) {
    const description = issue.getDescription();
    if (description && 'file' in description) {
      const title = this.createIssueDescriptionFromMarkdown(description);
      if (title) {
        const clickHandler = () => {
          console.error('Line click handler');
          Common.Revealer.reveal(issue);
        };
        this.issueMessages.push(new IssueMessage(title, rawLocation, this.locationPool, clickHandler));
      }
    }
  }

  private isTrustedTypeIssue(issue: SDK.Issue.Issue) {
    return issue.code() === SDK.ContentSecurityPolicyIssue.trustedTypesSinkViolationCode ||
        issue.code() === SDK.ContentSecurityPolicyIssue.trustedTypesPolicyViolationCode;
  }

  private resetMessages() {
    for (const message of this.issueMessages) {
      message.dispose();
    }
    this.issueMessages = [];
    this.locationPool.disposeAll();
  }

  // This method is to enable unit testing
  getIssueMessages(): Array<IssueMessage> {
    return this.issueMessages;
  }
}

export class IssueMessage {
  private text: string;
  private level: string;
  private uiMessage?: Workspace.UISourceCode.Message;
  private clickHandler: (() => void);

  constructor(
      title: string, rawLocation: SDK.DebuggerModel.Location, locationPool: Bindings.LiveLocation.LiveLocationPool,
      clickHandler: () => void) {
    this.text = title;
    this.level = Workspace.UISourceCode.Message.Level.Issue;
    this.uiMessage = undefined;
    this.clickHandler = clickHandler;
    Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().createLiveLocation(
        rawLocation, this.updateLocation.bind(this), locationPool);
  }

  private async updateLocation(liveLocation: Bindings.LiveLocation.LiveLocation) {
    if (this.uiMessage) {
      this.uiMessage.remove();
    }
    const uiLocation = await liveLocation.uiLocation();
    if (!uiLocation) {
      return;
    }
    this.uiMessage = uiLocation.uiSourceCode.addLineMessage(
        this.level, this.text, uiLocation.lineNumber, uiLocation.columnNumber, this.clickHandler);
  }

  dispose() {
    this.uiMessage?.remove();
  }

  getText(): string {
    return this.text;
  }

  getLevel(): string {
    return this.level;
  }
}
