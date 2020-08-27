// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as Network from '../network/network.js';
import * as SDK from '../sdk/sdk.js';  // eslint-disable-line no-unused-vars
import * as UI from '../ui/ui.js';
import * as Workspace from '../workspace/workspace.js';

/**
 * @param {boolean} b
 */
const booleanToYesNo = b => b ? ls`Yes` : ls`No`;

export class FrameDetailsView extends UI.ThrottledWidget.ThrottledWidget {
  /**
   * @param {!SDK.ResourceTreeModel.ResourceTreeFrame} frame
   */
  constructor(frame) {
    super();
    this._frame = frame;
    this._reportView = new UI.ReportView.ReportView(frame.displayName());
    this._reportView.registerRequiredCSS('resources/frameDetailsReportView.css');
    this._reportView.show(this.contentElement);

    this._generalSection = this._reportView.appendSection(ls`Document`);
    this._urlFieldValue = this._generalSection.appendField(ls`URL`);
    this._unreachableURL = this._generalSection.appendField(ls`Unreachable URL`);
    this._originFieldValue = this._generalSection.appendField(ls`Origin`);

    this._ownerElementFieldValue = this._generalSection.appendField(ls`Owner Element`);
    this._adStatus = this._generalSection.appendField(ls`Ad Status`);
    this._isolationSection = this._reportView.appendSection(ls`Security & Isolation`);
    this._secureContext = this._isolationSection.appendField(ls`Secure Context`);
    this._coepPolicy = this._isolationSection.appendField(ls`Cross-Origin Embedder Policy`);
    this._coopPolicy = this._isolationSection.appendField(ls`Cross-Origin Opener Policy`);
    this.update();
  }

  /**
   * @override
   * @return {!Promise<?>}
   */
  async doUpdate() {
    this._urlFieldValue.textContent = this._frame.url;
    if (!this._frame.unreachableUrl()) {
      const revealSources = UI.Icon.Icon.create('mediumicon-sources-panel', 'icon-link devtools-link');
      this._urlFieldValue.appendChild(revealSources);
      revealSources.title = ls`Click to reveal in Sources panel`;
      revealSources.addEventListener('click', () => {
        const sourceCode = Workspace.Workspace.WorkspaceImpl.instance().uiSourceCodeForURL(this._frame.url);
        Common.Revealer.reveal(sourceCode);
      });
    }
    FrameDetailsView.maybeAppendLinkToRequest(this._urlFieldValue, this._frame.resourceForURL(this._frame.url));
    this._maybeAppendLinkForUnreachableUrl();
    if (this._frame.securityOrigin && this._frame.securityOrigin !== '://') {
      this._originFieldValue.textContent = this._frame.securityOrigin;
      this._generalSection.setFieldVisible(ls`Origin`, true);
    } else {
      this._generalSection.setFieldVisible(ls`Origin`, false);
    }
    const ownerDomNode = await this._frame.getOwnerDOMNodeOrDocument();
    this._updateAdStatus();
    if (ownerDomNode) {
      this._ownerElementFieldValue.textContent = `<${ownerDomNode.nodeName().toLocaleLowerCase()}>`;
      const revealElement = UI.Icon.Icon.create('mediumicon-elements-panel', 'icon-link devtools-link');
      this._ownerElementFieldValue.appendChild(revealElement);
      revealElement.title = ls`Click to reveal in Elements panel`;
      revealElement.addEventListener('click', () => {
        Common.Revealer.reveal(ownerDomNode);
      });
    }
    await this._updateCoopCoepStatus();
    this._updateContextStatus();
  }

  async _updateCoopCoepStatus() {
    const info = await this._frame.resourceTreeModel()
                     .target()
                     .model(SDK.NetworkManager.NetworkManager)
                     .getSecurityIsolationStatus(this._frame.id);
    this._coepPolicy.textContent = info.coep.value;
    this._coopPolicy.textContent = info.coop.value;
  }

  /**
   * @param {?Protocol.Page.SecureContextType} type
   * @returns {?string}
   */
  _explanationFromSecureContextType(type) {
    switch (type) {
      case Protocol.Page.SecureContextType.Secure:
        return null;
      case Protocol.Page.SecureContextType.SecureLocalhost:
        return ls`Localhost is always a secure context`;
      case Protocol.Page.SecureContextType.InsecureAncestor:
        return ls`A frame ancestor is an insecure context`;
      case Protocol.Page.SecureContextType.InsecureScheme:
        return ls`The frame's scheme is insecure`;
    }
    return null;
  }

  _updateContextStatus() {
    if (this._frame.unreachableUrl()) {
      this._isolationSection.setFieldVisible(ls`Secure Context`, false);
      return;
    }
    this._isolationSection.setFieldVisible(ls`Secure Context`, true);
    this._secureContext.textContent = booleanToYesNo(this._frame.isSecureContext());
    const secureContextExplanation = this._explanationFromSecureContextType(this._frame.getSecureContextType());
    if (secureContextExplanation) {
      const secureContextType = this._secureContext.createChild('span', 'more-info');
      secureContextType.textContent = secureContextExplanation;
    }
  }

  /**
   * @param {!Element} element
   * @param {?SDK.Resource.Resource} resource
   */
  static maybeAppendLinkToRequest(element, resource) {
    if (resource && resource.request) {
      const request = resource.request;
      const revealRequest = UI.Icon.Icon.create('mediumicon-network-panel', 'icon-link devtools-link');
      element.appendChild(revealRequest);
      revealRequest.title = ls`Click to reveal in Network panel`;
      revealRequest.addEventListener('click', () => {
        Network.NetworkPanel.NetworkPanel.selectAndShowRequest(request, Network.NetworkItemView.Tabs.Headers);
      });
    }
  }

