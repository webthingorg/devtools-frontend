// Copyright (c) 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as SDK from '../../../core/sdk/sdk.js';
import type * as Platform from '../../../core/platform/platform.js';
import * as i18n from '../../../core/i18n/i18n.js';
import * as Common from '../../../core/common/common.js';
import * as NetworkForward from '../../../panels/network/forward/forward.js';
import type * as Logs from '../../../models/logs/logs.js';
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as IconButton from '../../../ui/components/icon_button/icon_button.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';
import * as Coordinator from '../render_coordinator/render_coordinator.js';

const UIStrings = {
  /**
  *@description Title for a link to a request in the network panel
  */
  clickToShowRequestInTheNetwork: 'Click to show request in the network panel',
  /**
  *@description Title for an unavailable link a request in the network panel
  */
  requestUnavailableInTheNetwork: 'Request unavailable in the network panel, try reloading the inspected page',
};
const str_ = i18n.i18n.registerUIStrings('ui/components/request_link_icon/RequestLinkIcon.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

export interface Data {
  linkToPreflight?: boolean;
  request?: SDK.NetworkRequest.NetworkRequest|null;
  affectedRequest?: {requestId: string, url?: string};
  highlightHeader?: {section: NetworkForward.UIRequestLocation.UIHeaderSection, name: string};
  requestResolver?: Logs.RequestResolver.RequestResolver;
  displayURL?: boolean;
  additionalOnClickAction?: () => void;
}

export const extractShortPath = (path: string): string => {
  // 1st regex matches everything after last '/'
  // if path ends with '/', 2nd regex returns everything between the last two '/'
  return (/[^/]+$/.exec(path) || /[^/]+\/$/.exec(path) || [''])[0];
};

export class RequestLinkIcon extends HTMLElement {
  static litTagName = LitHtml.literal`devtools-request-link-icon`;
  private readonly shadow = this.attachShadow({mode: 'open'});
  private linkToPreflight?: boolean;
  // The value `null` indicates that the request is not available,
  // `undefined` that it is still being resolved.
  private request?: SDK.NetworkRequest.NetworkRequest|null;
  private highlightHeader?: {section: NetworkForward.UIRequestLocation.UIHeaderSection, name: string};
  private requestResolver?: Logs.RequestResolver.RequestResolver;
  private displayURL: boolean = false;
  private networkTab?: NetworkForward.UIRequestLocation.UIRequestTabs;
  private affectedRequest?: {requestId: string, url?: string};
  private additionalOnClickAction?: () => void;

  set data(data: Data) {
    this.linkToPreflight = data.linkToPreflight;
    this.highlightHeader = data.highlightHeader;
    this.requestResolver = data.requestResolver;
    this.displayURL = data.displayURL ?? false;
    if (data.request) {
      this.request = data.request;
    } else if (data.affectedRequest) {
      this.affectedRequest = {...data.affectedRequest};
      this.resolveRequest(data.affectedRequest.requestId);
    }
    this.render();
  }

  private resolveRequest(requestId: string): void {
    if (!this.requestResolver) {
      throw new Error('A `RequestResolver` must be provided if an `affectedRequest` is provided.');
    }
    this.requestResolver.waitForNetworkRequest(requestId)
        .then(request => {
          this.request = request;
          this.render();
        })
        .catch(() => {
          this.request = null;
          this.render();
        });
  }

  get data(): Data {
    return {
      linkToPreflight: this.linkToPreflight,
      request: this.request,
      requestResolver: this.requestResolver,
      highlightHeader: this.highlightHeader,
      displayURL: this.displayURL,
    };
  }

  private iconColor(): string {
    if (!this.request) {
      return '--issue-color-yellow';
    }
    return '--color-link';
  }

  iconData(): IconButton.Icon.IconData {
    return {
      iconName: 'elements_panel_icon',
      color: `var(${this.iconColor()})`,
      width: '16px',
      height: '16px',
    };
  }

  private handleClick(event: MouseEvent): void {
    if (event.button !== 0) {
      return;  // Only handle left-click for now.
    }
    const linkedRequest = this.linkToPreflight ? this.request?.preflightRequest() : this.request;
    if (!linkedRequest) {
      return;
    }
    if (this.highlightHeader) {
      const requestLocation = NetworkForward.UIRequestLocation.UIRequestLocation.header(
          linkedRequest, this.highlightHeader.section, this.highlightHeader.name);
      Common.Revealer.reveal(requestLocation);
    } else {
      const requestLocation = NetworkForward.UIRequestLocation.UIRequestLocation.tab(
          linkedRequest, this.networkTab ?? NetworkForward.UIRequestLocation.UIRequestTabs.Headers);
      Common.Revealer.reveal(requestLocation);
    }
    this.additionalOnClickAction?.();
  }

  private getTooltip(): Platform.UIString.LocalizedString {
    if (this.request) {
      return i18nString(UIStrings.clickToShowRequestInTheNetwork);
    }
    return i18nString(UIStrings.requestUnavailableInTheNetwork);
  }

  private getUrlForDisplaying(): string|undefined {
    if (!this.request) {
      if (!this.affectedRequest || !this.affectedRequest.url) {
        return undefined;
      }
      return this.affectedRequest.url;
    }
    return this.request.url();
  }

  private maybeRenderURL(): LitHtml.TemplateResult|{} {
    if (!this.displayURL) {
      return LitHtml.nothing;
    }
    const url = this.getUrlForDisplaying();
    if (!url) {
      return LitHtml.nothing;
    }
    const filename = extractShortPath(url);
    return LitHtml.html`<span title="${url}" @click="${this.handleClick.bind(this)}">${filename}</span>`;
  }

  private render(): void {
    coordinator.write(() => {
      // clang-format off
      LitHtml.render(LitHtml.html`
        <style>
          :host {
            display: inline-block;
            white-space: nowrap;
            color: inherit;
            font-size: inherit;
            font-family: inherit;
          }

          .icon {
            vertical-align: middle;
          }

          .link {
            cursor: pointer;
          }

          .link span {
            color: var(--color-link);
          }
        </style>
        <span class="${LitHtml.Directives.classMap({'link': Boolean(this.request)})}">
          <${IconButton.Icon.Icon.litTagName} class="icon"
            .data=${this.iconData() as IconButton.Icon.IconData}
            @click="${this.handleClick.bind(this)}"
            title="${this.getTooltip()}"
          ></${IconButton.Icon.Icon.litTagName}>
          ${this.maybeRenderURL()}
        </span>
      `,
      this.shadow);
      // clang-format on
    });
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-request-link-icon', RequestLinkIcon);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-request-link-icon': RequestLinkIcon;
  }
}
