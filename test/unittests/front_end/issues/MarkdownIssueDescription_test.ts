// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {createIssueDescriptionFromRawMarkdown, substitutePlaceholders} from '../../../../front_end/issues/MarkdownIssueDescription.js';
import {IssueKind} from '../../../../front_end/sdk/Issue.js';

const {assert} = chai;

describe('createIssueDescriptionFromMarkdown', () => {
  const emptyMarkdownDescription = {
    file: '<unused>',
    substitutions: undefined,
    issueKind: IssueKind.BreakingChange,
    links: [],
  };

  it('only accepts Markdown where the first AST element is a heading, describing the title', () => {
    const validIssueDescription = '# Title for the issue\n\n...and some text describing the issue.';

    const description = createIssueDescriptionFromRawMarkdown(validIssueDescription, emptyMarkdownDescription);
    assert.strictEqual(description.title, 'Title for the issue');
  });

  it('throws an error for issue description without a heading', () => {
    const invalidIssueDescription = 'Just some text, but the heading is missing!';

    assert.throws(() => createIssueDescriptionFromRawMarkdown(invalidIssueDescription, emptyMarkdownDescription));
  });
});

describe('substitutePlaceholders', () => {
  it('returns the input as-is, with no placeholders present in the input', () => {
    const str = 'Example string with no placeholders';

    assert.strictEqual(substitutePlaceholders(str), str);
  });

  it('subsitutes a single placeholder', () => {
    const str = 'Example string with a single {placeholder}';

    const actual = substitutePlaceholders(str, new Map<string, string>([['placeholder', 'fooholder']]));
    assert.strictEqual(actual, 'Example string with a single fooholder');
  });

  it('substitutes multiple placeholders', () => {
    const str = 'Example string with two placeholders, \'{ph1}\' and \'{ph2}\'.';

    const actual = substitutePlaceholders(str, new Map<string, string>([['ph1', 'foo'], ['ph2', 'bar']]));
    assert.strictEqual(actual, 'Example string with two placeholders, \'foo\' and \'bar\'.');
  });

  it('ignores placeholder syntax when the map doesn\'t contain a replacement', () => {
    const str = 'Example string where {placeholder} syntax is part of the text.';

    assert.strictEqual(substitutePlaceholders(str), str);
  });
});
