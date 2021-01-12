// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {ls} from '../../../../front_end/platform/platform.js';
import * as QuickOpen from '../../../../front_end/quick_open/quick_open.js';
import * as UI from '../../../../front_end/ui/ui.js';
import {describeWithEnvironment} from '../helpers/EnvironmentHelpers.js';

const {assert} = chai;
class MockView extends UI.Widget.Widget implements UI.View.ViewLocationResolver {
  resolveLocation(_location: string) {
    return UI.ViewManager.ViewManager.instance().createStackLocation();
  }
}
const viewId = 'mockView';
const viewTitle = ls`Mock`;
const commandPrompt = 'Show Mock';
const order = 10;
describeWithEnvironment('View registration', () => {
  before(() => {
    UI.ViewManager.registerViewExtension({
      location: UI.ViewManager.ViewLocationValues.PANEL,
      id: viewId,
      commandPrompt: commandPrompt,
      title: viewTitle,
      order,
      persistence: UI.ViewManager.ViewPersistence.PERMANENT,
      hasToolbar: false,
      async loadView() {
        return new MockView();
      },
    });
    // The location resolver needs to be registered to add the command to show a view
    // from the command menu.
    UI.ViewManager.registerLocationResolver({
      name: UI.ViewManager.ViewLocationValues.PANEL,
      category: UI.ViewManager.ViewLocationCategoryValues.PANEL,
      async loadResolver() {
        return new MockView();
      },
    });
  });

  it('Retrieves a registered view', async () => {
    const preRegisteredView = UI.ViewManager.ViewManager.instance().view(viewId) as UI.ViewManager.PreRegisteredView;
    const mockWidget = await preRegisteredView.widget();
    assert.instanceOf(mockWidget, MockView, 'View did not load correctly');
    assert.strictEqual(preRegisteredView.title(), viewTitle, 'View title is not returned correctly');
    assert.strictEqual(preRegisteredView.commandPrompt(), commandPrompt, 'Command for view is not returned correctly');
  });

  it('Adds command for showing a pre registered view', () => {
    const allCommands = QuickOpen.CommandMenu.CommandMenu.instance({forceNew: true}).commands();
    const filteredCommands = allCommands.filter(
        command => command.title() === commandPrompt &&
            command.category() === UI.ViewManager.ViewLocationCategoryValues.PANEL);
    assert.strictEqual(filteredCommands.length, 1, 'Command for showing a preregistered view was not added correctly');
  });

  it('Throws an error trying to register a duplicated view id', () => {
    assert.throws(() => {
      UI.ViewManager.registerViewExtension({
        id: viewId,
        commandPrompt: commandPrompt,
        title: viewTitle,
        async loadView() {
          return new MockView();
        },
      });
    });
  });
});
