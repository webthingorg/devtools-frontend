// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/*
 * This file is automatically loaded and run by Karma because it automatically
 * loads and injects all *.js files it finds.
 */
import {resetTestDOM} from '../helpers/DOMHelpers.js';

beforeEach(resetTestDOM);

/*
 * The getStylesheet helper in components reads styles out of the runtime cache.
 * In a proper build this is populated but in test runs because we don't load
 * all of DevTools it's not. Therefore we fetch all the CSS files and populate
 * the cache before any tests are run.
 *
 * The static-styles URL is prepended so within the Karma config we can proxy
 * them through to the right place, respecting Karma's ROOT_DIRECTORY setting.
 */
const CSS_RESOURCES_TO_LOAD_INTO_RUNTIME = [
  '/static-styles/ui/checkboxTextLabel.css',
  '/static-styles/ui/closeButton.css',
  '/static-styles/ui/confirmDialog.css',
  '/static-styles/ui/dialog.css',
  '/static-styles/ui/dropTarget.css',
  '/static-styles/ui/emptyWidget.css',
  '/static-styles/ui/filter.css',
  '/static-styles/ui/glassPane.css',
  '/static-styles/ui/infobar.css',
  '/static-styles/ui/inlineButton.css',
  '/static-styles/ui/inspectorCommon.css',
  '/static-styles/ui/inspectorStyle.css',
  '/static-styles/ui/inspectorSyntaxHighlight.css',
  '/static-styles/ui/inspectorSyntaxHighlightDark.css',
  '/static-styles/ui/inspectorViewTabbedPane.css',
  '/static-styles/ui/listWidget.css',
  '/static-styles/ui/popover.css',
  '/static-styles/ui/progressIndicator.css',
  '/static-styles/ui/radioButton.css',
  '/static-styles/ui/remoteDebuggingTerminatedScreen.css',
  '/static-styles/ui/reportView.css',
  '/static-styles/ui/rootView.css',
  '/static-styles/ui/searchableView.css',
  '/static-styles/ui/slider.css',
  '/static-styles/ui/smallBubble.css',
  '/static-styles/ui/segmentedButton.css',
  '/static-styles/ui/softContextMenu.css',
  '/static-styles/ui/softDropDown.css',
  '/static-styles/ui/softDropDownButton.css',
  '/static-styles/ui/splitWidget.css',
  '/static-styles/ui/toolbar.css',
  '/static-styles/ui/suggestBox.css',
  '/static-styles/ui/tabbedPane.css',
  '/static-styles/ui/targetCrashedScreen.css',
  '/static-styles/ui/textButton.css',
  '/static-styles/ui/textPrompt.css',
  '/static-styles/ui/tooltip.css',
  '/static-styles/ui/treeoutline.css',
  '/static-styles/ui/viewContainers.css',
  '/static-styles/components/imagePreview.css',
  '/static-styles/components/jsUtils.css',
  '/static-styles/persistence/editFileSystemView.css',
  '/static-styles/persistence/workspaceSettingsTab.css',
  '/static-styles/console_counters/errorWarningCounter.css',
  '/static-styles/mobile_throttling/throttlingSettingsTab.css',
  '/static-styles/emulation/deviceModeToolbar.css',
  '/static-styles/emulation/deviceModeView.css',
  '/static-styles/emulation/devicesSettingsTab.css',
  '/static-styles/emulation/inspectedPagePlaceholder.css',
  '/static-styles/emulation/locationsSettingsTab.css',
  '/static-styles/emulation/mediaQueryInspector.css',
  '/static-styles/emulation/sensors.css',
  '/static-styles/inspector_main/nodeIcon.css',
  '/static-styles/inspector_main/renderingOptions.css',
  '/static-styles/data_grid/dataGrid.css',
  '/static-styles/help/releaseNote.css',
  '/static-styles/object_ui/customPreviewComponent.css',
  '/static-styles/object_ui/objectPopover.css',
  '/static-styles/object_ui/objectPropertiesSection.css',
  '/static-styles/object_ui/objectValue.css',
  '/static-styles/console/consoleContextSelector.css',
  '/static-styles/console/consolePinPane.css',
  '/static-styles/console/consolePrompt.css',
  '/static-styles/console/consoleSidebar.css',
  '/static-styles/console/consoleView.css',
  '/static-styles/cm/codemirror.css',
  '/static-styles/text_editor/autocompleteTooltip.css',
  '/static-styles/text_editor/cmdevtools.css',
];

before(async () => {
  self.Runtime = self.Runtime || {cachedResources: {}};
  const allPromises = CSS_RESOURCES_TO_LOAD_INTO_RUNTIME.map(resourcePath => {
    return fetch(resourcePath).then(response => response.text()).then(cssText => {
      self.Runtime.cachedResources[resourcePath.replace('/static-styles/', '')] = cssText;
    });
  });
  return Promise.all(allPromises);
});

after(() => {
  // @ts-expect-error cachedResources is readonly but we want to nuke it after test runs.
  self.Runtime.cachedResources = {};
});
