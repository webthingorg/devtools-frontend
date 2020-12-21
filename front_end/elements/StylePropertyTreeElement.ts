// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Bindings from '../bindings/bindings.js';
import * as ColorPicker from '../color_picker/color_picker.js';
import * as Common from '../common/common.js';
import * as Host from '../host/host.js';
import * as InlineEditor from '../inline_editor/inline_editor.js';
import * as Platform from '../platform/platform.js';
import * as SDK from '../sdk/sdk.js';
import * as TextUtils from '../text_utils/text_utils.js';
import * as UI from '../ui/ui.js';

import {BezierPopoverIcon, ColorSwatchPopoverIcon, ShadowSwatchPopoverHelper} from './ColorSwatchPopoverIcon.js';
import {CSSPropertyPrompt, StylePropertiesSection, StylesSidebarPane, StylesSidebarPropertyRenderer} from './StylesSidebarPane.js';  // eslint-disable-line no-unused-vars

/** @type {!WeakMap<!StylesSidebarPane, !StylePropertyTreeElement>} */
const parentMap = new WeakMap();

export class StylePropertyTreeElement extends UI.TreeOutline.TreeElement {
  _style: SDK.CSSStyleDeclaration.CSSStyleDeclaration;
  _matchedStyles: SDK.CSSMatchedStyles.CSSMatchedStyles;
  property: SDK.CSSProperty.CSSProperty;
  _inherited: boolean;
  _overloaded: boolean;
  selectable: boolean;
  _parentPane: StylesSidebarPane;
  isShorthand: boolean;
  _applyStyleThrottler: Common.Throttler.Throttler;
  _newProperty: boolean;
  _expandedDueToFilter: boolean;
  valueElement: HTMLElement|null;
  nameElement: HTMLElement|null;
  _expandElement: UI.Icon.Icon|null;
  _originalPropertyText: string;
  _hasBeenEditedIncrementally: boolean;
  _prompt: any;
  _lastComputedValue: string|null;
  _contextForTest: (Context|undefined)|undefined;
  constructor(
      stylesPane: StylesSidebarPane, matchedStyles: SDK.CSSMatchedStyles.CSSMatchedStyles,
      property: SDK.CSSProperty.CSSProperty, isShorthand: boolean, inherited: boolean, overloaded: boolean,
      newProperty: boolean) {
    // Pass an empty title, the title gets made later in onattach.
    super('', isShorthand);
    this._style = property.ownerStyle;
    this._matchedStyles = matchedStyles;
    this.property = property;
    this._inherited = inherited;
    this._overloaded = overloaded;
    this.selectable = false;
    this._parentPane = stylesPane;
    this.isShorthand = isShorthand;
    this._applyStyleThrottler = new Common.Throttler.Throttler(0);
    this._newProperty = newProperty;
    if (this._newProperty) {
      this.listItemElement.textContent = '';
    }
    this._expandedDueToFilter = false;
    this.valueElement = null;
    this.nameElement = null;
    this._expandElement = null;
    this._originalPropertyText = '';
    this._hasBeenEditedIncrementally = false;
    this._prompt = null;

    this._lastComputedValue = null;
  }

  matchedStyles(): SDK.CSSMatchedStyles.CSSMatchedStyles {
    return this._matchedStyles;
  }

  _editable(): boolean {
    return !!(this._style.styleSheetId && this._style.range);
  }

  inherited(): boolean {
    return this._inherited;
  }

  overloaded(): boolean {
    return this._overloaded;
  }

  setOverloaded(x: boolean) {
    if (x === this._overloaded) {
      return;
    }
    this._overloaded = x;
    this._updateState();
  }

  get name() {
    return this.property.name;
  }

  get value() {
    return this.property.value;
  }

  updateFilter(): boolean {
    const regex = this._parentPane.filterRegex();
    const matches = !!regex && (regex.test(this.property.name) || regex.test(this.property.value));
    this.listItemElement.classList.toggle('filter-match', matches);

    this.onpopulate();
    let hasMatchingChildren: true|false = false;

    for (let i = 0; i < this.childCount(); ++i) {
      const child = (this.childAt(i) as StylePropertyTreeElement | null);
      if (!child || (child && !child.updateFilter())) {
        continue;
      }
      hasMatchingChildren = true;
    }

    if (!regex) {
      if (this._expandedDueToFilter) {
        this.collapse();
      }
      this._expandedDueToFilter = false;
    } else if (hasMatchingChildren && !this.expanded) {
      this.expand();
      this._expandedDueToFilter = true;
    } else if (!hasMatchingChildren && this.expanded && this._expandedDueToFilter) {
      this.collapse();
      this._expandedDueToFilter = false;
    }
    return matches;
  }

  _processColor(text: string, valueChild?: Node|null|undefined): Node {
    const useUserSettingFormat = this._editable();
    const shiftClickMessage = Common.UIString.UIString('Shift + Click to change color format.');
    const tooltip =
        this._editable() ? Common.UIString.UIString('Open color picker. %s', shiftClickMessage) : shiftClickMessage;

    const swatch = new InlineEditor.ColorSwatch.ColorSwatch();
    swatch.renderColor(text, useUserSettingFormat, tooltip);

    if (!valueChild) {
      valueChild = swatch.createChild('span');
      valueChild.textContent = swatch.color ? swatch.color.asString(swatch.format) : text;
    }
    swatch.appendChild(valueChild);

    const onFormatchanged = (event: Event) => {
      const {data} = (event as any);
      swatch.firstElementChild && swatch.firstElementChild.remove();
      swatch.createChild('span').textContent = data.text;
    };

    swatch.addEventListener('format-changed', onFormatchanged);

    if (this._editable()) {
      this._addColorContrastInfo(swatch);
    }

    return swatch;
  }

