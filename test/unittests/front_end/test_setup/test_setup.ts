// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import {resetTestDOM} from '../helpers/DOMHelpers.js';

beforeEach(resetTestDOM);

const CSS_RESOURCES_TO_LOAD_INTO_RUNTIME = [
  'ui/checkboxTextLabel.css',
  'ui/closeButton.css',
  'ui/confirmDialog.css',
  'ui/dialog.css',
  'ui/dropTarget.css',
  'ui/emptyWidget.css',
  'ui/filter.css',
  'ui/glassPane.css',
  'ui/infobar.css',
  'ui/inlineButton.css',
  'ui/inspectorCommon.css',
  'ui/inspectorStyle.css',
  'ui/inspectorSyntaxHighlight.css',
  'ui/inspectorSyntaxHighlightDark.css',
  'ui/inspectorViewTabbedPane.css',
  'ui/listWidget.css',
  'ui/popover.css',
  'ui/progressIndicator.css',
  'ui/radioButton.css',
  'ui/remoteDebuggingTerminatedScreen.css',
  'ui/reportView.css',
  'ui/rootView.css',
  'ui/searchableView.css',
  'ui/slider.css',
  'ui/smallBubble.css',
  'ui/segmentedButton.css',
  'ui/softContextMenu.css',
  'ui/softDropDown.css',
  'ui/softDropDownButton.css',
  'ui/splitWidget.css',
  'ui/toolbar.css',
  'ui/suggestBox.css',
  'ui/tabbedPane.css',
  'ui/targetCrashedScreen.css',
  'ui/textButton.css',
  'ui/textPrompt.css',
  'ui/tooltip.css',
  'ui/treeoutline.css',
  'ui/viewContainers.css',
  'components/imagePreview.css',
  'components/jsUtils.css',
  'persistence/editFileSystemView.css',
  'persistence/workspaceSettingsTab.css',
  'console_counters/errorWarningCounter.css',
  'mobile_throttling/throttlingSettingsTab.css',
  'emulation/deviceModeToolbar.css',
  'emulation/deviceModeView.css',
  'emulation/devicesSettingsTab.css',
  'emulation/inspectedPagePlaceholder.css',
  'emulation/locationsSettingsTab.css',
  'emulation/mediaQueryInspector.css',
  'emulation/sensors.css',
  'inspector_main/nodeIcon.css',
  'inspector_main/renderingOptions.css',
  'data_grid/dataGrid.css',
  'help/releaseNote.css',
  'object_ui/customPreviewComponent.css',
  'object_ui/objectPopover.css',
  'object_ui/objectPropertiesSection.css',
  'object_ui/objectValue.css',
  'console/consoleContextSelector.css',
  'console/consolePinPane.css',
  'console/consolePrompt.css',
  'console/consoleSidebar.css',
  'console/consoleView.css',
  'cm/codemirror.css',
  'text_editor/autocompleteTooltip.css',
  'text_editor/cmdevtools.css',
];

before(async () => {
  self.Runtime = self.Runtime || {cachedResources: {}};
  const allPromises = CSS_RESOURCES_TO_LOAD_INTO_RUNTIME.map(resourcePath => {
    return fetch(`/base/out/Default/gen/front_end/${resourcePath}`).then(response => response.text()).then(cssText => {
      self.Runtime.cachedResources[resourcePath] = cssText;
    });
  });
  return Promise.all(allPromises);
});

after(
    () => {
        // delete self.Runtime;
    });
