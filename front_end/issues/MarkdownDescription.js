// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Marked from '../marked/marked.js';
import * as SDK from '../sdk/sdk.js';
import {createMarkdownView} from './MarkdownView_bridge.js';
/**
 * @param {!SDK.Issue.MarkdownIssueDescription} description
 * @return {!SDK.Issue.IssueDescription}
 */
export function createIssueDescriptionFromMarkdown(description) {
  const markdownAst = Marked.Marked.lexer(description.markdown);
  const title = findTitleFromMarkdownAst(markdownAst);
  if (!title) {
    throw new Error('Markdown issue descriptions must start with a heading');
  }
  const markdownComponent = createMarkdownView();
  markdownComponent.data = {tokens: markdownAst.slice(1)};
  return {
    title,
    message: () => markdownComponent,
    issueKind: SDK.Issue.IssueKind.BreakingChange,
    links: description.links
  };
}
/**
 * @param {!Array<*>} markdownAst
 * @return {?string}
 */
function findTitleFromMarkdownAst(markdownAst) {
  if (markdownAst.length === 0 || markdownAst[0].type !== 'heading' || markdownAst[0].depth !== 1) {
    return null;
  }
  return markdownAst[0].text;
}
// # sourceMappingURL=MarkdownDescription.js.map
