// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable rulesdir/no_underscored_properties */

import * as ARIAUtils from './ARIAUtils.js';
import { Keys } from './KeyboardShortcut.js';
import { ElementFocusRestorer, markBeingEdited } from './UIUtils.js';

let _defaultInstance: InplaceEditor | null = null;

export class InplaceEditor {
  _focusRestorer?: ElementFocusRestorer;
  static startEditing(element: Element, config?: Config<any>): Controller | null {
    if (!_defaultInstance) {
      _defaultInstance = new InplaceEditor();
    }
    return _defaultInstance.startEditing(element, config);
  }

  editorContent(editingContext: EditingContext): string {
    const element = editingContext.element;
    if (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'text') {
      return /** @type {!HTMLInputElement} */ (element as HTMLInputElement).value;
    }

    return element.textContent || '';
  }

  setUpEditor(editingContext: EditingContext): void {
    const element = (editingContext.element as HTMLElement);
    element.classList.add('editing');
    element.setAttribute('contenteditable', 'plaintext-only');

    const oldRole = element.getAttribute('role');
    ARIAUtils.markAsTextBox(element);
    editingContext.oldRole = oldRole;

    const oldTabIndex = element.tabIndex;
    if (typeof oldTabIndex !== 'number' || oldTabIndex < 0) {
      element.tabIndex = 0;
    }
    this._focusRestorer = new ElementFocusRestorer(element);
    editingContext.oldTabIndex = oldTabIndex;
  }

  closeEditor(editingContext: EditingContext): void {
    const element = (editingContext.element as HTMLElement);
    element.classList.remove('editing');
    element.removeAttribute('contenteditable');

    if (typeof editingContext.oldRole !== 'string') {
      element.removeAttribute('role');
    }
    else {
      element.setAttribute('role', editingContext.oldRole);
    }

    if (typeof editingContext.oldTabIndex !== 'number') {
      element.removeAttribute('tabIndex');
    }
    else {
      element.tabIndex = editingContext.oldTabIndex;
    }
    element.scrollTop = 0;
    element.scrollLeft = 0;
  }

  cancelEditing(editingContext: EditingContext): void {
    const element = (editingContext.element as HTMLElement);
    if (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'text') {
      (element as HTMLInputElement).value = editingContext.oldText || '';
    }
    else {
      element.textContent = editingContext.oldText;
    }
  }

  startEditing(element: Element, inputConfig?: Config<any>): Controller | null {
    if (!markBeingEdited(element, true)) {
      return null;
    }

    const config = inputConfig || new Config(function () { }, function () { });
    const editingContext: EditingContext = { element: element, config: config, oldRole: null, oldTabIndex: null, oldText: null };
    const committedCallback = config.commitHandler;
    const cancelledCallback = config.cancelHandler;
    const pasteCallback = config.pasteHandler;
    const context = config.context;
    let moveDirection = '';
    const self = this;

    this.setUpEditor(editingContext);

    editingContext.oldText = this.editorContent(editingContext);

    function blurEventListener(e?: Event): void {
      if (config.blurHandler && !config.blurHandler(element, e)) {
        return;
      }
      editingCommitted.call(element);
    }

    function cleanUpAfterEditing(): void {
      markBeingEdited(element, false);

      element.removeEventListener('blur', blurEventListener, false);
      element.removeEventListener('keydown', keyDownEventListener, true);
      if (pasteCallback) {
        element.removeEventListener('paste', pasteEventListener, true);
      }

      if (self._focusRestorer) {
        self._focusRestorer.restore();
      }
      self.closeEditor(editingContext);
    }

    function editingCancelled(this: Element): void {
      self.cancelEditing(editingContext);
      cleanUpAfterEditing();
      cancelledCallback(this, context);
    }

    function editingCommitted(this: Element): void {
      cleanUpAfterEditing();

      committedCallback(this, self.editorContent(editingContext), editingContext.oldText || '', context, moveDirection);
    }

    function defaultFinishHandler(event: KeyboardEvent): string {
      if (event.key === 'Enter') {
        return 'commit';
      }
      if (event.keyCode === Keys.Esc.code || event.key === 'Escape') {
        return 'cancel';
      }
      if (event.key === 'Tab') {
        return 'move-' + (event.shiftKey ? 'backward' : 'forward');
      }
      return '';
    }

    function handleEditingResult(result: string | undefined, event: Event): void {
      if (result === 'commit') {
        editingCommitted.call(element);
        event.consume(true);
      }
      else if (result === 'cancel') {
        editingCancelled.call(element);
        event.consume(true);
      }
      else if (result && result.startsWith('move-')) {
        moveDirection = result.substring(5);
        if ((event as KeyboardEvent).key === 'Tab') {
          event.consume(true);
        }
        blurEventListener();
      }
    }

    function pasteEventListener(event: Event): void {
      if (!pasteCallback) {
        return;
      }
      const result = pasteCallback(event);
      handleEditingResult(result, event);
    }

    function keyDownEventListener(event: Event): void {
      let result = defaultFinishHandler((event as KeyboardEvent));
      if (!result && config.postKeydownFinishHandler) {
        const postKeydownResult = config.postKeydownFinishHandler(event);
        if (postKeydownResult) {
          result = postKeydownResult;
        }
      }
      handleEditingResult(result, event);
    }

    element.addEventListener('blur', blurEventListener, false);
    element.addEventListener('keydown', keyDownEventListener, true);
    if (pasteCallback !== undefined) {
      element.addEventListener('paste', pasteEventListener, true);
    }

    const handle = { cancel: editingCancelled.bind(element), commit: editingCommitted.bind(element) };
    return handle;
  }
}

/**
 * @template T
 */
export class Config {
  commitHandler: (arg0: Element, arg1: string, arg2: string, arg3: T, arg4: string) => void;
  cancelHandler: (arg0: Element, arg1: T) => void;
  context: T | undefined;
  blurHandler: ((arg0: Element, arg1?: Event | undefined) => boolean) | undefined;
  pasteHandler!: EventHandler | null;
  postKeydownFinishHandler!: EventHandler | null;
  constructor(commitHandler: (arg0: Element, arg1: string, arg2: string, arg3: T, arg4: string) => void, cancelHandler: (arg0: Element, arg1: T) => void, context?: T, blurHandler?: ((arg0: Element, arg1?: Event | undefined) => boolean)) {
    this.commitHandler = commitHandler;
    this.cancelHandler = cancelHandler;
    this.context = context;
    this.blurHandler = blurHandler;
  }

  setPasteHandler(pasteHandler: EventHandler): void {
    this.pasteHandler = pasteHandler;
  }

  setPostKeydownFinishHandler(postKeydownFinishHandler: EventHandler): void {
    this.postKeydownFinishHandler = postKeydownFinishHandler;
  }
}

/**
 * @typedef {function(!Event):string|undefined}
 */
// @ts-ignore typedef.
export let EventHandler;
export interface Controller {
  cancel: () => void;
  commit: () => void;
}
export interface EditingContext {
  element: Element;
  config: Config<any>;
  oldRole: string | null;
  oldText: string | null;
  oldTabIndex: number | null;
}
