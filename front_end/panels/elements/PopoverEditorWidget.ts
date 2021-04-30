// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import '../../ui/components/icon_button/icon_button.js';

import * as IconButton from '../../ui/components/icon_button/icon_button.js';
import * as UI from '../../ui/legacy/legacy.js';

import {PropertyDeselectedEvent, PropertySelectedEvent} from './StylePropertyEditor.js';
import {StylePropertyTreeElement} from './StylePropertyTreeElement.js';
import {StylePropertiesSection, StylesSidebarPane} from './StylesSidebarPane.js';

let instance: PopoverEditorWidget|null = null;

interface Editor extends HTMLElement {
  addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) =>
          any,  // eslint-disable-line @typescript-eslint/no-explicit-any
      options?: boolean|AddEventListenerOptions): void;
  addEventListener(type: 'property-selected', callback: (event: PropertySelectedEvent) => void): void;
  addEventListener(type: 'property-deselected', callback: (event: PropertyDeselectedEvent) => void): void;
  removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) =>
          any,  // eslint-disable-line @typescript-eslint/no-explicit-any
      options?: boolean|AddEventListenerOptions): void;
  removeEventListener(type: 'property-selected', callback: (event: PropertySelectedEvent) => void): void;
  removeEventListener(type: 'property-deselected', callback: (event: PropertyDeselectedEvent) => void): void;
  data: {
    authoredProperties: Map<String, String>,
    computedProperties: Map<String, String>,
  };
  getEditableProperties(): Array<{propertyName: string}>;
}

/**
 * Thin UI.Widget wrapper around style editors to allow using it as a popover.
 */
export class PopoverEditorWidget extends UI.Widget.VBox {
  private editor?: Editor;
  private pane?: StylesSidebarPane;
  private section?: StylePropertiesSection;
  private editorContainer: HTMLElement;

  constructor() {
    super(true);
    this.contentElement.tabIndex = 0;
    this.setDefaultFocusedElement(this.contentElement);
    this.editorContainer = document.createElement('div');
    this.contentElement.appendChild(this.editorContainer);
    this.onPropertySelected = this.onPropertySelected.bind(this);
    this.onPropertyDeselected = this.onPropertyDeselected.bind(this);
  }

  getSection(): StylePropertiesSection|undefined {
    return this.section;
  }

  async onPropertySelected(event: PropertySelectedEvent): Promise<void> {
    if (!this.section) {
      return;
    }
    const target = ensureTreeElementForProperty(this.section, event.data.name);
    target.property.value = event.data.value;
    target.updateTitle();
    await target.applyStyleText(target.renderedPropertyText(), false);
    await this.render();
  }

  async onPropertyDeselected(event: PropertyDeselectedEvent): Promise<void> {
    if (!this.section) {
      return;
    }
    const target = ensureTreeElementForProperty(this.section, event.data.name);
    await target.applyStyleText('', false);
    await this.render();
  }

  bindContext(pane: StylesSidebarPane, section: StylePropertiesSection): void {
    this.pane = pane;
    this.section = section;
    this.editor?.addEventListener('property-selected', this.onPropertySelected);
    this.editor?.addEventListener('property-deselected', this.onPropertyDeselected);
  }

  unbindContext(): void {
    this.pane = undefined;
    this.section = undefined;
    this.editor?.removeEventListener('property-selected', this.onPropertySelected);
    this.editor?.removeEventListener('property-deselected', this.onPropertyDeselected);
  }

  async render(): Promise<void> {
    this.contentElement.removeChildren();
    if (this.editor) {
      this.editor.data = {
        authoredProperties: this.section ? getAuthoredStyles(this.section, this.editor.getEditableProperties()) :
                                           new Map(),
        computedProperties: this.pane ? await fetchComputedStyles(this.pane) : new Map(),
      };
      this.contentElement.appendChild(this.editor);
    }
  }

  static instance(): PopoverEditorWidget {
    if (!instance) {
      instance = new PopoverEditorWidget();
    }
    return instance;
  }

  setEditor(editor: Editor): void {
    this.editor = editor;
  }

  static createTriggerButton(
      pane: StylesSidebarPane, section: StylePropertiesSection, editor: Editor, buttonTitle: string): HTMLElement {
    const triggerButton = createButton(buttonTitle);

    triggerButton.onclick = async(event): Promise<void> => {
      event.stopPropagation();
      const popoverHelper = pane.swatchPopoverHelper();
      const widget = PopoverEditorWidget.instance();
      widget.setEditor(editor);
      widget.bindContext(pane, section);
      await widget.render();
      const scrollerElement = triggerButton.enclosingNodeOrSelfWithClass('style-panes-wrapper');
      const onScroll = (): void => {
        popoverHelper.hide(true);
      };
      popoverHelper.show(widget, triggerButton, () => {
        widget.unbindContext();
        if (scrollerElement) {
          scrollerElement.removeEventListener('scroll', onScroll);
        }
      });
      if (scrollerElement) {
        scrollerElement.addEventListener('scroll', onScroll);
      }
    };

    return triggerButton;
  }
}

function createButton(buttonTitle: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.classList.add('styles-pane-button');
  button.tabIndex = 0;
  button.title = buttonTitle;
  button.onmouseup = (event): void => {
    // Stop propagation to prevent the property editor from being activated.
    event.stopPropagation();
  };
  const icon = new IconButton.Icon.Icon();
  icon.data = {iconName: 'flex-wrap-icon', color: 'var(--color-text-secondary)', width: '12px', height: '12px'};
  button.appendChild(icon);
  return button;
}

function ensureTreeElementForProperty(section: StylePropertiesSection, propertyName: string): StylePropertyTreeElement {
  const target = section.propertiesTreeOutline.rootElement().children().find(
      child => child instanceof StylePropertyTreeElement && child.property.name === propertyName);
  if (target) {
    return target as StylePropertyTreeElement;
  }
  const newTarget = section.addNewBlankProperty();
  newTarget.property.name = propertyName;
  return newTarget;
}

async function fetchComputedStyles(pane: StylesSidebarPane): Promise<Map<string, string>> {
  const computedStyleModel = pane.computedStyleModel();
  const style = await computedStyleModel.fetchComputedStyle();
  return style ? style.computedStyle : new Map();
}

function getAuthoredStyles(
    section: StylePropertiesSection, editableProperties: Array<{propertyName: string}>): Map<string, string> {
  const authoredProperties = new Map();
  const editablePropertiesSet = new Set(editableProperties.map(prop => prop.propertyName));
  for (const prop of section._style.leadingProperties()) {
    if (editablePropertiesSet.has(prop.name)) {
      authoredProperties.set(prop.name, prop.value);
    }
  }
  return authoredProperties;
}
