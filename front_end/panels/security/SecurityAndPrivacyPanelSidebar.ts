// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../core/i18n/i18n.js';
import type * as Platform from '../../core/platform/platform.js';
import * as Protocol from '../../generated/protocol.js';
import type * as IconButton from '../../ui/components/icon_button/icon_button.js';
import * as UI from '../../ui/legacy/legacy.js';

import lockIconStyles from './lockIcon.css.js';
import {OriginTreeElement} from './OriginTreeElement.js';
import {
  getSecurityStateIconForDetailedView,
  getSecurityStateIconForOverview,
  type Origin,
  OriginGroup,
  SecurityPanel,
} from './SecurityPanel.js';
import sidebarStyles from './sidebar.css.js';

const UIStrings = {
  /**
   *@description Section title of the Security section of the Security Panel's sidebar
   */
  security: 'Security',
  /**
   *@description Text in Security Panel of the Security panel
   */
  mainOrigin: 'Main origin',
  /**
   *@description Text in Security Panel of the Security panel
   */
  nonsecureOrigins: 'Non-secure origins',
  /**
   *@description Text in Security Panel of the Security panel
   */
  secureOrigins: 'Secure origins',
  /**
   *@description Text in Security Panel of the Security panel
   */
  unknownCanceled: 'Unknown / canceled',
  /**
   *@description Title text content in Security Panel of the Security panel
   */
  overview: 'Overview',
  /**
   *@description Text in Security Panel of the Security panel
   */
  reloadToViewDetails: 'Reload to view details',
  /**
   *@description New parent title in Security Panel of the Security panel
   */
  mainOriginSecure: 'Main origin (secure)',
  /**
   *@description New parent title in Security Panel of the Security panel
   */
  mainOriginNonsecure: 'Main origin (non-secure)',
};

