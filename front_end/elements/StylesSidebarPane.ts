// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/*
 * Copyright (C) 2007 Apple Inc.  All rights reserved.
 * Copyright (C) 2009 Joseph Pecoraro
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Computer, Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import * as Bindings from '../bindings/bindings.js';
import * as Common from '../common/common.js';
import * as Components from '../components/components.js';
import * as Host from '../host/host.js';
import * as InlineEditor from '../inline_editor/inline_editor.js';
import * as Root from '../root/root.js';
import * as SDK from '../sdk/sdk.js';
import * as TextUtils from '../text_utils/text_utils.js';
import * as WebComponents from '../ui/components/components.js';
import * as UI from '../ui/ui.js';

import {FontEditorSectionManager} from './ColorSwatchPopoverIcon.js';
import {ComputedStyleModel} from './ComputedStyleModel.js';
import {findIcon} from './CSSPropertyIconResolver.js';
import {linkifyDeferredNodeReference} from './DOMLinkifier.js';
import {ElementsSidebarPane} from './ElementsSidebarPane.js';
import {ImagePreviewPopover} from './ImagePreviewPopover.js';
import {StylePropertyHighlighter} from './StylePropertyHighlighter.js';
import {Context, StylePropertyTreeElement} from './StylePropertyTreeElement.js';  // eslint-disable-line no-unused-vars

// Highlightable properties are those that can be hovered in the sidebar to trigger a specific
// highlighting mode on the current element.
const HIGHLIGHTABLE_PROPERTIES = [
  {mode: 'padding', properties: ['padding']},
  {mode: 'border', properties: ['border']},
  {mode: 'margin', properties: ['margin']},
  {mode: 'gap', properties: ['gap', 'grid-gap']},
  {mode: 'column-gap', properties: ['column-gap', 'grid-column-gap']},
  {mode: 'row-gap', properties: ['row-gap', 'grid-row-gap']},
  {mode: 'grid-template-columns', properties: ['grid-template-columns']},
  {mode: 'grid-template-rows', properties: ['grid-template-rows']},
  {mode: 'grid-template-areas', properties: ['grid-areas']},
  {mode: 'justify-content', properties: ['justify-content']},
  {mode: 'align-content', properties: ['align-content']},
  {mode: 'align-items', properties: ['align-items']},
];

/** @type {!StylesSidebarPane} */
let _stylesSidebarPaneInstance;

export class StylesSidebarPane extends ElementsSidebarPane {
  _currentToolbarPane: UI.Widget.Widget|null;
  _animatedToolbarPane: UI.Widget.Widget|null;
  _pendingWidget: UI.Widget.Widget|null;
  _pendingWidgetToggle: UI.Toolbar.ToolbarToggle|null;
  _toolbar: UI.Toolbar.Toolbar|null;
  _toolbarPaneElement: HTMLElement;
  _computedStyleModel: ComputedStyleModel;
  _noMatchesElement: HTMLElement;
  _sectionsContainer: HTMLElement;
  sectionByElement: WeakMap<Node, StylePropertiesSection>;
  _swatchPopoverHelper: InlineEditor.SwatchPopoverHelper.SwatchPopoverHelper;
  _linkifier: Components.Linkifier.Linkifier;
  _decorator: StylePropertyHighlighter;
  _lastRevealedProperty: SDK.CSSProperty.CSSProperty|null;
  _userOperation: boolean;
  _isEditingStyle: boolean;
  _filterRegex: RegExp|null;
  _isActivePropertyHighlighted: boolean;
  _initialUpdateCompleted: boolean;
  hasMatchedStyles: boolean;
  _sectionBlocks: SectionBlock[];
  _idleCallbackManager: IdleCallbackManager|null;
  _needsForceUpdate: boolean;
  _resizeThrottler: Common.Throttler.Throttler;
  _imagePreviewPopover: ImagePreviewPopover;
  activeCSSAngle: InlineEditor.CSSAngle.CSSAngle|null;
  static instance(): StylesSidebarPane {
    if (!_stylesSidebarPaneInstance) {
      _stylesSidebarPaneInstance = new StylesSidebarPane();
    }
    return _stylesSidebarPaneInstance;
  }

  /**
   * @private
   */
  constructor() {
    super(true /* delegatesFocus */);
    this.setMinimumSize(96, 26);
    this.registerRequiredCSS('elements/stylesSidebarPane.css', {enableLegacyPatching: true});

    Common.Settings.Settings.instance().moduleSetting('colorFormat').addChangeListener(this.update.bind(this));
    Common.Settings.Settings.instance().moduleSetting('textEditorIndent').addChangeListener(this.update.bind(this));

    this._currentToolbarPane = null;
    this._animatedToolbarPane = null;
    this._pendingWidget = null;
    this._pendingWidgetToggle = null;
    this._toolbar = null;
    this._toolbarPaneElement = this._createStylesSidebarToolbar();
    this._computedStyleModel = new ComputedStyleModel();

    this._noMatchesElement = this.contentElement.createChild('div', 'gray-info-message hidden');
    this._noMatchesElement.textContent = ls`No matching selector or style`;

    this._sectionsContainer = this.contentElement.createChild('div');
    UI.ARIAUtils.markAsTree(this._sectionsContainer);
    this._sectionsContainer.addEventListener('keydown', this._sectionsContainerKeyDown.bind(this), false);
    this._sectionsContainer.addEventListener('focusin', this._sectionsContainerFocusChanged.bind(this), false);
    this._sectionsContainer.addEventListener('focusout', this._sectionsContainerFocusChanged.bind(this), false);
    this.sectionByElement = new WeakMap();

    this._swatchPopoverHelper = new InlineEditor.SwatchPopoverHelper.SwatchPopoverHelper();
    this._swatchPopoverHelper.addEventListener(
        InlineEditor.SwatchPopoverHelper.Events.WillShowPopover, this.hideAllPopovers, this);
    this._linkifier = new Components.Linkifier.Linkifier(_maxLinkLength, /* useLinkDecorator */ true);
    this._decorator = new StylePropertyHighlighter(this);
    this._lastRevealedProperty = null;
    this._userOperation = false;
    this._isEditingStyle = false;
    this._filterRegex = null;
    this._isActivePropertyHighlighted = false;
    this._initialUpdateCompleted = false;
    this.hasMatchedStyles = false;

    this.contentElement.classList.add('styles-pane');

    this._sectionBlocks = [];
    this._idleCallbackManager = null;
    this._needsForceUpdate = false;
    _stylesSidebarPaneInstance = this;
    UI.Context.Context.instance().addFlavorChangeListener(SDK.DOMModel.DOMNode, this.forceUpdate, this);
    this.contentElement.addEventListener('copy', this._clipboardCopy.bind(this));
    this._resizeThrottler = new Common.Throttler.Throttler(100);

    this._imagePreviewPopover = new ImagePreviewPopover(this.contentElement, (event: Event) => {
      const link = event.composedPath()[0];
      if (link instanceof Element) {
        return link;
      }
      return null;
    }, () => this.node());

    this.activeCSSAngle = null;
  }

  swatchPopoverHelper(): InlineEditor.SwatchPopoverHelper.SwatchPopoverHelper {
    return this._swatchPopoverHelper;
  }

  setUserOperation(userOperation: boolean) {
    this._userOperation = userOperation;
  }

  static createExclamationMark(property: SDK.CSSProperty.CSSProperty, title: string|null): Element {
    const exclamationElement = (document.createElement('span', {is: 'dt-icon-label'}) as UI.UIUtils.DevToolsIconLabel);
    exclamationElement.className = 'exclamation-mark';
    if (!StylesSidebarPane.ignoreErrorsForProperty(property)) {
      exclamationElement.type = 'smallicon-warning';
    }
    if (title) {
      UI.Tooltip.Tooltip.install(exclamationElement, title);
    } else {
      UI.Tooltip.Tooltip.install(
          exclamationElement,
          SDK.CSSMetadata.cssMetadata().isCSSPropertyName(property.name) ?
              Common.UIString.UIString('Invalid property value') :
              Common.UIString.UIString('Unknown property name'));
    }
    return exclamationElement;
  }

  static ignoreErrorsForProperty(property: SDK.CSSProperty.CSSProperty): boolean {
    function hasUnknownVendorPrefix(string: string) {
      return !string.startsWith('-webkit-') && /^[-_][\w\d]+-\w/.test(string);
    }

    const name = property.name.toLowerCase();

    // IE hack.
    if (name.charAt(0) === '_') {
      return true;
    }

    // IE has a different format for this.
    if (name === 'filter') {
      return true;
    }

    // Common IE-specific property prefix.
    if (name.startsWith('scrollbar-')) {
      return true;
    }
    if (hasUnknownVendorPrefix(name)) {
      return true;
    }

    const value = property.value.toLowerCase();

    // IE hack.
    if (value.endsWith('\\9')) {
      return true;
    }
    if (hasUnknownVendorPrefix(value)) {
      return true;
    }

    return false;
  }

  static createPropertyFilterElement(
      placeholder: string, container: Element, filterCallback: (arg0: RegExp|null) => void): Element {
    const input = document.createElement('input');
    input.type = 'search';
    input.classList.add('custom-search-input');
    input.placeholder = placeholder;

    function searchHandler() {
      const regex = input.value ? new RegExp(input.value.escapeForRegExp(), 'i') : null;
      filterCallback(regex);
    }
    input.addEventListener('input', searchHandler, false);

    function keydownHandler(event: Event) {
      const keyboardEvent = (event as KeyboardEvent);
      if (keyboardEvent.key !== 'Escape' || !input.value) {
        return;
      }
      keyboardEvent.consume(true);
      input.value = '';
      searchHandler();
    }
    input.addEventListener('keydown', keydownHandler, false);
    return input;
  }

  static formatLeadingProperties(section: StylePropertiesSection): {allDeclarationText: string; ruleText: string;} {
    const selectorText = section._headerText();
    const indent = Common.Settings.Settings.instance().moduleSetting('textEditorIndent').get();

    const style = section._style;
    /** @type {!Array<string>} */
    const lines = [];

    // Invalid property should also be copied.
    // For example: *display: inline.
    for (const property of style.leadingProperties()) {
      if (property.disabled) {
        lines.push(`${indent}/* ${property.name}: ${property.value}; */`);
      } else {
        lines.push(`${indent}${property.name}: ${property.value};`);
      }
    }

    const allDeclarationText: string = lines.join('\n');
    const ruleText: string = `${selectorText} {\n${allDeclarationText}\n}`;

    return {
      allDeclarationText,
      ruleText,
    };
  }

  revealProperty(cssProperty: SDK.CSSProperty.CSSProperty) {
    this._decorator.highlightProperty(cssProperty);
    this._lastRevealedProperty = cssProperty;
    this.update();
  }

  jumpToProperty(propertyName: string) {
    this._decorator.findAndHighlightPropertyName(propertyName);
  }

  forceUpdate() {
    this._needsForceUpdate = true;
    this._swatchPopoverHelper.hide();
    this._resetCache();
    this.update();
  }

  _sectionsContainerKeyDown(event: Event) {
    const activeElement = this._sectionsContainer.ownerDocument.deepActiveElement();
    if (!activeElement) {
      return;
    }
    const section = this.sectionByElement.get(activeElement);
    if (!section) {
      return;
    }

    switch (/** @type {!KeyboardEvent} */ (event as KeyboardEvent).key) {
      case 'ArrowUp':
      case 'ArrowLeft': {
        const sectionToFocus = section.previousSibling() || section.lastSibling();
        if (sectionToFocus) {
          sectionToFocus.element.focus();
          event.consume(true);
        }
        break;
      }
      case 'ArrowDown':
      case 'ArrowRight': {
        const sectionToFocus = section.nextSibling() || section.firstSibling();
        if (sectionToFocus) {
          sectionToFocus.element.focus();
          event.consume(true);
        }
        break;
      }
      case 'Home': {
        const sectionToFocus = section.firstSibling();
        if (sectionToFocus) {
          sectionToFocus.element.focus();
          event.consume(true);
        }
        break;
      }
      case 'End': {
        const sectionToFocus = section.lastSibling();
        if (sectionToFocus) {
          sectionToFocus.element.focus();
          event.consume(true);
        }
        break;
      }
    }
  }

  _sectionsContainerFocusChanged() {
    this.resetFocus();
  }

  resetFocus() {
    // When a styles section is focused, shift+tab should leave the section.
    // Leaving tabIndex = 0 on the first element would cause it to be focused instead.
    if (this._sectionBlocks[0] && this._sectionBlocks[0].sections[0]) {
      this._sectionBlocks[0].sections[0].element.tabIndex = this._sectionsContainer.hasFocus() ? -1 : 0;
    }
  }

