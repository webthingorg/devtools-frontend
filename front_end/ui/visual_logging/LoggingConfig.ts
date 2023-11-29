// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const LOGGING_ATTRIBUTE = 'jslog';

export interface LoggingConfig {
  ve: number;
  track?: Map<string, string|undefined>;
  context?: string;
  parent?: string;
}

export function needsLogging(element: Element): boolean {
  return element.hasAttribute(LOGGING_ATTRIBUTE);
}

export function getLoggingConfig(element: Element): LoggingConfig {
  return parseJsLog(element.getAttribute(LOGGING_ATTRIBUTE) || '');
}

// eslint-disable-next-line rulesdir/const_enum
enum VisualElements {
  TreeItem = 1,
  AriaAttributes = 2,
  AccessibilityComputedProperties = 3,
  AccessibilityPane = 4,
  AccessibilitySourceOrder = 5,
  Toggle = 6,
  /* 7 used to be AddStylesRule, but free to grab now */
  TextField = 8,
  ShowAllStyleProperties = 9,
  Section = 10,
  StylePropertiesSectionSeparator = 11,
  StylesPane = 12,
  StylesSelector = 13,
  TreeItemExpand = 14,
  ToggleSubpane = 15,
  ElementClassesPane = 16,
  AddElementClassPrompt = 17,
  ElementStatesPan = 18,
  CssLayersPane = 19,
  DropDown = 20,
  StylesMetricsPane = 21,
  JumpToSource = 22,
  MetricsBox = 23,
  MetricsBoxPart = 24,
  /* 25 used to be DOMBreakpointsPane, but free to grab now */
  DOMBreakpoint = 26,
  ElementPropertiesPane = 27,
  EventListenersPane = 28,
  Action = 29,
  FilterDropdown = 30,
  /* 31 used to be AddColor, but free to grab now */
  BezierCurveEditor = 32,
  BezierEditor = 33,
  BezierPresetCategory = 34,
  Preview = 35,
  ColorCanvas = 36,
  ColorEyeDropper = 37,
  ColorPicker = 38,
  CopyColor = 39,
  CssAngleEditor = 40,
  CssFlexboxEditor = 41,
  CssGridEditor = 42,
  CssShadowEditor = 43,
  Link = 44,
  Next = 45,
  Item = 46,
  PaletteColorShades = 47,
  Panel = 48,
  Previous = 49,
  ShowStyleEditor = 50,
  Slider = 51,
  CssColorMix = 52,
  Value = 53,
  Key = 54,
  GridSettings = 55,
  FlexboxOverlays = 56,
  GridOverlays = 57,
  JumpToElement = 58,
  /* 59 used to be ElementsPanel, but free to grab now */
  ElementsTreeOutline = 60,
  /* 61 used to be RenderingPanel, but free to grab now */
  ElementsBreadcrumbs = 62,
  FullAccessibilityTree = 63,
  /* 64 used to be ToggleDeviceMode, but free to grab now */
  /* 65 used to be ToggleElementSearch, but free to grab now */
  PanelTabHeader = 66,
  Menu = 67,
  /* 68 used to be DeveloperResourcesPanel, but free to grab now */
  TableHeader = 69,
  TableCell = 70,
  StylesComputedPane = 71,
  Pane = 72,
  ResponsivePresets = 73,
  DeviceModeRuler = 74,
  MediaInspectorView = 75,
}

export type VisualElementName = keyof typeof VisualElements;

function resolveVe(ve: string): number {
  return VisualElements[ve as VisualElementName] ?? 0;
}

export function parseJsLog(jslog: string): LoggingConfig {
  const components = jslog.replace(/ /g, '').split(';');
  const getComponent = (name: string): string|undefined =>
      components.find(c => c.startsWith(name))?.substr(name.length);
  const ve = resolveVe(components[0]);
  if (ve === 0) {
    throw new Error('Unkown VE: ' + jslog);
  }
  const config: LoggingConfig = {ve};
  const context = getComponent('context:');
  if (context) {
    config.context = context;
  }

  const parent = getComponent('parent:');
  if (parent) {
    config.parent = parent;
  }

  const trackString = getComponent('track:');
  if (trackString) {
    config.track = new Map<string, string>(trackString.split(',').map(t => t.split(':') as [string, string]));
  }

  return config;
}

export function debugString(config: LoggingConfig): string {
  const components = [VisualElements[config.ve]];
  if (config.context) {
    components.push(`context: ${config.context}`);
  }
  if (config.parent) {
    components.push(`parent: ${config.parent}`);
  }
  if (config.track?.size) {
    components.push(`track: ${
            [...config.track?.entries()].map(([key, value]) => `${key}${value ? `: ${value}` : ''}`).join(', ')}`);
  }
  return components.join('; ');
}

export interface ConfigStringBuilder {
  /**
   * Specifies an optional context for the visual element. For string contexts
   * the convention is to use kebap case (e.g. `foo-bar`).
   *
   * @param value Optional context, which can be either a string or a number.
   * @returns The builder itself.
   */
  context: (value: string|number|undefined) => ConfigStringBuilder;

  /**
   * Speficies the name of a `ParentProvider` used to lookup the parent visual element.
   *
   * @param value The name of a previously registered `ParentProvider`.
   * @returns The builder itself.
   */
  parent: (value: string) => ConfigStringBuilder;

  /**
   * Specifies which DOM events to track for this visual element.
   *
   * @param options The set of DOM events to track.
   * @returns The builder itself.
   */
  track: (options: {
    click?: boolean,
    dblclick?: boolean,
    hover?: boolean,
    drag?: boolean,
    change?: boolean,
    keydown?: boolean|string,
  }) => ConfigStringBuilder;

  /**
   * Serializes the configuration into a `jslog` string.
   *
   * @returns The serialized string value to put on a DOM element via the `jslog` attribute.
   */
  toString: () => string;
}

export function makeConfigStringBuilder(veName: VisualElementName): ConfigStringBuilder {
  const components: string[] = [veName];
  return {
    context: function(value: string|number|undefined): ConfigStringBuilder {
      if (typeof value !== 'undefined') {
        components.push(`context: ${value}`);
      }
      return this;
    },
    parent: function(value: string): ConfigStringBuilder {
      components.push(`parent: ${value}`);
      return this;
    },
    track: function(options: {
      click?: boolean,
      dblclick?: boolean,
      hover?: boolean,
      drag?: boolean,
      change?: boolean,
      keydown?: boolean|string,
    }): ConfigStringBuilder {
      components.push(`track: ${
          Object.entries(options).map(([key, value]) => value !== true ? `${key}: ${value}` : key).join(', ')}`);
      return this;
    },
    toString: function(): string {
      return components.join('; ');
    },
  };
}
