// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Rule to check license headers
 * @author Tim van der Lippe
 */
'use strict';

const path = require('path');

const FRONT_END_FOLDER = path.join(__filename, '..', '..', '..', '..', 'front_end');

const CURRENT_YEAR = new Date().getFullYear();
const LINE_LICENSE_HEADER = [
  `Copyright ${CURRENT_YEAR} The Chromium Authors. All rights reserved.`,
  'Use of this source code is governed by a BSD-style license that can be',
  'found in the LICENSE file.',
];

const BLOCK_LICENSE_HEADER = [
  'Copyright \\(C\\) \\d{4} Google Inc. All rights reserved.',
  '',
  'Redistribution and use in source and binary forms, with or without',
  'modification, are permitted provided that the following conditions are',
  'met:',
  '',
  '    \\* Redistributions of source code must retain the above copyright',
  'notice, this list of conditions and the following disclaimer.',
  '    \\* Redistributions in binary form must reproduce the above',
  'copyright notice, this list of conditions and the following disclaimer',
  'in the documentation and/or other materials provided with the',
  'distribution.',
  '    \\* Neither the name of Google Inc. nor the names of its',
  'contributors may be used to endorse or promote products derived from',
  'this software without specific prior written permission.',
  '',
  'THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS',
  '"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT',
  'LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR',
  'A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT',
  'OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,',
  'SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES \\(INCLUDING, BUT NOT',
  'LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,',
  'DATA, OR PROFITS; OR BUSINESS INTERRUPTION\\) HOWEVER CAUSED AND ON ANY',
  'THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT',
  '\\(INCLUDING NEGLIGENCE OR OTHERWISE\\) ARISING IN ANY WAY OUT OF THE USE',
  'OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.',
];

const LINE_REGEXES =
    LINE_LICENSE_HEADER.map(line => new RegExp('[ ]?' + line.replace(CURRENT_YEAR, '(\\(c\\) )?\\d{4}')));
const BLOCK_REGEX = new RegExp('[\\s\\\\n\\*]*' + BLOCK_LICENSE_HEADER.join('[\\s\\\\n\\*]*'), 'm');

const LICENSE_HEADER_ADDITION = LINE_LICENSE_HEADER.map(line => `// ${line}`).join('\n') + '\n\n';

const EXCLUDED_FILES = [
  // FIXME: Dagre bundles must be moved to third_party
  'dagre_layout/dagre.js',
  // FIXME: Diff bundles must be moved to third_party
  'diff/diff_match_patch.js',
];