  _onAddButtonLongClick(event: Event) {
    const cssModel = this.cssModel();
    if (!cssModel) {
      return;
    }
    const headers = cssModel.styleSheetHeaders().filter(styleSheetResourceHeader);

    /** @type {!Array.<{text: string, handler: function():Promise<void>}>} */
    const contextMenuDescriptors = [];
    for (let i = 0; i < headers.length; ++i) {
      const header = headers[i];
      const handler = this._createNewRuleInStyleSheet.bind(this, header);
      contextMenuDescriptors.push({text: Bindings.ResourceUtils.displayNameForURL(header.resourceURL()), handler});
    }

    contextMenuDescriptors.sort(compareDescriptors);

    const contextMenu = new UI.ContextMenu.ContextMenu(event);
    for (let i = 0; i < contextMenuDescriptors.length; ++i) {
      const descriptor = contextMenuDescriptors[i];
      contextMenu.defaultSection().appendItem(descriptor.text, descriptor.handler);
    }
    contextMenu.footerSection().appendItem(
        'inspector-stylesheet', this._createNewRuleInViaInspectorStyleSheet.bind(this));
    contextMenu.show();

    function compareDescriptors(
        descriptor1: {text: string; handler: () => Promise<void>;},
        descriptor2: {text: string; handler: () => Promise<void>;}): number {
      return String.naturalOrderComparator(descriptor1.text, descriptor2.text);
    }

    function styleSheetResourceHeader(header: SDK.CSSStyleSheetHeader.CSSStyleSheetHeader): boolean {
      return !header.isViaInspector() && !header.isInline && !!header.resourceURL();
    }
  }

  _onFilterChanged(regex: RegExp|null) {
    this._filterRegex = regex;
    this._updateFilter();
  }

  _refreshUpdate(editedSection: StylePropertiesSection, editedTreeElement?: StylePropertyTreeElement|undefined) {
    if (editedTreeElement) {
      for (const section of this.allSections()) {
        if (section instanceof BlankStylePropertiesSection && section.isBlank) {
          continue;
        }
        section._updateVarFunctions(editedTreeElement);
      }
    }

    if (this._isEditingStyle) {
      return;
    }
    const node = this.node();
    if (!node) {
      return;
    }

    for (const section of this.allSections()) {
      if (section instanceof BlankStylePropertiesSection && section.isBlank) {
        continue;
      }
      section.update(section === editedSection);
    }

    if (this._filterRegex) {
      this._updateFilter();
    }
    this._nodeStylesUpdatedForTest(node, false);
  }

  /**
   * @override
   */
  async doUpdate(): Promise<any> {
    if (!this._initialUpdateCompleted) {
      setTimeout(() => {
        if (!this._initialUpdateCompleted) {
          // the spinner will get automatically removed when _innerRebuildUpdate is called
          this._sectionsContainer.createChild('span', 'spinner');
        }
      }, 200 /* only spin for loading time > 200ms to avoid unpleasant render flashes */);
    }

    const matchedStyles = await this._fetchMatchedCascade();
    await this._innerRebuildUpdate(matchedStyles);
    if (!this._initialUpdateCompleted) {
      this._initialUpdateCompleted = true;
      this.dispatchEventToListeners(Events.InitialUpdateCompleted);
    }

    this.dispatchEventToListeners(Events.StylesUpdateCompleted, {hasMatchedStyles: this.hasMatchedStyles});
  }

  onResize() {
    this._resizeThrottler.schedule(this._innerResize.bind(this));
  }

  _innerResize(): Promise<void> {
    const width = this.contentElement.getBoundingClientRect().width + 'px';
    this.allSections().forEach((section: StylePropertiesSection) => {
      section.propertiesTreeOutline.element.style.width = width;
    });
    return Promise.resolve();
  }

  _resetCache() {
    const cssModel = this.cssModel();
    if (cssModel) {
      cssModel.discardCachedMatchedCascade();
    }
  }

  _fetchMatchedCascade(): Promise<SDK.CSSMatchedStyles.CSSMatchedStyles|null> {
    const node = this.node();
    if (!node || !this.cssModel()) {
      return Promise.resolve((null as SDK.CSSMatchedStyles.CSSMatchedStyles | null));
    }

    const cssModel = this.cssModel();
    if (!cssModel) {
      return Promise.resolve(null);
    }
    return cssModel.cachedMatchedCascadeForNode(node).then(validateStyles.bind(this));

    function validateStyles(this: StylesSidebarPane, matchedStyles: SDK.CSSMatchedStyles.CSSMatchedStyles|null):
        SDK.CSSMatchedStyles.CSSMatchedStyles|null {
      return matchedStyles && matchedStyles.node() === this.node() ? matchedStyles : null;
    }
  }

  setEditingStyle(editing: boolean, treeElement?: StylePropertyTreeElement|undefined) {
    if (this._isEditingStyle === editing) {
      return;
    }
    this.contentElement.classList.toggle('is-editing-style', editing);
    this._isEditingStyle = editing;
    this._setActiveProperty(null);
  }

  _setActiveProperty(treeElement: StylePropertyTreeElement|null) {
    if (this._isActivePropertyHighlighted) {
      SDK.OverlayModel.OverlayModel.hideDOMNodeHighlight();
    }
    this._isActivePropertyHighlighted = false;

    if (!this.node()) {
      return;
    }

    if (!treeElement || treeElement.overloaded() || treeElement.inherited()) {
      return;
    }

    const rule = treeElement.property.ownerStyle.parentRule;
    const selectorList = (rule instanceof SDK.CSSRule.CSSStyleRule) ? rule.selectorText() : undefined;
    for (const {properties, mode} of HIGHLIGHTABLE_PROPERTIES) {
      if (!properties.includes(treeElement.name)) {
        continue;
      }
      const node = this.node();
      if (!node) {
        continue;
      }
      node.domModel().overlayModel().highlightInOverlay(
          {node: (this.node() as SDK.DOMModel.DOMNode), selectorList}, mode);
      this._isActivePropertyHighlighted = true;
      break;
    }
  }

  /**
   * @override
   */
  onCSSModelChanged(event?: Common.EventTarget.EventTargetEvent|undefined) {
    const edit = event && event.data ? event.data.edit as SDK.CSSModel.Edit | null : null;
    if (edit) {
      for (const section of this.allSections()) {
        section._styleSheetEdited(edit);
      }
      return;
    }

    if (this._userOperation || this._isEditingStyle) {
      return;
    }

    this._resetCache();
    this.update();
  }

  focusedSectionIndex(): number {
    let index = 0;
    for (const block of this._sectionBlocks) {
      for (const section of block.sections) {
        if (section.element.hasFocus()) {
          return index;
        }
        index++;
      }
    }
    return -1;
  }

  continueEditingElement(sectionIndex: number, propertyIndex: number) {
    const section = this.allSections()[sectionIndex];
    if (section) {
      const element = (section.closestPropertyForEditing(propertyIndex) as StylePropertyTreeElement | null);
      if (!element) {
        section.element.focus();
        return;
      }
      element.startEditing();
    }
  }

  async _innerRebuildUpdate(matchedStyles: SDK.CSSMatchedStyles.CSSMatchedStyles|null): Promise<void> {
    // ElementsSidebarPane's throttler schedules this method. Usually,
    // rebuild is suppressed while editing (see onCSSModelChanged()), but we need a
    // 'force' flag since the currently running throttler process cannot be canceled.
    if (this._needsForceUpdate) {
      this._needsForceUpdate = false;
    } else if (this._isEditingStyle || this._userOperation) {
      return;
    }

    const focusedIndex = this.focusedSectionIndex();

    this._linkifier.reset();
    this._sectionBlocks = [];

    const node = this.node();
    this.hasMatchedStyles = matchedStyles !== null && node !== null;
    if (!this.hasMatchedStyles) {
      this._sectionsContainer.removeChildren();
      this._noMatchesElement.classList.remove('hidden');
      return;
    }

    this._sectionBlocks =
        await this._rebuildSectionsForMatchedStyleRules((matchedStyles as SDK.CSSMatchedStyles.CSSMatchedStyles));

    this._sectionsContainer.removeChildren();
    const fragment = document.createDocumentFragment();

    let index = 0;
    let elementToFocus: HTMLDivElement|null = null;
    for (const block of this._sectionBlocks) {
      const titleElement = block.titleElement();
      if (titleElement) {
        fragment.appendChild(titleElement);
      }
      for (const section of block.sections) {
        fragment.appendChild(section.element);
        if (index === focusedIndex) {
          elementToFocus = section.element;
        }
        index++;
      }
    }

    this._sectionsContainer.appendChild(fragment);

    if (elementToFocus) {
      elementToFocus.focus();
    }

    if (focusedIndex >= index) {
      this._sectionBlocks[0].sections[0].element.focus();
    }

    this._sectionsContainerFocusChanged();

    if (this._filterRegex) {
      this._updateFilter();
    } else {
      this._noMatchesElement.classList.toggle('hidden', this._sectionBlocks.length > 0);
    }

    this._nodeStylesUpdatedForTest((node as SDK.DOMModel.DOMNode), true);
    if (this._lastRevealedProperty) {
      this._decorator.highlightProperty(this._lastRevealedProperty);
      this._lastRevealedProperty = null;
    }

    // Record the elements tool load time after the sidepane has loaded.
    Host.userMetrics.panelLoaded('elements', 'DevTools.Launch.Elements');

    this.dispatchEventToListeners(Events.StylesUpdateCompleted, {hasStyle: true});
  }

  _nodeStylesUpdatedForTest(node: SDK.DOMModel.DOMNode, rebuild: boolean) {
    // For sniffing in tests.
  }

  async _rebuildSectionsForMatchedStyleRules(matchedStyles: SDK.CSSMatchedStyles.CSSMatchedStyles):
      Promise<SectionBlock[]> {
    if (this._idleCallbackManager) {
      this._idleCallbackManager.discard();
    }

    this._idleCallbackManager = new IdleCallbackManager();

    const blocks = [new SectionBlock(null)];
    let lastParentNode: SDK.DOMModel.DOMNode|null = null;
    for (const style of matchedStyles.nodeStyles()) {
      const parentNode = matchedStyles.isInherited(style) ? matchedStyles.nodeForStyle(style) : null;
      if (parentNode && parentNode !== lastParentNode) {
        lastParentNode = parentNode;
        const block = await SectionBlock._createInheritedNodeBlock(lastParentNode);
        blocks.push(block);
      }

      const lastBlock = blocks.peekLast();
      if (lastBlock) {
        this._idleCallbackManager.schedule(() => {
          const section = new StylePropertiesSection(this, matchedStyles, style);
          lastBlock.sections.push(section);
        });
      }
    }

    let pseudoTypes: Protocol.DOM.PseudoType[] = [];
    const keys = matchedStyles.pseudoTypes();
    if (keys.delete(Protocol.DOM.PseudoType.Before)) {
      pseudoTypes.push(Protocol.DOM.PseudoType.Before);
    }
    pseudoTypes = pseudoTypes.concat([...keys].sort());
    for (const pseudoType of pseudoTypes) {
      const block = SectionBlock.createPseudoTypeBlock(pseudoType);
      for (const style of matchedStyles.pseudoStyles(pseudoType)) {
        this._idleCallbackManager.schedule(() => {
          const section = new StylePropertiesSection(this, matchedStyles, style);
          block.sections.push(section);
        });
      }
      blocks.push(block);
    }

    for (const keyframesRule of matchedStyles.keyframes()) {
      const block = SectionBlock.createKeyframesBlock(keyframesRule.name().text);
      for (const keyframe of keyframesRule.keyframes()) {
        this._idleCallbackManager.schedule(() => {
          block.sections.push(new KeyframePropertiesSection(this, matchedStyles, keyframe.style));
        });
      }
      blocks.push(block);
    }

    await this._idleCallbackManager.awaitDone();

    return blocks;
  }

  async _createNewRuleInViaInspectorStyleSheet() {
    const cssModel = this.cssModel();
    const node = this.node();
    if (!cssModel || !node) {
      return;
    }
    this.setUserOperation(true);

    const styleSheetHeader = await cssModel.requestViaInspectorStylesheet((node as SDK.DOMModel.DOMNode));

    this.setUserOperation(false);
    await this._createNewRuleInStyleSheet(styleSheetHeader);
  }

