// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export enum CommitType {
  COMMITTED,
  CANCELED,
  IN_PROGRESS,
}

const EDITING_STYLES = new Map<string, string>([
  ['color', 'black'],
  ['background-color', 'white'],
  ['outline', 'none'],
  ['box-shadow', 'var(--drop-shadow)'],
  // `inline-block` makes sure that the `text-decoration` set in
  // a parent does not propagate to this child. You can't use
  // `text-decoration: none`, as that does not reset the styling
  // per the spec: https://drafts.csswg.org/css-text-decor-4/#line-decoration
  // Instead, you have to specify the child to be an "out-of-flow
  // descendant", which is what `inline-block` does.
  ['display', 'inline-block'],
  // Add extra padding to make text more readable,
  // but to prevent surrounding elements from moving,
  // revert the visual change with a margin.
  ['padding', '1px'],
  ['margin', '-1px'],
]);

/**
 * Handler that can make nodes editable with the contenteditable attribute.
 * It ensures that styling remains valid for the rule and that it appears
 * as if it would be a regular text editor.
 */
export class EditTargetHandler {
  target?: HTMLElement;
  constructor(private root: DocumentOrShadowRoot) {
  }

  async start(target: HTMLElement): Promise<CommitType> {
    if (this.target) {
      return CommitType.IN_PROGRESS;
    }

    return new Promise(resolve => {
      this.target = target;

      const selection = this.selectAllTextInTarget(target);

      const onFinishedEditing = (commitType: CommitType) => {
        target.removeEventListener('blur', onFinishedBlurListener);

        this.target = undefined;
        this.stopEditing(target, selection);

        resolve(commitType);
      };
      const onFinishedBlurListener = () => {
        onFinishedEditing(CommitType.COMMITTED);
      };

      target.addEventListener('blur', onFinishedBlurListener);

      // Use keydown rather than keyup, to make sure that when you hit
      // the enter key, there is no flash of an extra line being added
      // to the the contenteditable node.
      //
      // Don't use once here, as we only want to listen for a couple of
      // key codes.
      target.addEventListener('keydown', this.keyDownListener(target, onFinishedEditing));

      this.startEditing(target);

      // Make sure to transfer the focus to the cell, rather than the
      // currently focused row. If we don't, after triple-clicking,
      // the click event on the row would fire and hijack the focus.
      // Moreover, it automatically selects the full text, for easier
      // copy-pasting for the user.
      target.focus();
    });
  }

  private selectAllTextInTarget(target: HTMLElement) {
    const selection = this.root.getSelection();
    if (!selection) {
      throw new Error('Was not able to obtain selection in root.');
    }
    const range = document.createRange();

    range.selectNodeContents(target);
    selection.removeAllRanges();
    selection.addRange(range);

    return selection;
  }

  // Make sure that all actions in `startEditing`
  // are reversed in `stopEditing`.
  private startEditing(target: HTMLElement) {
    target.classList.add('editing');
    target.contentEditable = 'plaintext-only';

    for (const [key, value] of EDITING_STYLES) {
      target.style.setProperty(key, value);
    }
  }

  private stopEditing(target: HTMLElement, selection: Selection) {
    target.classList.remove('editing');
    target.removeAttribute('contenteditable');

    for (const key of EDITING_STYLES.keys()) {
      target.style.removeProperty(key);
    }

    // When moving out of an edited box, the selection would
    // persist. Therefore, we have to explicitly remove the
    // selection before we continue.
    selection.removeAllRanges();
  }

  private keyDownListener(target: HTMLElement, onFinishedEditing: (commitType: CommitType) => void) {
    const listener = (event: KeyboardEvent) => {
      if (['Enter', 'Escape', 'Tab'].includes(event.key)) {
        // If we are tabbing out of an edited node, we have
        // to allow the default behavior of moving to the
        // next focusable node. However, we should prevent
        // the other key events, to not change the value in
        // the edit box before we can process it.
        if (event.key !== 'Tab') {
          event.preventDefault();
        }

        target.removeEventListener('keydown', listener);

        let commitType = CommitType.COMMITTED;

        if (event.key === 'Escape') {
          commitType = CommitType.CANCELED;
        }

        // Do not call `target.blur()` here, as that removes
        // the outline focus from the element.
        onFinishedEditing(commitType);
      }
    };
    return listener;
  }
}
