// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import type * as LoggableModule from './Loggable.js';
import * as LoggingConfig from './LoggingConfig.js';
import * as LoggingDriver from './LoggingDriver.js';
import * as LoggingEvents from './LoggingEvents.js';
import * as LoggingState from './LoggingState.js';

type Loggable = LoggableModule.Loggable;
const {startLogging, stopLogging} = LoggingDriver;
const {registerContextProvider, registerParentProvider} = LoggingState;
const {logImpressions, logClick} = LoggingEvents;

function registerLoggable(loggable: Loggable, config: string, parent: Loggable|null): void {
  void LoggingState.getOrCreateLoggingState(loggable, LoggingConfig.parseJsLog(config), parent || undefined);
}

const accessibilityComputedProperties =
    LoggingConfig.makeConfigStringBuilder.bind(null, 'AccessibilityComputedProperties');
const accessibilityPane = LoggingConfig.makeConfigStringBuilder.bind(null, 'AccessibilityPane');
const accessibilitySourceOrder = LoggingConfig.makeConfigStringBuilder.bind(null, 'AccessibilitySourceOrder');
const action = LoggingConfig.makeConfigStringBuilder.bind(null, 'Action');
const addElementClassPrompt = LoggingConfig.makeConfigStringBuilder.bind(null, 'AddElementClassPrompt');
const ariaAttributes = LoggingConfig.makeConfigStringBuilder.bind(null, 'AriaAttributes');
const bezierCurveEditor = LoggingConfig.makeConfigStringBuilder.bind(null, 'BezierCurveEditor');
const bezierEditor = LoggingConfig.makeConfigStringBuilder.bind(null, 'BezierEditor');
const bezierPresetCategory = LoggingConfig.makeConfigStringBuilder.bind(null, 'BezierPresetCategory');
const colorCanvas = LoggingConfig.makeConfigStringBuilder.bind(null, 'ColorCanvas');
const colorEyeDropper = LoggingConfig.makeConfigStringBuilder.bind(null, 'ColorEyeDropper');
const colorPicker = LoggingConfig.makeConfigStringBuilder.bind(null, 'ColorPicker');
const copyColor = LoggingConfig.makeConfigStringBuilder.bind(null, 'CopyColor');
const cssAngleEditor = LoggingConfig.makeConfigStringBuilder.bind(null, 'CssAngleEditor');
const cssColorMix = LoggingConfig.makeConfigStringBuilder.bind(null, 'CssColorMix');
const cssFlexboxEditor = LoggingConfig.makeConfigStringBuilder.bind(null, 'CssFlexboxEditor');
const cssGridEditor = LoggingConfig.makeConfigStringBuilder.bind(null, 'CssGridEditor');
const cssLayersPane = LoggingConfig.makeConfigStringBuilder.bind(null, 'CssLayersPane');
const cssShadowEditor = LoggingConfig.makeConfigStringBuilder.bind(null, 'CssShadowEditor');
const deviceModeRuler = LoggingConfig.makeConfigStringBuilder.bind(null, 'DeviceModeRuler');
const domBreakpoint = LoggingConfig.makeConfigStringBuilder.bind(null, 'DOMBreakpoint');
const dropDown = LoggingConfig.makeConfigStringBuilder.bind(null, 'DropDown');
const elementsBreadcrumbs = LoggingConfig.makeConfigStringBuilder.bind(null, 'ElementsBreadcrumbs');
const elementClassesPane = LoggingConfig.makeConfigStringBuilder.bind(null, 'ElementClassesPane');
const elementPropertiesPane = LoggingConfig.makeConfigStringBuilder.bind(null, 'ElementPropertiesPane');
const elementStatesPane = LoggingConfig.makeConfigStringBuilder.bind(null, 'ElementStatesPan');
const elementsTreeOutline = LoggingConfig.makeConfigStringBuilder.bind(null, 'ElementsTreeOutline');
const eventListenersPane = LoggingConfig.makeConfigStringBuilder.bind(null, 'EventListenersPane');
const filterDropdown = LoggingConfig.makeConfigStringBuilder.bind(null, 'FilterDropdown');
const flexboxOverlays = LoggingConfig.makeConfigStringBuilder.bind(null, 'FlexboxOverlays');
const fullAccessibilityTree = LoggingConfig.makeConfigStringBuilder.bind(null, 'FullAccessibilityTree');
const gridOverlays = LoggingConfig.makeConfigStringBuilder.bind(null, 'GridOverlays');
const gridSettings = LoggingConfig.makeConfigStringBuilder.bind(null, 'GridSettings');
const item = LoggingConfig.makeConfigStringBuilder.bind(null, 'Item');
const jumpToElement = LoggingConfig.makeConfigStringBuilder.bind(null, 'JumpToElement');
const jumpToSource = LoggingConfig.makeConfigStringBuilder.bind(null, 'JumpToSource');
const key = LoggingConfig.makeConfigStringBuilder.bind(null, 'Key');
const link = LoggingConfig.makeConfigStringBuilder.bind(null, 'Link');
const mediaInspectorView = LoggingConfig.makeConfigStringBuilder.bind(null, 'MediaInspectorView');
const menu = LoggingConfig.makeConfigStringBuilder.bind(null, 'Menu');
const metricsBox = LoggingConfig.makeConfigStringBuilder.bind(null, 'MetricsBox');
const next = LoggingConfig.makeConfigStringBuilder.bind(null, 'Next');
const paletteColorShades = LoggingConfig.makeConfigStringBuilder.bind(null, 'PaletteColorShades');
const pane = LoggingConfig.makeConfigStringBuilder.bind(null, 'Pane');
const panel = LoggingConfig.makeConfigStringBuilder.bind(null, 'Panel');
const panelTabHeader = LoggingConfig.makeConfigStringBuilder.bind(null, 'PanelTabHeader');
const preview = LoggingConfig.makeConfigStringBuilder.bind(null, 'Preview');
const previous = LoggingConfig.makeConfigStringBuilder.bind(null, 'Previous');
const responsivePresetsContainer = LoggingConfig.makeConfigStringBuilder.bind(null, 'ResponsivePresetsContainer');
const showAllStyleProperties = LoggingConfig.makeConfigStringBuilder.bind(null, 'ShowAllStyleProperties');
const showStyleEditor = LoggingConfig.makeConfigStringBuilder.bind(null, 'ShowStyleEditor');
const slider = LoggingConfig.makeConfigStringBuilder.bind(null, 'Slider');
const stylesComputedPane = LoggingConfig.makeConfigStringBuilder.bind(null, 'StylesComputedPane');
const section = LoggingConfig.makeConfigStringBuilder.bind(null, 'Section');
const stylePropertiesSectionSeparator =
    LoggingConfig.makeConfigStringBuilder.bind(null, 'StylePropertiesSectionSeparator');
