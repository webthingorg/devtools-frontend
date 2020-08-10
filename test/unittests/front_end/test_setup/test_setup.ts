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
 * The out/Release/gen/front_end URL is prepended so within the Karma config we can proxy
 * them through to the right place, respecting Karma's ROOT_DIRECTORY setting.
 */
const CSS_RESOURCES_TO_LOAD_INTO_RUNTIME = [
  '/base/out/Release/gen/front_end/ui/checkboxTextLabel.css',
  '/base/out/Release/gen/front_end/ui/closeButton.css',
  '/base/out/Release/gen/front_end/ui/confirmDialog.css',
  '/base/out/Release/gen/front_end/ui/dialog.css',
  '/base/out/Release/gen/front_end/ui/dropTarget.css',
  '/base/out/Release/gen/front_end/ui/emptyWidget.css',
  '/base/out/Release/gen/front_end/ui/filter.css',
  '/base/out/Release/gen/front_end/ui/glassPane.css',
  '/base/out/Release/gen/front_end/ui/infobar.css',
  '/base/out/Release/gen/front_end/ui/inlineButton.css',
  '/base/out/Release/gen/front_end/ui/inspectorCommon.css',
  '/base/out/Release/gen/front_end/ui/inspectorStyle.css',
  '/base/out/Release/gen/front_end/ui/inspectorSyntaxHighlight.css',
  '/base/out/Release/gen/front_end/ui/inspectorSyntaxHighlightDark.css',
  '/base/out/Release/gen/front_end/ui/inspectorViewTabbedPane.css',
  '/base/out/Release/gen/front_end/ui/listWidget.css',
  '/base/out/Release/gen/front_end/ui/popover.css',
  '/base/out/Release/gen/front_end/ui/progressIndicator.css',
  '/base/out/Release/gen/front_end/ui/radioButton.css',
  '/base/out/Release/gen/front_end/ui/remoteDebuggingTerminatedScreen.css',
  '/base/out/Release/gen/front_end/ui/reportView.css',
  '/base/out/Release/gen/front_end/ui/rootView.css',
  '/base/out/Release/gen/front_end/ui/searchableView.css',
  '/base/out/Release/gen/front_end/ui/slider.css',
  '/base/out/Release/gen/front_end/ui/smallBubble.css',
  '/base/out/Release/gen/front_end/ui/segmentedButton.css',
  '/base/out/Release/gen/front_end/ui/softContextMenu.css',
  '/base/out/Release/gen/front_end/ui/softDropDown.css',
  '/base/out/Release/gen/front_end/ui/softDropDownButton.css',
  '/base/out/Release/gen/front_end/ui/splitWidget.css',
  '/base/out/Release/gen/front_end/ui/toolbar.css',
  '/base/out/Release/gen/front_end/ui/suggestBox.css',
  '/base/out/Release/gen/front_end/ui/tabbedPane.css',
  '/base/out/Release/gen/front_end/ui/targetCrashedScreen.css',
  '/base/out/Release/gen/front_end/ui/textButton.css',
  '/base/out/Release/gen/front_end/ui/textPrompt.css',
  '/base/out/Release/gen/front_end/ui/tooltip.css',
  '/base/out/Release/gen/front_end/ui/treeoutline.css',
  '/base/out/Release/gen/front_end/ui/viewContainers.css',
  '/base/out/Release/gen/front_end/components/imagePreview.css',
  '/base/out/Release/gen/front_end/components/jsUtils.css',
  '/base/out/Release/gen/front_end/persistence/editFileSystemView.css',
  '/base/out/Release/gen/front_end/persistence/workspaceSettingsTab.css',
  '/base/out/Release/gen/front_end/console_counters/errorWarningCounter.css',
  '/base/out/Release/gen/front_end/mobile_throttling/throttlingSettingsTab.css',
  '/base/out/Release/gen/front_end/emulation/deviceModeToolbar.css',
  '/base/out/Release/gen/front_end/emulation/deviceModeView.css',
  '/base/out/Release/gen/front_end/emulation/devicesSettingsTab.css',
  '/base/out/Release/gen/front_end/emulation/inspectedPagePlaceholder.css',
  '/base/out/Release/gen/front_end/emulation/locationsSettingsTab.css',
  '/base/out/Release/gen/front_end/emulation/mediaQueryInspector.css',
  '/base/out/Release/gen/front_end/emulation/sensors.css',
  '/base/out/Release/gen/front_end/inspector_main/nodeIcon.css',
  '/base/out/Release/gen/front_end/inspector_main/renderingOptions.css',
  '/base/out/Release/gen/front_end/data_grid/dataGrid.css',
  '/base/out/Release/gen/front_end/help/releaseNote.css',
  '/base/out/Release/gen/front_end/object_ui/customPreviewComponent.css',
  '/base/out/Release/gen/front_end/object_ui/objectPopover.css',
  '/base/out/Release/gen/front_end/object_ui/objectPropertiesSection.css',
  '/base/out/Release/gen/front_end/object_ui/objectValue.css',
  '/base/out/Release/gen/front_end/console/consoleContextSelector.css',
  '/base/out/Release/gen/front_end/console/consolePinPane.css',
  '/base/out/Release/gen/front_end/console/consolePrompt.css',
  '/base/out/Release/gen/front_end/console/consoleSidebar.css',
  '/base/out/Release/gen/front_end/console/consoleView.css',
  '/base/out/Release/gen/front_end/cm/codemirror.css',
  '/base/out/Release/gen/front_end/text_editor/autocompleteTooltip.css',
  '/base/out/Release/gen/front_end/text_editor/cmdevtools.css',
];

before(async function() {
  this.timeout(10000);
  self.Runtime = self.Runtime || {cachedResources: {}};
  const allPromises = CSS_RESOURCES_TO_LOAD_INTO_RUNTIME.map(resourcePath => {
    return fetch(resourcePath).then(response => response.text()).then(cssText => {
      self.Runtime.cachedResources[resourcePath.replace('/base/out/Release/gen/front_end/', '')] = cssText;
    });
  });
  return Promise.all(allPromises);
});

after(() => {
  // @ts-expect-error cachedResources is readonly but we want to nuke it after test runs.
  self.Runtime.cachedResources = {};
});