const OTHER_LICENSE_HEADERS = [
  // Apple
  'bindings/ResourceUtils.ts',
  'common/Color.js',
  'common/Object.js',
  'common/ResourceType.js',
  'data_grid/DataGrid.js',
  'dom_extension/DOMExtension.js',
  'elements/MetricsSidebarPane.js',
  'profiler/CPUProfileView.ts',
  'profiler/ProfilesPanel.ts',
  'resources/ApplicationCacheItemsView.ts',
  'resources/ApplicationCacheModel.ts',
  'resources/DatabaseModel.ts',
  'resources/DatabaseQueryView.ts',
  'resources/DatabaseTableView.ts',
  'sdk/Resource.js',
  'sdk/Script.js',
  'source_frame/FontView.ts',
  'source_frame/ImageView.ts',
  'sources/CallStackSidebarPane.js',
  'ui/Panel.js',
  'ui/Treeoutline.js',
  // Brian Grinstead
  'color_picker/Spectrum.ts',
  // Joseph Pecoraro
  'console/ConsolePanel.ts',
  // Research In Motion Limited
  'network/ResourceWebSocketFrameView.js',
  // 280 North Inc.
  'profiler/BottomUpProfileDataGrid.ts',
  'profiler/ProfileDataGrid.ts',
  'profiler/TopDownProfileDataGrid.ts',
  // IBM Corp
  'sources/WatchExpressionsSidebarPane.js',
  // Multiple authors
  'components/JSPresentationUtils.js',
  'console/ConsoleView.ts',
  'console/ConsoleViewMessage.ts',
  'cookie_table/CookiesTable.ts',
  'elements/ComputedStyleWidget.js',
  'elements/ElementsPanel.js',
  'elements/ElementsTreeElement.js',
  'elements/ElementsTreeOutline.js',
  'elements/EventListenersWidget.js',
  'elements/PropertiesWidget.js',
  'elements/StylesSidebarPane.js',
  'main/MainImpl.js',
  'network/HARWriter.ts',
  'network/NetworkDataGridNode.ts',
  'network/NetworkLogView.ts',
  'network/NetworkPanel.ts',
  'network/NetworkTimeCalculator.ts',
  'network/RequestHeadersView.ts',
  'object_ui/ObjectPropertiesSection.ts',
  'perf_ui/TimelineGrid.ts',
  'platform/utilities.ts',
  'platform/UIString.ts',
  'resources/ApplicationPanelSidebar.ts',
  'resources/CookieItemsView.ts',
  'resources/DOMStorageItemsView.ts',
  'resources/DOMStorageModel.ts',
  'sdk/DOMModel.js',
  'source_frame/ResourceSourceFrame.ts',
  'sources/ScopeChainSidebarPane.js',
  'sources/SourcesPanel.js',
  'theme_support/theme_support_impl.js',
  'timeline/TimelinePanel.js',
  'timeline/TimelineUIUtils.js',
  'ui/KeyboardShortcut.js',
  'ui/SearchableView.js',
  'ui/TextPrompt.js',
  'ui/UIUtils.js',
  'ui/Widget.js',
];

// ------------------------------------------------------------------------------
// Rule Definition
// ------------------------------------------------------------------------------

/**
 * Check each linecomment that should (combined) result in the LINE_LICENSE_HEADER.
 */
function isMissingLineCommentLicense(comments) {
  for (let i = 0; i < LINE_REGEXES.length; i++) {
    if (!comments[i] || !LINE_REGEXES[i].test(comments[i].value)) {
      return true;
    }
  }

  return false;
}

/**
 * We match the whole block comment, including potential leading asterisks of the jsdoc.
 */
function isMissingBlockLineCommentLicense(licenseText) {
  return !BLOCK_REGEX.test(licenseText);
}

module.exports = {
  meta: {
    type: 'problem',

    docs: {
      description: 'check license headers',
      category: 'Possible Errors',
    },
    fixable: 'code',
    schema: []  // no options
  },
  create: function(context) {
    const fileName = context.getFilename();
    // Fix windows paths for exemptions
    const relativePath = path.relative(FRONT_END_FOLDER, fileName).replace(/\\/g, '/');

    if (relativePath.startsWith('third_party') || fileName.endsWith('TestRunner.js') ||
        EXCLUDED_FILES.includes(relativePath) || OTHER_LICENSE_HEADERS.includes(relativePath)) {
      return {};
    }

    return {
      Program(node) {
        if (node.body.length === 0) {
          return;
        }

        const comments = context.getSourceCode().getCommentsBefore(node.body[0]);

        if (!comments || comments.length === 0) {
          context.report({
            node,
            message: 'Missing license header',
            fix(fixer) {
              return fixer.insertTextBefore(node, LICENSE_HEADER_ADDITION);
            },
          });
        } else if (comments[0].type === 'Line') {
          if (isMissingLineCommentLicense(comments)) {
            context.report({
              node,
              message: 'Incorrect line license header',
              fix(fixer) {
                return fixer.insertTextBefore(comments[0], LICENSE_HEADER_ADDITION);
              }
            });
          }
        } else {
          if (isMissingBlockLineCommentLicense(comments[0].value)) {
            context.report({
              node,
              message: 'Incorrect block license header',
              fix(fixer) {
                return fixer.insertTextBefore(comments[0], LICENSE_HEADER_ADDITION);
              }
            });
          }
        }
      }
    };
  }
};