  _maybeAppendLinkForUnreachableUrl() {
    if (!this._frame.unreachableUrl()) {
      this._generalSection.setFieldVisible(ls`Unreachable URL`, false);
      return;
    }
    this._generalSection.setFieldVisible(ls`Unreachable URL`, true);
    this._unreachableURL.textContent = this._frame.unreachableUrl();
    const unreachableUrl = Common.ParsedURL.ParsedURL.fromString(this._frame.unreachableUrl());
    if (!unreachableUrl) {
      return;
    }
    const revealRequest = UI.Icon.Icon.create('mediumicon-network-panel', 'icon-link devtools-link');
    this._unreachableURL.appendChild(revealRequest);
    revealRequest.title = ls`Click to reveal in Network panel (might require page reload)`;

    revealRequest.addEventListener('click', () => {
      Network.NetworkPanel.NetworkPanel.revealAndFilter([
        {
          filterType: 'domain',
          filterValue: unreachableUrl.domain(),
        },
        {
          filterType: null,
          filterValue: unreachableUrl.path,
        }
      ]);
    });
  }

  _updateAdStatus() {
    switch (this._frame.adFrameType()) {
      case Protocol.Page.AdFrameType.Root:
        this._generalSection.setFieldVisible(ls`Ad Status`, true);
        this._adStatus.textContent = ls`root`;
        this._adStatus.title = ls`This frame has been identified as the root frame of an ad`;
        break;
      case Protocol.Page.AdFrameType.Child:
        this._generalSection.setFieldVisible(ls`Ad Status`, true);
        this._adStatus.textContent = ls`child`;
        this._adStatus.title = ls`This frame has been identified as the a child frame of an ad`;
        break;
      default:
        this._generalSection.setFieldVisible(ls`Ad Status`, false);
        break;
    }
  }
}

export class OpenedWindowDetailsView extends UI.ThrottledWidget.ThrottledWidget {
  /**
   * @param {!Protocol.Target.TargetInfo} targetInfo
   * @param {boolean} isWindowClosed
   */
  constructor(targetInfo, isWindowClosed) {
    super();
    this._targetInfo = targetInfo;
    this._isWindowClosed = isWindowClosed;
    this._reportView = new UI.ReportView.ReportView(this.buildTitle());
    this._reportView.registerRequiredCSS('resources/frameDetailsReportView.css');
    this._reportView.show(this.contentElement);

    this._documentSection = this._reportView.appendSection(ls`Document`);
    this._URLFieldValue = this._documentSection.appendField(ls`URL`);

    this._securitySection = this._reportView.appendSection(ls`Security`);
    this._hasDOMAccessValue = this._securitySection.appendField(ls`Access to opener`);
    this._openerFrameFieldValue = this._securitySection.appendField(ls`Opener Frame`);
    /** @type {?SDK.ResourceTreeModel.ResourceTreeFrame} */
    this._openerFrame = null;
    this._openerFrameFieldValue.addEventListener('mouseenter', this._onMouseEnter.bind(this), false);
    this._openerFrameFieldValue.addEventListener('mouseleave', this._onMouseLeave.bind(this), false);

    this.update();
  }

  /**
   * @param {!Event} event
   */
  _onMouseEnter(event) {
    if (this._openerFrame) {
      this._openerFrame.highlight();
    }
  }

  /**
   * @param {!Event} event
   */
  _onMouseLeave(event) {
    SDK.OverlayModel.OverlayModel.hideDOMNodeHighlight();
  }

  /**
   * @override
   * @return {!Promise<?>}
   */
  async doUpdate() {
    this._reportView.setTitle(this.buildTitle());
    this._URLFieldValue.textContent = this._targetInfo.url;
    this._hasDOMAccessValue.textContent = booleanToYesNo(this._targetInfo.canAccessOpener);

    const openerFrameId = this._targetInfo.openerFrameId;
    if (openerFrameId) {
      const frameManager = SDK.FrameManager.FrameManager.instance();
      this._openerFrame = frameManager.getFrame(openerFrameId);
      if (this._openerFrame) {
        const openerDomNode = await this._openerFrame.getOwnerDOMNodeOrDocument();
        if (openerDomNode) {
          this._openerFrameFieldValue.textContent = `<${openerDomNode.nodeName().toLocaleLowerCase()}>`;
          const revealElement = UI.Icon.Icon.create('mediumicon-elements-panel', 'icon-link devtools-link');
          this._openerFrameFieldValue.appendChild(revealElement);
          revealElement.title = ls`Click to reveal in Elements panel`;
          revealElement.addEventListener('click', () => {
            if (openerDomNode) {
              Common.Revealer.reveal(openerDomNode);
            }
          });
        }
      }
    }
  }

  /**
   * @return {string}
   */
  buildTitle() {
    let title = this._targetInfo.title || ls`Window without title`;
    if (this._isWindowClosed) {
      title += ` (${ls`closed`})`;
    }
    return title;
  }

  /**
   * @param {boolean} isWindowClosed
   */
  setIsWindowClosed(isWindowClosed) {
    this._isWindowClosed = isWindowClosed;
  }

  /**
   * @param {!Protocol.Target.TargetInfo} targetInfo
   */
  setTargetInfo(targetInfo) {
    this._targetInfo = targetInfo;
  }
}