  async _createNewRuleInStyleSheet(styleSheetHeader: SDK.CSSStyleSheetHeader.CSSStyleSheetHeader|null) {
    if (!styleSheetHeader) {
      return;
    }

    const text = (await styleSheetHeader.requestContent()).content || '';
    const lines = text.split('\n');
    const range = TextUtils.TextRange.TextRange.createFromLocation(lines.length - 1, lines[lines.length - 1].length);

    if (this._sectionBlocks && this._sectionBlocks.length > 0) {
      this._addBlankSection(this._sectionBlocks[0].sections[0], styleSheetHeader.id, range);
    }
  }

  _addBlankSection(
      insertAfterSection: StylePropertiesSection, styleSheetId: string, ruleLocation: TextUtils.TextRange.TextRange) {
    const node = this.node();
    const blankSection = new BlankStylePropertiesSection(
        this, insertAfterSection._matchedStyles, node ? node.simpleSelector() : '', styleSheetId, ruleLocation,
        insertAfterSection._style);

    this._sectionsContainer.insertBefore(blankSection.element, insertAfterSection.element.nextSibling);

    for (const block of this._sectionBlocks) {
      const index = block.sections.indexOf(insertAfterSection);
      if (index === -1) {
        continue;
      }
      block.sections.splice(index + 1, 0, blankSection);
      blankSection.startEditingSelector();
    }
  }

  removeSection(section: StylePropertiesSection) {
    for (const block of this._sectionBlocks) {
      const index = block.sections.indexOf(section);
      if (index === -1) {
        continue;
      }
      block.sections.splice(index, 1);
      section.element.remove();
    }
  }

  filterRegex(): RegExp|null {
    return this._filterRegex;
  }

  _updateFilter() {
    let hasAnyVisibleBlock: boolean|false = false;
    for (const block of this._sectionBlocks) {
      hasAnyVisibleBlock = block.updateFilter() || hasAnyVisibleBlock;
    }
    this._noMatchesElement.classList.toggle('hidden', !!hasAnyVisibleBlock);
  }

  willHide() {
    this.hideAllPopovers();
    super.willHide();
  }

  hideAllPopovers() {
    this._swatchPopoverHelper.hide();
    this._imagePreviewPopover.hide();
    if (this.activeCSSAngle) {
      this.activeCSSAngle.minify();
      this.activeCSSAngle = null;
    }
  }

  allSections(): StylePropertiesSection[] {
    /** @type {!Array<!StylePropertiesSection>} */
    let sections: StylePropertiesSection[] = [];
    for (const block of this._sectionBlocks) {
      sections = sections.concat(block.sections);
    }
    return sections;
  }

  _clipboardCopy(event: Event) {
    Host.userMetrics.actionTaken(Host.UserMetrics.Action.StyleRuleCopied);
  }

  _createStylesSidebarToolbar(): HTMLElement {
    const container = this.contentElement.createChild('div', 'styles-sidebar-pane-toolbar-container');
    const hbox = container.createChild('div', 'hbox styles-sidebar-pane-toolbar');
    const filterContainerElement = hbox.createChild('div', 'styles-sidebar-pane-filter-box');
    const filterInput =
        StylesSidebarPane.createPropertyFilterElement(ls`Filter`, hbox, this._onFilterChanged.bind(this));
    UI.ARIAUtils.setAccessibleName(filterInput, Common.UIString.UIString('Filter Styles'));
    filterContainerElement.appendChild(filterInput);
    const toolbar = new UI.Toolbar.Toolbar('styles-pane-toolbar', hbox);
    toolbar.makeToggledGray();
    toolbar.appendItemsAtLocation('styles-sidebarpane-toolbar');
    this._toolbar = toolbar;
    const toolbarPaneContainer = container.createChild('div', 'styles-sidebar-toolbar-pane-container');
    const toolbarPaneContent = (toolbarPaneContainer.createChild('div', 'styles-sidebar-toolbar-pane') as HTMLElement);

    return toolbarPaneContent;
  }

  showToolbarPane(widget: UI.Widget.Widget|null, toggle: UI.Toolbar.ToolbarToggle|null) {
    if (this._pendingWidgetToggle) {
      this._pendingWidgetToggle.setToggled(false);
    }
    this._pendingWidgetToggle = toggle;

    if (this._animatedToolbarPane) {
      this._pendingWidget = widget;
    } else {
      this._startToolbarPaneAnimation(widget);
    }

    if (widget && toggle) {
      toggle.setToggled(true);
    }
  }

  appendToolbarItem(item: UI.Toolbar.ToolbarItem) {
    if (this._toolbar) {
      this._toolbar.appendToolbarItem(item);
    }
  }

  _startToolbarPaneAnimation(widget: UI.Widget.Widget|null) {
    if (widget === this._currentToolbarPane) {
      return;
    }

    if (widget && this._currentToolbarPane) {
      this._currentToolbarPane.detach();
      widget.show(this._toolbarPaneElement);
      this._currentToolbarPane = widget;
      this._currentToolbarPane.focus();
      return;
    }

    this._animatedToolbarPane = widget;

    if (this._currentToolbarPane) {
      this._toolbarPaneElement.style.animationName = 'styles-element-state-pane-slideout';
    } else if (widget) {
      this._toolbarPaneElement.style.animationName = 'styles-element-state-pane-slidein';
    }

    if (widget) {
      widget.show(this._toolbarPaneElement);
    }

    const listener = onAnimationEnd.bind(this);
    this._toolbarPaneElement.addEventListener('animationend', listener, false);

    function onAnimationEnd(this: !StylesSidebarPane) {
      this._toolbarPaneElement.style.removeProperty('animation-name');
      this._toolbarPaneElement.removeEventListener('animationend', listener, false);

      if (this._currentToolbarPane) {
        this._currentToolbarPane.detach();
      }

      this._currentToolbarPane = this._animatedToolbarPane;
      if (this._currentToolbarPane) {
        this._currentToolbarPane.focus();
      }
      this._animatedToolbarPane = null;

      if (this._pendingWidget) {
        this._startToolbarPaneAnimation(this._pendingWidget);
        this._pendingWidget = null;
      }
    }
  }
}

export const enum Events {
  InitialUpdateCompleted = 'InitialUpdateCompleted',
  StylesUpdateCompleted = 'StylesUpdateCompleted'
}


export const _maxLinkLength = 23;

export class SectionBlock {
  _titleElement: Element|null;
  sections: StylePropertiesSection[];
  constructor(titleElement: Element|null) {
    this._titleElement = titleElement;
    this.sections = [];
  }

  static createPseudoTypeBlock(pseudoType: Protocol.DOM.PseudoType): SectionBlock {
    const separatorElement = document.createElement('div');
    separatorElement.className = 'sidebar-separator';
    separatorElement.textContent = Common.UIString.UIString('Pseudo ::%s element', pseudoType);
    return new SectionBlock(separatorElement);
  }

  static createKeyframesBlock(keyframesName: string): SectionBlock {
    const separatorElement = document.createElement('div');
    separatorElement.className = 'sidebar-separator';
    separatorElement.textContent = `@keyframes ${keyframesName}`;
    return new SectionBlock(separatorElement);
  }

  static async _createInheritedNodeBlock(node: SDK.DOMModel.DOMNode): Promise<SectionBlock> {
    const separatorElement = document.createElement('div');
    separatorElement.className = 'sidebar-separator';
    UI.UIUtils.createTextChild(separatorElement, ls`Inherited from${' '}`);
    const link = await Common.Linkifier.Linkifier.linkify(node, {
      preventKeyboardFocus: true,
      tooltip: undefined,
    });
    separatorElement.appendChild(link);
    return new SectionBlock(separatorElement);
  }

  updateFilter(): boolean {
    let hasAnyVisibleSection: boolean|false = false;
    for (const section of this.sections) {
      hasAnyVisibleSection = section._updateFilter() || hasAnyVisibleSection;
    }
    if (this._titleElement) {
      this._titleElement.classList.toggle('hidden', !hasAnyVisibleSection);
    }
    return !!hasAnyVisibleSection;
  }

  titleElement(): Element|null {
    return this._titleElement;
  }
}

export class IdleCallbackManager {
  _discarded: boolean;
  _promises: Promise<void>[];
  constructor() {
    this._discarded = false;
    this._promises = [];
  }

  discard() {
    this._discarded = true;
  }

  schedule(fn: () => void, timeout: number = 100) {
    if (this._discarded) {
      return;
    }
    this._promises.push(
        new Promise((resolve: (value: void|PromiseLike<void>) => void, reject: (reason?: any) => void) => {
          const run = () => {
            try {
              fn();
              resolve();
            } catch (err) {
              reject(err);
            }
          };
          window.requestIdleCallback(() => {
            if (this._discarded) {
              return resolve();
            }
            run();
          }, {timeout});
        }));
  }

  awaitDone() {
    return Promise.all(this._promises);
  }
}

export class StylePropertiesSection {
  _parentPane: StylesSidebarPane;
  _style: SDK.CSSStyleDeclaration.CSSStyleDeclaration;
  _matchedStyles: SDK.CSSMatchedStyles.CSSMatchedStyles;
  editable: boolean;
  _hoverTimer: number|null;
  _willCauseCancelEditing: boolean;
  _forceShowAll: boolean;
  _originalPropertiesCount: number;
  element: HTMLDivElement;
  _innerElement: HTMLElement;
  _titleElement: HTMLElement;
  propertiesTreeOutline: UI.TreeOutline.TreeOutlineInShadow;
  _showAllButton: HTMLButtonElement;
  _selectorElement: HTMLSpanElement;
  _newStyleRuleToolbar: (UI.Toolbar.Toolbar|undefined)|undefined;
  _fontEditorToolbar: (UI.Toolbar.Toolbar|undefined)|undefined;
  _fontEditorSectionManager: any;
  _fontEditorButton: (UI.Toolbar.ToolbarButton|undefined)|undefined;
  _selectedSinceMouseDown: boolean;
  _elementToSelectorIndex: WeakMap<Element, number>;
  navigable: (boolean|null|undefined)|undefined;
  _mediaListElement: HTMLElement;
  _selectorRefElement: HTMLElement;
  _selectorContainer: HTMLDivElement;
  _fontPopoverIcon: FontEditorSectionManager|null;
  _hoverableSelectorsMode: boolean;
  constructor(
      parentPane: StylesSidebarPane, matchedStyles: SDK.CSSMatchedStyles.CSSMatchedStyles,
      style: SDK.CSSStyleDeclaration.CSSStyleDeclaration) {
    this._parentPane = parentPane;
    this._style = style;
    this._matchedStyles = matchedStyles;
    this.editable = !!(style.styleSheetId && style.range);
    this._hoverTimer = null;
    this._willCauseCancelEditing = false;
    this._forceShowAll = false;
    this._originalPropertiesCount = style.leadingProperties().length;

    const rule = style.parentRule;
    this.element = document.createElement('div');
    this.element.classList.add('styles-section');
    this.element.classList.add('matched-styles');
    this.element.classList.add('monospace');
    UI.ARIAUtils.setAccessibleName(this.element, `${this._headerText()}, css selector`);
    this.element.tabIndex = -1;
    UI.ARIAUtils.markAsTreeitem(this.element);
    this.element.addEventListener('keydown', this._onKeyDown.bind(this), false);
    parentPane.sectionByElement.set(this.element, this);
    this._innerElement = this.element.createChild('div');

    this._titleElement =
        this._innerElement.createChild('div', 'styles-section-title ' + (rule ? 'styles-selector' : ''));

    this.propertiesTreeOutline = new UI.TreeOutline.TreeOutlineInShadow();
    this.propertiesTreeOutline.setFocusable(false);
    this.propertiesTreeOutline.registerRequiredCSS('elements/stylesSectionTree.css', {enableLegacyPatching: true});
    this.propertiesTreeOutline.element.classList.add('style-properties', 'matched-styles', 'monospace');
    // @ts-ignore TODO: fix ad hoc section property in a separate CL to be safe
    this.propertiesTreeOutline.section = this;
    this._innerElement.appendChild(this.propertiesTreeOutline.element);

    this._showAllButton = UI.UIUtils.createTextButton('', this._showAllItems.bind(this), 'styles-show-all');
    this._innerElement.appendChild(this._showAllButton);

    const selectorContainer = document.createElement('div');
    this._selectorElement = document.createElement('span');
    this._selectorElement.classList.add('selector');
    this._selectorElement.textContent = this._headerText();
    selectorContainer.appendChild(this._selectorElement);
    this._selectorElement.addEventListener('mouseenter', this._onMouseEnterSelector.bind(this), false);
    this._selectorElement.addEventListener('mousemove', (event: MouseEvent) => event.consume(), false);
    this._selectorElement.addEventListener('mouseleave', this._onMouseOutSelector.bind(this), false);

    const openBrace = selectorContainer.createChild('span', 'sidebar-pane-open-brace');
    openBrace.textContent = ' {';
    selectorContainer.addEventListener('mousedown', this._handleEmptySpaceMouseDown.bind(this), false);
    selectorContainer.addEventListener('click', this._handleSelectorContainerClick.bind(this), false);

    const closeBrace = this._innerElement.createChild('div', 'sidebar-pane-closing-brace');
    closeBrace.textContent = '}';

    if (this._style.parentRule) {
      const newRuleButton =
          new UI.Toolbar.ToolbarButton(Common.UIString.UIString('Insert Style Rule Below'), 'largeicon-add');
      newRuleButton.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, this._onNewRuleClick, this);
      newRuleButton.element.tabIndex = -1;
      if (!this._newStyleRuleToolbar) {
        this._newStyleRuleToolbar =
            new UI.Toolbar.Toolbar('sidebar-pane-section-toolbar new-rule-toolbar', this._innerElement);
      }
      this._newStyleRuleToolbar.appendToolbarItem(newRuleButton);
      UI.ARIAUtils.markAsHidden(this._newStyleRuleToolbar.element);
    }