const str_ = i18n.i18n.registerUIStrings('panels/security/SecurityAndPrivacyPanelSidebar.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class SecurityAndPrivacyPanelSidebar extends UI.Widget.VBox {
  panel: SecurityPanel;
  private readonly showOriginInPanel: (arg0: Origin) => void;
  readonly sidebarTree: UI.TreeOutline.TreeOutlineInShadow;
  private readonly originGroupTitles: Map<OriginGroup, string>;
  private originGroups: Map<OriginGroup, UI.TreeOutline.TreeElement>;
  securityOverviewElement: OriginTreeElement;
  private readonly elementsByOrigin: Map<string, OriginTreeElement>;
  private readonly mainViewReloadMessage: UI.TreeOutline.TreeElement;
  private mainOrigin: string|null;

  constructor(panel: SecurityPanel) {
    super();

    this.panel = panel;

    this.mainOrigin = null;
    this.showOriginInPanel = panel.showOrigin.bind(panel);

    this.sidebarTree = new UI.TreeOutline.TreeOutlineInShadow(UI.TreeOutline.TreeVariant.NAVIGATION_TREE);
    this.sidebarTree.element.classList.add('security-sidebar');
    // this.sidebarTree.hideOverflow();
    // this.sidebarTree.element.classList.add('filter-all');
    this.contentElement.appendChild(this.sidebarTree.element);

    const securitySectionTitle = i18nString(UIStrings.security);
    const securityTreeElement = this.addSidebarSection(securitySectionTitle, 'security');

    const getIconForSecurityState = (securityState: Protocol.Security.SecurityState): IconButton.Icon.Icon =>
        getSecurityStateIconForOverview(securityState, `lock-icon lock-icon-${securityState}`);
    const getTitleForSecurityState = (_securityState: Protocol.Security.SecurityState): Element => {
      const title = document.createElement('span');
      title.classList.add('title');
      title.textContent = i18nString(UIStrings.overview);
      return title;
    };
    this.securityOverviewElement = new OriginTreeElement({
      onSelect: panel.setVisibleView.bind(panel, panel.mainView),
      getIconForSecurityState,
      getTitleForSecurityState,
      className: 'security-main-view-sidebar-tree-item',
    });
    this.securityOverviewElement.tooltip = i18nString(UIStrings.overview);
    securityTreeElement.appendChild(this.securityOverviewElement);

    this.originGroupTitles = new Map([
      [OriginGroup.MainOrigin, i18nString(UIStrings.mainOrigin)],
      [OriginGroup.NonSecure, i18nString(UIStrings.nonsecureOrigins)],
      [OriginGroup.Secure, i18nString(UIStrings.secureOrigins)],
      [OriginGroup.Unknown, i18nString(UIStrings.unknownCanceled)],
    ]);

    this.originGroups = new Map();
    for (const group of Object.values(OriginGroup)) {
      const element = this.createOriginGroupElement(this.originGroupTitles.get(group) as string);
      this.originGroups.set(group, element);
      securityTreeElement.appendChild(element);
    }

    this.mainViewReloadMessage = new UI.TreeOutline.TreeElement(i18nString(UIStrings.reloadToViewDetails));
    this.mainViewReloadMessage.selectable = false;
    this.mainViewReloadMessage.listItemElement.classList.add('security-main-view-reload-message');

    // adding reload to the main origin
    const treeElement = this.originGroups.get(OriginGroup.MainOrigin);
    (treeElement as UI.TreeOutline.TreeElement).appendChild(this.mainViewReloadMessage);

    this.clearOriginGroups();

    this.elementsByOrigin = new Map();
  }

  private addSidebarSection(title: string, jslogContext: string): UI.TreeOutline.TreeElement {
    const treeElement = new UI.TreeOutline.TreeElement(title, true, jslogContext);
    treeElement.listItemElement.classList.add('security-group-list-item');
    treeElement.setCollapsible(false);
    treeElement.selectable = false;
    this.sidebarTree.appendChild(treeElement);
    UI.ARIAUtils.markAsHeading(treeElement.listItemElement, 3);
    UI.ARIAUtils.setLabel(treeElement.childrenListElement, title);
    return treeElement;
  }

  private originGroupTitle(originGroup: OriginGroup): string {
    return this.originGroupTitles.get(originGroup) as string;
  }

  private originGroupElement(originGroup: OriginGroup): UI.TreeOutline.TreeElement {
    return this.originGroups.get(originGroup) as UI.TreeOutline.TreeElement;
  }

  private createOriginGroupElement(originGroupTitle: string): UI.TreeOutline.TreeElement {
    const originGroup = new UI.TreeOutline.TreeElement(originGroupTitle, true);
    originGroup.selectable = false;
    originGroup.setCollapsible(false);
    originGroup.expand();
    originGroup.listItemElement.classList.add('security-sidebar-origins');
    UI.ARIAUtils.setLabel(originGroup.childrenListElement, originGroupTitle);
    return originGroup;
  }

  toggleOriginsList(hidden: boolean): void {
    for (const element of this.originGroups.values()) {
      element.hidden = hidden;
    }
  }

  addOrigin(origin: Platform.DevToolsPath.UrlString, securityState: Protocol.Security.SecurityState): void {
    this.mainViewReloadMessage.hidden = true;
    const getIconForSecurityState = (securityState: Protocol.Security.SecurityState): IconButton.Icon.Icon =>
        getSecurityStateIconForDetailedView(securityState, `security-property security-property-${securityState}`);
    const getTitleForSecurityState = (securityState: Protocol.Security.SecurityState): Element =>
        SecurityPanel.createHighlightedUrl(origin, securityState);
    const originElement = new OriginTreeElement({
      onSelect: this.showOriginInPanel.bind(this, origin),
      getIconForSecurityState,
      getTitleForSecurityState,
      className: 'security-sidebar-tree-item',
    });
    originElement.tooltip = origin;
    this.elementsByOrigin.set(origin, originElement);
    this.updateOrigin(origin, securityState);
  }

  setMainOrigin(origin: string): void {
    this.mainOrigin = origin;
  }

  updateOrigin(origin: string, securityState: Protocol.Security.SecurityState): void {
    const originElement = this.elementsByOrigin.get(origin) as OriginTreeElement;
    originElement.setSecurityState(securityState);

    let newParent: UI.TreeOutline.TreeElement;
    if (origin === this.mainOrigin) {
      newParent = this.originGroups.get(OriginGroup.MainOrigin) as UI.TreeOutline.TreeElement;
      if (securityState === Protocol.Security.SecurityState.Secure) {
        newParent.title = i18nString(UIStrings.mainOriginSecure);
      } else {
        newParent.title = i18nString(UIStrings.mainOriginNonsecure);
      }
      UI.ARIAUtils.setLabel(newParent.childrenListElement, newParent.title);
    } else {
      switch (securityState) {
        case Protocol.Security.SecurityState.Secure:
          newParent = this.originGroupElement(OriginGroup.Secure);
          break;
        case Protocol.Security.SecurityState.Unknown:
          newParent = this.originGroupElement(OriginGroup.Unknown);
          break;
        default:
          newParent = this.originGroupElement(OriginGroup.NonSecure);
          break;
      }
    }

    const oldParent = originElement.parent;
    if (oldParent !== newParent) {
      if (oldParent) {
        oldParent.removeChild(originElement);
        if (oldParent.childCount() === 0) {
          oldParent.hidden = true;
        }
      }
      newParent.appendChild(originElement);
      newParent.hidden = false;
    }
  }

  private clearOriginGroups(): void {
    for (const [originGroup, originGroupElement] of this.originGroups) {
      if (originGroup === OriginGroup.MainOrigin) {
        for (let i = originGroupElement.childCount() - 1; i > 0; i--) {
          originGroupElement.removeChildAtIndex(i);
        }
        originGroupElement.title = this.originGroupTitle(OriginGroup.MainOrigin);
        originGroupElement.hidden = false;
        this.mainViewReloadMessage.hidden = false;
      } else {
        originGroupElement.removeChildren();
        originGroupElement.hidden = true;
      }
    }
  }

  clearOrigins(): void {
    this.clearOriginGroups();
    this.elementsByOrigin.clear();
  }

  override wasShown(): void {
    super.wasShown();
    this.sidebarTree.registerCSSFiles([lockIconStyles, sidebarStyles]);
  }
}
