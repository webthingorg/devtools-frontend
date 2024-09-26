// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Platform from '../../core/platform/platform.js';
import * as Protocol from '../../generated/protocol.js';

import {type SecurityPanel} from './SecurityPanel.js';
import {SecurityPanelSidebarTreeElement} from './SecurityPanelSidebarTreeElement.js';

export class OriginTreeElement extends SecurityPanelSidebarTreeElement {
  #securityStateInternal: Protocol.Security.SecurityState|null;

  constructor(
      private readonly selectCallback: () => void, className: string,
      private readonly renderTreeElement: (element: SecurityPanelSidebarTreeElement) => void,
      private readonly originInternal: Platform.DevToolsPath.UrlString|null = null,
      securityPanel: SecurityPanel|undefined = undefined) {
    super(securityPanel);

    this.listItemElement.classList.add(className);
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

  origin(): Platform.DevToolsPath.UrlString|null {
    return this.originInternal;
  }

  override onselect(): boolean {
    this.selectCallback();
    return true;
  }
}