    if (Root.Runtime.experiments.isEnabled('fontEditor') && this.editable) {
      this._fontEditorToolbar = new UI.Toolbar.Toolbar('sidebar-pane-section-toolbar', this._innerElement);
      this._fontEditorSectionManager = new FontEditorSectionManager(this._parentPane.swatchPopoverHelper(), this);
      this._fontEditorButton = new UI.Toolbar.ToolbarButton('Font Editor', 'largeicon-font-editor');
      this._fontEditorButton.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, () => {
        this._onFontEditorButtonClicked();
      }, this);
      this._fontEditorButton.element.addEventListener('keydown', (event: KeyboardEvent) => {
        if (isEnterOrSpaceKey(event)) {
          event.consume(true);
          this._onFontEditorButtonClicked();
        }
      }, false);
      this._fontEditorToolbar.appendToolbarItem(this._fontEditorButton);

      if (this._style.type === SDK.CSSStyleDeclaration.Type.Inline) {
        if (this._newStyleRuleToolbar) {
          this._newStyleRuleToolbar.element.classList.add('shifted-toolbar');
        }
      } else {
        this._fontEditorToolbar.element.classList.add('font-toolbar-hidden');
      }
    }

    this._selectorElement.addEventListener('click', this._handleSelectorClick.bind(this), false);
    this.element.addEventListener('contextmenu', this._handleContextMenuEvent.bind(this), false);
    this.element.addEventListener('mousedown', this._handleEmptySpaceMouseDown.bind(this), false);
    this.element.addEventListener('click', this._handleEmptySpaceClick.bind(this), false);
    this.element.addEventListener('mousemove', this._onMouseMove.bind(this), false);
    this.element.addEventListener('mouseleave', this._onMouseLeave.bind(this), false);
    this._selectedSinceMouseDown = false;

    this._elementToSelectorIndex = new WeakMap();

    if (rule) {
      // Prevent editing the user agent and user rules.
      if (rule.isUserAgent() || rule.isInjected()) {
        this.editable = false;
      } else {
        // Check this is a real CSSRule, not a bogus object coming from BlankStylePropertiesSection.
        if (rule.styleSheetId) {
          const header = rule.cssModel().styleSheetHeaderForId(rule.styleSheetId);
          this.navigable = header && !header.isAnonymousInlineStyleSheet();
        }
      }
    }

    this._mediaListElement = this._titleElement.createChild('div', 'media-list media-matches');
    this._selectorRefElement = this._titleElement.createChild('div', 'styles-section-subtitle');
    this._updateMediaList();
    this._updateRuleOrigin();
    this._titleElement.appendChild(selectorContainer);
    this._selectorContainer = selectorContainer;

    if (this.navigable) {
      this.element.classList.add('navigable');
    }

    if (!this.editable) {
      this.element.classList.add('read-only');
      this.propertiesTreeOutline.element.classList.add('read-only');
    }
    this._fontPopoverIcon = null;
    this._hoverableSelectorsMode = false;
    this._markSelectorMatches();
    this.onpopulate();
  }

  registerFontProperty(treeElement: StylePropertyTreeElement) {
    if (this._fontEditorSectionManager) {
      this._fontEditorSectionManager.registerFontProperty(treeElement);
    }
    if (this._fontEditorToolbar) {
      this._fontEditorToolbar.element.classList.remove('font-toolbar-hidden');
      if (this._newStyleRuleToolbar) {
        this._newStyleRuleToolbar.element.classList.add('shifted-toolbar');
      }
    }
  }

  resetToolbars() {
    if (this._parentPane.swatchPopoverHelper().isShowing() ||
        this._style.type === SDK.CSSStyleDeclaration.Type.Inline) {
      return;
    }
    if (this._fontEditorToolbar) {
      this._fontEditorToolbar.element.classList.add('font-toolbar-hidden');
    }
    if (this._newStyleRuleToolbar) {
      this._newStyleRuleToolbar.element.classList.remove('shifted-toolbar');
    }
  }

  static createRuleOriginNode(
      matchedStyles: SDK.CSSMatchedStyles.CSSMatchedStyles, linkifier: Components.Linkifier.Linkifier,
      rule: SDK.CSSRule.CSSRule|null): Node {
    if (!rule) {
      return document.createTextNode('');
    }

    const ruleLocation = this._getRuleLocationFromCSSRule(rule);

    const header = rule.styleSheetId ? matchedStyles.cssModel().styleSheetHeaderForId(rule.styleSheetId) : null;

    if (header && header.isMutable && !header.isViaInspector()) {
      const label = header.isConstructed ? Common.UIString.UIString('constructed stylesheet') : '<style>';
      if (header.ownerNode) {
        const link = linkifyDeferredNodeReference(header.ownerNode);
        link.textContent = label;
        return link;
      }
      return document.createTextNode(label);
    }

    if (ruleLocation && rule.styleSheetId && header && !header.isAnonymousInlineStyleSheet()) {
      return StylePropertiesSection._linkifyRuleLocation(
          matchedStyles.cssModel(), linkifier, rule.styleSheetId, ruleLocation);
    }

    if (rule.isUserAgent()) {
      return document.createTextNode(Common.UIString.UIString('user agent stylesheet'));
    }
    if (rule.isInjected()) {
      return document.createTextNode(Common.UIString.UIString('injected stylesheet'));
    }
    if (rule.isViaInspector()) {
      return document.createTextNode(Common.UIString.UIString('via inspector'));
    }

    if (header && header.ownerNode) {
      const link = linkifyDeferredNodeReference(header.ownerNode, {
        preventKeyboardFocus: true,
        tooltip: undefined,
      });
      link.textContent = '<style>';
      return link;
    }

    return document.createTextNode('');
  }

  static _getRuleLocationFromCSSRule(rule: SDK.CSSRule.CSSRule): TextUtils.TextRange.TextRange|null|undefined {
    let ruleLocation;
    if (rule instanceof SDK.CSSRule.CSSStyleRule) {
      ruleLocation = rule.style.range;
    } else if (rule instanceof SDK.CSSRule.CSSKeyframeRule) {
      ruleLocation = rule.key().range;
    }
    return ruleLocation;
  }

  static tryNavigateToRuleLocation(
      matchedStyles: SDK.CSSMatchedStyles.CSSMatchedStyles, rule: SDK.CSSRule.CSSRule|null) {
    if (!rule) {
      return;
    }

    const ruleLocation = this._getRuleLocationFromCSSRule(rule);
    const header = rule.styleSheetId ? matchedStyles.cssModel().styleSheetHeaderForId(rule.styleSheetId) : null;

    if (ruleLocation && rule.styleSheetId && header && !header.isAnonymousInlineStyleSheet()) {
      const matchingSelectorLocation =
          this._getCSSSelectorLocation(matchedStyles.cssModel(), rule.styleSheetId, ruleLocation);
      this._revealSelectorSource(matchingSelectorLocation, true);
    }
  }

  static _linkifyRuleLocation(
      cssModel: SDK.CSSModel.CSSModel, linkifier: Components.Linkifier.Linkifier, styleSheetId: string,
      ruleLocation: TextUtils.TextRange.TextRange): Node {
    const matchingSelectorLocation = this._getCSSSelectorLocation(cssModel, styleSheetId, ruleLocation);
    return linkifier.linkifyCSSLocation(matchingSelectorLocation);
  }

  static _getCSSSelectorLocation(
      cssModel: SDK.CSSModel.CSSModel, styleSheetId: string,
      ruleLocation: TextUtils.TextRange.TextRange): SDK.CSSModel.CSSLocation {
    const styleSheetHeader =
        (cssModel.styleSheetHeaderForId(styleSheetId) as SDK.CSSStyleSheetHeader.CSSStyleSheetHeader);
    const lineNumber = styleSheetHeader.lineNumberInSource(ruleLocation.startLine);
    const columnNumber = styleSheetHeader.columnNumberInSource(ruleLocation.startLine, ruleLocation.startColumn);
    return new SDK.CSSModel.CSSLocation(styleSheetHeader, lineNumber, columnNumber);
  }

  _onKeyDown(event: Event) {
    const keyboardEvent = (event as KeyboardEvent);
    if (UI.UIUtils.isEditing() || !this.editable || keyboardEvent.altKey || keyboardEvent.ctrlKey ||
        keyboardEvent.metaKey) {
      return;
    }
    switch (keyboardEvent.key) {
      case 'Enter':
      case ' ':
        this._startEditingAtFirstPosition();
        keyboardEvent.consume(true);
        break;
      default:
        // Filter out non-printable key strokes.
        if (keyboardEvent.key.length === 1) {
          this.addNewBlankProperty(0).startEditing();
        }
        break;
    }
  }

  _setSectionHovered(isHovered: boolean) {
    this.element.classList.toggle('styles-panel-hovered', isHovered);
    this.propertiesTreeOutline.element.classList.toggle('styles-panel-hovered', isHovered);
    if (this._hoverableSelectorsMode !== isHovered) {
      this._hoverableSelectorsMode = isHovered;
      this._markSelectorMatches();
    }
  }

  _onMouseLeave(event: Event) {
    this._setSectionHovered(false);
    this._parentPane._setActiveProperty(null);
  }

  _onMouseMove(event: MouseEvent) {
    const hasCtrlOrMeta = UI.KeyboardShortcut.KeyboardShortcut.eventHasCtrlOrMeta((event as MouseEvent));
    this._setSectionHovered(hasCtrlOrMeta);

    const treeElement = this.propertiesTreeOutline.treeElementFromEvent(event);
    if (treeElement instanceof StylePropertyTreeElement) {
      this._parentPane._setActiveProperty((treeElement as StylePropertyTreeElement));
    } else {
      this._parentPane._setActiveProperty(null);
    }
    const selection = this.element.getComponentSelection();
    if (!this._selectedSinceMouseDown && selection && selection.toString()) {
      this._selectedSinceMouseDown = true;
    }
  }

  _onFontEditorButtonClicked() {
    if (this._fontEditorSectionManager && this._fontEditorButton) {
      Host.userMetrics.cssEditorOpened('fontEditor');
      this._fontEditorSectionManager.showPopover(this._fontEditorButton.element, this._parentPane);
    }
  }

  style(): SDK.CSSStyleDeclaration.CSSStyleDeclaration {
    return this._style;
  }

  _headerText(): string {
    const node = this._matchedStyles.nodeForStyle(this._style);
    if (this._style.type === SDK.CSSStyleDeclaration.Type.Inline) {
      return this._matchedStyles.isInherited(this._style) ? Common.UIString.UIString('Style Attribute') :
                                                            'element.style';
    }
    if (node && this._style.type === SDK.CSSStyleDeclaration.Type.Attributes) {
      return ls`${node.nodeNameInCorrectCase()}[Attributes Style]`;
    }
    if (this._style.parentRule instanceof SDK.CSSRule.CSSStyleRule) {
      return this._style.parentRule.selectorText();
    }
    return '';
  }

  _onMouseOutSelector() {
    if (this._hoverTimer) {
      clearTimeout(this._hoverTimer);
    }
    SDK.OverlayModel.OverlayModel.hideDOMNodeHighlight();
  }

  _onMouseEnterSelector() {
    if (this._hoverTimer) {
      clearTimeout(this._hoverTimer);
    }
    this._hoverTimer = setTimeout(this._highlight.bind(this), 300);
  }

  _highlight(mode: string|undefined = 'all') {
    SDK.OverlayModel.OverlayModel.hideDOMNodeHighlight();
    const node = this._parentPane.node();
    if (!node) {
      return;
    }
    const selectorList = this._style.parentRule && this._style.parentRule instanceof SDK.CSSRule.CSSStyleRule ?
        this._style.parentRule.selectorText() :
        undefined;
    node.domModel().overlayModel().highlightInOverlay({node, selectorList}, mode);
  }

  firstSibling(): StylePropertiesSection|null {
    const parent = this.element.parentElement;
    if (!parent) {
      return null;
    }

    let childElement: (ChildNode|null) = parent.firstChild;
    while (childElement) {
      const childSection = this._parentPane.sectionByElement.get(childElement);
      if (childSection) {
        return childSection;
      }
      childElement = childElement.nextSibling;
    }

    return null;
  }

  lastSibling(): StylePropertiesSection|null {
    const parent = this.element.parentElement;
    if (!parent) {
      return null;
    }

    let childElement: (ChildNode|null) = parent.lastChild;
    while (childElement) {
      const childSection = this._parentPane.sectionByElement.get(childElement);
      if (childSection) {
        return childSection;
      }
      childElement = childElement.previousSibling;
    }

    return null;
  }

  nextSibling(): StylePropertiesSection|undefined {
    /** @type {?Node} */
    let curElement: (ChildNode|null)|HTMLDivElement = this.element;
    do {
      curElement = curElement.nextSibling;
    } while (curElement && !this._parentPane.sectionByElement.has(curElement));

    if (curElement) {
      return this._parentPane.sectionByElement.get(curElement);
    }
    return;
  }

  previousSibling(): StylePropertiesSection|undefined {
    /** @type {?Node} */
    let curElement: (ChildNode|null)|HTMLDivElement = this.element;
    do {
      curElement = curElement.previousSibling;
    } while (curElement && !this._parentPane.sectionByElement.has(curElement));

    if (curElement) {
      return this._parentPane.sectionByElement.get(curElement);
    }
    return;
  }

  _onNewRuleClick(event: Common.EventTarget.EventTargetEvent) {
    event.data.consume();
    const rule = this._style.parentRule;
    if (!rule || !rule.style.range) {
      return;
    }
    const range =
        TextUtils.TextRange.TextRange.createFromLocation(rule.style.range.endLine, rule.style.range.endColumn + 1);
    this._parentPane._addBlankSection(this, (rule.styleSheetId as string), range);
  }

  _styleSheetEdited(edit: SDK.CSSModel.Edit) {
    const rule = this._style.parentRule;
    if (rule) {
      rule.rebase(edit);
    } else {
      this._style.rebase(edit);
    }

    this._updateMediaList();
    this._updateRuleOrigin();
  }

  _createMediaList(mediaRules: SDK.CSSMedia.CSSMedia[]) {
    for (let i = mediaRules.length - 1; i >= 0; --i) {
      const media = mediaRules[i];
      // Don't display trivial non-print media types.
      if (!media.text || !media.text.includes('(') && media.text !== 'print') {
        continue;
      }
      const mediaDataElement = this._mediaListElement.createChild('div', 'media');
      const mediaContainerElement = mediaDataElement.createChild('span');
      const mediaTextElement = mediaContainerElement.createChild('span', 'media-text');
      switch (media.source) {
        case SDK.CSSMedia.Source.LINKED_SHEET:
        case SDK.CSSMedia.Source.INLINE_SHEET: {
          mediaTextElement.textContent = `media="${media.text}"`;
          break;
        }
        case SDK.CSSMedia.Source.MEDIA_RULE: {
          const decoration = mediaContainerElement.createChild('span');
          mediaContainerElement.insertBefore(decoration, mediaTextElement);
          decoration.textContent = '@media ';
          mediaTextElement.textContent = media.text;
          if (media.styleSheetId) {
            mediaDataElement.classList.add('editable-media');
            mediaTextElement.addEventListener(
                'click', this._handleMediaRuleClick.bind(this, media, mediaTextElement), false);
          }
          break;
        }
        case SDK.CSSMedia.Source.IMPORT_RULE: {
          mediaTextElement.textContent = `@import ${media.text}`;
          break;
        }
      }
    }
  }

  _updateMediaList() {
    this._mediaListElement.removeChildren();
    if (this._style.parentRule && this._style.parentRule instanceof SDK.CSSRule.CSSStyleRule) {
      this._createMediaList(this._style.parentRule.media);
    }
  }

  isPropertyInherited(propertyName: string): boolean {
    if (this._matchedStyles.isInherited(this._style)) {
      // While rendering inherited stylesheet, reverse meaning of this property.
      // Render truly inherited properties with black, i.e. return them as non-inherited.
      return !SDK.CSSMetadata.cssMetadata().isPropertyInherited(propertyName);
    }
    return false;
  }

  nextEditableSibling(): StylePropertiesSection|null {
    /** @type {?StylePropertiesSection|undefined} */
    let curSection: (StylePropertiesSection|undefined)|(StylePropertiesSection | null)|this = this;
    do {
      curSection = curSection.nextSibling();
    } while (curSection && !curSection.editable);

    if (!curSection) {
      curSection = this.firstSibling();
      while (curSection && !curSection.editable) {
        curSection = curSection.nextSibling();
      }
    }

    return (curSection && curSection.editable) ? curSection : null;
  }

  previousEditableSibling(): StylePropertiesSection|null {
    /** @type {?StylePropertiesSection|undefined} */
    let curSection: (StylePropertiesSection|undefined)|(StylePropertiesSection | null)|this = this;
    do {
      curSection = curSection.previousSibling();
    } while (curSection && !curSection.editable);

    if (!curSection) {
      curSection = this.lastSibling();
      while (curSection && !curSection.editable) {
        curSection = curSection.previousSibling();
      }
    }

    return (curSection && curSection.editable) ? curSection : null;
  }

  refreshUpdate(editedTreeElement: StylePropertyTreeElement) {
    this._parentPane._refreshUpdate(this, editedTreeElement);
  }

  _updateVarFunctions(editedTreeElement: StylePropertyTreeElement) {
    let child: (UI.TreeOutline.TreeElement|null) = this.propertiesTreeOutline.firstChild();
    while (child) {
      if (child !== editedTreeElement && child instanceof StylePropertyTreeElement) {
        child.updateTitleIfComputedValueChanged();
      }
      child = child.traverseNextTreeElement(false /* skipUnrevealed */, null /* stayWithin */, true /* dontPopulate */);
    }
  }

  update(full: boolean) {
    this._selectorElement.textContent = this._headerText();
    this._markSelectorMatches();
    if (full) {
      this.onpopulate();
    } else {
      let child: (UI.TreeOutline.TreeElement|null) = this.propertiesTreeOutline.firstChild();
      while (child && child instanceof StylePropertyTreeElement) {
        child.setOverloaded(this._isPropertyOverloaded(child.property));
        child =
            child.traverseNextTreeElement(false /* skipUnrevealed */, null /* stayWithin */, true /* dontPopulate */);
      }
    }
  }

  _showAllItems(event?: Event|undefined) {
    if (event) {
      event.consume();
    }
    if (this._forceShowAll) {
      return;
    }
    this._forceShowAll = true;
    this.onpopulate();
  }

  onpopulate() {
    this._parentPane._setActiveProperty(null);
    this.propertiesTreeOutline.removeChildren();
    const style = this._style;
    let count = 0;
    const properties = style.leadingProperties();
    const maxProperties = StylePropertiesSection.MaxProperties + properties.length - this._originalPropertiesCount;

    for (const property of properties) {
      if (!this._forceShowAll && count >= maxProperties) {
        break;
      }
      count++;
      const isShorthand = !!style.longhandProperties(property.name).length;
      const inherited = this.isPropertyInherited(property.name);
      const overloaded = this._isPropertyOverloaded(property);
      if (style.parentRule && style.parentRule.isUserAgent() && inherited) {
        continue;
      }
      const item = new StylePropertyTreeElement(
          this._parentPane, this._matchedStyles, property, isShorthand, inherited, overloaded, false);
      this.propertiesTreeOutline.appendChild(item);
    }

    if (count < properties.length) {
      this._showAllButton.classList.remove('hidden');
      this._showAllButton.textContent = ls`Show All Properties (${properties.length - count} more)`;
    } else {
      this._showAllButton.classList.add('hidden');
    }
  }

  _isPropertyOverloaded(property: SDK.CSSProperty.CSSProperty): boolean {
    return this._matchedStyles.propertyState(property) === SDK.CSSMatchedStyles.PropertyState.Overloaded;
  }

  _updateFilter(): boolean {
    let hasMatchingChild: boolean|false = false;
    this._showAllItems();
    for (const child of this.propertiesTreeOutline.rootElement().children()) {
      if (child instanceof StylePropertyTreeElement) {
        const childHasMatches = child.updateFilter();
        hasMatchingChild = hasMatchingChild || childHasMatches;
      }
    }

    const regex = this._parentPane.filterRegex();
    const hideRule = !hasMatchingChild && !!regex && !regex.test(this.element.deepTextContent());
    this.element.classList.toggle('hidden', hideRule);
    if (!hideRule && this._style.parentRule) {
      this._markSelectorHighlights();
    }
    return !hideRule;
  }

  _markSelectorMatches() {
    const rule = this._style.parentRule;
    if (!rule || !(rule instanceof SDK.CSSRule.CSSStyleRule)) {
      return;
    }

    this._mediaListElement.classList.toggle('media-matches', this._matchedStyles.mediaMatches(this._style));

    const selectorTexts = rule.selectors.map((selector: CSSValue) => selector.text);
    const matchingSelectorIndexes = this._matchedStyles.matchingSelectors(rule);
    const matchingSelectors = (new Array(selectorTexts.length).fill(false) as boolean[]);
    for (const matchingIndex of matchingSelectorIndexes) {
      matchingSelectors[matchingIndex] = true;
    }

    if (this._parentPane._isEditingStyle) {
      return;
    }

    const fragment = this._hoverableSelectorsMode ? this._renderHoverableSelectors(selectorTexts, matchingSelectors) :
                                                    this._renderSimplifiedSelectors(selectorTexts, matchingSelectors);
    this._selectorElement.removeChildren();
    this._selectorElement.appendChild(fragment);
    this._markSelectorHighlights();
  }

  _renderHoverableSelectors(selectors: string[], matchingSelectors: boolean[]): DocumentFragment {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < selectors.length; ++i) {
      if (i) {
        UI.UIUtils.createTextChild(fragment, ', ');
      }
      fragment.appendChild(this._createSelectorElement(selectors[i], matchingSelectors[i], i));
    }
    return fragment;
  }

  _createSelectorElement(text: string, isMatching: boolean, navigationIndex?: number|undefined): Element {
    const element = document.createElement('span');
    element.classList.add('simple-selector');
    element.classList.toggle('selector-matches', isMatching);
    if (typeof navigationIndex === 'number') {
      this._elementToSelectorIndex.set(element, navigationIndex);
    }
    element.textContent = text;
    return element;
  }

  _renderSimplifiedSelectors(selectors: string[], matchingSelectors: boolean[]): DocumentFragment {
    const fragment = document.createDocumentFragment();
    let currentMatching: boolean|false = false;
    let text: '' = '';
    for (let i = 0; i < selectors.length; ++i) {
      if (currentMatching !== matchingSelectors[i] && text) {
        fragment.appendChild(this._createSelectorElement(text, currentMatching));
        text = '';
      }
      currentMatching = matchingSelectors[i];
      text += selectors[i] + (i === selectors.length - 1 ? '' : ', ');
    }
    if (text) {
      fragment.appendChild(this._createSelectorElement(text, currentMatching));
    }
    return fragment;
  }

  _markSelectorHighlights() {
    const selectors = this._selectorElement.getElementsByClassName('simple-selector');
    const regex = this._parentPane.filterRegex();
    for (let i = 0; i < selectors.length; ++i) {
      const selectorMatchesFilter = !!regex && regex.test(selectors[i].textContent || '');
      selectors[i].classList.toggle('filter-match', selectorMatchesFilter);
    }
  }

  _checkWillCancelEditing(): boolean {
    const willCauseCancelEditing = this._willCauseCancelEditing;
    this._willCauseCancelEditing = false;
    return willCauseCancelEditing;
  }

  _handleSelectorContainerClick(event: Event) {
    if (this._checkWillCancelEditing() || !this.editable) {
      return;
    }
    if (event.target === this._selectorContainer) {
      this.addNewBlankProperty(0).startEditing();
      event.consume(true);
    }
  }

  addNewBlankProperty(index: number|undefined = this.propertiesTreeOutline.rootElement().childCount()):
      StylePropertyTreeElement {
    const property = this._style.newBlankProperty(index);
    const item =
        new StylePropertyTreeElement(this._parentPane, this._matchedStyles, property, false, false, false, true);
    this.propertiesTreeOutline.insertChild(item, property.index);
    return item;
  }

  _handleEmptySpaceMouseDown() {
    this._willCauseCancelEditing = this._parentPane._isEditingStyle;
    this._selectedSinceMouseDown = false;
  }

  _handleEmptySpaceClick(event: Event) {
    if (!this.editable || this.element.hasSelection() || this._checkWillCancelEditing() ||
        this._selectedSinceMouseDown) {
      return;
    }

    const target = (event.target as Element);

    if (target.classList.contains('header') || this.element.classList.contains('read-only') ||
        target.enclosingNodeOrSelfWithClass('media')) {
      event.consume();
      return;
    }
    const deepTarget = UI.UIUtils.deepElementFromEvent(event);
    const treeElement = deepTarget && UI.TreeOutline.TreeElement.getTreeElementBylistItemNode(deepTarget);
    if (treeElement && treeElement instanceof StylePropertyTreeElement) {
      this.addNewBlankProperty(treeElement.property.index + 1).startEditing();
    } else {
      this.addNewBlankProperty().startEditing();
    }
    event.consume(true);
  }

  _handleMediaRuleClick(media: SDK.CSSMedia.CSSMedia, element: Element, event: Event) {
    if (UI.UIUtils.isBeingEdited(element)) {
      return;
    }

    if (UI.KeyboardShortcut.KeyboardShortcut.eventHasCtrlOrMeta((event as MouseEvent)) && this.navigable) {
      const location = media.rawLocation();
      if (!location) {
        event.consume(true);
        return;
      }
      const uiLocation = Bindings.CSSWorkspaceBinding.CSSWorkspaceBinding.instance().rawLocationToUILocation(location);
      if (uiLocation) {
        Common.Revealer.reveal(uiLocation);
      }
      event.consume(true);
      return;
    }

    if (!this.editable) {
      return;
    }

    const config = new UI.InplaceEditor.Config(
        this._editingMediaCommitted.bind(this, media), this._editingMediaCancelled.bind(this, element), undefined,
        this._editingMediaBlurHandler.bind(this));
    UI.InplaceEditor.InplaceEditor.startEditing(element, (config as UI.InplaceEditor.Config<any>));

    const selection = element.getComponentSelection();
    if (selection) {
      selection.selectAllChildren(element);
    }
    this._parentPane.setEditingStyle(true);
    const parentMediaElement = element.enclosingNodeOrSelfWithClass('media');
    parentMediaElement.classList.add('editing-media');

    event.consume(true);
  }

  _editingMediaFinished(element: Element) {
    this._parentPane.setEditingStyle(false);
    const parentMediaElement = element.enclosingNodeOrSelfWithClass('media');
    parentMediaElement.classList.remove('editing-media');
  }

  _editingMediaCancelled(element: Element) {
    this._editingMediaFinished(element);
    // Mark the selectors in group if necessary.
    // This is overridden by BlankStylePropertiesSection.
    this._markSelectorMatches();
    const selection = element.getComponentSelection();
    if (selection) {
      selection.collapse(element, 0);
    }
  }

  _editingMediaBlurHandler(): boolean {
    return true;
  }

  _editingMediaCommitted(
      media: SDK.CSSMedia.CSSMedia, element: Element, newContent: string, oldContent: string,
      context: Context|undefined, moveDirection: string) {
    this._parentPane.setEditingStyle(false);
    this._editingMediaFinished(element);

    if (newContent) {
      newContent = newContent.trim();
    }

    function userCallback(this: StylePropertiesSection, success: boolean) {
      if (success) {
        this._matchedStyles.resetActiveProperties();
        this._parentPane._refreshUpdate(this);
      }
      this._parentPane.setUserOperation(false);
      this._editingMediaTextCommittedForTest();
    }

    // This gets deleted in finishOperation(), which is called both on success and failure.
    this._parentPane.setUserOperation(true);
    const cssModel = this._parentPane.cssModel();
    if (cssModel && media.styleSheetId) {
      cssModel.setMediaText(media.styleSheetId, (media.range as TextUtils.TextRange.TextRange), newContent)
          .then(userCallback.bind(this));
    }
  }

  _editingMediaTextCommittedForTest() {
  }

  _handleSelectorClick(event: Event) {
    const target = (event.target as Element | null);
    if (!target) {
      return;
    }
    if (UI.KeyboardShortcut.KeyboardShortcut.eventHasCtrlOrMeta((event as MouseEvent)) && this.navigable &&
        target.classList.contains('simple-selector')) {
      const selectorIndex = this._elementToSelectorIndex.get(target);
      if (selectorIndex) {
        this._navigateToSelectorSource(selectorIndex, true);
      }
      event.consume(true);
      return;
    }
    if (this.element.hasSelection()) {
      return;
    }
    this._startEditingAtFirstPosition();
    event.consume(true);
  }

  _handleContextMenuEvent(event: Event) {
    const target = (event.target as Element | null);
    if (!target) {
      return;
    }

    const contextMenu = new UI.ContextMenu.ContextMenu(event);
    contextMenu.clipboardSection().appendItem(ls`Copy selector`, () => {
      const selectorText = this._headerText();
      Host.InspectorFrontendHost.InspectorFrontendHostInstance.copyText(selectorText);
    });

    contextMenu.clipboardSection().appendItem(ls`Copy rule`, () => {
      const ruleText = StylesSidebarPane.formatLeadingProperties(this).ruleText;
      Host.InspectorFrontendHost.InspectorFrontendHostInstance.copyText(ruleText);
    });

    contextMenu.clipboardSection().appendItem(ls`Copy all declarations`, () => {
      const allDeclarationText = StylesSidebarPane.formatLeadingProperties(this).allDeclarationText;
      Host.InspectorFrontendHost.InspectorFrontendHostInstance.copyText(allDeclarationText);
    });

    contextMenu.show();
  }

  _navigateToSelectorSource(index: number, focus: boolean) {
    const cssModel = this._parentPane.cssModel();
    if (!cssModel) {
      return;
    }
    const rule = (this._style.parentRule as SDK.CSSRule.CSSStyleRule | null);
    if (!rule) {
      return;
    }
    const header = cssModel.styleSheetHeaderForId((rule.styleSheetId as string));
    if (!header) {
      return;
    }
    const rawLocation =
        new SDK.CSSModel.CSSLocation(header, rule.lineNumberInSource(index), rule.columnNumberInSource(index));
    StylePropertiesSection._revealSelectorSource(rawLocation, focus);
  }

  static _revealSelectorSource(rawLocation: SDK.CSSModel.CSSLocation, focus: boolean) {
    const uiLocation = Bindings.CSSWorkspaceBinding.CSSWorkspaceBinding.instance().rawLocationToUILocation(rawLocation);
    if (uiLocation) {
      Common.Revealer.reveal(uiLocation, !focus);
    }
  }

  _startEditingAtFirstPosition() {
    if (!this.editable) {
      return;
    }

    if (!this._style.parentRule) {
      this.moveEditorFromSelector('forward');
      return;
    }

    this.startEditingSelector();
  }

  startEditingSelector() {
    const element = this._selectorElement;
    if (UI.UIUtils.isBeingEdited(element)) {
      return;
    }

    element.scrollIntoViewIfNeeded(false);
    // Reset selector marks in group, and normalize whitespace.
    const textContent = element.textContent;
    if (textContent !== null) {
      element.textContent = textContent.replace(/\s+/g, ' ').trim();
    }

    const config =
        new UI.InplaceEditor.Config(this.editingSelectorCommitted.bind(this), this.editingSelectorCancelled.bind(this));
    UI.InplaceEditor.InplaceEditor.startEditing(this._selectorElement, (config as UI.InplaceEditor.Config<any>));

    const selection = element.getComponentSelection();
    if (selection) {
      selection.selectAllChildren(element);
    }
    this._parentPane.setEditingStyle(true);
    if (element.classList.contains('simple-selector')) {
      this._navigateToSelectorSource(0, false);
    }
  }

  moveEditorFromSelector(moveDirection: string) {
    this._markSelectorMatches();

    if (!moveDirection) {
      return;
    }

    if (moveDirection === 'forward') {
      const firstChild = (this.propertiesTreeOutline.firstChild() as StylePropertyTreeElement);
      /** @type {?StylePropertyTreeElement} */
      let currentChild: (StylePropertyTreeElement|null)|StylePropertyTreeElement = firstChild;
      while (currentChild && currentChild.inherited()) {
        /** @type {?UI.TreeOutline.TreeElement} */
        const sibling = currentChild.nextSibling;
        currentChild = sibling instanceof StylePropertyTreeElement ? sibling : null;
      }
      if (!currentChild) {
        this.addNewBlankProperty().startEditing();
      } else {
        currentChild.startEditing(currentChild.nameElement);
      }
    } else {
      const previousSection = this.previousEditableSibling();
      if (!previousSection) {
        return;
      }

      previousSection.addNewBlankProperty().startEditing();
    }
  }

  editingSelectorCommitted(
      element: Element, newContent: string, oldContent: string, context: Context|undefined, moveDirection: string) {
    this._editingSelectorEnded();
    if (newContent) {
      newContent = newContent.trim();
    }
    if (newContent === oldContent) {
      // Revert to a trimmed version of the selector if need be.
      this._selectorElement.textContent = newContent;
      this.moveEditorFromSelector(moveDirection);
      return;
    }
    const rule = this._style.parentRule;
    if (!rule) {
      return;
    }

    function headerTextCommitted(this: StylePropertiesSection) {
      this._parentPane.setUserOperation(false);
      this.moveEditorFromSelector(moveDirection);
      this._editingSelectorCommittedForTest();
    }

    // This gets deleted in finishOperationAndMoveEditor(), which is called both on success and failure.
    this._parentPane.setUserOperation(true);
    this._setHeaderText(rule, newContent).then(headerTextCommitted.bind(this));
  }

  _setHeaderText(rule: SDK.CSSRule.CSSRule, newContent: string): Promise<void> {
    function onSelectorsUpdated(
        this: StylePropertiesSection, rule: SDK.CSSRule.CSSStyleRule, success: boolean): Promise<void> {
      if (!success) {
        return Promise.resolve();
      }
      return this._matchedStyles.recomputeMatchingSelectors(rule).then(updateSourceRanges.bind(this, rule));
    }

    function updateSourceRanges(this: StylePropertiesSection, rule: SDK.CSSRule.CSSStyleRule) {
      const doesAffectSelectedNode = this._matchedStyles.matchingSelectors(rule).length > 0;
      this.propertiesTreeOutline.element.classList.toggle('no-affect', !doesAffectSelectedNode);
      this._matchedStyles.resetActiveProperties();
      this._parentPane._refreshUpdate(this);
    }

    if (!(rule instanceof SDK.CSSRule.CSSStyleRule)) {
      return Promise.resolve();
    }
    const oldSelectorRange = rule.selectorRange();
    if (!oldSelectorRange) {
      return Promise.resolve();
    }
    return rule.setSelectorText(newContent).then(onSelectorsUpdated.bind(this, rule, Boolean(oldSelectorRange)));
  }

  _editingSelectorCommittedForTest() {
  }

  _updateRuleOrigin() {
    this._selectorRefElement.removeChildren();
    this._selectorRefElement.appendChild(StylePropertiesSection.createRuleOriginNode(
        this._matchedStyles, this._parentPane._linkifier, this._style.parentRule));
  }

  _editingSelectorEnded() {
    this._parentPane.setEditingStyle(false);
  }

  editingSelectorCancelled() {
    this._editingSelectorEnded();

    // Mark the selectors in group if necessary.
    // This is overridden by BlankStylePropertiesSection.
    this._markSelectorMatches();
  }

  /**
   * A property at or near an index and suitable for subsequent editing.
   * Either the last property, if index out-of-upper-bound,
   * or property at index, if such a property exists,
   * or otherwise, null.
   */
  closestPropertyForEditing(propertyIndex: number): UI.TreeOutline.TreeElement|null {
    const rootElement = this.propertiesTreeOutline.rootElement();
    if (propertyIndex >= rootElement.childCount()) {
      return rootElement.lastChild();
    }
    return rootElement.childAt(propertyIndex);
  }
}