  _processVar(text: string): Node {
    const computedSingleValue = this._matchedStyles.computeSingleVariableValue(this._style, text);
    if (!computedSingleValue) {
      throw new Error('Unable to compute single value');
    }
    const {computedValue, fromFallback} = computedSingleValue;

    const varSwatch = new InlineEditor.CSSVarSwatch.CSSVarSwatch();
    UI.UIUtils.createTextChild(varSwatch, text);
    varSwatch.data = {text, computedValue, fromFallback, onLinkClick: this._handleVarDefinitionClick.bind(this)};

    if (!computedValue || !Common.Color.Color.parse(computedValue)) {
      return varSwatch;
    }

    return this._processColor(computedValue, varSwatch);
  }

  _handleVarDefinitionClick(variableName: string, event: MouseEvent) {
    if (event.button !== 0) {
      return;
    }

    Host.userMetrics.actionTaken(Host.UserMetrics.Action.CustomPropertyLinkClicked);
    this._parentPane.jumpToProperty(variableName);
    event.consume(true);
  }

  async _addColorContrastInfo(swatch: InlineEditor.ColorSwatch.ColorSwatch) {
    const swatchPopoverHelper = this._parentPane.swatchPopoverHelper();
    const swatchIcon = new ColorSwatchPopoverIcon(this, swatchPopoverHelper, swatch);
    if (this.property.name !== 'color' || !this._parentPane.cssModel() || !this.node()) {
      return;
    }
    const cssModel = this._parentPane.cssModel();
    const node = this.node();
    if (cssModel && node && typeof node.id !== 'undefined') {
      const contrastInfo = new ColorPicker.ContrastInfo.ContrastInfo(await cssModel.backgroundColorsPromise(node.id));
      swatchIcon.setContrastInfo(contrastInfo);
    }
  }

  renderedPropertyText(): string {
    if (!this.nameElement || !this.valueElement) {
      return '';
    }
    return this.nameElement.textContent + ': ' + this.valueElement.textContent;
  }

  _processBezier(text: string): Node {
    if (!this._editable() || !UI.Geometry.CubicBezier.parse(text)) {
      return document.createTextNode(text);
    }
    const swatchPopoverHelper = this._parentPane.swatchPopoverHelper();
    const swatch = InlineEditor.Swatches.BezierSwatch.create();
    swatch.setBezierText(text);
    new BezierPopoverIcon(this, swatchPopoverHelper, swatch);
    return swatch;
  }

  _processFont(text: string): Node {
    const section = this.section();
    if (section) {
      section.registerFontProperty(this);
    }
    return document.createTextNode(text);
  }

  _processShadow(propertyValue: string, propertyName: string): Node {
    if (!this._editable()) {
      return document.createTextNode(propertyValue);
    }
    let shadows;
    if (propertyName === 'text-shadow') {
      shadows = InlineEditor.CSSShadowModel.CSSShadowModel.parseTextShadow(propertyValue);
    } else {
      shadows = InlineEditor.CSSShadowModel.CSSShadowModel.parseBoxShadow(propertyValue);
    }
    if (!shadows.length) {
      return document.createTextNode(propertyValue);
    }
    const container = document.createDocumentFragment();
    const swatchPopoverHelper = this._parentPane.swatchPopoverHelper();
    for (let i = 0; i < shadows.length; i++) {
      if (i !== 0) {
        container.appendChild(document.createTextNode(', '));
      }  // Add back commas and spaces between each shadow.
      // TODO(flandy): editing the property value should use the original value with all spaces.
      const cssShadowSwatch = InlineEditor.Swatches.CSSShadowSwatch.create();
      cssShadowSwatch.setCSSShadow(shadows[i]);
      new ShadowSwatchPopoverHelper(this, swatchPopoverHelper, cssShadowSwatch);
      const colorSwatch = cssShadowSwatch.colorSwatch();
      if (colorSwatch) {
        new ColorSwatchPopoverIcon(this, swatchPopoverHelper, colorSwatch);
      }
      container.appendChild(cssShadowSwatch);
    }
    return container;
  }

  _processGrid(propertyValue: string, propertyName: string): Node {
    const splitResult =
        TextUtils.TextUtils.Utils.splitStringByRegexes(propertyValue, [SDK.CSSMetadata.GridAreaRowRegex]);
    if (splitResult.length <= 1) {
      return document.createTextNode(propertyValue);
    }

    const indent = Common.Settings.Settings.instance().moduleSetting('textEditorIndent').get();
    const container = document.createDocumentFragment();
    for (const result of splitResult) {
      const value = result.value.trim();
      const content = UI.Fragment.html`<br /><span class='styles-clipboard-only'>${indent.repeat(2)}</span>${value}`;
      container.appendChild(content);
    }
    return container;
  }

  _processAngle(angleText: string) {
    if (!this._editable()) {
      return document.createTextNode(angleText);
    }
    const cssAngle = new InlineEditor.CSSAngle.CSSAngle();
    const valueElement = document.createElement('span');
    valueElement.textContent = angleText;
    const computedPropertyValue = this._matchedStyles.computeValue(this.property.ownerStyle, this.property.value) || '';
    cssAngle.data = {
      propertyName: this.property.name,
      propertyValue: computedPropertyValue,
      angleText,
      containingPane: (this._parentPane.element.enclosingNodeOrSelfWithClass('style-panes-wrapper') as HTMLElement),
    };
    cssAngle.append(valueElement);

    const popoverToggled = (event: Event) => {
      const section = this.section();
      if (!section) {
        return;
      }

      const {data} = (event as any);
      if (data.open) {
        this._parentPane.hideAllPopovers();
        this._parentPane.activeCSSAngle = cssAngle;
      }

      section.element.classList.toggle('has-open-popover', data.open);
      this._parentPane.setEditingStyle(data.open);
    };

    const valueChanged = async (event: Event) => {
      const {data} = (event as any);

      valueElement.textContent = data.value;
      await this.applyStyleText(this.renderedPropertyText(), false);
      const computedPropertyValue =
          this._matchedStyles.computeValue(this.property.ownerStyle, this.property.value) || '';
      cssAngle.updateProperty(this.property.name, computedPropertyValue);
    };

    const unitChanged = async (event: Event) => {
      const {data} = (event as any);
      valueElement.textContent = data.value;
    };

    cssAngle.addEventListener('popover-toggled', popoverToggled);
    cssAngle.addEventListener('value-changed', valueChanged);
    cssAngle.addEventListener('unit-changed', unitChanged);

    return cssAngle;
  }

