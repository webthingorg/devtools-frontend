// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as FrontendHelpers from '../../../test/unittests/front_end/helpers/EnvironmentHelpers.js';
import * as ComponentHelpers from '../../component_helpers/component_helpers.js';
import * as Issues from '../../issues/issues.js';
import * as Marked from '../../third_party/marked/marked.js';

await ComponentHelpers.ComponentServerSetup.setup();
await FrontendHelpers.initializeGlobalVars();

// Register an image in the markdown image map.
Issues.MarkdownImagesMap.markdownImages.set('test-image', {
  src: 'Images/lighthouse_logo.svg',
  width: '200px',
  height: '200px',
  isIcon: false,
});

const component = new Issues.MarkdownView.MarkdownView();
document.getElementById('container')?.appendChild(component);

const markdownAst = Marked.Marked.lexer(`
Paragraph

* List item 1
* List item 2
* \`code\`

![Image](test-image)
`);

component.data = {
  tokens: markdownAst,
};
