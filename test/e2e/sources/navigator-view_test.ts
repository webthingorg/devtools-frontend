// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {getBrowserAndPages, waitFor, waitForNone} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {openFileWithQuickOpen} from '../helpers/quick_open-helpers.js';
import {
  clickOnContextMenu,
  getSelectedNavigatorTabTitle,
  openFileInSourcesPanel,
  openSnippetsSubPane,
  openSourceCodeEditorForFile,
  openSourcesPanel,
  toggleNavigatorSidebar,
} from '../helpers/sources-helpers.js';

describe('The Sources panel', async () => {
  describe('contains a Navigator view', () => {
    describe('with a Page tab', () => {
      it('which offers a context menu option "Search in folder" for folders', async () => {
        await openSourceCodeEditorForFile('index.html', 'navigation/index.html');

        await clickOnContextMenu('[aria-label="test/e2e/resources/sources/navigation, nw-folder"]', 'Search in folder');
        const element = await waitFor('[aria-label="Search Query"]');
        const value = await element.evaluate(input => (input as HTMLInputElement).value);

        assert.strictEqual(value, 'file:test/e2e/resources/sources/navigation');
      });

      it('which reveals the correct file when using the "Reveal in sidebar" context menu option', async () => {
        // Navigate without opening a file, switch to 'Snippets' view.
        await openFileInSourcesPanel('navigation/index.html');
        await openSnippetsSubPane();
        // Open file via the command menu.
        await openFileWithQuickOpen('index.html');
        // Manually reveal the file in the sidebar.
        await clickOnContextMenu('.tabbed-pane-header-tab-title[title$="index.html"]', 'Reveal in sidebar');
        // Wait for the file to be selected in the 'Page' tree.
        await waitFor('[aria-label="index.html, file"][aria-selected="true"]');
      });
    });

    it('which does not automatically switch to the Page tab when opening a document', async () => {
      // Navigate without opening a file, switch to 'Snippets' view.
      await openFileInSourcesPanel('navigation/index.html');
      await openSnippetsSubPane();
      // Open file via the command menu.
      await openFileWithQuickOpen('index.html');
      // Check that we're still in 'Snippets' view.
      assert.strictEqual(await getSelectedNavigatorTabTitle(), 'Snippets');
    });

    it('which can be toggled via Ctrl+Shift+Y shortcut keyboard shortcut', async () => {
      const {frontend} = getBrowserAndPages();
      await openSourcesPanel();
      // Make sure that the navigator sidebar is not collapsed in initial state
      await waitFor('.navigator-tabbed-pane');
      // Collapse navigator sidebar
      await toggleNavigatorSidebar(frontend);
      await waitForNone('.navigator-tabbed-pane');
      // Expand navigator sidebar
      await toggleNavigatorSidebar(frontend);
      await waitFor('.navigator-tabbed-pane');
    });
  });
});
