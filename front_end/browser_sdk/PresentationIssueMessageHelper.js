// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Bindings from '../bindings/bindings.js';  // eslint-disable-line no-unused-vars
import * as SDK from '../sdk/sdk.js';
import * as Marked from '../third_party/marked/marked.js';
import * as Workspace from '../workspace/workspace.js';

import {findTitleFromMarkdownAst, getMarkdownFileContent} from './MarkdownHelpers.js';


export class PresentationIssueMessageHelper {
  /**
   * @param {!SDK.IssuesModel.IssuesModel} issuesModel
   */
  constructor(issuesModel) {
    this._issuesModel = issuesModel;

    /** @type {!Array.<!PresentationIssueMessage>} */
    this._presentationIssueMessages = [];

    this._locationPool = new Bindings.LiveLocation.LiveLocationPool();
  }

  /**
   * @param {!SDK.Issue.Issue} issue
   */
  issueAdded(issue) {
    const debuggerModel = this._issuesModel.target().model(SDK.DebuggerModel.DebuggerModel);
    if (issue instanceof SDK.ContentSecurityPolicyIssue.ContentSecurityPolicyIssue) {
      const srcLocation = issue.details().sourceCodeLocation;
      if (srcLocation && debuggerModel) {
        const rawLocation =
            debuggerModel.createRawLocationByURL(srcLocation.url, srcLocation.lineNumber, srcLocation.columnNumber);
        if (rawLocation) {
          this._addConsoleMessageToScript(issue, rawLocation);
        }
      }
    }
  }

  /**
   * @param {!SDK.Issue.MarkdownIssueDescription} description
   * @return {?string}
   */
  _createIssueDescriptionFromMarkdown(description) {
    const rawMarkdown = getMarkdownFileContent(description.file);
    const markdownAst = Marked.Marked.lexer(rawMarkdown);
    return findTitleFromMarkdownAst(markdownAst);
  }

  /**
   * @param {!SDK.Issue.Issue} issue
   * @param {!SDK.DebuggerModel.Location} rawLocation
   */
  _addConsoleMessageToScript(issue, rawLocation) {
    const description = issue.getDescription();
    if (description && 'file' in description) {
      // TODO(crbug.com/1011811): Remove casts once closure is gone. TypeScript can infer the type variant.
      const title =
          this._createIssueDescriptionFromMarkdown(/** @type {SDK.Issue.MarkdownIssueDescription} */ (description));
      if (title) {
        this._presentationIssueMessages.push(new PresentationIssueMessage(title, rawLocation, this._locationPool));
      }
    }
  }

  debuggerReset() {
    for (const message of this._presentationIssueMessages) {
      message.dispose();
    }
    this._presentationIssueMessages = [];
    this._locationPool.disposeAll();
  }
}

/**
 * @unrestricted
 */
export class PresentationIssueMessage {
  /**
   * @param {string} title
   * @param {!SDK.DebuggerModel.Location} rawLocation
   * @param {!Bindings.LiveLocation.LiveLocationPool} locationPool
   */
  constructor(title, rawLocation, locationPool) {
    this._text = title;
    this._level = Workspace.UISourceCode.Message.Level.Issue;
    Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().createLiveLocation(
        rawLocation, this._updateLocation.bind(this), locationPool);
  }

  /**
   * @param {!Bindings.LiveLocation.LiveLocation} liveLocation
   */
  async _updateLocation(liveLocation) {
    if (this._uiMessage) {
      this._uiMessage.remove();
    }
    const uiLocation = await liveLocation.uiLocation();
    if (!uiLocation) {
      return;
    }
    this._uiMessage =
        uiLocation.uiSourceCode.addLineMessage(this._level, this._text, uiLocation.lineNumber, uiLocation.columnNumber);
  }

  dispose() {
    if (this._uiMessage) {
      this._uiMessage.remove();
    }
  }
}
