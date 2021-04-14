// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as IssuesManager from '../models/issues_manager/issues_manager.js';
import * as Marked from '../third_party/marked/marked.js';

export interface IssueDescription {
  title: string;
  // TODO(crbug.com/1108699): Fix types when they are available.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  markdown: any[];
  links: {link: string, linkTitle: string}[];
}

export async function createIssueDescriptionFromMarkdown(description: IssuesManager.Issue.MarkdownIssueDescription):
    Promise<IssueDescription> {
  let resolve = (_: IssueDescription): void => {};
  function reqListener(this: XMLHttpRequest): void {
    const rawMarkdownWithPlaceholdersReplaced = substitutePlaceholders(this.responseText, description.substitutions);
    const desc = createIssueDescriptionFromRawMarkdown(rawMarkdownWithPlaceholdersReplaced, description);
    resolve(desc);
  }
  const promise = new Promise<IssueDescription>(r => {
    resolve = r;
  });
  const oReq = new XMLHttpRequest();
  oReq.addEventListener('load', reqListener);
  const url = new URL(`${description.file}`, import.meta.url);
  oReq.open('GET', url.toString());
  oReq.send();

  return promise;
}

/**
 * This function is exported separately for unit testing.
 */
export function createIssueDescriptionFromRawMarkdown(
    markdown: string, description: IssuesManager.Issue.MarkdownIssueDescription): IssueDescription {
  const markdownAst = Marked.Marked.lexer(markdown);
  const title = findTitleFromMarkdownAst(markdownAst);
  if (!title) {
    throw new Error('Markdown issue descriptions must start with a heading');
  }

  return {
    title,
    markdown: markdownAst.slice(1),
    links: description.links,
  };
}

const validPlaceholderMatchPattern = /\{(PLACEHOLDER_[a-zA-Z][a-zA-Z0-9]*)\}/g;
const validPlaceholderNamePattern = /PLACEHOLDER_[a-zA-Z][a-zA-Z0-9]*/;

/**
 * Replaces placeholders in markdown text with a string provided by the
 * `substitutions` map. To keep mental overhead to a minimum, the same
 * syntax is used as for l10n placeholders. Please note that the
 * placeholders require a mandatory 'PLACEHOLDER_' prefix.
 *
 * Example:
 *   const str = "This is markdown with `code` and two placeholders, namely {PLACEHOLDER_PH1} and {PLACEHOLDER_PH2}".
 *   const result = substitePlaceholders(str, new Map([['PLACEHOLDER_PH1', 'foo'], ['PLACEHOLDER_PH2', 'bar']]));
 *
 * Exported only for unit testing.
 */
export function substitutePlaceholders(markdown: string, substitutions?: Map<string, string>): string {
  const unusedPlaceholders = new Set(substitutions ? substitutions.keys() : []);
  validatePlaceholders(unusedPlaceholders);

  const result = markdown.replace(validPlaceholderMatchPattern, (_, placeholder) => {
    const replacement = substitutions ? substitutions.get(placeholder) : undefined;
    if (!replacement) {
      throw new Error(`No replacment provided for placeholder '${placeholder}'.`);
    }
    unusedPlaceholders.delete(placeholder);
    return replacement;
  });

  if (unusedPlaceholders.size > 0) {
    throw new Error(`Unused replacements provided: ${[...unusedPlaceholders]}`);
  }

  return result;
}

// Ensure that all provided placeholders match the naming pattern.
function validatePlaceholders(placeholders: Set<string>): void {
  const invalidPlaceholders = [...placeholders].filter(placeholder => !validPlaceholderNamePattern.test(placeholder));
  if (invalidPlaceholders.length > 0) {
    throw new Error(`Invalid placeholders provided in the substitutions map: ${invalidPlaceholders}`);
  }
}

// TODO(crbug.com/1108699): Fix types when they are available.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findTitleFromMarkdownAst(markdownAst: any[]): string|null {
  if (markdownAst.length === 0 || markdownAst[0].type !== 'heading' || markdownAst[0].depth !== 1) {
    return null;
  }
  return markdownAst[0].text;
}