  _updateState() {
    if (!this.listItemElement) {
      return;
    }

    if (this._style.isPropertyImplicit(this.name)) {
      this.listItemElement.classList.add('implicit');
    } else {
      this.listItemElement.classList.remove('implicit');
    }

    const hasIgnorableError = !this.property.parsedOk && StylesSidebarPane.ignoreErrorsForProperty(this.property);
    if (hasIgnorableError) {
      this.listItemElement.classList.add('has-ignorable-error');
    } else {
      this.listItemElement.classList.remove('has-ignorable-error');
    }

    if (this.inherited()) {
      this.listItemElement.classList.add('inherited');
    } else {
      this.listItemElement.classList.remove('inherited');
    }

    if (this.overloaded()) {
      this.listItemElement.classList.add('overloaded');
    } else {
      this.listItemElement.classList.remove('overloaded');
    }

    if (this.property.disabled) {
      this.listItemElement.classList.add('disabled');
    } else {
      this.listItemElement.classList.remove('disabled');
    }
  }

  node(): SDK.DOMModel.DOMNode|null {
    return this._parentPane.node();
  }

  parentPane(): StylesSidebarPane {
    return this._parentPane;
  }

  section(): StylePropertiesSection|null {
    if (!this.treeOutline) {
      return null;
    }
    return /** @type {*} */ (this.treeOutline as any).section;
  }

  _updatePane() {
    const section = this.section();
    if (section) {
      section.refreshUpdate(this);
    }
  }

  async _toggleDisabled(disabled: boolean) {
    const oldStyleRange = this._style.range;
    if (!oldStyleRange) {
      return;
    }

    this._parentPane.setUserOperation(true);
    const success = await this.property.setDisabled(disabled);
    this._parentPane.setUserOperation(false);

    if (!success) {
      return;
    }
    this._matchedStyles.resetActiveProperties();
    this._updatePane();
    this.styleTextAppliedForTest();
  }

  /**
   * @override
   */
  async onpopulate(): Promise<void> {
    // Only populate once and if this property is a shorthand.
    if (this.childCount() || !this.isShorthand) {
      return;
    }

    const longhandProperties = this._style.longhandProperties(this.name);
    const leadingProperties = this._style.leadingProperties();

    for (let i = 0; i < longhandProperties.length; ++i) {
      const name = longhandProperties[i].name;
      let inherited: boolean|false = false;
      let overloaded: boolean|true|false = false;

      const section = this.section();
      if (section) {
        inherited = section.isPropertyInherited(name);
        overloaded =
            this._matchedStyles.propertyState(longhandProperties[i]) === SDK.CSSMatchedStyles.PropertyState.Overloaded;
      }

      const leadingProperty = leadingProperties.find(
          (property: SDK.CSSProperty.CSSProperty) => property.name === name && property.activeInStyle());
      if (leadingProperty) {
        overloaded = true;
      }

      const item = new StylePropertyTreeElement(
          this._parentPane, this._matchedStyles, longhandProperties[i], false, inherited, overloaded, false);
      this.appendChild(item);
    }
  }

  /**
   * @override
   */
  onattach() {
    this.updateTitle();

    this.listItemElement.addEventListener('mousedown', (event: MouseEvent) => {
      if (event.button === 0) {
        parentMap.set(this._parentPane, this);
      }
    }, false);
    this.listItemElement.addEventListener('mouseup', this._mouseUp.bind(this));
    this.listItemElement.addEventListener('click', (event: MouseEvent) => {
      if (!event.target) {
        return;
      }

      const node = (event.target as HTMLElement);
      if (!node.hasSelection() && event.target !== this.listItemElement) {
        event.consume(true);
      }
    });

    // Copy context menu.
    this.listItemElement.addEventListener('contextmenu', this._handleCopyContextMenuEvent.bind(this));
  }

  onexpand() {
    this._updateExpandElement();
  }

  oncollapse() {
    this._updateExpandElement();
  }

  _updateExpandElement() {
    if (!this._expandElement) {
      return;
    }
    if (this.expanded) {
      this._expandElement.setIconType('smallicon-triangle-down');
    } else {
      this._expandElement.setIconType('smallicon-triangle-right');
    }
  }

  updateTitleIfComputedValueChanged() {
    const computedValue = this._matchedStyles.computeValue(this.property.ownerStyle, this.property.value);
    if (computedValue === this._lastComputedValue) {
      return;
    }
    this._lastComputedValue = computedValue;
    this._innerUpdateTitle();
  }

  updateTitle() {
    this._lastComputedValue = this._matchedStyles.computeValue(this.property.ownerStyle, this.property.value);
    this._innerUpdateTitle();
  }