const stylesMetricsPane = LoggingConfig.makeConfigStringBuilder.bind(null, 'StylesMetricsPane');
const stylesPane = LoggingConfig.makeConfigStringBuilder.bind(null, 'StylesPane');
const stylesSelector = LoggingConfig.makeConfigStringBuilder.bind(null, 'StylesSelector');
const tableCell = LoggingConfig.makeConfigStringBuilder.bind(null, 'TableCell');
const tableHeader = LoggingConfig.makeConfigStringBuilder.bind(null, 'TableHeader');
const textField = LoggingConfig.makeConfigStringBuilder.bind(null, 'TextField');
const toggle = LoggingConfig.makeConfigStringBuilder.bind(null, 'Toggle');
const toggleSubpane = LoggingConfig.makeConfigStringBuilder.bind(null, 'ToggleSubpane');
const treeItem = LoggingConfig.makeConfigStringBuilder.bind(null, 'TreeItem');
const treeItemExpand = LoggingConfig.makeConfigStringBuilder.bind(null, 'TreeItemExpand');
const value = LoggingConfig.makeConfigStringBuilder.bind(null, 'Value');

export {
  Loggable,
  logClick,
  logImpressions,
  startLogging,
  stopLogging,
  registerContextProvider,
  registerParentProvider,
  registerLoggable,

  accessibilityComputedProperties,
  accessibilityPane,
  accessibilitySourceOrder,
  action,
  addElementClassPrompt,
  ariaAttributes,
  bezierCurveEditor,
  bezierEditor,
  bezierPresetCategory,
  colorCanvas,
  colorEyeDropper,
  colorPicker,
  copyColor,
  cssAngleEditor,
  cssColorMix,
  cssFlexboxEditor,
  cssGridEditor,
  cssLayersPane,
  cssShadowEditor,
  deviceModeRuler,
  domBreakpoint,
  dropDown,
  elementsBreadcrumbs,
  elementClassesPane,
  elementPropertiesPane,
  elementStatesPane,
  elementsTreeOutline,
  eventListenersPane,
  filterDropdown,
  flexboxOverlays,
  fullAccessibilityTree,
  gridOverlays,
  gridSettings,
  item,
  jumpToElement,
  jumpToSource,
  key,
  link,
  mediaInspectorView,
  menu,
  metricsBox,
  next,
  paletteColorShades,
  pane,
  panel,
  panelTabHeader,
  preview,
  previous,
  responsivePresetsContainer,
  showAllStyleProperties,
  showStyleEditor,
  slider,
  stylesComputedPane,
  section,
  stylePropertiesSectionSeparator,
  stylesMetricsPane,
  stylesPane,
  stylesSelector,
  tableCell,
  tableHeader,
  textField,
  toggle,
  toggleSubpane,
  treeItem,
  treeItemExpand,
  value,
};