StylePropertiesSection.MaxProperties = 50;

export class BlankStylePropertiesSection extends StylePropertiesSection {
  _normal: boolean;
  _ruleLocation: TextUtils.TextRange.TextRange;
  _styleSheetId: string;
  _style: SDK.CSSStyleDeclaration.CSSStyleDeclaration|undefined;
  constructor(
      stylesPane: StylesSidebarPane, matchedStyles: SDK.CSSMatchedStyles.CSSMatchedStyles, defaultSelectorText: string,
      styleSheetId: string, ruleLocation: TextUtils.TextRange.TextRange,
      insertAfterStyle: SDK.CSSStyleDeclaration.CSSStyleDeclaration) {
    const cssModel = (stylesPane.cssModel() as SDK.CSSModel.CSSModel);
    const rule = SDK.CSSRule.CSSStyleRule.createDummyRule(cssModel, defaultSelectorText);
    super(stylesPane, matchedStyles, rule.style);
    this._normal = false;
    this._ruleLocation = ruleLocation;
    this._styleSheetId = styleSheetId;
    this._selectorRefElement.removeChildren();
    this._selectorRefElement.appendChild(StylePropertiesSection._linkifyRuleLocation(
        cssModel, this._parentPane._linkifier, styleSheetId, this._actualRuleLocation()));
    if (insertAfterStyle && insertAfterStyle.parentRule &&
        insertAfterStyle.parentRule instanceof SDK.CSSRule.CSSStyleRule) {
      this._createMediaList(insertAfterStyle.parentRule.media);
    }
    this.element.classList.add('blank-section');
  }