  _innerUpdateTitle() {
    this._updateState();
    if (this.isExpandable()) {
      this._expandElement = UI.Icon.Icon.create('smallicon-triangle-right', 'expand-icon');
    } else {
      this._expandElement = null;
    }

    const propertyRenderer =
        new StylesSidebarPropertyRenderer(this._style.parentRule, this.node(), this.name, this.value);
    if (this.property.parsedOk) {
      propertyRenderer.setVarHandler(this._processVar.bind(this));
      propertyRenderer.setColorHandler(this._processColor.bind(this));
      propertyRenderer.setBezierHandler(this._processBezier.bind(this));
      propertyRenderer.setFontHandler(this._processFont.bind(this));
      propertyRenderer.setShadowHandler(this._processShadow.bind(this));
      propertyRenderer.setGridHandler(this._processGrid.bind(this));
      propertyRenderer.setAngleHandler(this._processAngle.bind(this));
    }

    this.listItemElement.removeChildren();
    this.nameElement = (propertyRenderer.renderName() as HTMLElement);
    if (this.property.name.startsWith('--') && this.nameElement) {
      UI.Tooltip.Tooltip.install(
          this.nameElement, this._matchedStyles.computeCSSVariable(this._style, this.property.name) || '');
    }
    this.valueElement = (propertyRenderer.renderValue() as HTMLElement);
    if (!this.treeOutline) {
      return;
    }

    const indent = Common.Settings.Settings.instance().moduleSetting('textEditorIndent').get();
    UI.UIUtils.createTextChild(
        this.listItemElement.createChild('span', 'styles-clipboard-only'),
        indent + (this.property.disabled ? '/* ' : ''));
    if (this.nameElement) {
      this.listItemElement.appendChild(this.nameElement);
    }
    if (this.valueElement) {
      const lineBreakValue =
          this.valueElement.firstElementChild && this.valueElement.firstElementChild.tagName === 'BR';
      const separator = lineBreakValue ? ':' : ': ';
      this.listItemElement.createChild('span', 'styles-name-value-separator').textContent = separator;
      if (this._expandElement) {
        this.listItemElement.appendChild(this._expandElement);
      }
      this.listItemElement.appendChild(this.valueElement);
      UI.UIUtils.createTextChild(this.listItemElement, ';');
      if (this.property.disabled) {
        UI.UIUtils.createTextChild(this.listItemElement.createChild('span', 'styles-clipboard-only'), ' */');
      }
    }

    if (!this.property.parsedOk) {
      // Avoid having longhands under an invalid shorthand.
      this.listItemElement.classList.add('not-parsed-ok');

      // Add a separate exclamation mark IMG element with a tooltip.
      this.listItemElement.insertBefore(
          StylesSidebarPane.createExclamationMark(this.property, null), this.listItemElement.firstChild);
    } else {
      this._updateFontVariationSettingsWarning();
    }

    if (!this.property.activeInStyle()) {
      this.listItemElement.classList.add('inactive');
    }
    this.updateFilter();

    if (this.property.parsedOk && this.section() && this.parent && this.parent.root) {
      const enabledCheckboxElement = document.createElement('input');
      enabledCheckboxElement.className = 'enabled-button';
      enabledCheckboxElement.type = 'checkbox';
      enabledCheckboxElement.checked = !this.property.disabled;
      enabledCheckboxElement.addEventListener('mousedown', (event: MouseEvent) => event.consume(), false);
      enabledCheckboxElement.addEventListener('click', (event: MouseEvent) => {
        this._toggleDisabled(!this.property.disabled);
        event.consume();
      }, false);
      if (this.nameElement && this.valueElement) {
        UI.ARIAUtils.setAccessibleName(
            enabledCheckboxElement, `${this.nameElement.textContent} ${this.valueElement.textContent}`);
      }
      this.listItemElement.insertBefore(enabledCheckboxElement, this.listItemElement.firstChild);
    }
  }

  async _updateFontVariationSettingsWarning() {
    if (this.property.name !== 'font-variation-settings') {
      return;
    }
    const value = this.property.value;
    const cssModel = this._parentPane.cssModel();
    if (!cssModel) {
      return;
    }
    const computedStyleModel = this._parentPane.computedStyleModel();
    const styles = await computedStyleModel.fetchComputedStyle();
    if (!styles) {
      return;
    }
    const fontFamily = styles.computedStyle.get('font-family');
    if (!fontFamily) {
      return;
    }
    const fontFamilies = new Set<string>(SDK.CSSPropertyParser.parseFontFamily(fontFamily));
    const matchingFontFaces =
        cssModel.fontFaces().filter((f: SDK.CSSFontFace.CSSFontFace) => fontFamilies.has(f.getFontFamily()));
    const variationSettings = SDK.CSSPropertyParser.parseFontVariationSettings(value);
    const warnings = [];
    for (const elementSetting of variationSettings) {
      for (const font of matchingFontFaces) {
        const fontSetting = font.getVariationAxisByTag(elementSetting.tag);
        if (!fontSetting) {
          continue;
        }
        if (elementSetting.value < fontSetting.minValue || elementSetting.value > fontSetting.maxValue) {
          warnings.push(
              ls`Value for setting “${elementSetting.tag}” ${elementSetting.value} is outside the supported range [${
                  fontSetting.minValue}, ${fontSetting.maxValue}] for font-family “${font.getFontFamily()}”.`);
        }
      }
    }

    if (!warnings.length) {
      return;
    }
    this.listItemElement.classList.add('has-warning');
    this.listItemElement.insertBefore(
        StylesSidebarPane.createExclamationMark(this.property, warnings.join(' ')), this.listItemElement.firstChild);
  }

  _mouseUp(event: Event) {
    const activeTreeElement = parentMap.get(this._parentPane);
    parentMap.delete(this._parentPane);
    if (!activeTreeElement) {
      return;
    }
    if (this.listItemElement.hasSelection()) {
      return;
    }
    if (UI.UIUtils.isBeingEdited((event.target as Node))) {
      return;
    }

    event.consume(true);

    if (event.target === this.listItemElement) {
      return;
    }

    const section = this.section();
    if (UI.KeyboardShortcut.KeyboardShortcut.eventHasCtrlOrMeta((event as MouseEvent)) && section &&
        section.navigable) {
      this._navigateToSource((event.target as Element));
      return;
    }

    this.startEditing((event.target as Element));
  }

