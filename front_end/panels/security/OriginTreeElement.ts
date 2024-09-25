// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Protocol from '../../generated/protocol.js';
import type * as IconButton from '../../ui/components/icon_button/icon_button.js';

import {type SecurityPanel} from './SecurityPanel.js';
import {SecurityPanelSidebarTreeElement} from './SecurityPanelSidebarTreeElement.js';

export class OriginTreeElement extends SecurityPanelSidebarTreeElement {
  readonly #selectCallback: () => void;
  #securityStateInternal: Protocol.Security.SecurityState|null;

  getIconForSecurityState: (securityState: Protocol.Security.SecurityState) => IconButton.Icon.Icon;
  getTitleForSecurityState: (securityState: Protocol.Security.SecurityState) => Element;

  constructor(
      options: {
        onSelect: () => void,
        getIconForSecurityState: (securityState: Protocol.Security.SecurityState) => IconButton.Icon.Icon,
        getTitleForSecurityState: (securityState: Protocol.Security.SecurityState) => Element,
        className: string,
      },
      private readonly renderTreeElement: (element: SecurityPanelSidebarTreeElement) => void,
      securityPanel: SecurityPanel|undefined = undefined) {
    super(securityPanel);
    this.#selectCallback = options.onSelect;
    this.listItemElement.classList.add(options.className);

    this.getIconForSecurityState = options.getIconForSecurityState;
    this.getTitleForSecurityState = options.getTitleForSecurityState;
    this.#securityStateInternal = null;
    this.setSecurityState(Protocol.Security.SecurityState.Unknown);
  }

  setSecurityState(newSecurityState: Protocol.Security.SecurityState): void {
    this.#securityStateInternal = newSecurityState;
    this.renderTreeElement(this);
  }

  securityState(): Protocol.Security.SecurityState|null {
    return this.#securityStateInternal;
  }

  override onselect(): boolean {
    this.#selectCallback();
    return true;
  }
}