  _actualRuleLocation(): TextUtils.TextRange.TextRange {
    const prefix = this._rulePrefix();
    const lines = prefix.split('\n');
    const lastLine = lines.peekLast();
    const editRange = new TextUtils.TextRange.TextRange(0, 0, lines.length - 1, lastLine ? lastLine.length : 0);
    return this._ruleLocation.rebaseAfterTextEdit(TextUtils.TextRange.TextRange.createFromLocation(0, 0), editRange);
  }

  _rulePrefix(): string {
    return this._ruleLocation.startLine === 0 && this._ruleLocation.startColumn === 0 ? '' : '\n\n';
  }

  /**
   * @return {boolean}
   */
  get isBlank() {
    return !this._normal;
  }

  /**
   * @override
   */
  editingSelectorCommitted(
      element: Element, newContent: string, oldContent: string, context: Context|undefined, moveDirection: string) {
    if (!this.isBlank) {
      super.editingSelectorCommitted(element, newContent, oldContent, context, moveDirection);
      return;
    }

    function onRuleAdded(this: BlankStylePropertiesSection, newRule: SDK.CSSRule.CSSStyleRule|null): Promise<void> {
      if (!newRule) {
        this.editingSelectorCancelled();
        this._editingSelectorCommittedForTest();
        return Promise.resolve();
      }
      return this._matchedStyles.addNewRule(newRule, this._matchedStyles.node())
          .then(onAddedToCascade.bind(this, newRule));
    }

    function onAddedToCascade(this: BlankStylePropertiesSection, newRule: SDK.CSSRule.CSSStyleRule) {
      const doesSelectorAffectSelectedNode = this._matchedStyles.matchingSelectors(newRule).length > 0;
      this._makeNormal(newRule);

      if (!doesSelectorAffectSelectedNode) {
        this.propertiesTreeOutline.element.classList.add('no-affect');
      }

      this._updateRuleOrigin();

      this._parentPane.setUserOperation(false);
      this._editingSelectorEnded();
      if (this.element.parentElement)  // Might have been detached already.
      {
        this.moveEditorFromSelector(moveDirection);
      }
      this._markSelectorMatches();

      this._editingSelectorCommittedForTest();
    }

    if (newContent) {
      newContent = newContent.trim();
    }
    this._parentPane.setUserOperation(true);

    const cssModel = this._parentPane.cssModel();
    const ruleText = this._rulePrefix() + newContent + ' {}';
    if (cssModel) {
      cssModel.addRule(this._styleSheetId, ruleText, this._ruleLocation).then(onRuleAdded.bind(this));
    }
  }