  _handleContextMenuEvent(context: Context, event: Event) {
    const contextMenu = new UI.ContextMenu.ContextMenu(event);
    if (this.property.parsedOk && this.section() && this.parent && this.parent.root) {
      contextMenu.defaultSection().appendCheckboxItem(ls`Toggle property and continue editing`, async () => {
        const sectionIndex = this._parentPane.focusedSectionIndex();
        if (this.treeOutline) {
          const propertyIndex = this.treeOutline.rootElement().indexOfChild(this);
          // order matters here: this.editingCancelled may invalidate this.treeOutline.
          this.editingCancelled(null, context);
          await this._toggleDisabled(!this.property.disabled);
          event.consume();
          this._parentPane.continueEditingElement(sectionIndex, propertyIndex);
        }
      }, !this.property.disabled);
    }
    const revealCallback = (this._navigateToSource.bind(this) as () => any);
    contextMenu.defaultSection().appendItem(ls`Reveal in Sources panel`, revealCallback);
    contextMenu.show();
  }

  _handleCopyContextMenuEvent(event: Event) {
    const target = (event.target as Element | null);

    if (!target) {
      return;
    }

    const contextMenu = new UI.ContextMenu.ContextMenu(event);
    contextMenu.clipboardSection().appendItem(ls`Copy declaration`, () => {
      const propertyText = `${this.property.name}: ${this.property.value};`;
      Host.InspectorFrontendHost.InspectorFrontendHostInstance.copyText(propertyText);
    });

    contextMenu.clipboardSection().appendItem(ls`Copy property`, () => {
      Host.InspectorFrontendHost.InspectorFrontendHostInstance.copyText(this.property.name);
    });

    contextMenu.clipboardSection().appendItem(ls`Copy value`, () => {
      Host.InspectorFrontendHost.InspectorFrontendHostInstance.copyText(this.property.value);
    });

    contextMenu.defaultSection().appendItem(ls`Copy rule`, () => {
      const section = (this.section() as StylePropertiesSection);
      const ruleText = StylesSidebarPane.formatLeadingProperties(section).ruleText;
      Host.InspectorFrontendHost.InspectorFrontendHostInstance.copyText(ruleText);
    });

    contextMenu.defaultSection().appendItem(ls`Copy all declarations`, () => {
      const section = (this.section() as StylePropertiesSection);
      const allDeclarationText = StylesSidebarPane.formatLeadingProperties(section).allDeclarationText;
      Host.InspectorFrontendHost.InspectorFrontendHostInstance.copyText(allDeclarationText);
    });

    contextMenu.show();
  }

  _navigateToSource(element: Element, omitFocus?: boolean|undefined) {
    const section = this.section();
    if (!section || !section.navigable) {
      return;
    }
    const propertyNameClicked = element === this.nameElement;
    const uiLocation = Bindings.CSSWorkspaceBinding.CSSWorkspaceBinding.instance().propertyUILocation(
        this.property, propertyNameClicked);
    if (uiLocation) {
      Common.Revealer.reveal(uiLocation, omitFocus);
    }
  }

  startEditing(selectElement?: Element|null|undefined) {
    // FIXME: we don't allow editing of longhand properties under a shorthand right now.
    if (this.parent instanceof StylePropertyTreeElement && this.parent.isShorthand) {
      return;
    }

    if (this._expandElement && selectElement === this._expandElement) {
      return;
    }

    const section = this.section();
    if (section && !section.editable) {
      return;
    }

    if (selectElement) {
      selectElement = selectElement.enclosingNodeOrSelfWithClass('webkit-css-property') ||
          selectElement.enclosingNodeOrSelfWithClass('value');
    }
    if (!selectElement) {
      selectElement = this.nameElement;
    }

    if (UI.UIUtils.isBeingEdited(selectElement)) {
      return;
    }

    const isEditingName = selectElement === this.nameElement;
    if (!isEditingName && this.valueElement) {
      if (SDK.CSSMetadata.cssMetadata().isGridAreaDefiningProperty(this.name)) {
        this.valueElement.textContent = restoreGridIndents(this.value);
      }
      this.valueElement.textContent = restoreURLs(this.valueElement.textContent || '', this.value);
    }

    function restoreGridIndents(value: string) {
      const splitResult = TextUtils.TextUtils.Utils.splitStringByRegexes(value, [SDK.CSSMetadata.GridAreaRowRegex]);
      return splitResult
          .map(
              (result: {value: string; position: number; regexIndex: number; captureGroups: (string | undefined)[];}) =>
                  result.value.trim())
          .join('\n');
    }

    function restoreURLs(fieldValue: string, modelValue: string): string {
      const splitFieldValue = fieldValue.split(SDK.CSSMetadata.URLRegex);
      if (splitFieldValue.length === 1) {
        return fieldValue;
      }
      const modelUrlRegex = new RegExp(SDK.CSSMetadata.URLRegex);
      for (let i = 1; i < splitFieldValue.length; i += 2) {
        const match = modelUrlRegex.exec(modelValue);
        if (match) {
          splitFieldValue[i] = match[0];
        }
      }
      return splitFieldValue.join('');
    }

    const previousContent = selectElement ? (selectElement.textContent || '') : '';

    /** @type {!Context} */
    const context = {
      expanded: this.expanded,
      hasChildren: this.isExpandable(),
      isEditingName: isEditingName,
      originalProperty: this.property,
      previousContent: previousContent,
      originalName: undefined,
      originalValue: undefined,
    };
    this._contextForTest = context;

    // Lie about our children to prevent expanding on double click and to collapse shorthands.
    this.setExpandable(false);

    if (selectElement) {
      if (selectElement.parentElement) {
        selectElement.parentElement.classList.add('child-editing');
      }
      selectElement.textContent = selectElement.textContent;  // remove color swatch and the like
    }

    function pasteHandler(this: StylePropertyTreeElement, context: Context, event: Event) {
      const clipboardEvent = (event as ClipboardEvent);
      const clipboardData = clipboardEvent.clipboardData;
      if (!clipboardData) {
        return;
      }

      const data = clipboardData.getData('Text');
      if (!data) {
        return;
      }
      const colonIdx = data.indexOf(':');
      if (colonIdx < 0) {
        return;
      }
      const name = data.substring(0, colonIdx).trim();
      const value = data.substring(colonIdx + 1).trim();

      event.preventDefault();

      if (typeof context.originalName === 'undefined') {
        if (this.nameElement) {
          context.originalName = this.nameElement.textContent || '';
        }

        if (this.valueElement) {
          context.originalValue = this.valueElement.textContent || '';
        }
      }
      this.property.name = name;
      this.property.value = value;
      if (this.nameElement) {
        this.nameElement.textContent = name;
        this.nameElement.normalize();
      }

      if (this.valueElement) {
        this.valueElement.textContent = value;
        this.valueElement.normalize();
      }

      const target = (event.target as HTMLElement);
      this._editingCommitted(target.textContent || '', context, 'forward');
    }

    function blurListener(this: StylePropertyTreeElement, context: Context, event: Event) {
      const target = (event.target as HTMLElement);
      let text: (string|null) = target.textContent;
      if (!context.isEditingName) {
        text = this.value || text;
      }
      this._editingCommitted(text || '', context, '');
    }

    this._originalPropertyText = this.property.propertyText || '';

    this._parentPane.setEditingStyle(true, this);
    if (selectElement && selectElement.parentElement) {
      selectElement.parentElement.scrollIntoViewIfNeeded(false);
    }

    this._prompt = new CSSPropertyPrompt(this, isEditingName);
    this._prompt.setAutocompletionTimeout(0);

    this._prompt.addEventListener(UI.TextPrompt.Events.TextChanged, (event: any) => {
      this._applyFreeFlowStyleTextEdit(context);
    });

    if (selectElement) {
      const proxyElement = this._prompt.attachAndStartEditing(selectElement, blurListener.bind(this, context));
      this._navigateToSource(selectElement, true);

      proxyElement.addEventListener('keydown', this._editingNameValueKeyDown.bind(this, context), false);
      proxyElement.addEventListener('keypress', this._editingNameValueKeyPress.bind(this, context), false);
      if (isEditingName) {
        proxyElement.addEventListener('paste', pasteHandler.bind(this, context), false);
        proxyElement.addEventListener('contextmenu', this._handleContextMenuEvent.bind(this, context), false);
      }

      const componentSelection = selectElement.getComponentSelection();
      if (componentSelection) {
        componentSelection.selectAllChildren(selectElement);
      }
    }
  }

