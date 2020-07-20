// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {createIssueDescriptionFromMarkdown} from '../../../../front_end/issues/MarkdownDescription.js';

const {assert} = chai;

describe('createIssueDescriptionFromMarkdown', () => {
  it('only accepts Markdown where the first AST element is a heading, describing the title', () => {
    const validIssueDescription = '# Title for the issue\n\n...and some text describing the issue.';

    const description = createIssueDescriptionFromMarkdown({markdown: validIssueDescription, links: []});
    assert.strictEqual(description.title, 'Title for the issue');
  });

  it('throws and error for issue description without a heading', () => {
    const invalidIssueDescription = 'Just some text, but the heading is missing!';

    assert.throws(() => createIssueDescriptionFromMarkdown({markdown: invalidIssueDescription, links: []}));
  });
});