  editingSelectorCancelled() {
    this._parentPane.setUserOperation(false);
    if (!this.isBlank) {
      super.editingSelectorCancelled();
      return;
    }

    this._editingSelectorEnded();
    this._parentPane.removeSection(this);
  }

  _makeNormal(newRule: SDK.CSSRule.CSSRule) {
    this.element.classList.remove('blank-section');
    this._style = newRule.style;
    // FIXME: replace this instance by a normal StylePropertiesSection.
    this._normal = true;
  }
}

export class KeyframePropertiesSection extends StylePropertiesSection {
  constructor(
      stylesPane: StylesSidebarPane, matchedStyles: SDK.CSSMatchedStyles.CSSMatchedStyles,
      style: SDK.CSSStyleDeclaration.CSSStyleDeclaration) {
    super(stylesPane, matchedStyles, style);
    this._selectorElement.className = 'keyframe-key';
  }

  _headerText(): string {
    if (this._style.parentRule instanceof SDK.CSSRule.CSSKeyframeRule) {
      return this._style.parentRule.key().text;
    }
    return '';
  }

  /**
   * @override
   */
  _setHeaderText(rule: SDK.CSSRule.CSSRule, newContent: string): Promise<void> {
    function updateSourceRanges(this: KeyframePropertiesSection, success: boolean) {
      if (!success) {
        return;
      }
      this._parentPane._refreshUpdate(this);
    }

    if (!(rule instanceof SDK.CSSRule.CSSKeyframeRule)) {
      return Promise.resolve();
    }
    const oldRange = rule.key().range;
    if (!oldRange) {
      return Promise.resolve();
    }
    return rule.setKeyText(newContent).then(updateSourceRanges.bind(this));
  }

  isPropertyInherited(propertyName: string): boolean {
    return false;
  }

  _isPropertyOverloaded(property: SDK.CSSProperty.CSSProperty): boolean {
    return false;
  }

  _markSelectorHighlights() {
  }

  _markSelectorMatches() {
    if (this._style.parentRule instanceof SDK.CSSRule.CSSKeyframeRule) {
      this._selectorElement.textContent = this._style.parentRule.key().text;
    }
  }

  _highlight() {
  }
}

export function quoteFamilyName(familyName: string): string {
  return `'${familyName.replaceAll('\'', '\\\'')}'`;
}

export class CSSPropertyPrompt extends UI.TextPrompt.TextPrompt {
  _isColorAware: boolean;
  _cssCompletions: string[];
  _selectedNodeComputedStyles: Map<string, string>|null;
  _parentNodeComputedStyles: Map<string, string>|null;
  _treeElement: StylePropertyTreeElement;
  _isEditingName: boolean;
  _cssVariables: string[];
  constructor(treeElement: StylePropertyTreeElement, isEditingName: boolean) {
    // Use the same callback both for applyItemCallback and acceptItemCallback.
    super();
    this.initialize(this._buildPropertyCompletions.bind(this), UI.UIUtils.StyleValueDelimiters);
    const cssMetadata = SDK.CSSMetadata.cssMetadata();
    this._isColorAware = SDK.CSSMetadata.cssMetadata().isColorAwareProperty(treeElement.property.name);
    this._cssCompletions = [];
    const node = treeElement.node();
    if (isEditingName) {
      this._cssCompletions = cssMetadata.allProperties();
      if (node && !node.isSVGNode()) {
        this._cssCompletions = this._cssCompletions.filter((property: string) => !cssMetadata.isSVGProperty(property));
      }
    } else {
      this._cssCompletions = cssMetadata.propertyValues(treeElement.property.name);
      if (node && cssMetadata.isFontFamilyProperty(treeElement.property.name)) {
        const fontFamilies = node.domModel().cssModel().fontFaces().map(
            (font: SDK.CSSFontFace.CSSFontFace) => quoteFamilyName(font.getFontFamily()));
        this._cssCompletions.unshift(...fontFamilies);
      }
    }

    /**
     * Computed styles cache populated by cssFlexboxFeatures experiment.
     */
    this._selectedNodeComputedStyles = null;
    /**
     * Computed styles cache populated by cssFlexboxFeatures experiment.
     */
    this._parentNodeComputedStyles = null;
    this._treeElement = treeElement;
    this._isEditingName = isEditingName;
    this._cssVariables = treeElement.matchedStyles().availableCSSVariables(treeElement.property.ownerStyle);
    if (this._cssVariables.length < 1000) {
      this._cssVariables.sort(String.naturalOrderComparator);
    } else {
      this._cssVariables.sort();
    }

    if (!isEditingName) {
      this.disableDefaultSuggestionForEmptyInput();

      // If a CSS value is being edited that has a numeric or hex substring, hint that precision modifier shortcuts are available.
      if (treeElement && treeElement.valueElement) {
        const cssValueText = treeElement.valueElement.textContent;
        const cmdOrCtrl = Host.Platform.isMac() ? 'Cmd' : 'Ctrl';
        if (cssValueText !== null) {
          if (cssValueText.match(/#[\da-f]{3,6}$/i)) {
            this.setTitle(
                ls`Increment/decrement with mousewheel or up/down keys. ${cmdOrCtrl}: R ±1, Shift: G ±1, Alt: B ±1`);
          } else if (cssValueText.match(/\d+/)) {
            this.setTitle(
                ls`Increment/decrement with mousewheel or up/down keys. ${cmdOrCtrl}: ±100, Shift: ±10, Alt: ±0.1`);
          }
        }
      }
    }
  }

  /**
   * @override
   */
  onKeyDown(event: Event) {
    const keyboardEvent = (event as KeyboardEvent);
    switch (keyboardEvent.key) {
      case 'ArrowUp':
      case 'ArrowDown':
      case 'PageUp':
      case 'PageDown':
        if (!this.isSuggestBoxVisible() && this._handleNameOrValueUpDown(keyboardEvent)) {
          keyboardEvent.preventDefault();
          return;
        }
        break;
      case 'Enter':
        if (keyboardEvent.shiftKey) {
          return;
        }
        // Accept any available autocompletions and advance to the next field.
        this.tabKeyPressed();
        keyboardEvent.preventDefault();
        return;
    }

    super.onKeyDown(keyboardEvent);
  }

  onMouseWheel(event: Event) {
    if (this._handleNameOrValueUpDown(event)) {
      event.consume(true);
      return;
    }
    super.onMouseWheel(event);
  }

  tabKeyPressed(): boolean {
    this.acceptAutoComplete();

    // Always tab to the next field.
    return false;
  }

  _handleNameOrValueUpDown(event: Event): boolean {
    function finishHandler(this: CSSPropertyPrompt, originalValue: string, replacementString: string) {
      // Synthesize property text disregarding any comments, custom whitespace etc.
      if (this._treeElement.nameElement && this._treeElement.valueElement) {
        this._treeElement.applyStyleText(
            this._treeElement.nameElement.textContent + ': ' + this._treeElement.valueElement.textContent, false);
      }
    }

    function customNumberHandler(this: CSSPropertyPrompt, prefix: string, number: number, suffix: string): string {
      if (number !== 0 && !suffix.length &&
          SDK.CSSMetadata.cssMetadata().isLengthProperty(this._treeElement.property.name) &&
          !this._treeElement.property.value.toLowerCase().startsWith('calc(')) {
        suffix = 'px';
      }
      return prefix + number + suffix;
    }

    // Handle numeric value increment/decrement only at this point.
    if (!this._isEditingName && this._treeElement.valueElement &&
        UI.UIUtils.handleElementValueModifications(
            event, this._treeElement.valueElement, finishHandler.bind(this), this._isValueSuggestion.bind(this),
            customNumberHandler.bind(this))) {
      return true;
    }

    return false;
  }

  _isValueSuggestion(word: string): boolean {
    if (!word) {
      return false;
    }
    word = word.toLowerCase();
    return this._cssCompletions.indexOf(word) !== -1 || word.startsWith('--');
  }

  async _buildPropertyCompletions(expression: string, query: string, force?: boolean|undefined):
      Promise<UI.SuggestBox.Suggestions> {
    const lowerQuery = query.toLowerCase();
    const editingVariable = !this._isEditingName && expression.trim().endsWith('var(');
    if (!query && !force && !editingVariable && (this._isEditingName || expression)) {
      return Promise.resolve([]);
    }

    /** @type {!UI.SuggestBox.Suggestions} */
    const prefixResults = [];
    /** @type {!UI.SuggestBox.Suggestions} */
    const anywhereResults = [];
    if (!editingVariable) {
      this._cssCompletions.forEach(
          (completion: string) => filterCompletions.call(this, completion, false /* variable */));
    }
    const node = this._treeElement.node();
    if (this._isEditingName && node) {
      const nameValuePresets = SDK.CSSMetadata.cssMetadata().nameValuePresets(node.isSVGNode());
      nameValuePresets.forEach(
          (preset: string) => filterCompletions.call(this, preset, false /* variable */, true /* nameValue */));
    }
    if (this._isEditingName || editingVariable) {
      this._cssVariables.forEach((variable: string) => filterCompletions.call(this, variable, true /* variable */));
    }

    const results = prefixResults.concat(anywhereResults);
    if (!this._isEditingName && !results.length && query.length > 1 && '!important'.startsWith(lowerQuery)) {
      results.push({
        text: '!important',
        title: undefined,
        subtitle: undefined,
        iconType: undefined,
        priority: undefined,
        isSecondary: undefined,
        subtitleRenderer: undefined,
        selectionRange: undefined,
        hideGhostText: undefined,
        iconElement: undefined,
      });
    }
    const userEnteredText = query.replace('-', '');
    if (userEnteredText && (userEnteredText === userEnteredText.toUpperCase())) {
      for (let i = 0; i < results.length; ++i) {
        if (!results[i].text.startsWith('--')) {
          results[i].text = results[i].text.toUpperCase();
        }
      }
    }

    for (const result of results) {
      if (editingVariable) {
        result.title = result.text;
        result.text += ')';
        continue;
      }
      const valuePreset = SDK.CSSMetadata.cssMetadata().getValuePreset(this._treeElement.name, result.text);
      if (!this._isEditingName && valuePreset) {
        result.title = result.text;
        result.text = valuePreset.text;
        result.selectionRange = {startColumn: valuePreset.startColumn, endColumn: valuePreset.endColumn};
      }
    }

    if (Root.Runtime.experiments.isEnabled('cssFlexboxFeatures')) {
      const node = this._treeElement.node();

      const ensureComputedStyles = async () => {
        if (!node || this._selectedNodeComputedStyles) {
          return;
        }
        this._selectedNodeComputedStyles = await node.domModel().cssModel().computedStylePromise(node.id);
        const parentNode = node.parentNode;
        if (parentNode) {
          this._parentNodeComputedStyles = await parentNode.domModel().cssModel().computedStylePromise(node.id);
        }
      };

      for (const result of results) {
        await ensureComputedStyles();
        // Using parent node's computed styles does not work in all cases. For example:
        //
        // <div id="container" style="display:flex">
        //  <div id="useless" style="display:contents">
        //    <div id="item">item</div>
        //  </div>
        // </div>
        // TODO(crbug/1139945): Find a better way to get the flex container styles.
        const iconInfo = findIcon(
            this._isEditingName ? result.text : `${this._treeElement.property.name}: ${result.text}`,
            this._selectedNodeComputedStyles, this._parentNodeComputedStyles);
        if (!iconInfo) {
          continue;
        }
        const icon = new WebComponents.Icon.Icon();
        const width = '12.5px';
        const height = '12.5px';
        icon.data = {
          iconName: iconInfo.iconName,
          width,
          height,
          color: 'black',
        };
        icon.style.transform =
            `rotate(${iconInfo.rotate}deg) scale(${iconInfo.scaleX * 1.1}, ${iconInfo.scaleY * 1.1})`;
        icon.style.maxHeight = height;
        icon.style.maxWidth = width;
        result.iconElement = icon;
      }
    }

    if (this._isColorAware && !this._isEditingName) {
      results.sort((a: UI.SuggestBox.Suggestion, b: UI.SuggestBox.Suggestion) => {
        if (!!a.subtitleRenderer === !!b.subtitleRenderer) {
          return 0;
        }
        return a.subtitleRenderer ? -1 : 1;
      });
    }
    return Promise.resolve(results);

    function filterCompletions(
        this: CSSPropertyPrompt, completion: string, variable: boolean, nameValue?: boolean|undefined) {
      const index = completion.toLowerCase().indexOf(lowerQuery);
      /** @type {!UI.SuggestBox.Suggestion} */
      const result = {
        text: completion,
        title: undefined,
        subtitle: undefined,
        iconType: undefined,
        priority: undefined,
        isSecondary: undefined,
        subtitleRenderer: undefined,
        selectionRange: undefined,
        hideGhostText: undefined,
        iconElement: undefined,
      };
      if (variable) {
        const computedValue =
            this._treeElement.matchedStyles().computeCSSVariable(this._treeElement.property.ownerStyle, completion);
        if (computedValue) {
          const color = Common.Color.Color.parse(computedValue);
          if (color) {
            result.subtitleRenderer = swatchRenderer.bind(null, color);
          }
        }
      }
      if (nameValue) {
        result.hideGhostText = true;
      }
      if (index === 0) {
        result.priority = this._isEditingName ? SDK.CSSMetadata.cssMetadata().propertyUsageWeight(completion) : 1;
        prefixResults.push(result);
      } else if (index > -1) {
        anywhereResults.push(result);
      }
    }

    function swatchRenderer(color: Common.Color.Color): Element {
      const swatch = new InlineEditor.ColorSwatch.ColorSwatch();
      swatch.renderColor(color);
      swatch.style.pointerEvents = 'none';
      return swatch;
    }
  }
}

export class StylesSidebarPropertyRenderer {
  _rule: SDK.CSSRule.CSSRule|null;
  _node: SDK.DOMModel.DOMNode|null;
  _propertyName: string;
  _propertyValue: string;
  _colorHandler: ((arg0: string) => Node)|null;
  _bezierHandler: ((arg0: string) => Node)|null;
  _fontHandler: ((arg0: string) => Node)|null;
  _shadowHandler: ((arg0: string, arg1: string) => Node)|null;
  _gridHandler: ((arg0: string, arg1: string) => Node)|null;
  _varHandler: ((arg0: string) => Node)|null;
  _angleHandler: ((arg0: string) => Node)|null;
  constructor(rule: SDK.CSSRule.CSSRule|null, node: SDK.DOMModel.DOMNode|null, name: string, value: string) {
    this._rule = rule;
    this._node = node;
    this._propertyName = name;
    this._propertyValue = value;
    this._colorHandler = null;
    this._bezierHandler = null;
    this._fontHandler = null;
    this._shadowHandler = null;
    this._gridHandler = null;
    this._varHandler = document.createTextNode.bind(document);
    this._angleHandler = null;
  }