  _editingNameValueKeyDown(context: Context, event: Event) {
    if (event.handled) {
      return;
    }

    const keyboardEvent = (event as KeyboardEvent);
    const target = (keyboardEvent.target as HTMLElement);
    let result;
    if (isEnterKey(keyboardEvent) && !keyboardEvent.shiftKey) {
      result = 'forward';
    } else if (keyboardEvent.keyCode === UI.KeyboardShortcut.Keys.Esc.code || keyboardEvent.key === 'Escape') {
      result = 'cancel';
    } else if (
        !context.isEditingName && this._newProperty &&
        keyboardEvent.keyCode === UI.KeyboardShortcut.Keys.Backspace.code) {
      // For a new property, when Backspace is pressed at the beginning of new property value, move back to the property name.
      const selection = target.getComponentSelection();
      if (selection && selection.isCollapsed && !selection.focusOffset) {
        event.preventDefault();
        result = 'backward';
      }
    } else if (keyboardEvent.key === 'Tab') {
      result = keyboardEvent.shiftKey ? 'backward' : 'forward';
      event.preventDefault();
    }

    if (result) {
      switch (result) {
        case 'cancel':
          this.editingCancelled(null, context);
          break;
        case 'forward':
        case 'backward':
          this._editingCommitted(target.textContent || '', context, result);
          break;
      }

      event.consume();
      return;
    }
  }

  _editingNameValueKeyPress(context: Context, event: Event) {
    function shouldCommitValueSemicolon(text: string, cursorPosition: number): boolean {
      // FIXME: should this account for semicolons inside comments?
      let openQuote: ('"'|'\'')|'' = '';
      for (let i = 0; i < cursorPosition; ++i) {
        const ch = text[i];
        if (ch === '\\' && openQuote !== '') {
          ++i;
        }  // skip next character inside string
        else if (!openQuote && (ch === '"' || ch === '\'')) {
          openQuote = ch;
        } else if (openQuote === ch) {
          openQuote = '';
        }
      }
      return !openQuote;
    }

    const keyboardEvent = (event as KeyboardEvent);
    const target = (keyboardEvent.target as HTMLElement);
    const keyChar = String.fromCharCode(keyboardEvent.charCode);
    const selectionLeftOffset = target.selectionLeftOffset();
    const isFieldInputTerminated =
        (context.isEditingName ? keyChar === ':' :
                                 keyChar === ';' && selectionLeftOffset !== null &&
                 shouldCommitValueSemicolon(target.textContent || '', selectionLeftOffset));
    if (isFieldInputTerminated) {
      // Enter or colon (for name)/semicolon outside of string (for value).
      event.consume(true);
      this._editingCommitted(target.textContent || '', context, 'forward');
      return;
    }
  }

  async _applyFreeFlowStyleTextEdit(context: Context): Promise<void> {
    if (!this._prompt || !this._parentPane.node()) {
      return;
    }

    const enteredText = this._prompt.text();
    if (context.isEditingName && enteredText.includes(':')) {
      this._editingCommitted(enteredText, context, 'forward');
      return;
    }

    const valueText = this._prompt.textWithCurrentSuggestion();
    if (valueText.includes(';')) {
      return;
    }
    // Prevent destructive side-effects during live-edit. crbug.com/433889
    const parentNode = this._parentPane.node();
    if (parentNode) {
      const isPseudo = !!parentNode.pseudoType();
      if (isPseudo) {
        if (this.name.toLowerCase() === 'content') {
          return;
        }
        const lowerValueText = valueText.trim().toLowerCase();
        if (lowerValueText.startsWith('content:') || lowerValueText === 'display: none') {
          return;
        }
      }
    }

    if (context.isEditingName) {
      if (valueText.includes(':')) {
        await this.applyStyleText(valueText, false);
      } else if (this._hasBeenEditedIncrementally) {
        await this._applyOriginalStyle(context);
      }
    } else {
      if (this.nameElement) {
        await this.applyStyleText(`${this.nameElement.textContent}: ${valueText}`, false);
      }
    }
  }

