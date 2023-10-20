// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as LoggingConfig from './LoggingConfig.js';
import * as LoggingDriver from './LoggingDriver.js';
import * as LoggingState from './LoggingState.js';

const {startLogging, stopLogging} = LoggingDriver;
const {registerContextProvider, registerParentProvider} = LoggingState;

const accessibilityComputedProperties =
    LoggingConfig.makeConfigStringBuilder.bind(null, 'AccessibilityComputedProperties');
const accessibilityPane = LoggingConfig.makeConfigStringBuilder.bind(null, 'AccessibilityPane');
const accessibilitySourceOrder = LoggingConfig.makeConfigStringBuilder.bind(null, 'AccessibilitySourceOrder');
const addColor = LoggingConfig.makeConfigStringBuilder.bind(null, 'addColor');
const addElementClassPrompt = LoggingConfig.makeConfigStringBuilder.bind(null, 'AddElementClassPrompt');
const addStylesRule = LoggingConfig.makeConfigStringBuilder.bind(null, 'AddStylesRule');
const ariaAttributes = LoggingConfig.makeConfigStringBuilder.bind(null, 'AriaAttributes');
const bezierCurveEditor = LoggingConfig.makeConfigStringBuilder.bind(null, 'bezierCurveEditor');
const bezierEditor = LoggingConfig.makeConfigStringBuilder.bind(null, 'bezierEditor');
const bezierPresetCategory = LoggingConfig.makeConfigStringBuilder.bind(null, 'bezierPresetCategory');
const bezierPreview = LoggingConfig.makeConfigStringBuilder.bind(null, 'bezierPreview');
const colorCanvas = LoggingConfig.makeConfigStringBuilder.bind(null, 'colorCanvas');
const colorEyeDropper = LoggingConfig.makeConfigStringBuilder.bind(null, 'colorEyeDropper');
const colorPicker = LoggingConfig.makeConfigStringBuilder.bind(null, 'colorPicker');
const copyColor = LoggingConfig.makeConfigStringBuilder.bind(null, 'copyColor');
const cssAngleEditor = LoggingConfig.makeConfigStringBuilder.bind(null, 'cssAngleEditor');
const cssFlexboxEditor = LoggingConfig.makeConfigStringBuilder.bind(null, 'cssFlexboxEditor');
const cssGridEditor = LoggingConfig.makeConfigStringBuilder.bind(null, 'cssGridEditor');
const cssLayersPane = LoggingConfig.makeConfigStringBuilder.bind(null, 'CssLayersPane');
const cssShadowEditor = LoggingConfig.makeConfigStringBuilder.bind(null, 'cssShadowEditor');
const domBreakpoint = LoggingConfig.makeConfigStringBuilder.bind(null, 'DOMBreakpoint');
const domBreakpointsPane = LoggingConfig.makeConfigStringBuilder.bind(null, 'DOMBreakpointsPane');
const dropDownButton = LoggingConfig.makeConfigStringBuilder.bind(null, 'DropDownButton');
const elementClassesPane = LoggingConfig.makeConfigStringBuilder.bind(null, 'ElementClassesPane');
const elementPropertiesPane = LoggingConfig.makeConfigStringBuilder.bind(null, 'ElementPropertiesPane');
const elementStatesPane = LoggingConfig.makeConfigStringBuilder.bind(null, 'ElementStatesPan');
const eventListenersPane = LoggingConfig.makeConfigStringBuilder.bind(null, 'EventListenersPane');
const filterDropdown = LoggingConfig.makeConfigStringBuilder.bind(null, 'FilterDropdown');
const filterTextField = LoggingConfig.makeConfigStringBuilder.bind(null, 'FilterTextField');
const hexValue = LoggingConfig.makeConfigStringBuilder.bind(null, 'hexValue');
const jumpToSource = LoggingConfig.makeConfigStringBuilder.bind(null, 'JumpToSource');
const link = LoggingConfig.makeConfigStringBuilder.bind(null, 'link');
const metricsBox = LoggingConfig.makeConfigStringBuilder.bind(null, 'MetricsBox');
const next = LoggingConfig.makeConfigStringBuilder.bind(null, 'next');
const option = LoggingConfig.makeConfigStringBuilder.bind(null, 'option');
const paletteColorShades = LoggingConfig.makeConfigStringBuilder.bind(null, 'paletteColorShades');
const palettePanel = LoggingConfig.makeConfigStringBuilder.bind(null, 'palettePanel');
const previous = LoggingConfig.makeConfigStringBuilder.bind(null, 'previous');
const refresh = LoggingConfig.makeConfigStringBuilder.bind(null, 'Refresh');
const showAllStyleProperties = LoggingConfig.makeConfigStringBuilder.bind(null, 'ShowAllStyleProperties');
const showStyleEditor = LoggingConfig.makeConfigStringBuilder.bind(null, 'showStyleEditor');
const slider = LoggingConfig.makeConfigStringBuilder.bind(null, 'slider');
const stylePropertiesSection = LoggingConfig.makeConfigStringBuilder.bind(null, 'StylePropertiesSection');
const stylePropertiesSectionSeparator =
    LoggingConfig.makeConfigStringBuilder.bind(null, 'StylePropertiesSectionSeparator');
const stylesMetricsPane = LoggingConfig.makeConfigStringBuilder.bind(null, 'StylesMetricsPane');
const stylesPane = LoggingConfig.makeConfigStringBuilder.bind(null, 'StylesPane');
const stylesSelector = LoggingConfig.makeConfigStringBuilder.bind(null, 'StylesSelector');
const toggle = LoggingConfig.makeConfigStringBuilder.bind(null, 'Toggle');
const toggleSubpane = LoggingConfig.makeConfigStringBuilder.bind(null, 'ToggleSubpane');
const treeItem = LoggingConfig.makeConfigStringBuilder.bind(null, 'TreeItem');
const treeItemExpand = LoggingConfig.makeConfigStringBuilder.bind(null, 'TreeItemExpand');
const value = LoggingConfig.makeConfigStringBuilder.bind(null, 'value');

export {
  startLogging,
  stopLogging,
  registerContextProvider,
  registerParentProvider,

  accessibilityComputedProperties,
  accessibilityPane,
  accessibilitySourceOrder,
  addColor,
  addElementClassPrompt,
  addStylesRule,
  ariaAttributes,
  bezierCurveEditor,
  bezierEditor,
  bezierPresetCategory,
  bezierPreview,
  colorCanvas,
  colorEyeDropper,
  colorPicker,
  copyColor,
  cssAngleEditor,
  cssFlexboxEditor,
  cssGridEditor,
  cssLayersPane,
  cssShadowEditor,
  domBreakpoint,
  domBreakpointsPane,
  dropDownButton,
  elementClassesPane,
  elementPropertiesPane,
  elementStatesPane,
  eventListenersPane,
  filterDropdown,
  filterTextField,
  hexValue,
  jumpToSource,
  link,
  metricsBox,
  next,
  option,
  paletteColorShades,
  palettePanel,
  previous,
  refresh,
  showAllStyleProperties,
  showStyleEditor,
  slider,
  stylePropertiesSection,
  stylePropertiesSectionSeparator,
  stylesMetricsPane,
  stylesPane,
  stylesSelector,
  toggle,
  toggleSubpane,
  treeItem,
  treeItemExpand,
  value,
};