  setColorHandler(handler: (arg0: string) => Node) {
    this._colorHandler = handler;
  }

  setBezierHandler(handler: (arg0: string) => Node) {
    this._bezierHandler = handler;
  }

  setFontHandler(handler: (arg0: string) => Node) {
    this._fontHandler = handler;
  }

  setShadowHandler(handler: (arg0: string, arg1: string) => Node) {
    this._shadowHandler = handler;
  }

  setGridHandler(handler: (arg0: string, arg1: string) => Node) {
    this._gridHandler = handler;
  }

  setVarHandler(handler: (arg0: string) => Node) {
    this._varHandler = handler;
  }

  setAngleHandler(handler: (arg0: string) => Node) {
    this._angleHandler = handler;
  }

  renderName(): Element {
    const nameElement = document.createElement('span');
    nameElement.className = 'webkit-css-property';
    nameElement.textContent = this._propertyName;
    nameElement.normalize();
    return nameElement;
  }

  renderValue(): Element {
    const valueElement = document.createElement('span');
    valueElement.className = 'value';
    if (!this._propertyValue) {
      return valueElement;
    }

    const metadata = SDK.CSSMetadata.cssMetadata();

    if (this._shadowHandler && metadata.isShadowProperty(this._propertyName) &&
        !SDK.CSSMetadata.VariableRegex.test(this._propertyValue)) {
      valueElement.appendChild(this._shadowHandler(this._propertyValue, this._propertyName));
      valueElement.normalize();
      return valueElement;
    }

    if (this._gridHandler && metadata.isGridAreaDefiningProperty(this._propertyName)) {
      valueElement.appendChild(this._gridHandler(this._propertyValue, this._propertyName));
      valueElement.normalize();
      return valueElement;
    }

    if (metadata.isStringProperty(this._propertyName)) {
      UI.Tooltip.Tooltip.install(valueElement, unescapeCssString(this._propertyValue));
    }

    const regexes = [SDK.CSSMetadata.VariableRegex, SDK.CSSMetadata.URLRegex];
    const processors = [this._varHandler, this._processURL.bind(this)];
    if (this._bezierHandler && metadata.isBezierAwareProperty(this._propertyName)) {
      regexes.push(UI.Geometry.CubicBezier.Regex);
      processors.push(this._bezierHandler);
    }
    if (this._colorHandler && metadata.isColorAwareProperty(this._propertyName)) {
      regexes.push(Common.Color.Regex);
      processors.push(this._colorHandler);
    }
    if (this._angleHandler && metadata.isAngleAwareProperty(this._propertyName)) {
      // TODO(changhaohan): crbug.com/1138628 refactor this to handle unitless 0 cases
      regexes.push(InlineEditor.CSSAngleRegex.CSSAngleRegex);
      processors.push(this._angleHandler);
    }
    if (this._fontHandler && metadata.isFontAwareProperty(this._propertyName)) {
      if (this._propertyName === 'font-family') {
        regexes.push(InlineEditor.FontEditorUtils.FontFamilyRegex);
      } else {
        regexes.push(InlineEditor.FontEditorUtils.FontPropertiesRegex);
      }
      processors.push(this._fontHandler);
    }
    const results = TextUtils.TextUtils.Utils.splitStringByRegexes(this._propertyValue, regexes);
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const processor =
          result.regexIndex === -1 ? document.createTextNode.bind(document) : processors[result.regexIndex];
      if (processor) {
        valueElement.appendChild(processor(result.value));
      }
    }
    valueElement.normalize();
    return valueElement;
  }

  _processURL(text: string): Node {
    // Strip "url(" and ")" along with whitespace.
    let url: string = text.substring(4, text.length - 1).trim();
    const isQuoted = /^'.*'$/s.test(url) || /^".*"$/s.test(url);
    if (isQuoted) {
      url = url.substring(1, url.length - 1);
    }
    const container = document.createDocumentFragment();
    UI.UIUtils.createTextChild(container, 'url(');
    let hrefUrl: (string|null)|null = null;
    if (this._rule && this._rule.resourceURL()) {
      hrefUrl = Common.ParsedURL.ParsedURL.completeURL(this._rule.resourceURL(), url);
    } else if (this._node) {
      hrefUrl = this._node.resolveURL(url);
    }
    const link = ImagePreviewPopover.setImageUrl(
        Components.Linkifier.Linkifier.linkifyURL(hrefUrl || url, {
          text: url,
          preventClick: true,
          // crbug.com/1027168
          // We rely on CSS text-overflow: ellipsis to hide long URLs in the Style panel,
          // so that we don't have to keep two versions (original vs. trimmed) of URL
          // at the same time, which complicates both StylesSidebarPane and StylePropertyTreeElement.
          bypassURLTrimming: true,
          className: undefined,
          lineNumber: undefined,
          columnNumber: undefined,
          maxLength: undefined,
          tabStop: undefined,
        }),
        hrefUrl || url);
    container.appendChild(link);
    UI.UIUtils.createTextChild(container, ')');
    return container;
  }
}

export class ButtonProvider implements UI.Toolbar.Provider {
  _button: UI.Toolbar.ToolbarButton;
  constructor() {
    this._button = new UI.Toolbar.ToolbarButton(Common.UIString.UIString('New Style Rule'), 'largeicon-add');
    this._button.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, this._clicked, this);
    const longclickTriangle = UI.Icon.Icon.create('largeicon-longclick-triangle', 'long-click-glyph');
    this._button.element.appendChild(longclickTriangle);

    new UI.UIUtils.LongClickController(this._button.element, this._longClicked.bind(this));
    UI.Context.Context.instance().addFlavorChangeListener(SDK.DOMModel.DOMNode, onNodeChanged.bind(this));
    onNodeChanged.call(this);

    function onNodeChanged(this: ButtonProvider) {
      let node: (SDK.DOMModel.DOMNode|null) = UI.Context.Context.instance().flavor(SDK.DOMModel.DOMNode);
      node = node ? node.enclosingElementOrSelf() : null;
      this._button.setEnabled(!!node);
    }
  }

  _clicked(event: Common.EventTarget.EventTargetEvent) {
    StylesSidebarPane.instance()._createNewRuleInViaInspectorStyleSheet();
  }

  _longClicked(event: Event) {
    StylesSidebarPane.instance()._onAddButtonLongClick(event);
  }

  item(): UI.Toolbar.ToolbarItem {
    return this._button;
  }
}