  kickFreeFlowStyleEditForTest(): Promise<void> {
    const context = this._contextForTest;
    return this._applyFreeFlowStyleTextEdit((context as Context));
  }

  editingEnded(context: Context) {
    this.setExpandable(context.hasChildren);
    if (context.expanded) {
      this.expand();
    }
    const editedElement = context.isEditingName ? this.nameElement : this.valueElement;
    // The proxyElement has been deleted, no need to remove listener.
    if (editedElement && editedElement.parentElement) {
      editedElement.parentElement.classList.remove('child-editing');
    }

    this._parentPane.setEditingStyle(false);
  }

  editingCancelled(element: Element|null, context: Context) {
    this._removePrompt();

    if (this._hasBeenEditedIncrementally) {
      this._applyOriginalStyle(context);
    } else if (this._newProperty && this.treeOutline) {
      this.treeOutline.removeChild(this);
    }
    this.updateTitle();

    // This should happen last, as it clears the info necessary to restore the property value after [Page]Up/Down changes.
    this.editingEnded(context);
  }

  async _applyOriginalStyle(context: Context) {
    await this.applyStyleText(this._originalPropertyText, false, context.originalProperty);
  }

  _findSibling(moveDirection: string): StylePropertyTreeElement|null {
    /** @type {?StylePropertyTreeElement} */
    let target: (StylePropertyTreeElement|null)|this = this;
    do {
      /** @type {?UI.TreeOutline.TreeElement} */
      const sibling = moveDirection === 'forward' ? target.nextSibling : target.previousSibling;
      target = sibling instanceof StylePropertyTreeElement ? sibling : null;
    } while (target && target.inherited());

    return target;
  }

  async _editingCommitted(userInput: string, context: Context, moveDirection: string) {
    this._removePrompt();
    this.editingEnded(context);
    const isEditingName = context.isEditingName;
    // If the underlying property has been ripped out, always assume that the value having been entered was
    // a name-value pair and attempt to process it via the SDK.
    if (!this.nameElement || !this.valueElement) {
      return;
    }

    const nameElementValue = this.nameElement.textContent || '';
    const nameValueEntered = (isEditingName && nameElementValue.includes(':')) || !this.property;

    // Determine where to move to before making changes
    let createNewProperty: true|false = false;
    let moveToSelector: true|false = false;
    const isDataPasted = typeof context.originalName !== 'undefined';
    const isDirtyViaPaste = isDataPasted &&
        (this.nameElement.textContent !== context.originalName ||
         this.valueElement.textContent !== context.originalValue);
    const isPropertySplitPaste =
        isDataPasted && isEditingName && this.valueElement.textContent !== context.originalValue;
    /** @type {?StylePropertyTreeElement} */
    let moveTo: (StylePropertyTreeElement|null)|this = this;
    const moveToOther = (isEditingName !== (moveDirection === 'forward'));
    const abandonNewProperty = this._newProperty && !userInput && (moveToOther || isEditingName);
    if (moveDirection === 'forward' && (!isEditingName || isPropertySplitPaste) ||
        moveDirection === 'backward' && isEditingName) {
      moveTo = moveTo._findSibling(moveDirection);
      if (!moveTo) {
        if (moveDirection === 'forward' && (!this._newProperty || userInput)) {
          createNewProperty = true;
        } else if (moveDirection === 'backward') {
          moveToSelector = true;
        }
      }
    }

    // Make the Changes and trigger the moveToNextCallback after updating.
    let moveToIndex: number|- 1 = -1;
    if (moveTo !== null && this.treeOutline) {
      moveToIndex = this.treeOutline.rootElement().indexOfChild((moveTo as UI.TreeOutline.TreeElement));
    }
    const blankInput = Platform.StringUtilities.isWhitespace(userInput);
    const shouldCommitNewProperty = this._newProperty &&
        (isPropertySplitPaste || moveToOther || (!moveDirection && !isEditingName) || (isEditingName && blankInput) ||
         nameValueEntered);
    const section = (this.section() as StylePropertiesSection);
    if (((userInput !== context.previousContent || isDirtyViaPaste) && !this._newProperty) || shouldCommitNewProperty) {
      let propertyText;
      if (nameValueEntered) {
        propertyText = this.nameElement.textContent;
      } else if (
          blankInput ||
          (this._newProperty && Platform.StringUtilities.isWhitespace(this.valueElement.textContent || ''))) {
        propertyText = '';
      } else {
        if (isEditingName) {
          propertyText = userInput + ': ' + this.property.value;
        } else {
          propertyText = this.property.name + ': ' + userInput;
        }
      }
      await this.applyStyleText(propertyText || '', true);
      moveToNextCallback.call(this, this._newProperty, !blankInput, section);
    } else {
      if (isEditingName) {
        this.property.name = userInput;
      } else {
        this.property.value = userInput;
      }
      if (!isDataPasted && !this._newProperty) {
        this.updateTitle();
      }
      moveToNextCallback.call(this, this._newProperty, false, section);
    }

    /**
     * The Callback to start editing the next/previous property/selector.
     */
    function moveToNextCallback(
        this: StylePropertyTreeElement, alreadyNew: boolean, valueChanged: boolean, section: StylePropertiesSection) {
      if (!moveDirection) {
        this._parentPane.resetFocus();
        return;
      }

      // User just tabbed through without changes.
      if (moveTo && moveTo.parent) {
        moveTo.startEditing(!isEditingName ? moveTo.nameElement : moveTo.valueElement);
        return;
      }

      // User has made a change then tabbed, wiping all the original treeElements.
      // Recalculate the new treeElement for the same property we were going to edit next.
      if (moveTo && !moveTo.parent) {
        const rootElement = section.propertiesTreeOutline.rootElement();
        if (moveDirection === 'forward' && blankInput && !isEditingName) {
          --moveToIndex;
        }
        if (moveToIndex >= rootElement.childCount() && !this._newProperty) {
          createNewProperty = true;
        } else {
          const treeElement =
              (moveToIndex >= 0 ? rootElement.childAt(moveToIndex) : null as StylePropertyTreeElement | null);
          if (treeElement) {
            let elementToEdit: (HTMLElement|null) =
                !isEditingName || isPropertySplitPaste ? treeElement.nameElement : treeElement.valueElement;
            if (alreadyNew && blankInput) {
              elementToEdit = moveDirection === 'forward' ? treeElement.nameElement : treeElement.valueElement;
            }
            treeElement.startEditing(elementToEdit);
            return;
          }
          if (!alreadyNew) {
            moveToSelector = true;
          }
        }
      }

      // Create a new attribute in this section (or move to next editable selector if possible).
      if (createNewProperty) {
        if (alreadyNew && !valueChanged && (isEditingName !== (moveDirection === 'backward'))) {
          return;
        }

        section.addNewBlankProperty().startEditing();
        return;
      }

      if (abandonNewProperty) {
        moveTo = this._findSibling(moveDirection);
        const sectionToEdit = (moveTo || moveDirection === 'backward') ? section : section.nextEditableSibling();
        if (sectionToEdit) {
          if (sectionToEdit.style().parentRule) {
            sectionToEdit.startEditingSelector();
          } else {
            sectionToEdit.moveEditorFromSelector(moveDirection);
          }
        }
        return;
      }

      if (moveToSelector) {
        if (section.style().parentRule) {
          section.startEditingSelector();
        } else {
          section.moveEditorFromSelector(moveDirection);
        }
      }
    }
  }

