// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Marked from '../marked/marked.js';
import * as SDK from '../sdk/sdk.js';

import {createMarkdownView} from './MarkdownView_bridge.js';

/**
 * @typedef {{
 *             file: string,
 *             issueKind: !SDK.Issue.IssueKind,
 *             links: !Array<!{link: string, linkTitle: string}>
 *          }}
 */
// @ts-ignore typedef
let MarkdownIssueDescription;  // eslint-disable-line no-unused-vars

/** @type {!Map<string, !MarkdownIssueDescription>} */
const markdownDescriptions = new Map([]);

/**
 * Returns an `SDK.Issue.IssueDescription` for a given Issue code.
 *
 * Prefer this method over `Issue#getDescription` and only use
 * `Issue#getDescription as a fall-back should this method return null.
 *
 *  @param {string} issueCode
 * @return {?SDK.Issue.IssueDescription}
 */
export function getDescription(issueCode) {
  const maybeMarkdownDescription = markdownDescriptions.get(issueCode);
  if (maybeMarkdownDescription) {
    return createIssueDescriptionFromMarkdown(maybeMarkdownDescription);
  }

  return null;
}

/**
 * @param {!MarkdownIssueDescription} description
 * @return {!SDK.Issue.IssueDescription}
 */
function createIssueDescriptionFromMarkdown(description) {
  const rawMarkdown = markdownFile(description.file);
  return createIssueDescriptionFromRawMarkdown(rawMarkdown, description);
}

/**
 * @param {string} filename
 * @return {string}
 */
function markdownFile(filename) {
  const rawMarkdown = self.Runtime.cachedResources[filename];
  if (!rawMarkdown) {
    throw new Error(`Markdown file ${filename} not found. Declare it as a resource in the module.json file`);
  }
  return rawMarkdown;
}

/**
 * @param {string} markdown
 * @param {!MarkdownIssueDescription} description
 * @return {!SDK.Issue.IssueDescription}
 *
 * This function is exported separately for unit testing.
 */
export function createIssueDescriptionFromRawMarkdown(markdown, description) {
  const markdownAst = Marked.Marked.lexer(markdown);
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