  _removePrompt() {
    // BUG 53242. This cannot go into editingEnded(), as it should always happen first for any editing outcome.
    if (this._prompt) {
      this._prompt.detach();
      this._prompt = null;
    }
  }

  styleTextAppliedForTest() {
  }

  applyStyleText(styleText: string, majorChange: boolean, property?: SDK.CSSProperty.CSSProperty|null|undefined):
      Promise<void> {
    return this._applyStyleThrottler.schedule(this._innerApplyStyleText.bind(this, styleText, majorChange, property));
  }

  async _innerApplyStyleText(
      styleText: string, majorChange: boolean, property?: SDK.CSSProperty.CSSProperty|null|undefined): Promise<void> {
    // this.property might have been nulled at the end of the last _innerApplyStyleText
    if (!this.treeOutline || !this.property) {
      return;
    }

    const oldStyleRange = this._style.range;
    if (!oldStyleRange) {
      return;
    }

    const hasBeenEditedIncrementally = this._hasBeenEditedIncrementally;
    styleText = styleText.replace(/[\xA0\t]/g, ' ').trim();  // Replace &nbsp; with whitespace.
    if (!styleText.length && majorChange && this._newProperty && !hasBeenEditedIncrementally) {
      // The user deleted everything and never applied a new property value via Up/Down scrolling/live editing, so remove the tree element and update.
      this.parent && this.parent.removeChild(this);
      return;
    }

    const currentNode = this._parentPane.node();
    this._parentPane.setUserOperation(true);

    // Append a ";" if the new text does not end in ";".
    // FIXME: this does not handle trailing comments.
    if (styleText.length && !/;\s*$/.test(styleText)) {
      styleText += ';';
    }
    const overwriteProperty = !this._newProperty || hasBeenEditedIncrementally;
    let success: boolean = await this.property.setText(styleText, majorChange, overwriteProperty);
    // Revert to the original text if applying the new text failed
    if (hasBeenEditedIncrementally && majorChange && !success) {
      majorChange = false;
      success = await this.property.setText(this._originalPropertyText, majorChange, overwriteProperty);
    }
    this._parentPane.setUserOperation(false);

    // TODO: using this.property.index to access its containing StyleDeclaration's property will result in
    // off-by-1 errors when the containing StyleDeclaration's respective property has already been deleted.
    // These referencing logic needs to be updated to be more robust.
    const updatedProperty = property || this._style.propertyAt(this.property.index);
    const isPropertyWithinBounds = this.property.index < this._style.allProperties().length;
    if (!success || (!updatedProperty && isPropertyWithinBounds)) {
      if (majorChange) {
        // It did not apply, cancel editing.
        if (this._newProperty) {
          this.treeOutline.removeChild(this);
        } else {
          this.updateTitle();
        }
      }
      this.styleTextAppliedForTest();
      return;
    }

    this._matchedStyles.resetActiveProperties();
    this._hasBeenEditedIncrementally = true;

    // null check for updatedProperty before setting this.property as the code never expects this.property to be undefined or null.
    // This occurs when deleting the last index of a StylePropertiesSection as this._style._allProperties array gets updated
    // before we index it when setting the value for updatedProperty
    const deleteProperty = majorChange && !styleText.length;
    const section = this.section();
    if (deleteProperty && section) {
      section.resetToolbars();
    } else if (!deleteProperty && updatedProperty) {
      this.property = updatedProperty;
    }

    if (currentNode === this.node()) {
      this._updatePane();
    }

    this.styleTextAppliedForTest();
  }

  ondblclick(): boolean {
    return true;  // handled
  }

  isEventWithinDisclosureTriangle(event: Event): boolean {
    return event.target === this._expandElement;
  }
}
export interface Context {
  expanded: boolean;
  hasChildren: boolean;
  isEditingName: boolean;
  originalProperty?: SDK.CSSProperty.CSSProperty;
  originalName?: string;
  originalValue?: string;
  previousContent: string;
}
